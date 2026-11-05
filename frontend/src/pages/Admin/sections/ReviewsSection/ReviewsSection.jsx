import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllReviews, getAllCommentsFlat, setReviewApproved, setCommentApproved,
  deleteReview, deleteComment, ratingSummary,
} from '../../../../firebase/reviews.js';
import { useToast } from '../../../../context/ToastContext.jsx';
import Skeleton from '../../../../components/Skeleton';
import StarRating from '../../../../components/StarRating';
import styles from '../../Admin.module.css';

/*
 * Moderation queue for reviews and their comments.
 *
 * Reviews and comments are loaded together, up front, in two reads. The earlier
 * version fetched a review's comments only when that review was expanded, which
 * meant a comment waiting for approval on an already-published review was
 * invisible - there was no way to know it existed without opening every review
 * in turn. Everything pending now surfaces in one list regardless of what it
 * hangs off.
 *
 * Pending items render fully expanded. A moderation queue exists to be read and
 * cleared; making someone click each item open before they can judge it is the
 * one place where saving vertical space costs more than it saves.
 */

const FILTERS = [
  { key: 'pending', label: 'Needs attention' },
  { key: 'published', label: 'Published' },
  { key: 'all', label: 'All' },
];

const fmt = (ts) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ReviewsSection() {
  const { addToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([getAllReviews(), getAllCommentsFlat()])
      .then(([r, c]) => { setReviews(r); setComments(c); })
      .catch((err) => {
        console.error('Failed to load reviews:', err);
        addToast('Could not load reviews.', 'error');
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const reviewById = useMemo(() => new Map(reviews.map((r) => [r.id, r])), [reviews]);
  const commentsByReview = useMemo(() => {
    const map = {};
    for (const c of comments) (map[c.reviewId] ||= []).push(c);
    return map;
  }, [comments]);

  const pendingReviews = useMemo(() => reviews.filter((r) => !r.approved), [reviews]);
  const pendingComments = useMemo(() => comments.filter((c) => !c.approved), [comments]);
  const pendingTotal = pendingReviews.length + pendingComments.length;

  const summary = useMemo(() => ratingSummary(reviews.filter((r) => r.approved)), [reviews]);

  const listed = useMemo(() => {
    if (filter === 'published') return reviews.filter((r) => r.approved);
    if (filter === 'all') return reviews;
    return [];
  }, [reviews, filter]);

  const guard = async (id, fn, successMessage) => {
    setBusy(id);
    try {
      await fn();
      await load();
      if (successMessage) addToast(successMessage, 'success');
    } catch (err) {
      const reason = err?.code === 'permission-denied'
        ? 'Permission denied - make sure you are signed in as an admin.'
        : err?.message || 'Unknown error';
      addToast(`Failed: ${reason}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  const toggleReview = (review) => guard(
    review.id,
    () => setReviewApproved(review.id, !review.approved),
    review.approved ? 'Review hidden from the site.' : 'Review published.',
  );

  const removeReview = (review) => {
    if (!confirm(`Delete ${review.authorName}'s review and all its comments? This cannot be undone.`)) return undefined;
    return guard(review.id, () => deleteReview(review.id), 'Review deleted.');
  };

  const toggleComment = (comment) => guard(
    comment.id,
    () => setCommentApproved(comment.reviewId, comment.id, !comment.approved),
    comment.approved ? 'Comment hidden.' : 'Comment published.',
  );

  const removeComment = (comment) => {
    if (!confirm(`Delete ${comment.authorName}'s comment?`)) return undefined;
    return guard(comment.id, () => deleteComment(comment.reviewId, comment.id), 'Comment deleted.');
  };

  /** Publish everything currently waiting, in one go. */
  const publishAllPending = () => {
    if (!confirm(`Publish all ${pendingTotal} waiting item(s)? Read them first - this puts them straight on the site.`)) return undefined;
    return guard('bulk', async () => {
      await Promise.all([
        ...pendingReviews.map((r) => setReviewApproved(r.id, true)),
        ...pendingComments.map((c) => setCommentApproved(c.reviewId, c.id, true)),
      ]);
    }, 'Everything published.');
  };

  // ── Pieces ────────────────────────────────────────────────────────────────

  const reviewActions = (review) => (
    <div className={styles.msgActions}>
      <button
        className={`btn btn-sm ${review.approved ? 'btn-secondary' : 'btn-teal'}`}
        onClick={() => toggleReview(review)}
        disabled={busy === review.id}
      >
        {review.approved ? 'Hide from site' : 'Publish'}
      </button>
      <button
        className={`btn btn-sm ${styles.deleteBtn}`}
        onClick={() => removeReview(review)}
        disabled={busy === review.id}
      >
        Delete
      </button>
    </div>
  );

  const commentRow = (comment, { showParent = false } = {}) => {
    const parent = reviewById.get(comment.reviewId);
    return (
      <div key={comment.id} className={`${styles.reviewComment} ${!comment.approved ? styles.commentPending : ''}`}>
        <div className={styles.reviewCommentBody}>
          {showParent && (
            <p className={styles.modParent}>
              on <strong>{parent?.authorName || 'a review'}</strong>
              {parent?.title ? ` — “${parent.title}”` : ''}
              {parent && !parent.approved && <span className={styles.unreadBadge} style={{ marginLeft: '0.4rem' }}>review not published</span>}
            </p>
          )}
          <p>
            <strong>{comment.authorName}</strong>
            {comment.flagged && (
              <span className={styles.spamBadge} title={(comment.flags || []).join('; ')}>⚠️ Likely spam</span>
            )}
            <span className={styles.msgDate}> · {fmt(comment.createdAt)}</span>
            {!comment.approved && <span className={styles.unreadBadge} style={{ marginLeft: '0.5rem' }}>Pending</span>}
          </p>
          <p className={styles.msgText}>{comment.body}</p>
        </div>
        <div className={styles.msgActions}>
          <button
            className={`btn btn-sm ${comment.approved ? 'btn-secondary' : 'btn-teal'}`}
            onClick={() => toggleComment(comment)}
            disabled={busy === comment.id}
          >
            {comment.approved ? 'Hide' : 'Publish'}
          </button>
          <button
            className={`btn btn-sm ${styles.deleteBtn}`}
            onClick={() => removeComment(comment)}
            disabled={busy === comment.id}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <span className={styles.helpText} style={{ margin: 0 }}>
          {pendingTotal > 0
            ? (
              <span className={styles.unreadBadge}>
                {pendingReviews.length} review(s) · {pendingComments.length} comment(s) waiting
              </span>
            )
            : 'Nothing waiting - the queue is clear.'}
          {summary.total > 0 && (
            <span style={{ marginLeft: '0.6rem' }}>
              Published average {summary.average.toFixed(1)} ★ from {summary.total}.
            </span>
          )}
        </span>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}{f.key === 'pending' && pendingTotal > 0 ? ` (${pendingTotal})` : ''}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.helpText}>
        Reviews and comments stay invisible on the site until you publish them here.
      </p>

      {loading && (
        <div className={styles.messageList}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.messageCard}>
              <div className={styles.msgHeader} style={{ cursor: 'default' }}>
                <div className={styles.msgMeta}>
                  <Skeleton style={{ width: '140px', height: '1rem' }} />
                  <Skeleton style={{ width: '90px', height: '0.85rem' }} />
                </div>
                <Skeleton style={{ width: '120px', height: '0.8rem', flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Needs attention: reviews AND comments together ─────────────────── */}
      {!loading && filter === 'pending' && (
        pendingTotal === 0 ? (
          <p className={styles.empty}>Nothing waiting for approval 🎉</p>
        ) : (
          <>
            <div className={styles.modBulk}>
              <button
                className="btn btn-teal btn-sm"
                onClick={publishAllPending}
                disabled={busy === 'bulk'}
              >
                {busy === 'bulk' ? 'Publishing…' : `Publish all ${pendingTotal}`}
              </button>
            </div>

            {pendingReviews.length > 0 && (
              <>
                <h3 className={styles.modGroupTitle}>Reviews waiting ({pendingReviews.length})</h3>
                <div className={styles.messageList}>
                  {pendingReviews.map((review) => (
                    <div key={review.id} className={`${styles.messageCard} ${styles.unread}`}>
                      <div className={styles.msgHeader} style={{ cursor: 'default' }}>
                        <div className={styles.msgMeta}>
                          <span className={styles.dot} />
                          <strong>{review.authorName}</strong> {review.flagged && <span className={styles.spamBadge} title={(review.flags || []).join('; ')}>⚠️ Likely spam</span>}
                          <StarRating value={review.rating} size="sm" />
                          {review.petName && <span className={styles.petChip}>🐾 {review.petName}</span>}
                          {review.serviceUsed && <span className={styles.serviceChip}>{review.serviceUsed}</span>}
                        </div>
                        <span className={styles.msgDate}>{fmt(review.createdAt)}</span>
                      </div>
                      <div className={styles.msgBody}>
                        {review.title && <p><strong>{review.title}</strong></p>}
                        <p className={styles.msgText}>{review.body}</p>
                        {reviewActions(review)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {pendingComments.length > 0 && (
              <>
                <h3 className={styles.modGroupTitle}>Comments waiting ({pendingComments.length})</h3>
                <div className={styles.messageList}>
                  {pendingComments.map((c) => commentRow(c, { showParent: true }))}
                </div>
              </>
            )}
          </>
        )
      )}

      {/* ── Published / All: reviews with their threads ────────────────────── */}
      {!loading && filter !== 'pending' && (
        <div className={styles.messageList}>
          {listed.length === 0 && <p className={styles.empty}>No reviews here yet.</p>}

          {listed.map((review) => {
            const thread = commentsByReview[review.id] || [];
            const waiting = thread.filter((c) => !c.approved).length;
            return (
              <div key={review.id} className={`${styles.messageCard} ${!review.approved ? styles.unread : ''}`}>
                <div className={styles.msgHeader} onClick={() => setExpanded(expanded === review.id ? null : review.id)}>
                  <div className={styles.msgMeta}>
                    {!review.approved && <span className={styles.dot} />}
                    <strong>{review.authorName}</strong> {review.flagged && <span className={styles.spamBadge} title={(review.flags || []).join('; ')}>⚠️ Likely spam</span>}
                    <StarRating value={review.rating} size="sm" />
                    {thread.length > 0 && <span className={styles.serviceChip}>💬 {thread.length}</span>}
                    {waiting > 0 && <span className={styles.unreadBadge}>{waiting} waiting</span>}
                  </div>
                  <span className={styles.msgDate}>{fmt(review.createdAt)}</span>
                </div>

                {expanded === review.id && (
                  <div className={styles.msgBody}>
                    {review.title && <p><strong>{review.title}</strong></p>}
                    <p className={styles.msgText}>{review.body}</p>
                    <p className={styles.msgPhone}>❤️ {review.likes || 0} like(s)</p>
                    {reviewActions(review)}

                    <div className={styles.reviewThread}>
                      <p className={styles.helpText} style={{ margin: '0 0 0.5rem' }}>
                        {thread.length === 0 ? 'No comments on this review.' : `${thread.length} comment(s)`}
                      </p>
                      {thread.map((c) => commentRow(c))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
