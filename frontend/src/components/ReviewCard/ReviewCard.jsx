import { useState } from 'react';
import StarRating from '../StarRating/StarRating.jsx';
import Skeleton from '../Skeleton/Skeleton.jsx';
import { REVIEW_LIMITS } from '../../firebase/config.js';
import styles from './ReviewCard.module.css';

/*
 * One published review, with its like button and comment thread.
 *
 *   compact - the Home page testimonial strip. Body clamped, no interaction.
 *   full    - the Reviews page. Likes, expandable comments, reply form.
 *
 * Comments arrive already grouped by review (see firebase/reviews.js), so
 * expanding a thread costs no extra reads.
 */

const initial = (name = '') => name.trim().charAt(0).toUpperCase() || '🐾';

/** Firestore Timestamp | Date | ms → a short human date. */
export const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
};

function LikeButton({ count = 0, liked, onToggle, label }) {
  return (
    <button
      type="button"
      className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
      onClick={onToggle}
      aria-pressed={liked}
      aria-label={`${liked ? 'Remove your like from' : 'Like'} ${label}`}
    >
      <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  );
}

export default function ReviewCard({
  review,
  variant = 'full',
  comments = [],
  likedIds,
  onLikeReview,
  onLikeComment,
  onSubmitComment,
}) {
  const compact = variant === 'compact';
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ authorName: '', body: '' });
  const [sending, setSending] = useState(false);

  const liked = likedIds?.has(review.id);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const posted = await onSubmitComment?.(review.id, form);
      // Only clear the box if it actually went through - otherwise a failed
      // submit silently eats what the visitor typed.
      if (posted) setForm({ authorName: '', body: '' });
    } finally {
      setSending(false);
    }
  };

  return (
    <article className={`${styles.card} ${compact ? styles.compact : ''}`}>
      <header className={styles.head}>
        <span className={styles.avatar} aria-hidden="true">{initial(review.authorName)}</span>
        <div className={styles.who}>
          <strong className={styles.author}>{review.authorName}</strong>
          <span className={styles.meta}>
            <StarRating value={review.rating} size="sm" />
            <time className={styles.date}>{formatDate(review.createdAt)}</time>
          </span>
        </div>
      </header>

      {review.title && <h3 className={styles.title}>{review.title}</h3>}
      <p className={styles.body}>{review.body}</p>

      {(review.petName || review.serviceUsed) && (
        <p className={styles.chips}>
          {review.petName && <span className={styles.petChip}>🐾 {review.petName}</span>}
          {review.serviceUsed && <span className={styles.serviceChip}>{review.serviceUsed}</span>}
        </p>
      )}

      {!compact && (
        <footer className={styles.actions}>
          <LikeButton
            count={review.likes || 0}
            liked={liked}
            onToggle={() => onLikeReview?.(review.id)}
            label={`${review.authorName}'s review`}
          />
          <button
            type="button"
            className={styles.commentToggle}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            💬 {comments.length === 0 ? 'Comment' : `${comments.length} comment${comments.length === 1 ? '' : 's'}`}
          </button>
        </footer>
      )}

      {!compact && open && (
        <div className={styles.thread}>
          {comments.map((c) => (
            <div key={c.id} className={styles.comment}>
              <span className={styles.commentAvatar} aria-hidden="true">{initial(c.authorName)}</span>
              <div className={styles.commentBody}>
                <p className={styles.commentHead}>
                  <strong>{c.authorName}</strong>
                  <span className={styles.date}>{formatDate(c.createdAt)}</span>
                </p>
                <p className={styles.commentText}>{c.body}</p>
              </div>
              <LikeButton
                count={c.likes || 0}
                liked={likedIds?.has(c.id)}
                onToggle={() => onLikeComment?.(review.id, c.id)}
                label={`${c.authorName}'s comment`}
              />
            </div>
          ))}

          <form className={styles.replyForm} onSubmit={submit}>
            <input
              className={styles.replyName}
              value={form.authorName}
              onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
              placeholder="Your name"
              maxLength={REVIEW_LIMITS.authorName.max}
              required
            />
            <textarea
              className={styles.replyBody}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Add a comment…"
              rows={2}
              maxLength={REVIEW_LIMITS.comment.max}
              required
            />
            <button type="submit" className="btn btn-teal btn-sm" disabled={sending}>
              {sending ? 'Posting…' : 'Post comment'}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

/** Placeholder matching a review card's shape. */
export function ReviewCardSkeleton({ variant = 'full' }) {
  const compact = variant === 'compact';
  return (
    <article className={`${styles.card} ${compact ? styles.compact : ''}`} aria-hidden="true">
      <header className={styles.head}>
        <Skeleton circle style={{ width: '2.75rem', height: '2.75rem' }} />
        <div className={styles.who}>
          <Skeleton style={{ width: '120px', height: '1rem', marginBottom: '0.4rem' }} />
          <Skeleton style={{ width: '160px', height: '0.85rem' }} />
        </div>
      </header>
      <Skeleton style={{ width: '55%', height: '1.2rem', margin: '0.9rem 0 0.6rem' }} />
      <Skeleton style={{ width: '100%', height: '0.95rem', marginBottom: '0.35rem' }} />
      <Skeleton style={{ width: '100%', height: '0.95rem', marginBottom: '0.35rem' }} />
      <Skeleton style={{ width: '70%', height: '0.95rem' }} />
      {!compact && (
        <div className={styles.actions}>
          <Skeleton style={{ width: '64px', height: '2rem', borderRadius: 'var(--radius-full)' }} />
          <Skeleton style={{ width: '110px', height: '2rem', borderRadius: 'var(--radius-full)' }} />
        </div>
      )}
    </article>
  );
}
