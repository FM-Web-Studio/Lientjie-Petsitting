/*
 * Small localStorage helpers for the review page's "have I already done this?"
 * state - which reviews/comments this browser has liked, and when it last
 * posted.
 *
 * This is deliberately NOT a security control. The likePost function is what
 * allows one like per visitor; this only remembers which hearts to show filled.
 * Real abuse of reviews is caught by moderation - nothing appears on the site
 * until an admin approves it.
 */

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private mode / disabled storage - degrade to "nothing remembered"
  }
};

const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* nothing we can do */ }
};

const LIKES_KEY = 'petsitting.likedIds';

/** The set of review/comment ids this browser has liked. */
export function likedIds() {
  const list = read(LIKES_KEY);
  return new Set(Array.isArray(list) ? list : []);
}

/** Remember whether this browser likes an id. */
export function setLikedFlag(id, liked) {
  const set = likedIds();
  if (liked) set.add(id); else set.delete(id);
  write(LIKES_KEY, [...set]);
}

const LAST_POST_KEY = 'petsitting.lastReviewAt';

/** Minimum gap between review submissions from one browser. */
const REVIEW_COOLDOWN_MS = 5 * 60 * 1000;

/** Milliseconds still to wait before this browser may post again (0 if ready). */
export function reviewCooldownRemaining() {
  const last = Number(read(LAST_POST_KEY)) || 0;
  return Math.max(0, last + REVIEW_COOLDOWN_MS - Date.now());
}

export function markReviewPosted() {
  write(LAST_POST_KEY, Date.now());
}
