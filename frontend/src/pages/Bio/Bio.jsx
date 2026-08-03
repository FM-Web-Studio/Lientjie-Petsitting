import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import BioBlock, { BioBlockSkeleton } from '../../components/BioBlock/BioBlock.jsx';
import styles from './Bio.module.css';

export default function Bio() {
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
      <header className={`page-header ${styles.pageHeader}`}>
        <div className="container">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSubtitle}</p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {loading ? <BioBlockSkeleton /> : (
            <BioBlock
              bio={bio}
              tag={t.tag}
              stats={stats}
              qualsTitle={t.qualsTitle}
              location={location}
              actions={(
                <>
                  <Link to="/contact" className="btn btn-primary">{t.ctaPrimary}</Link>
                  <Link to="/services" className="btn btn-secondary">{t.ctaSecondary}</Link>
                </>
              )}
            />
          )}
        </div>
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
