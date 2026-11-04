import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import BioBlock, { BioBlockSkeleton } from '../../components/BioBlock';
import PageHero from '../../components/PageHero';
import Reveal from '../../components/Reveal';
import Tilt from '../../components/Tilt';
import styles from './Bio.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function Bio() {
  usePageMeta({ title: 'About' });
  const { bio, loading } = useData();
  const { copy } = useContent();
  const t = copy('about');
  const info = copy('contact');

  const location = info.location || bio?.location;

  // The experience tile only exists if a value was entered; the other two are
  // always-on brand statements from site copy.
  const stats = [
    bio?.experience ? { value: bio.experience, label: t.expLabel } : null,
    { value: t.stat2Value, label: t.stat2Label },
    { value: t.stat3Value, label: t.stat3Label },
  ].filter(Boolean);

  const whyCards = [
    { icon: t.why1Icon, title: t.why1Title, desc: t.why1Desc },
    { icon: t.why2Icon, title: t.why2Title, desc: t.why2Desc },
    { icon: t.why3Icon, title: t.why3Title, desc: t.why3Desc },
    { icon: t.why4Icon, title: t.why4Title, desc: t.why4Desc },
  ];

  return (
    <div>
      <PageHero title={t.heroTitle} subtitle={t.heroSubtitle} emoji="👋" tone="pink" />

      <section className="section-tight">
        <div className="container">
          {loading ? <BioBlockSkeleton /> : (
            <Reveal>
              <BioBlock
                bio={bio}
                tag={t.tag}
                stats={stats}
                qualsTitle={t.qualsTitle}
                location={location}
                actions={(
                  <>
                    <Link to="/contact" className="btn btn-primary">{t.ctaPrimary} 🐾</Link>
                    <Link to="/services" className="btn btn-secondary">{t.ctaSecondary}</Link>
                  </>
                )}
              />
            </Reveal>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Why me?</span>
            <h2 className="section-title">{t.whyTitle}</h2>
          </Reveal>
          <div className={styles.whyGrid}>
            {whyCards.map(({ icon, title, desc }, i) => (
              <Reveal key={i} delay={i * 90} className={styles.whyCell}>
                <Tilt>
                  <div className={styles.whyCard}>
                    <span className={styles.whyIcon} aria-hidden="true">{icon}</span>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
