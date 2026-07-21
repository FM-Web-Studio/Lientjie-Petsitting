import { useState, useRef, useEffect } from 'react';
import styles from './KebabMenu.module.css';

/**
 * A tap-triggered "⋯" action menu — the mobile-friendly way to tuck row
 * actions away without a hidden long-press gesture. Closes on outside
 * click or Escape.
 *
 * @param {{ label: string, onClick: () => void, danger?: boolean, disabled?: boolean }[]} items
 * @param {string} [ariaLabel] accessible name for the trigger button
 */
export default function KebabMenu({ items = [], ariaLabel = 'Actions' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!items.length) return null;

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        ⋯
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`${styles.item} ${item.danger ? styles.danger : ''}`}
              disabled={item.disabled}
              onClick={() => { setOpen(false); item.onClick?.(); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
