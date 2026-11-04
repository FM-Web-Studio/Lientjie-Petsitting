import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  getApprovedCommentsByReview, submitReview, submitComment,
  setReviewLiked, setCommentLiked, ratingSummary,
} from '../../firebase/reviews.js';
import { REVIEW_LIMITS, REVIEW_SORTS } from '../../firebase/config.js';
import { likedIds as readLikedIds, setLikedFlag, reviewCooldownRemaining, markReviewPosted } from '../../utils/localFlags.js';
import ReviewCard, { ReviewCardSkeleton } from '../../components/ReviewCard';
import StarRating from '../../components/StarRating';
import Modal from '../../components/Modal';
import InfoNote from '../../components/InfoNote';
import PageHero from '../../components/PageHero';
import Reveal from '../../components/Reveal';
import CountUp from '../../components/CountUp';
import Honeypot, { caughtBot, trapFields } from '../../components/Honeypot';
import { LIMIT_TEXT } from '../../firebase/functions.js';
import styles from './Reviews.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

const BLANK = { authorName: '', rating: 0, title: '', body: '', petName: '', serviceUsed: '' };
const STARS_DESC = [5, 4, 3, 2, 1];
const RATING_WORDS = ['', 'Not great', 'Okay', 'Good', 'Great', 'Amazing!'];

export default function Reviews() {
  usePageMeta({ title: 'Reviews' });
  const { reviews, services, loading, errors } = useData();
  const { copy } = useContent();
  const { addToast } = useToast();
  const t = copy('reviews');

  const [commentsByReview, setCommentsByReview] = useState({});
  const [liked, setLiked] = useState(() => readLikedIds());
  // Like counts as the server last reported them, laid over the loaded data.
  const [likeCounts, setLikeCounts] = useState({});
  const pendingLikes = useRef(new Set());
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

  const withLikes = (record) => ({
    ...record,
    likes: Math.max(0, likeCounts[record.id] ?? record.likes ?? 0),
  });

  const shown = useMemo(() => {
    const list = filterRating
      ? reviews.filter((r) => Math.round(r.rating) === filterRating)
      : [...reviews];
    const byNewest = (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
    const likesOf = (r) => likeCounts[r.id] ?? r.likes ?? 0;
    // Ties fall back to newest, so equal ratings still read in a sensible order.
    const comparators = {
      newest: byNewest,
      highest: (a, b) => (b.rating - a.rating) || byNewest(a, b),
      lowest: (a, b) => (a.rating - b.rating) || byNewest(a, b),
      liked: (a, b) => (likesOf(b) - likesOf(a)) || byNewest(a, b),
    };
    return list.sort(comparators[sort] || comparators.newest);
  }, [reviews, sort, filterRating, likeCounts]);

  /*
   * Likes are optimistic: the heart and counter move immediately, then settle on
   * whatever the server says (it allows one like per visitor, so the true count
   * can differ from the guess). A second tap while one is in flight is ignored.
   */
  const applyLike = async (record, write) => {
    const { id } = record;
    if (pendingLikes.current.has(id)) return;
    pendingLikes.current.add(id);

    const wasLiked = liked.has(id);
    const before = Math.max(0, likeCounts[id] ?? record.likes ?? 0);
    const want = !wasLiked;
    const updateLiked = (value) => {
      setLikedFlag(id, value);
      setLiked(readLikedIds());
    };

    updateLiked(want);
    setLikeCounts((c) => ({ ...c, [id]: Math.max(0, before + (want ? 1 : -1)) }));

    try {
      const res = await write(want);
      updateLiked(!!res?.liked);
      if (typeof res?.likes === 'number') setLikeCounts((c) => ({ ...c, [id]: res.likes }));
    } catch (err) {
      console.error('Like failed:', err);
      updateLiked(wasLiked);
      setLikeCounts((c) => ({ ...c, [id]: before }));
      addToast(err.limit ? 'That is a lot of love! Please try again a bit later.' : 'Could not save that like. Please try again.', 'error');
    } finally {
      pendingLikes.current.delete(id);
    }
  };

  const handleLikeReview = (review) => applyLike(review, (like) => setReviewLiked(review.id, like));
  const handleLikeComment = (reviewId, comment) =>
    applyLike(comment, (like) => setCommentLiked(reviewId, comment.id, like));

  const handleSubmitComment = async (reviewId, { authorName, body, isBot, trap: trapData }) => {
    if (authorName.trim().length < REVIEW_LIMITS.authorName.min || body.trim().length < REVIEW_LIMITS.comment.min) {
      addToast('Please add your name and a comment.', 'warning');
      return false;
    }
    try {
      if (!isBot) await submitComment(reviewId, { authorName, body }, trapData);
      addToast('Comment sent! It will appear once it has been checked. 🐾', 'success');
      return true;
    } catch (err) {
      console.error('Comment failed:', err);
      addToast(LIMIT_TEXT[err.limit] ?? 'Could not post your comment. Please try again.', 'error');
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
    if (!form.rating) { addToast('Please tap a star rating.', 'warning'); return; }
    if (form.authorName.trim().length < REVIEW_LIMITS.authorName.min) { addToast('Please enter your name.', 'warning'); return; }
    if (form.body.trim().length < REVIEW_LIMITS.body.min) {
      addToast(`Please write at least ${REVIEW_LIMITS.body.min} characters.`, 'warning');
      return;
    }

    setSaving(true);
    try {
      if (!caughtBot(trap)) await submitReview(form, trapFields(trap));
      markReviewPosted();
      setWriting(false);
      setForm(BLANK);
      addToast('Thank you! Your review has been sent and will appear once it is approved. 💛', 'success', 6000);
    } catch (err) {
      console.error('Review failed:', err);
      addToast(LIMIT_TEXT[err.limit] ?? 'Could not send your review. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasAny = summary.total > 0;
  const bodyLeft = REVIEW_LIMITS.body.min - form.body.trim().length;

  return (
    <div>
      <PageHero title={t.heroTitle} subtitle={t.heroSubtitle} emoji="⭐" tone="yellow" />

      <section className="section-tight">
        <div className="container">

          {/* ── Rating summary ─────────────────────────────────────────── */}
          <Reveal className={styles.summary}>
            <div className={styles.score}>
              <strong className={styles.average}>{hasAny ? <CountUp value={summary.average.toFixed(1)} /> : '—'}</strong>
              <StarRating value={summary.average} size="lg" />
              <span className={styles.count}>
                {hasAny ? `${summary.total} review${summary.total === 1 ? '' : 's'}` : t.emptySummary}
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
                    aria-label={`${n} ${star}-star review${n === 1 ? '' : 's'}. ${active ? 'Clear filter' : 'Show only these'}`}
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
              <span className={styles.writeIcon} aria-hidden="true">✍️</span>
              <p className={styles.writeBlurb}>{t.writeBlurb}</p>
              <button type="button" className="btn btn-primary" onClick={openWriter}>{t.writeBtn}</button>
              <p className={styles.moderationNote}>{t.moderationNote}</p>
            </div>
          </Reveal>

          {/* ── Toolbar ────────────────────────────────────────────────── */}
          {hasAny && (
            <div className={styles.toolbar}>
              <div className={styles.sorts} role="group" aria-label="Sort reviews">
                <span className={styles.sortLabel}>Sort:</span>
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
                  Showing {filterRating}★ only <span aria-hidden="true">✕</span><span className="sr-only">- show all</span>
                </button>
              )}
            </div>
          )}

          {/* ── List ───────────────────────────────────────────────────── */}
          {loading && (
            <div className={styles.list}>
              {[...Array(4)].map((_, i) => <ReviewCardSkeleton key={i} />)}
            </div>
          )}

          {!loading && errors.reviews && <p className={styles.empty}>⚠️ {errors.reviews}</p>}

          {!loading && !errors.reviews && shown.length === 0 && (
            <div className={styles.empty}>
              <p>{hasAny ? 'No reviews with that rating yet.' : t.emptyList}</p>
              {!hasAny && <button type="button" className="btn btn-yellow" onClick={openWriter}>{t.writeBtn}</button>}
            </div>
          )}

          {!loading && !errors.reviews && shown.length > 0 && (
            <div className={styles.list}>
              {shown.map((review, i) => (
                <Reveal key={review.id} delay={(i % 2) * 90} className={styles.cell}>
                  <ReviewCard
                    review={withLikes(review)}
                    comments={(commentsByReview[review.id] || []).map(withLikes)}
                    likedIds={liked}
                    onLikeReview={() => handleLikeReview(review)}
                    onLikeComment={(reviewId, commentId) => {
                      const c = (commentsByReview[reviewId] || []).find((x) => x.id === commentId);
                      if (c) handleLikeComment(reviewId, c);
                    }}
                    onSubmitComment={handleSubmitComment}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Write a review ───────────────────────────────────────────────── */}
      <Modal open={writing} onClose={() => setWriting(false)} title={t.formTitle} size="lg">
        <form onSubmit={handleSubmitReview} className={styles.form} noValidate>
          <div className={styles.ratingField}>
            <span className="field-label" id="rating-label">How was it? *</span>
            <StarRating value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} size="lg" />
            <span className={styles.ratingWord} aria-live="polite">{RATING_WORDS[form.rating] || 'Tap a star'}</span>
          </div>

          <div className={styles.row}>
            <div className="field">
              <label htmlFor="rv-name">Your name *</label>
              <input id="rv-name" value={form.authorName} onChange={set('authorName')} placeholder="Jane S." maxLength={REVIEW_LIMITS.authorName.max} autoComplete="given-name" required />
            </div>
            <div className="field">
              <label htmlFor="rv-pet">Your pet&apos;s name</label>
              <input id="rv-pet" value={form.petName} onChange={set('petName')} placeholder="Buddy" maxLength={REVIEW_LIMITS.petName.max} />
            </div>
          </div>

          <div className={styles.row}>
            <div className="field">
              <label htmlFor="rv-title">Headline</label>
              <input id="rv-title" value={form.title} onChange={set('title')} placeholder="Absolutely wonderful with our dog" maxLength={REVIEW_LIMITS.title.max} />
            </div>
            <div className="field">
              <label htmlFor="rv-service">Service used</label>
              <select id="rv-service" value={form.serviceUsed} onChange={set('serviceUsed')}>
                <option value="">Select a service…</option>
                {services.map((s) => <option key={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="rv-body">Your review *</label>
            <textarea id="rv-body" value={form.body} onChange={set('body')} rows={5} placeholder="Tell others what the experience was like…" maxLength={REVIEW_LIMITS.body.max} required />
            <span className={styles.counter}>
              {bodyLeft > 0 ? `${bodyLeft} more character${bodyLeft === 1 ? '' : 's'} to go` : '✓ Looks good'}
              {' · '}{form.body.length} / {REVIEW_LIMITS.body.max}
            </span>
          </div>

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
