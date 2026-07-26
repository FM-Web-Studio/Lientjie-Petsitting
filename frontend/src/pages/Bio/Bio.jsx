import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBio } from '../../firebase/bio.js';
import { useContent } from '../../context/ContentContext.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import styles from './Bio.module.css';

function BioSkeleton() {
  return (
    <div className={`container ${styles.layout}`}>
      <div className={styles.imageCol}>
        <Skeleton style={{ width: '100%', height: '420px', borderRadius: 'var(--radius-xl)' }} />
        <div className={styles.stats}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.stat}>
              <Skeleton style={{ width: '55%', height: '1.5rem', margin: '0 auto 0.3rem' }} />
              <Skeleton style={{ width: '75%', height: '0.8rem', margin: '0 auto' }} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.content}>
        <Skeleton style={{ width: '160px', height: '1.5rem', marginBottom: '0.75rem', borderRadius: 'var(--radius-full)' }} />
        <Skeleton style={{ width: '50%', height: '2.5rem', marginBottom: '0.5rem' }} />
        <Skeleton style={{ width: '80%', height: '1.15rem', marginBottom: '1.5rem' }} />
        <Skeleton style={{ width: '100%', height: '1rem', marginBottom: '0.5rem' }} />
        <Skeleton style={{ width: '100%', height: '1rem', marginBottom: '0.5rem' }} />
        <Skeleton style={{ width: '80%', height: '1rem', marginBottom: '2rem' }} />
        <Skeleton style={{ width: '100%', height: '5rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Skeleton style={{ width: '140px', height: '48px', borderRadius: 'var(--radius-full)' }} />
          <Skeleton style={{ width: '130px', height: '48px', borderRadius: 'var(--radius-full)' }} />
        </div>
      </div>
    </div>
  );
}

export default function Bio() {
  const { copy } = useContent();
  const t = copy('about');
  const info = copy('contact');
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBio().then(setBio).finally(() => setLoading(false));
  }, []);

  const qualifications = bio?.qualifications || [];
  const location = info.location || bio?.location;
  const whyCards = [
    { icon: t.why1Icon, title: t.why1Title, desc: t.why1Desc },
    { icon: t.why2Icon, title: t.why2Title, desc: t.why2Desc },
    { icon: t.why3Icon, title: t.why3Title, desc: t.why3Desc },
    { icon: t.why4Icon, title: t.why4Title, desc: t.why4Desc },
  ];

  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSubtitle}</p>
        </div>
      </section>

      <section className="section">
        {loading
          ? <BioSkeleton />
          : (
            <div className={`container ${styles.layout}`}>
              <div className={styles.imageCol}>
                {bio?.profileImageUrl
                  ? <img src={bio.profileImageUrl} alt={bio.name || 'Lientjie'} className={styles.profileImage} />
                  : <div className={styles.placeholder}>🐾</div>
                }
                <div className={styles.stats}>
                  {bio?.experience && (
                    <div className={styles.stat}>
                      <strong>{bio.experience}</strong>
                      <span>{t.expLabel}</span>
                    </div>
                  )}
                  <div className={styles.stat}>
                    <strong>{t.stat2Value}</strong>
                    <span>{t.stat2Label}</span>
                  </div>
                  <div className={styles.stat}>
                    <strong>{t.stat3Value}</strong>
                    <span>{t.stat3Label}</span>
                  </div>
                </div>
              </div>

              <div className={styles.content}>
                <span className={styles.tag}>{t.tag}</span>
                <h2>{bio?.name || 'Lientjie'}</h2>
                {bio?.tagline && <p className={styles.tagline}>{bio.tagline}</p>}

                {bio?.story && (
                  <div className={styles.story}>
                    {bio.story.split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
                  </div>
                )}

                {qualifications.length > 0 && (
                  <div className={styles.quals}>
                    <h3>{t.qualsTitle}</h3>
                    <ul>
                      {qualifications.map((q, i) => (
                        <li key={i}>🏆 {q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {location && (
                  <div className={styles.detail}>
                    <span>📍</span>
                    <span>{location}</span>
                  </div>
                )}

                <div className={styles.actions}>
                  <Link to="/contact" className="btn btn-primary">{t.ctaPrimary}</Link>
                  <Link to="/services" className="btn btn-secondary">{t.ctaSecondary}</Link>
                </div>
              </div>
            </div>
          )
        }
      </section>

      <section className={styles.whySection}>
        <div className="container">
          <h2 className="section-title">{t.whyTitle}</h2>
          <div className={styles.whyGrid}>
            {whyCards.map(({ icon, title, desc }, i) => (
              <div key={i} className={styles.whyCard}>
                <span className={styles.whyIcon}>{icon}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
