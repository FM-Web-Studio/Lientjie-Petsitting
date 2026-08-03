import { useEffect, useRef, useState } from 'react';
import styles from './InfoNote.module.css';

/*
 * A notice that says its piece, then gets out of the way.
 *
 * It opens expanded so the message is actually read, collapses to a single icon
 * after a few seconds, and reopens on click. The point is that the information
 * stays retrievable rather than being dismissed forever - people notice the
 * badge later, when they are wondering exactly the thing it answers.
 *
 * Two behaviours worth keeping:
 *   - the auto-collapse fires ONCE, on mount. Once someone has opened it by
 *     hand, a timer yanking it shut again would be hostile.
 *   - collapsing never moves focus. The timer can fire while the visitor is
 *     typing in a field below, and stealing focus mid-sentence is far worse
 *     than a notice they have to click twice.
 */
export default function InfoNote({
  children,
  icon = '⚠️',
  autoHideMs = 6000,
  label = 'More information',
  placement = 'bottom',
}) {
  const [open, setOpen] = useState(true);
  // Set as soon as the visitor touches the control, so the mount timer stands down.
  const interacted = useRef(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!autoHideMs) return undefined;
    const id = setTimeout(() => {
      if (!interacted.current) setOpen(false);
    }, autoHideMs);
    return () => clearTimeout(id);
  }, [autoHideMs]);

  /*
   * The panel floats over the fields beneath it, so it has to close when the
   * visitor reaches past it - otherwise it sits between them and the input they
   * were aiming for.
   */
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const toggle = () => {
    interacted.current = true;
    setOpen((v) => !v);
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.note} ${styles[placement]} ${open ? styles.open : styles.collapsed}`}
    >
      <button
        type="button"
        className={styles.badge}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="info-note-body"
        aria-label={open ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        title={open ? 'Hide' : label}
      >
        <span aria-hidden="true">{icon}</span>
      </button>

      {/*
        Collapsed in CSS rather than unmounted or `hidden`: both remove the node
        from layout, which kills the transition and leaves aria-controls pointing
        at nothing. The collapsed rule uses visibility:hidden, so the text is
        still out of the accessibility tree when it is not showing.
      */}
      <p id="info-note-body" className={styles.body}>{children}</p>
    </div>
  );
}
