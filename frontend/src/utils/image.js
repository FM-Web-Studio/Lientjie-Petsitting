/*
 * Client-side image compression.
 *
 * Phone cameras produce 4–12 MB photos. Uploading them raw is the main cause of
 * slow, memory-hungry uploads on mobile (and the tab getting killed mid-upload).
 * We downscale to a sane max dimension and re-encode as JPEG before upload,
 * typically shrinking a photo ~10–20×. Everything here is best-effort: on any
 * failure we return the ORIGINAL file so an upload never breaks because of us.
 */

const DEFAULTS = {
  maxDimension: 1920, // longest edge, in px — plenty for web display
  quality: 0.82,      // JPEG quality
  mimeType: 'image/jpeg',
};

/** Decode a File into an ImageBitmap (preferred) or HTMLImageElement. */
async function decode(file) {
  // createImageBitmap is fast and can honour EXIF orientation where supported.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Return a compressed JPEG File, or the original file when compression is
 * skipped (non-image, animated GIF) or wouldn't help.
 */
export async function compressImage(file, opts = {}) {
  const { maxDimension, quality, mimeType } = { ...DEFAULTS, ...opts };

  // Don't touch things we shouldn't: non-images, or GIFs (canvas kills animation).
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  try {
    const bitmap = await decode(file);
    const width = bitmap.width || bitmap.naturalWidth;
    const height = bitmap.height || bitmap.naturalHeight;
    if (!width || !height) return file;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    if (typeof bitmap.close === 'function') bitmap.close(); // free the decoded bitmap ASAP

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    // Free the canvas backing store on mobile.
    canvas.width = 0;
    canvas.height = 0;

    // If re-encoding didn't actually shrink the file, keep the original.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: mimeType, lastModified: file.lastModified });
  } catch {
    return file; // best-effort: never block an upload on a compression failure
  }
}
