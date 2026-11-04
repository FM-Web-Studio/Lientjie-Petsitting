import { signInWithPopup, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './app.js';

// Always show the account picker, so a shared computer never signs in as whoever
// happened to be logged into Google last.
googleProvider.setCustomParameters({ prompt: 'select_account' });

// The admin sign-in lasts until the browser is closed, not for months. Forgetting to
// sign out on someone else's laptop then does not leave the admin panel open. Set once
// here rather than inside signInWithGoogle: anything awaited between a tap and the popup
// can make Safari treat the popup as unrequested and block it.
setPersistence(auth, browserSessionPersistence).catch(() => {});

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

// The allow-list firestore.rules checks. Rules let only a listed, verified address read it.
export async function isListedAdmin(email) {
  try {
    const emails = (await getDoc(doc(db, 'settings', 'admins'))).data()?.emails;
    return Array.isArray(emails) && emails.includes(email);
  } catch {
    return false;
  }
}
