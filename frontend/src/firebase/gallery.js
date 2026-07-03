import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './app.js';
import { COLLECTIONS, STORAGE_PREFIX } from './config.js';

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

/** Upload a single file to storage and return its { url, storagePath }. */
async function uploadFile(file) {
  const fileName = `${Date.now()}_${Math.round(Math.random() * 1e6)}_${file.name.replace(/\s+/g, '_')}`;
  const storagePath = `${STORAGE_PREFIX}/${fileName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

/** Upload many files sequentially, preserving selection order. */
async function uploadFiles(files) {
  const images = [];
  for (const file of files) {
    images.push(await uploadFile(file)); // eslint-disable-line no-await-in-loop
  }
  return images;
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

/** Create a new post from a list of files + shared metadata. */
export async function createAlbum({ title = '', caption = '', category = 'Dogs', files = [] }) {
  const images = await uploadFiles(files);
  const snap = await getDocs(col());
  return addDoc(col(), {
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
}

/** Patch a post's metadata (caption, category, title, active, coverIndex, order). */
export async function updateAlbum(id, data) {
  return updateDoc(albumDoc(id), { ...data, updatedAt: new Date() });
}

/** Upload and append more images to an existing post. Returns the new images array. */
export async function addImagesToAlbum(id, files, existingImages = []) {
  const uploaded = await uploadFiles(files);
  const images = [...existingImages, ...uploaded];
  await updateDoc(albumDoc(id), { images, updatedAt: new Date() });
  return images;
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
