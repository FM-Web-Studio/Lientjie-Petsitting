import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import ServiceCard, { ServiceCardSkeleton, SERVICE_COLORS, serviceColor } from '../../components/ServiceCard';
import PageHero from '../../components/PageHero';
import Reveal from '../../components/Reveal';
import Tilt from '../../components/Tilt';
import styles from './Services.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

const ALL = 'All';
const CATEGORY_ICONS = { Walking: '🦮', Sitting: '🏠', Grooming: '🛁', Transport: '🚗', Other: '✨' };

export default function Services() {
  usePageMeta({ title: 'Services' });
  const { services, loading, errors } = useData();
  const { copy } = useContent();
  const t = copy('services');
  const error = errors.services;
  const [category, setCategory] = useState(ALL);

  // Only offer filters for categories that actually have a service in them.
  const categories = useMemo(
    () => [...new Set(services.map((s) => s.category).filter(Boolean))],
    [services],
  );
  const shown = category === ALL ? services : services.filter((s) => s.category === category);

  const faqs = [1, 2, 3, 4]
    .map((n) => ({ q: t[`faq${n}Q`], a: t[`faq${n}A`] }))
    .filter((f) => f.q && f.a);

  return (
    <div>
      <PageHero title={t.heroTitle} subtitle={t.heroSubtitle} emoji="🦴" tone="teal" />

      <section className="section-tight">
        <div className="container">
          {categories.length > 1 && (
            <div className={styles.filters} role="group" aria-label="Filter services">
              {[ALL, ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.chip} ${category === c ? styles.chipOn : ''}`}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                >
                  <span aria-hidden="true">{c === ALL ? '🐾' : CATEGORY_ICONS[c] || '✨'}</span> {c}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className={styles.grid}>
              {SERVICE_COLORS.slice(0, 3).map((c) => <ServiceCardSkeleton key={c} color={c} />)}
            </div>
          )}

          {!loading && error && <p className={styles.empty}>⚠️ {error}</p>}

          {!loading && !error && services.length === 0 && (
            <p className={styles.empty}>🐾 Services coming soon! In the meantime, <Link to="/contact" className="link">send me a message</Link>.</p>
          )}

          {!loading && !error && shown.length > 0 && (
            <div className={styles.grid}>
              {shown.map((svc, i) => (
                <Reveal key={svc.id} delay={(i % 3) * 90} className={styles.cell}>
                  <Tilt><ServiceCard service={svc} color={serviceColor(services.indexOf(svc))} bookLabel={t.bookBtn} /></Tilt>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal className={styles.custom}>
            <span className={styles.customIcon} aria-hidden="true">💬</span>
            <div className={styles.customCopy}>
              <h2>{t.customTitle}</h2>
              <p>{t.customText}</p>
            </div>
            <Link to="/contact" className="btn btn-yellow">Let&apos;s chat →</Link>
          </Reveal>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="section">
          <div className={`container ${styles.faqWrap}`}>
            <Reveal className="section-head">
              <span className="eyebrow">FAQ</span>
              <h2 className="section-title">{t.faqTitle}</h2>
            </Reveal>
            <div className={styles.faqs}>
              {faqs.map((f, i) => (
                <Reveal key={i} delay={i * 70}>
                  <details className={styles.faq}>
                    <summary>
                      <span>{f.q}</span>
                      <span className={styles.faqIcon} aria-hidden="true">+</span>
                    </summary>
                    <p>{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
