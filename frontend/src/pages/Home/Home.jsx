import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { ratingSummary } from '../../firebase/reviews.js';
import { albumCover } from '../../firebase/gallery.js';
import ServiceCard, { ServiceCardSkeleton, serviceColor } from '../../components/ServiceCard';
import BioBlock, { BioBlockSkeleton } from '../../components/BioBlock';
import GalleryTile, { GalleryTileSkeleton } from '../../components/GalleryTile';
import ReviewCard, { ReviewCardSkeleton } from '../../components/ReviewCard';
import StarRating from '../../components/StarRating';
import Reveal from '../../components/Reveal';
import Tilt from '../../components/Tilt';
import Draggable from '../../components/Draggable';
import DragScroller from '../../components/DragScroller';
import SmartImage from '../../components/SmartImage';
import CountUp from '../../components/CountUp';
import Skeleton from '../../components/Skeleton';
import styles from './Home.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

const PREVIEW_SERVICES = 3;
const PREVIEW_PHOTOS = 5;
const PREVIEW_REVIEWS = 8;

// Underline the last word of an editable heading, so the effect survives any edit.
function Highlight({ text }) {
  const words = String(text).trim().split(' ');
  if (words.length < 2) return text;
  const last = words.pop();
  return <>{words.join(' ')} <span className="squiggle">{last}</span></>;
}

export default function Home() {
  usePageMeta();
  const { services, albums, bio, reviews, loading } = useData();
  const { copy, loaded: copyLoaded } = useContent();
  const t = copy('home');
  const heroRef = useRef(null);

  // Parallax: the blobs behind the photo drift slower than the page as you scroll.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        heroRef.current?.style.setProperty('--sy', String(Math.min(window.scrollY, 900)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, []);
  const badges = [t.badge1, t.badge2, t.badge3, t.badge4].filter(Boolean);

  const topServices = services.slice(0, PREVIEW_SERVICES);
  const topPhotos = albums.slice(0, PREVIEW_PHOTOS);
  const heroImage = bio?.profileImageUrl || albumCover(albums[0])?.url;

  const summary = useMemo(() => ratingSummary(reviews), [reviews]);
  // Lead with the reviews people found most useful, not just the newest.
  const topReviews = useMemo(
    () => [...reviews].sort((a, b) => (b.likes || 0) - (a.likes || 0) || b.rating - a.rating).slice(0, PREVIEW_REVIEWS),
    [reviews],
  );

  const steps = [
    { icon: '👋', title: t.step1Title, text: t.step1Text },
    { icon: '🤝', title: t.step2Title, text: t.step2Text },
    { icon: '😌', title: t.step3Title, text: t.step3Text },
  ];

  return (
    <div className={styles.page}>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={styles.hero} ref={heroRef}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            {copyLoaded ? (
              <>
                <span className="eyebrow">{t.heroTag}</span>
                <h1 className={styles.heroTitle}><Highlight text={t.heroTitle} /></h1>
                <p className={styles.heroSub}>{t.heroSub}</p>
                <div className={styles.heroBtns}>
                  <Link to="/contact" className="btn btn-primary">{t.heroBtnSecondary} 🐾</Link>
                  <Link to="/services" className="btn btn-secondary">{t.heroBtnPrimary}</Link>
                </div>
                {badges.length > 0 && (
                  <ul className={styles.heroBadges} aria-label="What I offer">
                    {badges.map((b, i) => (
                      <li key={i} style={{ '--i': i }}>
                        <Link to="/services">{b}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className={styles.heroCopySkeleton} aria-busy="true" aria-label="Loading">
                <Skeleton style={{ width: '14rem', height: '1.9rem', borderRadius: 'var(--radius-full)' }} />
                <Skeleton style={{ width: '95%', height: '3.4rem', borderRadius: 'var(--radius-md)' }} />
                <Skeleton style={{ width: '70%', height: '3.4rem', borderRadius: 'var(--radius-md)' }} />
                <Skeleton style={{ width: '90%', height: '1.1rem' }} />
                <Skeleton style={{ width: '75%', height: '1.1rem' }} />
                <div className={styles.heroBtns}>
                  <Skeleton style={{ width: '170px', height: '48px', borderRadius: 'var(--radius-full)' }} />
                  <Skeleton style={{ width: '150px', height: '48px', borderRadius: 'var(--radius-full)' }} />
                </div>
                <div className={styles.heroBtns}>
                  {[110, 95, 130, 100].map((w) => <Skeleton key={w} style={{ width: `${w}px`, height: '34px', borderRadius: 'var(--radius-full)' }} />)}
                </div>
              </div>
            )}
          </div>

          <div className={styles.heroArt}>
            <div className={styles.blobBack} />
            <div className={styles.blobPhoto}>
              {loading && <Skeleton style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />}
              {!loading && (heroImage
                ? <SmartImage src={heroImage} alt={bio?.name ? `${bio.name} with a happy pet` : 'A happy pet'} fetchpriority="high" />
                : <span className={styles.blobEmoji} aria-hidden="true">🐶</span>)}
            </div>

            {/* Stickers and paws can be picked up and thrown; they bounce back home. */}
            {summary.total > 0 && (
              <Draggable className={`${styles.spot} ${styles.spotRating}`}>
                <Link to="/reviews" className={`${styles.sticker} ${styles.stickerRating}`}>
                  <strong><CountUp value={summary.average.toFixed(1)} /> ★</strong>
                  <span>{summary.total} happy review{summary.total === 1 ? '' : 's'}</span>
                </Link>
              </Draggable>
            )}
            <Draggable className={`${styles.spot} ${styles.spotPhotos}`}>
              <Link to="/gallery" className={`${styles.sticker} ${styles.stickerPhotos}`}>
                <span className={styles.stickerEmoji} aria-hidden="true">📸</span>
                <span>See the pets</span>
              </Link>
            </Draggable>
            <Draggable className={`${styles.spot} ${styles.paw1}`} aria-hidden="true"><span className={styles.paw}>🐾</span></Draggable>
            <Draggable className={`${styles.spot} ${styles.paw2}`} aria-hidden="true"><span className={styles.paw}>🐾</span></Draggable>
            <Draggable className={`${styles.spot} ${styles.paw3}`} aria-hidden="true"><span className={styles.paw}>🦴</span></Draggable>
            <span className={styles.dragHint} aria-hidden="true">psst... drag the stickers!</span>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className={`section ${styles.steps}`}>
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Easy as 1-2-3</span>
            <h2 className="section-title">{t.stepsTitle}</h2>
          </Reveal>
          <ol className={styles.stepList}>
            {steps.map((s, i) => (
              <Reveal as="li" key={i} delay={i * 120} className={styles.stepCell}>
                <Tilt max={6}>
                  <div className={styles.step}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <span className={styles.stepIcon} aria-hidden="true">{s.icon}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Services preview ──────────────────────────────────────────── */}
      <section className={`section ${styles.servicesSection}`}>
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Services</span>
            <h2 className="section-title">{t.servicesTitle}</h2>
            <p className="section-subtitle">{t.servicesSubtitle}</p>
          </Reveal>

          <div className={styles.servicesGrid}>
            {loading
              ? [...Array(PREVIEW_SERVICES)].map((_, i) => (
                <ServiceCardSkeleton key={i} color={serviceColor(i)} variant="compact" />
              ))
              : topServices.map((svc, i) => (
                <Reveal key={svc.id} delay={i * 100} className={styles.cell}>
                  <Tilt><ServiceCard service={svc} color={serviceColor(i)} variant="compact" /></Tilt>
                </Reveal>
              ))}
          </div>

          {!loading && topServices.length > 0 && (
            <div className="centred">
              <Link to="/services" className="btn btn-teal">{t.servicesCta} →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Bio teaser ────────────────────────────────────────────────── */}
      {(loading || bio) && (
        <section className={`section ${styles.bioSection}`}>
          <div className="container">
            {loading ? <BioBlockSkeleton variant="compact" /> : (
              <Reveal>
                <BioBlock
                  bio={bio}
                  variant="compact"
                  tag={t.bioTag}
                  actions={<Link to="/about" className="btn btn-yellow">{t.bioCta} →</Link>}
                />
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ── Gallery mosaic ────────────────────────────────────────────── */}
      {(loading || topPhotos.length > 0) && (
        <section className={`section ${styles.gallerySection}`}>
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">Gallery</span>
              <h2 className="section-title">{t.galleryTitle}</h2>
              <p className="section-subtitle">{t.gallerySubtitle}</p>
            </Reveal>

            <div className={styles.mosaic}>
              {loading
                ? [...Array(PREVIEW_PHOTOS)].map((_, i) => <GalleryTileSkeleton key={i} variant="preview" />)
                : topPhotos.map((album, i) => (
                  <Reveal key={album.id} delay={i * 80} className={styles.mosaicCell}>
                    <GalleryTile album={album} variant="preview" to="/gallery" />
                  </Reveal>
                ))}
            </div>

            {!loading && (
              <div className="centred">
                <Link to="/gallery" className="btn btn-secondary">{t.galleryCta} →</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Reviews ───────────────────────────────────────────────────── */}
      {(loading || summary.total > 0) && (
        <section className={`section ${styles.reviewsSection}`}>
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">Reviews</span>
              <h2 className="section-title">{t.reviewsTitle}</h2>
              <p className="section-subtitle">{t.reviewsSubtitle}</p>
              {!loading && summary.total > 0 && (
                <p className={styles.reviewsScore}>
                  <StarRating value={summary.average} size="md" />
                  <strong>{summary.average.toFixed(1)}</strong>
                  <span>from {summary.total} review{summary.total === 1 ? '' : 's'}</span>
                </p>
              )}
            </Reveal>

            {loading ? (
              <div className={styles.reviewsGrid}>
                {[...Array(3)].map((_, i) => <ReviewCardSkeleton key={i} variant="compact" />)}
              </div>
            ) : (
              <Reveal>
                <DragScroller label="Reviews">
                  {topReviews.map((r) => <ReviewCard key={r.id} review={r} variant="compact" />)}
                </DragScroller>
              </Reveal>
            )}

            {!loading && (
              <div className="centred">
                <Link to="/reviews" className="btn btn-yellow">{t.reviewsCta} →</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Call to action ────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <Reveal className={styles.cta}>
            <span className={styles.ctaPaw} aria-hidden="true">🐕</span>
            <div className={styles.ctaCopy}>
              <h2>{t.ctaTitle}</h2>
              <p>{t.ctaText}</p>
            </div>
            <Link to="/contact" className="btn btn-yellow">{t.ctaBtn} →</Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
