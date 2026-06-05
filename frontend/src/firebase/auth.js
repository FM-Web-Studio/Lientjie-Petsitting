import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './app.js';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}
