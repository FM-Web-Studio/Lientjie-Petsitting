import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Glass modal dialog. Traps focus, locks scroll, restores focus on close.
 * The dialog carries a global `admin-modal` class so the admin form styles
 * (which live in styles/admin.css) reach content rendered through this portal.
 */
export default function Modal({ open, onClose, children, title, size = 'md' }) {
  const dialogRef = useRef(null);
  const prevFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    prevFocusRef.current = document.activeElement;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    const raf = requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      prevFocusRef.current?.focus?.();
    };
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Tab' && dialogRef.current) {
      const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      if (!nodes.length) { e.preventDefault(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        className={`admin-modal ${styles.dialog} ${size === 'lg' ? styles.dialogLg : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'admin-modal-title' : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <button className={styles.close} onClick={onClose} type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {title && (
          <header className={styles.header}>
            <h2 id="admin-modal-title" className={styles.title}>{title}</h2>
          </header>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
