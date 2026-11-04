import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import ServiceCard, { ServiceCardSkeleton, SERVICE_COLORS, serviceColor } from '../../components/ServiceCard';
import styles from './Services.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function Services() {
  usePageMeta({ title: 'Services' });
  const { services, loading, errors } = useData();
  const { copy } = useContent();
  const t = copy('services');
  const error = errors.services;

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
          {loading && (
            <div className={styles.grid}>
              {SERVICE_COLORS.map((c) => <ServiceCardSkeleton key={c} color={c} />)}
            </div>
          )}

          {!loading && error && (
            <div className={styles.empty}>
              <p>⚠️ {error}</p>
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
                <ServiceCard key={svc.id} service={svc} color={serviceColor(i)} bookLabel={t.bookBtn} />
              ))}
            </div>
          )}

          <div className={styles.note}>
            <span>💬</span>
            <div>
              <strong>{t.customTitle}</strong>
              <p>{t.customText} <Link to="/contact">Contact me</Link>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
