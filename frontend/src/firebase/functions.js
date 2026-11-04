import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './app.js';

// Visitors never write Firestore directly. Contact messages, reviews and comments go
// through these functions (functions/index.js), which check for spam and save them.
const call = (name) => httpsCallable(getFunctions(app, 'europe-west1'), name);

export const LIMIT_TEXT = {
  sender: 'You have sent a few already. Please try again tomorrow.',
  everyone: 'The site has had a lot of posts today. Please try again tomorrow.',
};

/**
 * Calls a function and turns a rate limit into an Error with .limit set to
 * 'sender' or 'everyone', so the page can show LIMIT_TEXT[err.limit].
 */
export async function callPublic(name, data) {
  try {
    await call(name)(data);
  } catch (err) {
    const tooMany = err?.code === 'functions/resource-exhausted';
    const error = new Error(tooMany ? 'limit' : 'failed');
    error.limit = tooMany ? (err.message === 'everyone' ? 'everyone' : 'sender') : null;
    throw error;
  }
}
