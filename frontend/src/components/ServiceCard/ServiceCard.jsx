import { Link } from 'react-router-dom';
import Skeleton from '../Skeleton/Skeleton.jsx';
import styles from './ServiceCard.module.css';

/*
 * One service, in the two shapes the site needs:
 *
 *   compact - the Home page preview: icon, name, blurb, price. No booking
 *             button, because the section already ends in "See All Services".
 *   full    - the Services page: price badge, duration, what's included, and a
 *             Book Now button.
 *
 * These used to be two hand-written copies with different field coverage, so
 * `duration` and `includes` only ever showed up on one of them. One component
 * means adding a field is one edit.
 */

export const SERVICE_COLORS = ['coral', 'teal', 'purple', 'yellow', 'pink', 'orange'];

/** The accent colour for the card at position `i` in a list. */
export const serviceColor = (i) => SERVICE_COLORS[i % SERVICE_COLORS.length];

export default function ServiceCard({ service, color = 'coral', variant = 'full', bookLabel = 'Book Now' }) {
  const compact = variant === 'compact';
  const {
    icon, name, description, price, priceUnit, duration, includes,
  } = service;

  return (
    <article className={`${styles.card} ${compact ? styles.compact : ''}`} data-color={color}>
      <div className={styles.top}>
        <span className={styles.icon}>{icon || '🐾'}</span>
        {!compact && (
          <span className={styles.priceBadge}>
            R{price}
            <span>/{priceUnit || 'session'}</span>
          </span>
        )}
      </div>

      <h3 className={styles.name}>{name}</h3>

      {duration && <p className={styles.duration}>⏱ {duration}</p>}

      <p className={styles.description}>{description}</p>

      {!compact && includes?.length > 0 && (
        <ul className={styles.includes}>
          {includes.map((item, i) => <li key={i}>✅ {item}</li>)}
        </ul>
      )}

      {compact ? (
        <p className={styles.price}>
          <strong>R{price}</strong>
          <span> / {priceUnit || 'session'}</span>
        </p>
      ) : (
        <Link to="/contact" className={`btn btn-primary ${styles.bookBtn}`}>{bookLabel}</Link>
      )}
    </article>
  );
}

/** Placeholder matching the real card's shape, so loading doesn't shift layout. */
export function ServiceCardSkeleton({ color = 'coral', variant = 'full' }) {
  const compact = variant === 'compact';
  return (
    <article className={`${styles.card} ${compact ? styles.compact : ''}`} data-color={color} aria-hidden="true">
      <div className={styles.top}>
        <Skeleton circle style={{ width: compact ? '2.5rem' : '2.75rem', height: compact ? '2.5rem' : '2.75rem' }} />
        {!compact && <Skeleton style={{ width: '80px', height: '44px', borderRadius: 'var(--radius-md)' }} />}
      </div>
      <Skeleton style={{ width: '62%', height: '1.4rem', marginBottom: '0.35rem' }} />
      {!compact && <Skeleton style={{ width: '38%', height: '0.9rem', marginBottom: '0.75rem' }} />}
      <Skeleton style={{ width: '100%', height: compact ? '3rem' : '4.5rem', marginBottom: '1rem' }} />
      <Skeleton style={{
        width: compact ? '45%' : '110px',
        height: compact ? '1.4rem' : '42px',
        borderRadius: compact ? undefined : 'var(--radius-full)',
        marginTop: 'auto',
      }}
      />
    </article>
  );
}
