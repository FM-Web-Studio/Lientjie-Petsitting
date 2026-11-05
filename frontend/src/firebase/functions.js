import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './app.js';

// Visitors never write Firestore directly. Contact messages, reviews, comments and
// likes go through these functions (functions/ in the Lientjie-Portfolio repo), which require App Check,
// check for spam and save them.
//
// limitedUseAppCheckTokens asks for a fresh single-use token per call. postReview and
// likePost spend each token once, so a token copied out of the browser cannot be replayed.
const call = (name) => httpsCallable(getFunctions(app, 'europe-west1'), name, { limitedUseAppCheckTokens: true });

export const LIMIT_TEXT = {
  sender: 'You have sent a few already. Please try again tomorrow.',
  everyone: 'The site has had a lot of posts today. Please try again tomorrow.',
};

/**
 * Calls a function and returns its data. A rate limit becomes an Error with .limit
 * set to 'sender' or 'everyone', so the page can show LIMIT_TEXT[err.limit].
 */
export async function callPublic(name, data) {
  try {
    const result = await call(name)(data);
    return result.data;
  } catch (err) {
    const tooMany = err?.code === 'functions/resource-exhausted';
    const error = new Error(tooMany ? 'limit' : 'failed');
    error.limit = tooMany ? (err.message === 'everyone' ? 'everyone' : 'sender') : null;
    error.code = err?.code;
    throw error;
  }
}
