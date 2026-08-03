import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { ratingSummary } from '../../firebase/reviews.js';
import ServiceCard, { ServiceCardSkeleton, serviceColor } from '../../components/ServiceCard/ServiceCard.jsx';
import BioBlock, { BioBlockSkeleton } from '../../components/BioBlock/BioBlock.jsx';
import GalleryTile, { GalleryTileSkeleton } from '../../components/GalleryTile/GalleryTile.jsx';
import ReviewCard, { ReviewCardSkeleton } from '../../components/ReviewCard/ReviewCard.jsx';
import StarRating from '../../components/StarRating/StarRating.jsx';
import styles from './Home.module.css';

const PREVIEW_SERVICES = 3;
const PREVIEW_PHOTOS = 6;
const PREVIEW_REVIEWS = 3;

export default function Home() {
  const { services, albums, bio, reviews, loading } = useData();
  const { copy } = useContent();
  const t = copy('home');
  const badges = [t.badge1, t.badge2, t.badge3, t.badge4].filter(Boolean);

  const topServices = services.slice(0, PREVIEW_SERVICES);
  const topPhotos = albums.slice(0, PREVIEW_PHOTOS);

  const summary = useMemo(() => ratingSummary(reviews), [reviews]);
  // Lead with the reviews people found most useful, not just the newest.
  const topReviews = useMemo(
    () => [...reviews].sort((a, b) => (b.likes || 0) - (a.likes || 0) || b.rating - a.rating).slice(0, PREVIEW_REVIEWS),
    [reviews],
  );

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroPaws}>
          {['🐾', '🐾', '🐾', '🐾', '🐾'].map((p, i) => (
            <span key={i} className={styles.floatingPaw} style={{ '--i': i }}>{p}</span>
          ))}
        </div>
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroTag}>{t.heroTag}</span>
          <h1 className={styles.heroTitle}>{t.heroTitle}</h1>
          <p className={styles.heroSub}>{t.heroSub}</p>
          <div className={styles.heroBtns}>
            <Link to="/services" className="btn btn-primary">{t.heroBtnPrimary}</Link>
            <Link to="/contact" className="btn btn-secondary">{t.heroBtnSecondary}</Link>
          </div>
          <div className={styles.heroBadges}>
            {badges.map((b, i) => <span key={i}>{b}</span>)}
          </div>
        </div>
      </section>

      {/* ── Services Preview ──────────────────────────────────────────── */}
      <section className={`section ${styles.servicesSection}`}>
        <div className="container">
          <h2 className="section-title">{t.servicesTitle}</h2>
          <p className="section-subtitle">{t.servicesSubtitle}</p>

          <div className={styles.servicesGrid}>
            {loading
              ? [...Array(PREVIEW_SERVICES)].map((_, i) => (
                <ServiceCardSkeleton key={i} color={serviceColor(i)} variant="compact" />
              ))
              : topServices.map((svc, i) => (
                <ServiceCard key={svc.id} service={svc} color={serviceColor(i)} variant="compact" />
              ))}
          </div>

          {!loading && topServices.length > 0 && (
            <div className={styles.centred}>
              <Link to="/services" className="btn btn-primary">{t.servicesCta}</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Bio Snippet ───────────────────────────────────────────────── */}
      {(loading || bio) && (
        <section className={`section ${styles.bioSection}`}>
          <div className="container">
            {loading ? <BioBlockSkeleton variant="compact" /> : (
              <BioBlock
                bio={bio}
                variant="compact"
                tag={t.bioTag}
                actions={<Link to="/about" className="btn btn-teal">{t.bioCta}</Link>}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Gallery Preview ───────────────────────────────────────────── */}
      <section className={`section ${styles.gallerySection}`}>
        <div className="container">
          <h2 className="section-title">{t.galleryTitle}</h2>
          <p className="section-subtitle">{t.gallerySubtitle}</p>

          <div className={styles.galleryGrid}>
            {loading
              ? [...Array(PREVIEW_PHOTOS)].map((_, i) => <GalleryTileSkeleton key={i} variant="preview" />)
              : topPhotos.map((album) => (
                <GalleryTile key={album.id} album={album} variant="preview" to="/gallery" />
              ))}
          </div>

          {!loading && topPhotos.length > 0 && (
            <div className={styles.centred}>
              <Link to="/gallery" className="btn btn-secondary">{t.galleryCta}</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Reviews Preview ───────────────────────────────────────────── */}
      {(loading || summary.total > 0) && (
        <section className={`section ${styles.reviewsSection}`}>
          <div className="container">
            <h2 className="section-title">{t.reviewsTitle}</h2>
            <p className="section-subtitle">{t.reviewsSubtitle}</p>

            {!loading && summary.total > 0 && (
              <p className={styles.reviewsScore}>
                <StarRating value={summary.average} size="md" />
                <strong>{summary.average.toFixed(1)}</strong>
                <span>from {summary.total} review{summary.total === 1 ? '' : 's'}</span>
              </p>
            )}

            <div className={styles.reviewsGrid}>
              {loading
                ? [...Array(PREVIEW_REVIEWS)].map((_, i) => <ReviewCardSkeleton key={i} variant="compact" />)
                : topReviews.map((r) => <ReviewCard key={r.id} review={r} variant="compact" />)}
            </div>

            {!loading && (
              <div className={styles.centred}>
                <Link to="/reviews" className="btn btn-yellow">{t.reviewsCta}</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={`container ${styles.ctaContent}`}>
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaText}</p>
          <Link to="/contact" className="btn btn-yellow">{t.ctaBtn}</Link>
        </div>
      </section>
    </div>
  );
}
