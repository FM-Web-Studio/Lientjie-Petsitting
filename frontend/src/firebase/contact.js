import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './app.js';
import { COLLECTIONS } from './config.js';

const col = () => collection(db, COLLECTIONS.messages);

export async function sendMessage(data) {
  return addDoc(col(), { ...data, read: false, createdAt: new Date() });
}

export async function getMessages() {
  const q = query(col(), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markMessageRead(id, read = true) {
  return updateDoc(doc(db, COLLECTIONS.messages, id), { read });
}

export async function deleteMessage(id) {
  return deleteDoc(doc(db, COLLECTIONS.messages, id));
}
