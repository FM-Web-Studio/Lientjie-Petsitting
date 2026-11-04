import {
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore';
import { db } from './app.js';
import { COLLECTIONS, CONTACT_LIMITS } from './config.js';
import { callPublic } from './functions.js';

const col = () => collection(db, COLLECTIONS.messages);

const clip = (value, max) => String(value ?? '').trim().slice(0, max);

// Sent through the sendMessage function, which checks for spam, stamps the time and
// the expiry date, and saves it. trap is trapFields() from the Honeypot component.
export async function sendMessage(data, trap) {
  const L = CONTACT_LIMITS;
  return callPublic('sendMessage', {
    site: 'petsitting',
    name: clip(data.name, L.name),
    email: clip(data.email, L.email),
    phone: clip(data.phone, L.phone),
    petName: clip(data.petName, L.petName),
    petType: clip(data.petType, L.petType),
    serviceInterest: clip(data.serviceInterest, L.serviceInterest),
    message: clip(data.message, L.message),
    ...trap,
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
