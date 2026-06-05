import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

export async function uploadProfileImage(file) {
  const storageRef = ref(storage, `${STORAGE_PREFIX}/profile/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
