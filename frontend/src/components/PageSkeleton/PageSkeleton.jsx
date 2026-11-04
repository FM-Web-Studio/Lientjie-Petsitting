import Skeleton from '../Skeleton';
import styles from './PageSkeleton.module.css';

/*
 * What a page looks like while its code is still downloading: a hero block and
 * a row of cards, in the same shapes the real page uses, so nothing jumps when
 * it arrives.
 *
 *   variant="page"  (default) a public page
 *   variant="admin" the admin panel's top bar, sidebar and a form
 */
export default function PageSkeleton({ variant = 'page' }) {
  if (variant === 'admin') return <AdminSkeleton />;
  return (
    <div className={styles.page} aria-busy="true" aria-label="Loading">
      <div className={styles.hero}>
        <Skeleton circle style={{ width: '4.25rem', height: '4.25rem', margin: '0 auto 1rem' }} />
        <Skeleton style={{ width: 'min(70%, 26rem)', height: '2.6rem', margin: '0 auto 0.75rem', borderRadius: 'var(--radius-md)' }} />
        <Skeleton style={{ width: 'min(85%, 32rem)', height: '1.1rem', margin: '0 auto' }} />
      </div>
      <div className={`container ${styles.grid}`}>
        {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

/** One generic card: icon, title, three lines and a button. */
export function CardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <Skeleton circle style={{ width: '3.25rem', height: '3.25rem', marginBottom: '1rem' }} />
      <Skeleton style={{ width: '60%', height: '1.4rem', marginBottom: '0.75rem' }} />
      <Skeleton style={{ width: '100%', height: '0.95rem', marginBottom: '0.4rem' }} />
      <Skeleton style={{ width: '92%', height: '0.95rem', marginBottom: '0.4rem' }} />
      <Skeleton style={{ width: '70%', height: '0.95rem', marginBottom: '1.25rem' }} />
      <Skeleton style={{ width: '100%', height: '48px', borderRadius: 'var(--radius-full)', marginTop: 'auto' }} />
    </div>
  );
}

/** A form being loaded: label + input pairs and a save button. Used by the admin editors. */
export function FormSkeleton({ fields = 5 }) {
  return (
    <div className={styles.form} aria-busy="true" aria-label="Loading">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className={styles.formRow}>
          <Skeleton style={{ width: `${30 + ((i * 17) % 30)}%`, height: '0.9rem', marginBottom: '0.5rem' }} />
          <Skeleton style={{ width: '100%', height: i === fields - 1 ? '7rem' : '2.9rem', borderRadius: 'var(--radius-md)' }} />
        </div>
      ))}
      <Skeleton style={{ width: '140px', height: '44px', borderRadius: 'var(--radius-full)' }} />
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className={styles.admin} aria-busy="true" aria-label="Loading">
      <div className={styles.adminBar}>
        <Skeleton style={{ width: '180px', height: '1.5rem' }} />
        <Skeleton style={{ width: '220px', height: '2.25rem', borderRadius: 'var(--radius-full)' }} />
      </div>
      <div className={styles.adminShell}>
        <div className={styles.adminNav}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} style={{ width: `${55 + ((i * 13) % 35)}%`, height: '1.6rem' }} />)}
        </div>
        <div className={styles.adminMain}>
          <Skeleton style={{ width: '220px', height: '2rem', marginBottom: '1.5rem' }} />
          <FormSkeleton />
        </div>
      </div>
    </div>
  );
}
