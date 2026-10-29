import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './app.js';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

// The allow-list firestore.rules checks. Rules let only a listed address read it.
export async function isListedAdmin(email) {
  try {
    const emails = (await getDoc(doc(db, 'settings', 'admins'))).data()?.emails;
    return Array.isArray(emails) && emails.includes(email);
  } catch {
    return false;
  }
}
