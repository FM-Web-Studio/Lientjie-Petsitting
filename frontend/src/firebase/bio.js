import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './app.js';
import { COLLECTIONS, BIO_DOC, STORAGE_PREFIX } from './config.js';

const bioRef = () => doc(db, COLLECTIONS.bio, BIO_DOC);

export async function getBio() {
  const snap = await getDoc(bioRef());
  return snap.exists() ? snap.data() : null;
}

export async function saveBio(data) {
  return setDoc(bioRef(), data, { merge: true });
}

/**
 * Upload a new profile photo, reporting progress (0..1).
 *
 * Three things this deliberately does NOT do the naive way:
 *   - `uploadBytesResumable`, not `uploadBytes`. The one-shot variant reports no
 *     progress and surfaces nothing while a phone photo crawls up a slow link,
 *     which is indistinguishable from a hang.
 *   - A unique, sanitised filename. Writing to a fixed `profile/<original name>`
 *     overwrites the previous object, and browsers/the CDN happily keep serving
 *     the cached old bytes for the unchanged URL - the upload "works" and the
 *     picture never changes.
 *   - An explicit contentType. storage.rules requires `image/*`; a file the
 *     browser hands us with an empty `type` would otherwise upload as
 *     application/octet-stream and be rejected.
 *
 * Returns { url, storagePath } - the path is stored alongside the URL so the
 * previous photo can be cleaned up instead of orphaning a file per upload.
 */
export async function uploadProfileImage(file, onProgress) {
  const safeName = (file.name || 'profile.jpg').replace(/[^\w.-]+/g, '_');
  const storagePath = `${STORAGE_PREFIX}/profile/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    });
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

/** Best-effort removal of a superseded profile photo. Never throws. */
export async function deleteProfileImage(storagePath) {
  if (!storagePath) return;
  try { await deleteObject(ref(storage, storagePath)); } catch { /* already gone */ }
}
