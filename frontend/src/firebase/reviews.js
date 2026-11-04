import {
  collection, collectionGroup, doc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, writeBatch,
} from 'firebase/firestore';
import { db } from './app.js';
import { COLLECTIONS, REVIEW_COMMENTS, REVIEW_LIMITS } from './config.js';
import { callPublic } from './functions.js';

/*
 * Public reviews, with comments and likes.
 *
 *   petsitting_reviews/{reviewId}
 *     authorName, rating (1-5), title, body, petName, serviceUsed,
 *     approved, likes, createdAt
 *
 *   petsitting_reviews/{reviewId}/petsitting_review_comments/{commentId}
 *     authorName, body, approved, likes, createdAt
 *
 * Three deliberate design choices, all enforced in firestore.rules:
 *
 * 1. MODERATED. Anyone may post, but `approved` is false on create and only an
 *    admin can flip it. An open, instantly-public write endpoint on a small
 *    business's site is a spam and defamation liability; the poster gets a
 *    "waiting to be published" confirmation instead.
 *
 * 2. NO EMAIL ADDRESSES. Reviews are world-readable, so anything stored on the
 *    document is public - a contact field would be a PII leak the moment the
 *    page loads. Reviewers give a display name only.
 *
 * 3. ONE LIKE PER VISITOR. Likes go through the likePost function, which keeps
 *    a scrambled record per visitor and post, so liking again does nothing and
 *    a script cannot pump the counter. The browser also remembers what it
 *    liked (utils/localFlags.js) so the heart shows the right state.
 */

const reviewsCol = () => collection(db, COLLECTIONS.reviews);
const reviewDoc = (id) => doc(db, COLLECTIONS.reviews, id);
const commentsCol = (reviewId) => collection(db, COLLECTIONS.reviews, reviewId, REVIEW_COMMENTS);
const commentDoc = (reviewId, commentId) => doc(db, COLLECTIONS.reviews, reviewId, REVIEW_COMMENTS, commentId);

const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

/** Trim to a max length, collapsing surrounding whitespace. */
const clip = (value, max) => String(value ?? '').trim().slice(0, max);

// ── Reading ─────────────────────────────────────────────────────────────────

/**
 * Published reviews, newest first.
 *
 * The `approved` filter is not optional decoration: rules evaluate per returned
 * document, so an unfiltered query would include pending reviews, fail the read
 * check, and reject the whole query. Sorting/filtering by rating or likes then
 * happens client-side - a petsitter's review count stays small, and one index
 * beats four.
 */
export async function getApprovedReviews() {
  const q = query(reviewsCol(), where('approved', '==', true), orderBy('createdAt', 'desc'));
  return mapDocs(await getDocs(q));
}

/** Every review including pending ones. Admin only - rules reject this otherwise. */
export async function getAllReviews() {
  const q = query(reviewsCol(), orderBy('createdAt', 'desc'));
  return mapDocs(await getDocs(q));
}

/**
 * Every published comment across every review, in one collection-group read,
 * grouped by review id. Loading comments per-review would be one query per card;
 * this keeps the page at a flat two reads no matter how many reviews there are.
 */
export async function getApprovedCommentsByReview() {
  const q = query(
    collectionGroup(db, REVIEW_COMMENTS),
    where('approved', '==', true),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  const byReview = {};
  for (const d of snap.docs) {
    const reviewId = d.ref.parent.parent?.id;
    if (!reviewId) continue;
    (byReview[reviewId] ||= []).push({ id: d.id, reviewId, ...d.data() });
  }
  return byReview;
}

/**
 * Every comment in the project, pending included, as one flat list. Admin only.
 *
 * This is what lets the moderation screen show pending comments without first
 * knowing which review they hang off - otherwise a comment awaiting approval is
 * invisible until someone happens to expand the right review.
 *
 * Deliberately unordered and unfiltered: a collection-group query with no
 * `where` and no `orderBy` needs no index at all, so this cannot break the admin
 * screen while an index builds. Ordering happens in JS.
 */
export async function getAllCommentsFlat() {
  const snap = await getDocs(collectionGroup(db, REVIEW_COMMENTS));
  return snap.docs
    .map((d) => ({ id: d.id, reviewId: d.ref.parent.parent?.id, ...d.data() }))
    .filter((c) => c.reviewId)
    .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
}

// ── Writing (public) ────────────────────────────────────────────────────────

/**
 * Submit a review through the postReview function, which checks for spam and saves
 * it unpublished. trap is trapFields() from the Honeypot component.
 */
export async function submitReview({ authorName, rating, title, body, petName, serviceUsed }, trap) {
  return callPublic('postReview', {
    kind: 'review',
    authorName: clip(authorName, REVIEW_LIMITS.authorName.max),
    rating: Number(rating),
    title: clip(title, REVIEW_LIMITS.title.max),
    body: clip(body, REVIEW_LIMITS.body.max),
    petName: clip(petName, REVIEW_LIMITS.petName.max),
    serviceUsed: clip(serviceUsed, 80),
    ...trap,
  });
}

/** Post a comment on a published review. Also unpublished until approved. */
export async function submitComment(reviewId, { authorName, body }, trap) {
  return callPublic('postReview', {
    kind: 'comment',
    reviewId,
    authorName: clip(authorName, REVIEW_LIMITS.authorName.max),
    body: clip(body, REVIEW_LIMITS.comment.max),
    ...trap,
  });
}

/**
 * Like or unlike a review. The likePost function remembers one like per visitor,
 * so liking twice does nothing. Resolves to { liked, likes } as the server sees it.
 */
export function setReviewLiked(reviewId, like) {
  return callPublic('likePost', { reviewId, like: !!like });
}

/** Like or unlike a comment. Same rules as setReviewLiked. */
export function setCommentLiked(reviewId, commentId, like) {
  return callPublic('likePost', { reviewId, commentId, like: !!like });
}

// ── Writing (admin) ─────────────────────────────────────────────────────────

export function setReviewApproved(id, approved) {
  return updateDoc(reviewDoc(id), { approved: !!approved });
}

export function setCommentApproved(reviewId, commentId, approved) {
  return updateDoc(commentDoc(reviewId, commentId), { approved: !!approved });
}

export function deleteComment(reviewId, commentId) {
  return deleteDoc(commentDoc(reviewId, commentId));
}

/**
 * Delete a review and its comments. Firestore does not cascade - deleting the
 * parent alone would strand the subcollection as unreachable-but-billed
 * documents that reappear if the id is ever reused.
 */
export async function deleteReview(id) {
  const snap = await getDocs(commentsCol(id));
  // A batch tops out at 500 writes, so chunk rather than fail on a busy thread.
  for (let i = 0; i < snap.docs.length; i += 500) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
    await batch.commit(); // eslint-disable-line no-await-in-loop
  }
  return deleteDoc(reviewDoc(id));
}

// ── Derived ─────────────────────────────────────────────────────────────────

/**
 * Average, total, and a 5→1 count breakdown for a set of reviews.
 * Returns `average: 0` for an empty list so callers can render without guarding.
 */
export function ratingSummary(reviews = []) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  for (const r of reviews) {
    const rating = Math.round(Number(r.rating) || 0);
    if (rating >= 1 && rating <= 5) { counts[rating] += 1; sum += rating; }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { average: total ? sum / total : 0, total, counts };
}
