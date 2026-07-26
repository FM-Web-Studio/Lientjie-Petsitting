import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getServices } from '../../firebase/services.js';
import { getAlbums, albumCover } from '../../firebase/gallery.js';
import { getBio } from '../../firebase/bio.js';
import { useContent } from '../../context/ContentContext.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import styles from './Home.module.css';

const serviceColors = ['coral', 'teal', 'purple', 'yellow', 'pink', 'orange'];

function ServicesSkeleton() {
  return (
    <div className={styles.servicesGrid}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles.serviceCard} data-color={serviceColors[i]}>
          <Skeleton circle style={{ width: '2.5rem', height: '2.5rem', marginBottom: '1rem' }} />
          <Skeleton style={{ width: '65%', height: '1.25rem', marginBottom: '0.5rem' }} />
          <Skeleton style={{ width: '100%', height: '3rem', marginBottom: '1rem' }} />
          <Skeleton style={{ width: '45%', height: '1.4rem' }} />
        </div>
      ))}
    </div>
  );
}

function BioSnippetSkeleton() {
  return (
    <div className={styles.bioInner}>
      <div className={styles.bioImageWrap}>
        <Skeleton style={{ width: '100%', height: '400px', borderRadius: 'var(--radius-xl)' }} />
      </div>
      <div className={styles.bioText}>
        <Skeleton style={{ width: '160px', height: '1.5rem', marginBottom: '0.75rem', borderRadius: 'var(--radius-full)' }} />
        <Skeleton style={{ width: '50%', height: '2.5rem', marginBottom: '0.5rem' }} />
        <Skeleton style={{ width: '80%', height: '1.15rem', marginBottom: '1rem' }} />
        <Skeleton style={{ width: '100%', height: '1rem', marginBottom: '0.4rem' }} />
        <Skeleton style={{ width: '100%', height: '1rem', marginBottom: '0.4rem' }} />
        <Skeleton style={{ width: '70%', height: '1rem', marginBottom: '1.5rem' }} />
        <Skeleton style={{ width: '140px', height: '48px', borderRadius: 'var(--radius-full)' }} />
      </div>
    </div>
  );
}

function GalleryPreviewSkeleton() {
  return (
    <div className={styles.galleryGrid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.galleryItem} style={{ pointerEvents: 'none' }}>
          <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { copy } = useContent();
  const t = copy('home');
  const badges = [t.badge1, t.badge2, t.badge3, t.badge4].filter(Boolean);
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getServices(true),
      getAlbums(true),
      getBio(),
    ]).then(([s, albums, b]) => {
      setServices(s.slice(0, 3));
      // Show each post's cover photo in the home preview grid.
      const covers = albums
        .filter((a) => a.images?.length)
        .slice(0, 6)
        .map((a) => ({ id: a.id, url: albumCover(a)?.url, caption: a.caption }));
      setGallery(covers);
      setBio(b);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroPaws}>
          {['🐾','🐾','🐾','🐾','🐾'].map((p, i) => (
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
          {loading ? <ServicesSkeleton /> : (
            <>
              <div className={styles.servicesGrid}>
                {services.map((svc, i) => (
                  <div key={svc.id} className={styles.serviceCard} data-color={serviceColors[i % serviceColors.length]}>
                    <div className={styles.serviceIcon}>{svc.icon || '🐾'}</div>
                    <h3>{svc.name}</h3>
                    <p>{svc.description}</p>
                    <div className={styles.servicePrice}>
                      <strong>R{svc.price}</strong>
                      <span> / {svc.priceUnit || 'session'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.centred}>
                <Link to="/services" className="btn btn-primary">{t.servicesCta}</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Bio Snippet ───────────────────────────────────────────────── */}
      <section className={`section ${styles.bioSection}`}>
        <div className="container">
          {loading ? <BioSnippetSkeleton /> : bio && (
            <div className={styles.bioInner}>
              <div className={styles.bioImageWrap}>
                {bio.profileImageUrl
                  ? <img src={bio.profileImageUrl} alt={bio.name} className={styles.bioImage} />
                  : <div className={styles.bioPlaceholder}>🐾</div>
                }
              </div>
              <div className={styles.bioText}>
                <span className={styles.bioTag}>{t.bioTag}</span>
                <h2>{bio.name || 'Lientjie'}</h2>
                <p className={styles.bioTagline}>{bio.tagline}</p>
                <p>{bio.story?.slice(0, 300)}{bio.story?.length > 300 ? '…' : ''}</p>
                <Link to="/about" className="btn btn-teal" style={{ marginTop: '1.5rem' }}>{t.bioCta}</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Gallery Preview ───────────────────────────────────────────── */}
      <section className={`section ${styles.gallerySection}`}>
        <div className="container">
          <h2 className="section-title">{t.galleryTitle}</h2>
          <p className="section-subtitle">{t.gallerySubtitle}</p>
          {loading ? <GalleryPreviewSkeleton /> : (
            <>
              <div className={styles.galleryGrid}>
                {gallery.map((img) => (
                  <Link key={img.id} to="/gallery" className={styles.galleryItem}>
                    <img src={img.url} alt={img.caption || 'Pet photo'} />
                    {img.caption && <div className={styles.galleryOverlay}><span>{img.caption}</span></div>}
                  </Link>
                ))}
              </div>
              <div className={styles.centred}>
                <Link to="/gallery" className="btn btn-secondary">{t.galleryCta}</Link>
              </div>
            </>
          )}
        </div>
      </section>

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
