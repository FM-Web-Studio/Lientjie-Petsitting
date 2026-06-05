import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './app.js';
import { COLLECTIONS, STORAGE_PREFIX } from './config.js';

const col = () => collection(db, COLLECTIONS.gallery);

export async function getGalleryImages(activeOnly = true) {
  const snap = await getDocs(col());
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((d) => !activeOnly || d.active !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export async function uploadGalleryImage(file, caption, category) {
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, `${STORAGE_PREFIX}/${fileName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  const snap = await getDocs(col());
  const order = snap.size;

  return addDoc(col(), {
    url,
    storagePath: `${STORAGE_PREFIX}/${fileName}`,
    caption: caption || '',
    category: category || 'Other Pets',
    active: true,
    order,
    uploadedAt: new Date(),
  });
}

export async function updateGalleryImage(id, data) {
  return updateDoc(doc(db, COLLECTIONS.gallery, id), data);
}

export async function deleteGalleryImage(id, storagePath) {
  if (storagePath) {
    try { await deleteObject(ref(storage, storagePath)); } catch (_) { /* already deleted */ }
  }
  return deleteDoc(doc(db, COLLECTIONS.gallery, id));
}
