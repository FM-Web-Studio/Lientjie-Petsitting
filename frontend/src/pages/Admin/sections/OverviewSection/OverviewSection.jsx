import { useData } from '../../../../context/DataContext.jsx';
import Skeleton from '../../../../components/Skeleton';
import styles from './OverviewSection.module.css';

/*
 * The admin landing screen: what needs doing, at a glance.
 *
 * The moderation queue is the one thing that silently breaks the site if it is
 * ignored - a review nobody approves never appears - so pending items lead, and
 * every tile jumps straight to the screen where they are dealt with.
 */
export default function OverviewSection({ counts, loading, onOpen }) {
  const { services, albums, reviews } = useData();

  const todo = [
    { id: 'messages', icon: '💬', n: counts.unread, one: 'unread message', many: 'unread messages', tone: 'coral' },
    { id: 'reviews', icon: '⭐', n: counts.pendingReviews, one: 'review to approve', many: 'reviews to approve', tone: 'yellow' },
    { id: 'reviews', icon: '🗨️', n: counts.pendingComments, one: 'comment to approve', many: 'comments to approve', tone: 'teal' },
  ];
  const allClear = !loading && todo.every((t) => !t.n);

  const live = [
    { id: 'services', icon: '🦴', n: services.length, label: 'services live' },
    { id: 'gallery', icon: '📸', n: albums.length, label: 'gallery posts' },
    { id: 'reviews', icon: '💛', n: reviews.length, label: 'published reviews' },
  ];

  return (
    <div className={styles.wrap}>
      <section>
        <h3 className={styles.heading}>Needs your attention</h3>
        {allClear ? (
          <div className={styles.clear}>
            <span aria-hidden="true">🎉</span>
            <div>
              <strong>All caught up!</strong>
              <p>No unread messages and nothing waiting for approval.</p>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {todo.map((t) => (
              <button
                key={t.one}
                type="button"
                className={`${styles.tile} ${t.n ? styles.hot : ''}`}
                data-tone={t.tone}
                onClick={() => onOpen(t.id)}
              >
                <span className={styles.icon} aria-hidden="true">{t.icon}</span>
                {loading
                  ? <Skeleton style={{ width: '3rem', height: '2rem' }} />
                  : <strong className={styles.num}>{t.n}</strong>}
                <span className={styles.label}>{t.n === 1 ? t.one : t.many}</span>
                <span className={styles.go} aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className={styles.heading}>On the site right now</h3>
        <div className={styles.grid}>
          {live.map((t) => (
            <button key={t.label} type="button" className={styles.tile} onClick={() => onOpen(t.id)}>
              <span className={styles.icon} aria-hidden="true">{t.icon}</span>
              <strong className={styles.num}>{t.n}</strong>
              <span className={styles.label}>{t.label}</span>
              <span className={styles.go} aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.tips}>
        <h3 className={styles.heading}>Quick tips</h3>
        <ul>
          <li>✏️ Change any heading or sentence on the site under <button type="button" className={styles.inline} onClick={() => onOpen('copy')}>Site Copy</button>.</li>
          <li>📇 Your phone, email and WhatsApp link live under <button type="button" className={styles.inline} onClick={() => onOpen('contact')}>Contact Info</button> and show up across the site.</li>
          <li>🔒 For safety you are signed out after 30 minutes without activity, and when you close the browser.</li>
        </ul>
      </section>
    </div>
  );
}
