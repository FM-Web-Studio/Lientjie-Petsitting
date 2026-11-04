import Skeleton from '../Skeleton';
import SmartImage from '../SmartImage';
import CountUp from '../CountUp';
import styles from './BioBlock.module.css';

/*
 * Lientjie's profile: photo on one side, story on the other.
 *
 *   compact - the Home page teaser. Story truncated, one button.
 *   full    - the About page. Stat tiles under the photo, whole story split
 *             into paragraphs, qualifications, location.
 *
 * Both used to be written out separately, which is why the Home teaser silently
 * lost its formatting when a story gained a second paragraph.
 */

const TEASER_LENGTH = 300;

export default function BioBlock({
  bio,
  variant = 'full',
  tag,
  stats = [],
  qualsTitle,
  location,
  actions,
}) {
  const compact = variant === 'compact';
  const name = bio?.name || 'Lientjie';
  const story = bio?.story || '';
  const quals = bio?.qualifications || [];

  return (
    <div className={`${styles.layout} ${compact ? styles.compact : ''}`}>
      <div className={styles.imageCol}>
        {bio?.profileImageUrl
          ? <SmartImage src={bio.profileImageUrl} alt={name} className={styles.image} />
          : <div className={styles.placeholder}>🐾</div>}

        {!compact && stats.length > 0 && (
          <div className={styles.stats}>
            {stats.map(({ value, label }, i) => (
              <div key={i} className={styles.stat}>
                <strong><CountUp value={value} /></strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.content}>
        {tag && <span className={styles.tag}>{tag}</span>}
        <h2 className={styles.name}>{name}</h2>
        {bio?.tagline && <p className={styles.tagline}>{bio.tagline}</p>}

        {story && (
          <div className={styles.story}>
            {compact
              ? <p>{story.slice(0, TEASER_LENGTH)}{story.length > TEASER_LENGTH ? '…' : ''}</p>
              : story.split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
          </div>
        )}

        {!compact && quals.length > 0 && (
          <div className={styles.quals}>
            {qualsTitle && <h3>{qualsTitle}</h3>}
            <ul>
              {quals.map((q, i) => <li key={i}>🏆 {q}</li>)}
            </ul>
          </div>
        )}

        {!compact && location && (
          <p className={styles.detail}><span>📍</span><span>{location}</span></p>
        )}

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}

/** Placeholder matching the real block's proportions. */
export function BioBlockSkeleton({ variant = 'full' }) {
  const compact = variant === 'compact';
  return (
    <div className={`${styles.layout} ${compact ? styles.compact : ''}`} aria-hidden="true">
      <div className={styles.imageCol}>
        <Skeleton style={{ width: '100%', height: compact ? '400px' : '420px', borderRadius: 'var(--radius-xl)' }} />
        {!compact && (
          <div className={styles.stats}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.stat}>
                <Skeleton style={{ width: '55%', height: '1.5rem', margin: '0 auto 0.3rem' }} />
                <Skeleton style={{ width: '75%', height: '0.8rem', margin: '0 auto' }} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.content}>
        <Skeleton style={{ width: '160px', height: '1.5rem', marginBottom: '0.75rem', borderRadius: 'var(--radius-full)' }} />
        <Skeleton style={{ width: '50%', height: '2.5rem', marginBottom: '0.5rem' }} />
        <Skeleton style={{ width: '80%', height: '1.15rem', marginBottom: compact ? '1rem' : '1.5rem' }} />
        <Skeleton style={{ width: '100%', height: '1rem', marginBottom: '0.4rem' }} />
        <Skeleton style={{ width: '100%', height: '1rem', marginBottom: '0.4rem' }} />
        <Skeleton style={{ width: '70%', height: '1rem', marginBottom: compact ? '1.5rem' : '2rem' }} />
        {!compact && <Skeleton style={{ width: '100%', height: '5rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }} />}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Skeleton style={{ width: '140px', height: '48px', borderRadius: 'var(--radius-full)' }} />
          {!compact && <Skeleton style={{ width: '130px', height: '48px', borderRadius: 'var(--radius-full)' }} />}
        </div>
      </div>
    </div>
  );
}
