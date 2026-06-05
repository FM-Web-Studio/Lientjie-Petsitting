import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getServices } from '../../firebase/services.js';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import styles from './Services.module.css';

const COLORS = ['coral', 'teal', 'purple', 'yellow', 'pink', 'orange'];

function ServiceCardSkeleton({ color }) {
  return (
    <article className={styles.card} data-color={color} aria-hidden="true">
      <div className={styles.cardTop}>
        <Skeleton circle style={{ width: '2.75rem', height: '2.75rem' }} />
        <Skeleton style={{ width: '80px', height: '44px', borderRadius: 'var(--radius-md)' }} />
      </div>
      <Skeleton style={{ width: '62%', height: '1.4rem', marginBottom: '0.35rem' }} />
      <Skeleton style={{ width: '38%', height: '0.9rem', marginBottom: '0.75rem' }} />
      <Skeleton style={{ width: '100%', height: '4.5rem' }} />
      <Skeleton style={{ width: '110px', height: '42px', borderRadius: 'var(--radius-full)', marginTop: 'auto' }} />
    </article>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getServices(true)
      .then(setServices)
      .catch((err) => { console.error('Services load failed:', err); setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <h1>My Services 🐾</h1>
          <p>Professional, loving care tailored to your pet's needs</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading && (
            <div className={styles.grid}>
              {COLORS.map((c) => <ServiceCardSkeleton key={c} color={c} />)}
            </div>
          )}

          {!loading && error && (
            <div className={styles.empty}>
              <p>⚠️ Could not load services: {error}</p>
            </div>
          )}

          {!loading && !error && services.length === 0 && (
            <div className={styles.empty}>
              <p>🐾 Services coming soon! Check back later.</p>
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <div className={styles.grid}>
              {services.map((svc, i) => (
                <article key={svc.id} className={styles.card} data-color={COLORS[i % COLORS.length]}>
                  <div className={styles.cardTop}>
                    <div className={styles.icon}>{svc.icon || '🐾'}</div>
                    <div className={styles.priceBadge}>
                      R{svc.price}
                      <span>/{svc.priceUnit || 'session'}</span>
                    </div>
                  </div>
                  <h2>{svc.name}</h2>
                  {svc.duration && (
                    <p className={styles.duration}>⏱ {svc.duration}</p>
                  )}
                  <p className={styles.description}>{svc.description}</p>
                  {svc.includes?.length > 0 && (
                    <ul className={styles.includes}>
                      {svc.includes.map((item, idx) => (
                        <li key={idx}>✅ {item}</li>
                      ))}
                    </ul>
                  )}
                  <Link to="/contact" className={`btn btn-primary ${styles.bookBtn}`}>Book Now</Link>
                </article>
              ))}
            </div>
          )}

          <div className={styles.note}>
            <span>💬</span>
            <div>
              <strong>Need something custom?</strong>
              <p>Every pet is unique! <Link to="/contact">Contact me</Link> to discuss your specific needs and we'll find the perfect solution.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
