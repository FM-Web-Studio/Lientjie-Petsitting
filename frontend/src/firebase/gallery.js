import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './app.js';
import { COLLECTIONS, STORAGE_PREFIX } from './config.js';
import { compressImage } from '../utils/image.js';

// How many images to upload at once. Small enough to stay gentle on mobile
// memory, large enough to beat one-at-a-time latency.
const UPLOAD_CONCURRENCY = 3;
// How many times to retry a single failed upload before giving up on it.
const MAX_RETRIES = 2;

/*
 * Gallery is organised as "posts" (a.k.a. folders / albums) — Instagram-style.
 * Each document in `petsitting_albums` holds many images plus a shared caption:
 *   {
 *     title, caption, category, active, order, coverIndex,
 *     images: [{ url, storagePath }],
 *     createdAt, updatedAt,
 *   }
 */

const col = () => collection(db, COLLECTIONS.albums);
const albumDoc = (id) => doc(db, COLLECTIONS.albums, id);

/**
 * Compress + upload a single file to storage, reporting progress (0..1).
 * Returns its { url, storagePath }.
 */
async function uploadFile(file, onProgress) {
  const compressed = await compressImage(file);
  const safeName = compressed.name.replace(/\s+/g, '_');
  const fileName = `${Date.now()}_${Math.round(Math.random() * 1e6)}_${safeName}`;
  const storagePath = `${STORAGE_PREFIX}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, compressed, { contentType: compressed.type });
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0),
      reject,
      resolve,
    );
  });

  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

/** Upload a file with a few retries, so one flaky request doesn't sink the batch. */
async function uploadFileWithRetry(file, onProgress) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await uploadFile(file, onProgress); // eslint-disable-line no-await-in-loop
    } catch (err) {
      lastErr = err;
      onProgress?.(0); // reset this file's progress before retrying
    }
  }
  throw lastErr;
}

/**
 * Upload many files with limited concurrency, preserving selection order.
 * `onProgress` receives overall completion (0..1) across the whole batch.
 * Files that fail after retries resolve to `null` (rather than aborting the
 * whole batch), so a single bad photo never discards the ones that succeeded.
 */
async function uploadFiles(files, onProgress) {
  const results = new Array(files.length).fill(null);
  const perFile = new Array(files.length).fill(0);
  const report = () => onProgress?.(perFile.reduce((a, b) => a + b, 0) / files.length);

  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const i = cursor;
      cursor += 1;
      try {
        results[i] = await uploadFileWithRetry(files[i], (p) => { perFile[i] = p; report(); }); // eslint-disable-line no-await-in-loop
      } catch {
        results[i] = null; // give up on this one file; keep the rest
      }
      perFile[i] = 1;
      report();
    }
  }

  const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, worker);
  await Promise.all(workers);
  return results; // may contain nulls for failed uploads
}

/** Fetch all posts, newest first by `order`. Public callers pass activeOnly = true. */
export async function getAlbums(activeOnly = true) {
  const snap = await getDocs(col());
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((d) => !activeOnly || d.active !== false)
    .map((d) => ({ ...d, images: Array.isArray(d.images) ? d.images : [] }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/** The cover image object for a post ({ url, storagePath }), or null. */
export function albumCover(album) {
  if (!album?.images?.length) return null;
  const idx = Math.min(album.coverIndex ?? 0, album.images.length - 1);
  return album.images[idx];
}

/**
 * Create a new post from a list of files + shared metadata.
 * `onProgress` receives overall upload completion (0..1).
 * Returns { ref, uploaded, failed } so the caller can report partial failures.
 */
export async function createAlbum({ title = '', caption = '', category = 'Dogs', files = [], onProgress }) {
  const results = await uploadFiles(files, onProgress);
  const images = results.filter(Boolean);
  if (!images.length) throw new Error('All image uploads failed.');

  const snap = await getDocs(col());
  const created = await addDoc(col(), {
    title: title || '',
    caption: caption || '',
    category: category || 'Other Pets',
    active: true,
    order: snap.size,
    coverIndex: 0,
    images,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { ref: created, uploaded: images.length, failed: files.length - images.length };
}

/** Patch a post's metadata (caption, category, title, active, coverIndex, order). */
export async function updateAlbum(id, data) {
  return updateDoc(albumDoc(id), { ...data, updatedAt: new Date() });
}

/**
 * Upload and append more images to an existing post.
 * Returns { images, uploaded, failed }. Files that fail after retries are skipped.
 */
export async function addImagesToAlbum(id, files, existingImages = [], onProgress) {
  const results = await uploadFiles(files, onProgress);
  const uploaded = results.filter(Boolean);
  if (!uploaded.length) throw new Error('All image uploads failed.');

  const images = [...existingImages, ...uploaded];
  await updateDoc(albumDoc(id), { images, updatedAt: new Date() });
  return { images, uploaded: uploaded.length, failed: files.length - uploaded.length };
}

/** Remove one image (by index) from a post, deleting it from storage too. */
export async function removeImageFromAlbum(id, images, index) {
  const target = images[index];
  if (target?.storagePath) {
    try { await deleteObject(ref(storage, target.storagePath)); } catch (_) { /* already gone */ }
  }
  const next = images.filter((_, i) => i !== index);
  // Keep the cover pointing at a valid image.
  await updateDoc(albumDoc(id), { images: next, coverIndex: 0, updatedAt: new Date() });
  return next;
}

/** Delete an entire post and every image it holds from storage. */
export async function deleteAlbum(id, images = []) {
  for (const img of images) {
    if (img?.storagePath) {
      try { await deleteObject(ref(storage, img.storagePath)); } catch (_) { /* already gone */ } // eslint-disable-line no-await-in-loop
    }
  }
  return deleteDoc(albumDoc(id));
}
