import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  getApprovedCommentsByReview, submitReview, submitComment,
  likeReview, likeComment, ratingSummary,
} from '../../firebase/reviews.js';
import { REVIEW_LIMITS, REVIEW_SORTS } from '../../firebase/config.js';
import { likedIds as readLikedIds, toggleLiked, reviewCooldownRemaining, markReviewPosted } from '../../utils/localFlags.js';
import ReviewCard, { ReviewCardSkeleton } from '../../components/ReviewCard/ReviewCard.jsx';
import StarRating from '../../components/StarRating/StarRating.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import InfoNote from '../../components/InfoNote/InfoNote.jsx';
import Honeypot, { caughtBot } from '../../components/Honeypot/Honeypot.jsx';
import styles from './Reviews.module.css';

const BLANK = { authorName: '', rating: 0, title: '', body: '', petName: '', serviceUsed: '' };

const STARS_DESC = [5, 4, 3, 2, 1];

export default function Reviews() {
  const { reviews, services, loading, errors } = useData();
  const { copy } = useContent();
  const { addToast } = useToast();
  const t = copy('reviews');

  const [commentsByReview, setCommentsByReview] = useState({});
  const [liked, setLiked] = useState(() => readLikedIds());
  // Local +1/-1 overlay on the stored like counts, so a like shows up instantly
  // without refetching every review on the page.
  const [likeDeltas, setLikeDeltas] = useState({});
  const [sort, setSort] = useState('newest');
  const [filterRating, setFilterRating] = useState(0); // 0 = show all
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const trap = useRef(null);

  useEffect(() => {
    getApprovedCommentsByReview()
      .then(setCommentsByReview)
      .catch((err) => console.error('Failed to load comments:', err));
  }, []);

  const summary = useMemo(() => ratingSummary(reviews), [reviews]);

  const shown = useMemo(() => {
    const list = filterRating
      ? reviews.filter((r) => Math.round(r.rating) === filterRating)
      : [...reviews];
    const byNewest = (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
    // Ties fall back to newest, so equal ratings still read in a sensible order.
    const comparators = {
      newest: byNewest,
      highest: (a, b) => (b.rating - a.rating) || byNewest(a, b),
      lowest: (a, b) => (a.rating - b.rating) || byNewest(a, b),
      liked: (a, b) => ((b.likes || 0) - (a.likes || 0)) || byNewest(a, b),
    };
    return list.sort(comparators[sort] || comparators.newest);
  }, [reviews, sort, filterRating]);

  /*
   * Likes are optimistic: the counter moves immediately and the write goes out
   * behind it. A like is a low-stakes, high-frequency action - waiting on a
   * round trip makes the button feel broken, and refetching the whole review
   * list to learn one new number is worse. On failure both the flag and the
   * count go back.
   */
  const applyLike = async (id, write) => {
    const nowLiked = toggleLiked(id);
    const delta = nowLiked ? 1 : -1;
    setLiked(readLikedIds());
    setLikeDeltas((d) => ({ ...d, [id]: (d[id] || 0) + delta }));

    try {
      await write(delta);
    } catch (err) {
      console.error('Like failed:', err);
      toggleLiked(id);
      setLiked(readLikedIds());
      setLikeDeltas((d) => ({ ...d, [id]: (d[id] || 0) - delta }));
      addToast('Could not save that like. Please try again.', 'error');
    }
  };

  /** A record's stored like count plus anything this visitor has just added. */
  const withLikes = (record) => ({
    ...record,
    likes: Math.max(0, (record.likes || 0) + (likeDeltas[record.id] || 0)),
  });

  const handleLikeReview = (id) => applyLike(id, (delta) => likeReview(id, delta));
  const handleLikeComment = (reviewId, commentId) =>
    applyLike(commentId, (delta) => likeComment(reviewId, commentId, delta));

  const handleSubmitComment = async (reviewId, { authorName, body, isBot }) => {
    if (authorName.trim().length < REVIEW_LIMITS.authorName.min || body.trim().length < REVIEW_LIMITS.comment.min) {
      addToast('Please add your name and a comment.', 'warning');
      return false;
    }
    try {
      if (!isBot) await submitComment(reviewId, { authorName, body });
      addToast('Comment sent! It is being processed. 🐾', 'success');
      return true;
    } catch (err) {
      console.error('Comment failed:', err);
      addToast('Could not post your comment. Please try again.', 'error');
      return false;
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openWriter = () => {
    const wait = reviewCooldownRemaining();
    if (wait > 0) {
      addToast(`Thanks! Please wait ${Math.ceil(wait / 60000)} more minute(s) before posting again.`, 'warning');
      return;
    }
    setForm(BLANK);
    setWriting(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!form.rating) { addToast('Please pick a star rating.', 'warning'); return; }
    if (form.authorName.trim().length < REVIEW_LIMITS.authorName.min) { addToast('Please enter your name.', 'warning'); return; }
    if (form.body.trim().length < REVIEW_LIMITS.body.min) {
      addToast(`Please write at least ${REVIEW_LIMITS.body.min} characters.`, 'warning');
      return;
    }

    setSaving(true);
    try {
      if (!caughtBot(trap)) await submitReview(form);
      markReviewPosted();
      setWriting(false);
      setForm(BLANK);
      addToast('Thank you! Your review has been sent and is being processed. 💛', 'success', 6000);
    } catch (err) {
      console.error('Review failed:', err);
      addToast('Could not send your review. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasAny = summary.total > 0;

  return (
    <div>
      <header className={`page-header ${styles.pageHeader}`}>
        <div className="container">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSubtitle}</p>
        </div>
      </header>

      <section className="section">
        <div className="container">

          {/* ── Rating summary ─────────────────────────────────────────── */}
          <div className={styles.summary}>
            <div className={styles.score}>
              <strong className={styles.average}>{hasAny ? summary.average.toFixed(1) : '—'}</strong>
              <StarRating value={summary.average} size="lg" />
              <span className={styles.count}>
                {hasAny
                  ? `${summary.total} review${summary.total === 1 ? '' : 's'}`
                  : t.emptySummary}
              </span>
            </div>

            <div className={styles.breakdown}>
              {STARS_DESC.map((star) => {
                const n = summary.counts[star];
                const pct = summary.total ? (n / summary.total) * 100 : 0;
                const active = filterRating === star;
                return (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.barRow} ${active ? styles.barActive : ''}`}
                    onClick={() => setFilterRating(active ? 0 : star)}
                    aria-pressed={active}
                    aria-label={`${n} ${star}-star review${n === 1 ? '' : 's'}. ${active ? 'Clear filter' : 'Filter by this rating'}`}
                    disabled={!n}
                  >
                    <span className={styles.barLabel}>{star} ★</span>
                    <span className={styles.barTrack}>
                      <span className={styles.barFill} style={{ width: `${pct}%` }} />
                    </span>
                    <span className={styles.barCount}>{n}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.writeCta}>
              <p className={styles.writeBlurb}>{t.writeBlurb}</p>
              <button type="button" className="btn btn-primary" onClick={openWriter}>{t.writeBtn}</button>
              <p className={styles.moderationNote}>{t.moderationNote}</p>
            </div>
          </div>

          {/* ── Toolbar ────────────────────────────────────────────────── */}
          {hasAny && (
            <div className={styles.toolbar}>
              <div className={styles.sorts}>
                {REVIEW_SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={`${styles.sortBtn} ${sort === s.key ? styles.sortActive : ''}`}
                    onClick={() => setSort(s.key)}
                    aria-pressed={sort === s.key}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {filterRating > 0 && (
                <button type="button" className={styles.clearFilter} onClick={() => setFilterRating(0)}>
                  Showing {filterRating}★ only — clear ✕
                </button>
              )}
            </div>
          )}

          {/* ── List ───────────────────────────────────────────────────── */}
          {loading && (
            <div className={styles.list}>
              {[...Array(3)].map((_, i) => <ReviewCardSkeleton key={i} />)}
            </div>
          )}

          {!loading && errors.reviews && (
            <p className={styles.empty}>⚠️ {errors.reviews}</p>
          )}

          {!loading && !errors.reviews && shown.length === 0 && (
            <p className={styles.empty}>
              {hasAny ? 'No reviews with that rating yet.' : t.emptyList}
            </p>
          )}

          {!loading && !errors.reviews && shown.length > 0 && (
            <div className={styles.list}>
              {shown.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={withLikes(review)}
                  comments={(commentsByReview[review.id] || []).map(withLikes)}
                  likedIds={liked}
                  onLikeReview={handleLikeReview}
                  onLikeComment={handleLikeComment}
                  onSubmitComment={handleSubmitComment}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Write a review ───────────────────────────────────────────────── */}
      <Modal open={writing} onClose={() => setWriting(false)} title={t.formTitle} size="lg">
        <form onSubmit={handleSubmitReview} className={styles.form} noValidate>
          <div className={styles.ratingField}>
            <label id="rating-label">How was it? *</label>
            <StarRating value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="rv-name">Your name *</label>
              <input
                id="rv-name"
                value={form.authorName}
                onChange={set('authorName')}
                placeholder="Jane S."
                maxLength={REVIEW_LIMITS.authorName.max}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="rv-pet">Your pet's name</label>
              <input
                id="rv-pet"
                value={form.petName}
                onChange={set('petName')}
                placeholder="Buddy"
                maxLength={REVIEW_LIMITS.petName.max}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="rv-title">Headline</label>
              <input
                id="rv-title"
                value={form.title}
                onChange={set('title')}
                placeholder="Absolutely wonderful with our dog"
                maxLength={REVIEW_LIMITS.title.max}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="rv-service">Service used</label>
              <select id="rv-service" value={form.serviceUsed} onChange={set('serviceUsed')}>
                <option value="">Select a service…</option>
                {services.map((s) => <option key={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="rv-body">Your review *</label>
            <textarea
              id="rv-body"
              value={form.body}
              onChange={set('body')}
              rows={5}
              placeholder="Tell others what the experience was like…"
              maxLength={REVIEW_LIMITS.body.max}
              required
            />
            <span className={styles.counter}>{form.body.length} / {REVIEW_LIMITS.body.max}</span>
          </div>

          {/*
            The privacy note lives with the buttons rather than among the fields.
            It is the one strip of the form nothing is ever aimed at, so the badge
            cannot sit between the visitor and a control, and its panel opens
            upward over space that is already filled.
          */}
          <Honeypot ref={trap} />

          <div className={styles.formActions}>
            <InfoNote placement="top" label="Privacy note">
              {t.privacyNote} <Link to="/privacy" onClick={() => setWriting(false)}>Privacy policy</Link>
            </InfoNote>
            <div className={styles.actionBtns}>
              <button type="button" className="btn btn-secondary" onClick={() => setWriting(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Sending…' : t.submitBtn}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
