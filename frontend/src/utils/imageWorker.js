/*
 * Image-processing Web Worker.
 *
 * Decoding, downscaling and JPEG re-encoding are expensive — on a phone they can
 * freeze the UI for seconds per photo. Doing them here keeps the main thread free
 * so the page stays responsive while photos are prepared and uploaded.
 *
 * For each file we produce TWO JPEGs from a single decode:
 *   - `full`    → the upload-sized image (longest edge ≤ maxDimension)
 *   - `preview` → a tiny thumbnail for the on-screen selection strip
 *
 * Requires OffscreenCanvas + createImageBitmap. The main thread only sends work
 * here after feature-detecting both; otherwise it falls back to a main-thread path.
 */

async function encode(bitmap, maxDim, quality) {
  const { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.convertToBlob({ type: 'image/jpeg', quality });
}

self.onmessage = async ({ data }) => {
  const { id, file, maxDimension, quality, previewDimension } = data;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    // Encode sequentially — two OffscreenCanvases alive at once wastes memory on mobile.
    const full = await encode(bitmap, maxDimension, quality);
    const preview = await encode(bitmap, previewDimension, quality);
    if (typeof bitmap.close === 'function') bitmap.close();
    self.postMessage({ id, full, preview });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message ? err.message : err) });
  }
};
