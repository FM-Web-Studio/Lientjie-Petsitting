import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './app.js';
import { COLLECTIONS, CONTACT_LIMITS } from './config.js';
import { CONTACT_RETENTION_DAYS } from '../content/legal.js';

const col = () => collection(db, COLLECTIONS.messages);

const clip = (value, max) => String(value ?? '').trim().slice(0, max);

// Every field is always written, matching petsitting_messages in firestore.rules.
// expireAt drives the TTL policy that deletes the message on that date.
export async function sendMessage(data) {
  const L = CONTACT_LIMITS;
  return addDoc(col(), {
    name: clip(data.name, L.name),
    email: clip(data.email, L.email),
    phone: clip(data.phone, L.phone),
    petName: clip(data.petName, L.petName),
    petType: clip(data.petType, L.petType),
    serviceInterest: clip(data.serviceInterest, L.serviceInterest),
    message: clip(data.message, L.message),
    read: false,
    createdAt: serverTimestamp(),
    expireAt: Timestamp.fromMillis(Date.now() + CONTACT_RETENTION_DAYS * 864e5),
  });
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
