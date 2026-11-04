import { useToast } from '../../context/ToastContext.jsx';
import styles from './Toast.module.css';

const ICONS = { success: '🎉', error: '😿', warning: '🐾', info: '💡' };

export default function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type] || ''}`}>
          <span className={styles.icon} aria-hidden="true">{ICONS[t.type] || ICONS.info}</span>
          <span className={styles.message}>{t.message}</span>
          <button type="button" onClick={() => removeToast(t.id)} className={styles.close} aria-label="Dismiss">✕</button>
        </div>
      ))}
    </div>
  );
}
