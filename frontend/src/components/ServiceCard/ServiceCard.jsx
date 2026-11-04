import { Link } from 'react-router-dom';
import Skeleton from '../Skeleton';
import styles from './ServiceCard.module.css';

/*
 * One service, in the two shapes the site needs:
 *
 *   compact - the Home page preview: icon, name, blurb, price, and a small
 *             "Ask about this" link.
 *   full    - the Services page: price, duration, what's included, and a Book
 *             button.
 *
 * Both book through /contact?service=<name>, which opens the contact form with
 * that service already picked - one tap from "I want this" to the form.
 */

export const SERVICE_COLORS = ['coral', 'teal', 'purple', 'yellow', 'pink', 'orange'];

/** The accent colour for the card at position `i` in a list. */
export const serviceColor = (i) => SERVICE_COLORS[i % SERVICE_COLORS.length];

export const bookingLink = (name) => (name ? `/contact?service=${encodeURIComponent(name)}` : '/contact');

const hasPrice = (price) => price !== undefined && price !== null && String(price).trim() !== '';

export default function ServiceCard({ service, color = 'coral', variant = 'full', bookLabel = 'Book Now' }) {
  const compact = variant === 'compact';
  const {
    icon, name, description, price, priceUnit, duration, includes,
  } = service;

  return (
    <article className={`${styles.card} ${compact ? styles.compact : ''}`} data-color={color}>
      <div className={styles.top}>
        <span className={styles.icon} aria-hidden="true">{icon || '🐾'}</span>
        {hasPrice(price) && (
          <span className={styles.price}>
            <strong>R{price}</strong>
            <span>/{priceUnit || 'session'}</span>
          </span>
        )}
      </div>

      <h3 className={styles.name}>{name}</h3>
      {duration && <p className={styles.duration}><span aria-hidden="true">⏱</span> {duration}</p>}
      <p className={styles.description}>{description}</p>

      {!compact && includes?.length > 0 && (
        <ul className={styles.includes} aria-label="Included">
          {includes.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}

      {compact ? (
        <Link to={bookingLink(name)} className={styles.ask}>
          Ask about this <span aria-hidden="true">→</span>
          <span className="sr-only"> ({name})</span>
        </Link>
      ) : (
        <Link to={bookingLink(name)} className={`btn btn-primary btn-block ${styles.bookBtn}`}>
          {bookLabel} <span className="sr-only">- {name}</span>
        </Link>
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
        <Skeleton circle style={{ width: '3.25rem', height: '3.25rem' }} />
        <Skeleton style={{ width: '80px', height: '2.2rem', borderRadius: 'var(--radius-full)' }} />
      </div>
      <Skeleton style={{ width: '62%', height: '1.4rem', marginBottom: '0.5rem' }} />
      <Skeleton style={{ width: '100%', height: compact ? '3rem' : '4.5rem', marginBottom: '1rem' }} />
      <Skeleton style={{
        width: compact ? '45%' : '100%',
        height: compact ? '1.2rem' : '48px',
        borderRadius: 'var(--radius-full)',
        marginTop: 'auto',
      }}
      />
    </article>
  );
}
