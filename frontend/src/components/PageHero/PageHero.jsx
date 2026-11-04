import { useContent } from '../../context/ContentContext.jsx';
import Skeleton from '../Skeleton';
import styles from './PageHero.module.css';

/*
 * The colourful header every inner page opens with: a big friendly title, a
 * line of explanation, a bouncing emoji and two soft blobs behind it.
 *
 *   tone   coral | teal | yellow | purple | pink - picks the blob colours
 *   emoji  the mascot for the page (decorative, hidden from screen readers)
 *   children  optional extras under the subtitle, e.g. a summary chip row
 */
// Most editable titles already end in an emoji ("My Services 🐾"); a second one above would be noise.
const HAS_EMOJI = /\p{Extended_Pictographic}/u;

export default function PageHero({ title, subtitle, emoji = '🐾', tone = 'coral', children }) {
  // Titles are editable copy that arrives a moment after the page: show bars until it
  // does, rather than flashing the built-in default and then swapping the words.
  const { loaded } = useContent();
  const showEmoji = loaded && emoji && !HAS_EMOJI.test(String(title));
  return (
    <header className={`${styles.hero} ${showEmoji ? '' : styles.noEmoji}`} data-tone={tone}>
      <span className={`${styles.blob} ${styles.blobA}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobB}`} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        {showEmoji && <span className={styles.emoji} aria-hidden="true">{emoji}</span>}
        {loaded ? (
          <>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </>
        ) : (
          <div aria-busy="true" aria-label="Loading">
            <Skeleton style={{ width: 'min(70%, 24rem)', height: '2.8rem', margin: '0 auto 0.75rem', borderRadius: 'var(--radius-md)' }} />
            <Skeleton style={{ width: 'min(85%, 30rem)', height: '1.1rem', margin: '0 auto' }} />
          </div>
        )}
        {children && <div className={styles.extra}>{children}</div>}
      </div>
      <svg className={styles.wave} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 30 C 240 70 480 0 720 26 S 1200 60 1440 22 L1440 60 L0 60 Z" />
      </svg>
    </header>
  );
}
