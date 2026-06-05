import { useToast } from '../../context/ToastContext.jsx';
import styles from './Toast.module.css';

export default function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className={styles.close} aria-label="Dismiss">✕</button>
        </div>
      ))}
    </div>
  );
}
