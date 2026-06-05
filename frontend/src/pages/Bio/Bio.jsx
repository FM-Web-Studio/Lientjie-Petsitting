import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBio } from '../../firebase/bio.js';
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
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBio().then(setBio).finally(() => setLoading(false));
  }, []);

  const qualifications = bio?.qualifications || [];

  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <h1>Meet Lientjie 🐾</h1>
          <p>The person who will love your pet like her own</p>
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
                      <span>Experience</span>
                    </div>
                  )}
                  <div className={styles.stat}>
                    <strong>100%</strong>
                    <span>Love Given</span>
                  </div>
                  <div className={styles.stat}>
                    <strong>∞</strong>
                    <span>Happy Pets</span>
                  </div>
                </div>
              </div>

              <div className={styles.content}>
                <span className={styles.tag}>Your trusted petsitter</span>
                <h2>{bio?.name || 'Lientjie'}</h2>
                {bio?.tagline && <p className={styles.tagline}>{bio.tagline}</p>}

                {bio?.story && (
                  <div className={styles.story}>
                    {bio.story.split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
                  </div>
                )}

                {qualifications.length > 0 && (
                  <div className={styles.quals}>
                    <h3>Qualifications & Certifications</h3>
                    <ul>
                      {qualifications.map((q, i) => (
                        <li key={i}>🏆 {q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {bio?.location && (
                  <div className={styles.detail}>
                    <span>📍</span>
                    <span>{bio.location}</span>
                  </div>
                )}

                <div className={styles.actions}>
                  <Link to="/contact" className="btn btn-primary">Book a Session</Link>
                  <Link to="/services" className="btn btn-secondary">View Services</Link>
                </div>
              </div>
            </div>
          )
        }
      </section>

      <section className={styles.whySection}>
        <div className="container">
          <h2 className="section-title">Why Choose Me? 💛</h2>
          <div className={styles.whyGrid}>
            {[
              { icon: '❤️', title: 'Genuine Love for Animals', desc: 'Every pet in my care gets love, attention and cuddles – just like at home.' },
              { icon: '📱', title: 'Regular Updates', desc: 'Photos and videos sent regularly so you can relax wherever you are.' },
              { icon: '🏡', title: 'Home Away From Home', desc: 'A safe, comfortable and stimulating environment for your furry friend.' },
              { icon: '🤝', title: 'Trustworthy & Reliable', desc: "Punctual, professional and always putting your pet's needs first." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className={styles.whyCard}>
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
