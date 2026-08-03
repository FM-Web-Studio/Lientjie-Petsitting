import { useRef, useState } from 'react';
import styles from './StarRating.module.css';

/*
 * Five stars, in two modes.
 *
 * Read-only (no `onChange`) renders as text, not controls - a rating is
 * information, and a screen reader should hear "Rated 4 out of 5" once rather
 * than tab through five inert stars. Half-filled stars are supported so a 4.3
 * average doesn't have to lie.
 *
 * Editable (`onChange` given) renders a real radio group, so arrow keys and
 * labels come free, and stays keyboard- and screen-reader-operable even though
 * it is driven by pointer events. On top of that it supports press-and-drag:
 * hold anywhere on the row and sweep to raise or lower the rating, which is how
 * people expect a star control to behave on a phone.
 *
 * The star is drawn as SVG rather than the ★ character on purpose. A text glyph
 * only fills about 70% of its em box and sits off-centre, so it always looked
 * small and floated inside its tap target no matter how far the font-size was
 * pushed. An SVG fills exactly the space it is given.
 */

const STARS = [1, 2, 3, 4, 5];

const StarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

export default function StarRating({
  value = 0,
  onChange,
  size = 'md',
  name = 'rating',
  showValue = false,
}) {
  const [hovered, setHovered] = useState(0);
  const rowRef = useRef(null);
  const dragging = useRef(false);
  const editable = typeof onChange === 'function';
  const shown = hovered || value;

  if (!editable) {
    return (
      <span
        className={`${styles.stars} ${styles[size]}`}
        role="img"
        aria-label={`Rated ${Number(value).toFixed(1)} out of 5`}
      >
        {STARS.map((n) => {
          // Fraction of this star that should be filled, for averages like 4.3.
          const fill = Math.max(0, Math.min(1, Number(value) - (n - 1)));
          return (
            <span key={n} className={styles.star} aria-hidden="true">
              <StarIcon className={`${styles.icon} ${styles.empty}`} />
              {/* Fixed-width icon inside a narrowed, clipping box - that is what
                  produces a partly-filled star for a fractional average. */}
              <span className={styles.filled} style={{ width: `${fill * 100}%` }}>
                <StarIcon className={styles.icon} />
              </span>
            </span>
          );
        })}
        {showValue && <span className={styles.value}>{Number(value).toFixed(1)}</span>}
      </span>
    );
  }

  /* Which star sits under this x position, 1-5. */
  const ratingAt = (clientX) => {
    const el = rowRef.current;
    if (!el) return 0;
    const { left, width } = el.getBoundingClientRect();
    const ratio = (clientX - left) / width;
    return Math.min(5, Math.max(1, Math.ceil(ratio * 5)));
  };

  const commit = (clientX) => {
    const n = ratingAt(clientX);
    if (!n) return;
    setHovered(n);
    if (n !== value) onChange(n);
  };

  const handlePointerDown = (e) => {
    // Ignore secondary buttons so a right-click doesn't set a rating.
    if (e.button != null && e.button !== 0) return;
    dragging.current = true;
    // Capture keeps the drag alive when the pointer leaves the row mid-sweep,
    // instead of the rating freezing wherever it slipped out.
    rowRef.current?.setPointerCapture?.(e.pointerId);
    commit(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!dragging.current) return;
    commit(e.clientX);
  };

  const endDrag = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    rowRef.current?.releasePointerCapture?.(e.pointerId);
    setHovered(0); // fall back to the committed value
  };

  return (
    <span
      ref={rowRef}
      className={`${styles.stars} ${styles[size]} ${styles.editable}`}
      role="radiogroup"
      aria-label="Your rating"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onMouseLeave={() => { if (!dragging.current) setHovered(0); }}
    >
      {STARS.map((n) => (
        <label
          key={n}
          className={`${styles.star} ${styles.clickable} ${n <= shown ? styles.on : ''}`}
          onMouseEnter={() => { if (!dragging.current) setHovered(n); }}
        >
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className={styles.input}
          />
          <StarIcon className={styles.icon} />
          <span className={styles.srOnly}>{n} star{n === 1 ? '' : 's'}</span>
        </label>
      ))}
    </span>
  );
}
