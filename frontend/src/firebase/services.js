import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from './app.js';
import { COLLECTIONS } from './config.js';

const col = () => collection(db, COLLECTIONS.services);

export async function getServices(activeOnly = true) {
  const snap = await getDocs(col());
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((d) => !activeOnly || d.active !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export async function addService(data) {
  return addDoc(col(), { ...data, active: true });
}

export async function updateService(id, data) {
  return updateDoc(doc(db, COLLECTIONS.services, id), data);
}

export async function deleteService(id) {
  return deleteDoc(doc(db, COLLECTIONS.services, id));
}
