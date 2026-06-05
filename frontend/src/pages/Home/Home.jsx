import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getServices } from '../../firebase/services.js';
import { getGalleryImages } from '../../firebase/gallery.js';
import { getBio } from '../../firebase/bio.js';
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
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getServices(true),
      getGalleryImages(true),
      getBio(),
    ]).then(([s, g, b]) => {
      setServices(s.slice(0, 3));
      setGallery(g.slice(0, 6));
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
          <span className={styles.heroTag}>Professional Pet Care in Pretoria 🌟</span>
          <h1 className={styles.heroTitle}>
            Your Pet's Home<br />Away From Home!
          </h1>
          <p className={styles.heroSub}>
            Loving, professional care for your furry, feathery & scaly family members.<br />
            Because they deserve the best while you're away.
          </p>
          <div className={styles.heroBtns}>
            <Link to="/services" className="btn btn-primary">View Services</Link>
            <Link to="/contact" className="btn btn-secondary">Book a Session</Link>
          </div>
          <div className={styles.heroBadges}>
            <span>🐕 Dog Walking</span>
            <span>🏠 Pet Sitting</span>
            <span>🌙 Overnight Stays</span>
            <span>🛁 Grooming</span>
          </div>
        </div>
      </section>

      {/* ── Services Preview ──────────────────────────────────────────── */}
      <section className={`section ${styles.servicesSection}`}>
        <div className="container">
          <h2 className="section-title">What I Offer 🐾</h2>
          <p className="section-subtitle">Tailored care for every kind of pet</p>
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
                <Link to="/services" className="btn btn-primary">See All Services</Link>
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
                <span className={styles.bioTag}>Meet your petsitter</span>
                <h2>{bio.name || 'Lientjie'}</h2>
                <p className={styles.bioTagline}>{bio.tagline}</p>
                <p>{bio.story?.slice(0, 300)}{bio.story?.length > 300 ? '…' : ''}</p>
                <Link to="/about" className="btn btn-teal" style={{ marginTop: '1.5rem' }}>Read My Story</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Gallery Preview ───────────────────────────────────────────── */}
      <section className={`section ${styles.gallerySection}`}>
        <div className="container">
          <h2 className="section-title">Happy Pets 📸</h2>
          <p className="section-subtitle">Wholesome moments from my care sessions</p>
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
                <Link to="/gallery" className="btn btn-secondary">See All Photos</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={`container ${styles.ctaContent}`}>
          <h2>Ready to book? Let's chat! 🐾</h2>
          <p>Your pet will be in the safest, most loving hands.</p>
          <Link to="/contact" className="btn btn-yellow">Get in Touch</Link>
        </div>
      </section>
    </div>
  );
}
