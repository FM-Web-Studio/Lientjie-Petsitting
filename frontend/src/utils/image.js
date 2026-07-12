/*
 * Client-side image preparation.
 *
 * Phone cameras produce 4–12 MP, 4–12 MB photos. Two things make them painful on
 * mobile: (1) painting full-res files into tiny <img> previews decodes ~48 MB of
 * bitmap per photo, and (2) re-encoding them for upload on the main thread freezes
 * the UI. We solve both by decoding + downscaling + re-encoding ONCE per file in a
 * Web Worker (OffscreenCanvas), producing both the upload image and a small preview
 * thumbnail. Everything is best-effort: on any failure we fall back to the main
 * thread, and ultimately to the ORIGINAL file, so an upload never breaks on us.
 */

const DEFAULTS = {
  maxDimension: 1920,   // longest edge for the uploaded image, in px
  quality: 0.82,        // JPEG quality
  previewDimension: 400, // longest edge for the on-screen thumbnail (60px box @ retina)
  mimeType: 'image/jpeg',
};

/* ── Web Worker plumbing ──────────────────────────────────────────────────── */

let worker;
let workerDisabled = false;
let seq = 0;
const pending = new Map();

function workerSupported() {
  return !workerDisabled
    && typeof Worker !== 'undefined'
    && typeof OffscreenCanvas !== 'undefined'
    && typeof createImageBitmap === 'function';
}

function disableWorker(reason) {
  workerDisabled = true;
  for (const p of pending.values()) p.reject(new Error(reason));
  pending.clear();
  if (worker) { worker.terminate(); worker = null; }
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./imageWorker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    const p = pending.get(data.id);
    if (!p) return;
    pending.delete(data.id);
    if (data.error) p.reject(new Error(data.error));
    else p.resolve({ full: data.full, preview: data.preview });
  };
  // A fatal worker error (e.g. module workers unsupported): give up on the worker
  // for the rest of the session and let callers fall back to the main thread.
  worker.onerror = () => disableWorker('image worker failed');
  return worker;
}

function runInWorker(file, opts) {
  return new Promise((resolve, reject) => {
    const id = seq += 1;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, file, ...opts });
  });
}

/* ── Shared helpers ───────────────────────────────────────────────────────── */

/** Wrap an encoded blob as a JPEG File named after the original. */
function toJpegFile(blob, original) {
  const name = original.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: DEFAULTS.mimeType, lastModified: original.lastModified });
}

/** Decode a File into an ImageBitmap (preferred) or HTMLImageElement. */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ── Main-thread fallback ─────────────────────────────────────────────────── */

/**
 * Return a compressed JPEG File, or the original file when compression is
 * skipped (non-image, animated GIF) or wouldn't help. Runs on the main thread —
 * used only when the worker is unavailable.
 */
export async function compressImage(file, opts = {}) {
  const { maxDimension, quality, mimeType } = { ...DEFAULTS, ...opts };
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  try {
    const bitmap = await decode(file);
    const width = bitmap.width || bitmap.naturalWidth;
    const height = bitmap.height || bitmap.naturalHeight;
    if (!width || !height) return file;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (typeof bitmap.close === 'function') bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    canvas.width = 0; canvas.height = 0; // free the backing store on mobile

    if (!blob || blob.size >= file.size) return file;
    return toJpegFile(blob, file);
  } catch {
    return file;
  }
}

/** Main-thread twin of the worker: produce a small preview Blob for the strip. */
async function makePreview(file, opts = {}) {
  const { previewDimension, quality, mimeType } = { ...DEFAULTS, ...opts };
  try {
    const bitmap = await decode(file);
    const width = bitmap.width || bitmap.naturalWidth;
    const height = bitmap.height || bitmap.naturalHeight;
    if (!width || !height) return null;

    const scale = Math.min(1, previewDimension / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (typeof bitmap.close === 'function') bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    canvas.width = 0; canvas.height = 0;
    return blob;
  } catch {
    return null;
  }
}

/* ── Public API ───────────────────────────────────────────────────────────── */

/**
 * Prepare a single file for upload. Returns { file, previewUrl }:
 *   - `file`       is a compressed JPEG (or the original if compression didn't help)
 *   - `previewUrl` is a small object-URL thumbnail — the CALLER must revokeObjectURL it
 */
export async function prepareImage(file, opts = {}) {
  const options = { ...DEFAULTS, ...opts };

  // Don't touch things we shouldn't: non-images, or GIFs (canvas kills animation).
  // Preview straight from the original — these files are already small.
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return { file, previewUrl: URL.createObjectURL(file) };
  }

  if (workerSupported()) {
    try {
      const { full, preview } = await runInWorker(file, {
        maxDimension: options.maxDimension,
        quality: options.quality,
        previewDimension: options.previewDimension,
      });
      const uploadFile = full && full.size < file.size ? toJpegFile(full, file) : file;
      const previewUrl = URL.createObjectURL(preview || full || file);
      return { file: uploadFile, previewUrl };
    } catch {
      /* worker failed for this file — fall back to the main thread */
    }
  }

  const [compressed, preview] = await Promise.all([
    compressImage(file, options),
    makePreview(file, options),
  ]);
  return { file: compressed, previewUrl: URL.createObjectURL(preview || compressed) };
}

/**
 * Prepare many files, at limited concurrency to bound memory. Preserves order.
 * `onProgress` receives completion (0..1) as each file finishes.
 */
export async function prepareImages(files, onProgress, concurrency = 3) {
  const results = new Array(files.length);
  let done = 0;
  let cursor = 0;

  async function work() {
    while (cursor < files.length) {
      const i = cursor; cursor += 1;
      results[i] = await prepareImage(files[i]); // eslint-disable-line no-await-in-loop
      done += 1;
      onProgress?.(done / files.length);
    }
  }

  const lanes = Array.from({ length: Math.min(concurrency, files.length) }, work);
  await Promise.all(lanes);
  return results;
}
