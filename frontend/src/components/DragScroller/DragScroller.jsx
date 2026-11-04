import { Children, useCallback, useEffect, useRef, useState } from 'react';
import styles from './DragScroller.module.css';

/*
 * A horizontal row you can grab and fling.
 *
 *   - mouse: click-and-drag, with momentum when you let go
 *   - touch: the native swipe the phone already does well, with snapping
 *   - keyboard / anyone: the arrow buttons, and the dots show where you are
 *
 * A drag never counts as a click, so a card that is a link does not open when
 * you were only trying to move the row.
 *
 *   <DragScroller label="Reviews">{cards}</DragScroller>
 */
export default function DragScroller({ label, itemWidth = 'min(340px, 82vw)', children }) {
  const track = useRef(null);
  const drag = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const items = Children.toArray(children);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 8);
    const first = el.firstElementChild;
    const step = first ? first.getBoundingClientRect().width + 20 : el.clientWidth;
    setActive(Math.min(items.length - 1, Math.round(el.scrollLeft / step)));
  }, [items.length]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const scrollByCard = (dir) => {
    const el = track.current;
    const first = el.firstElementChild;
    const step = first ? first.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const goTo = (i) => {
    const el = track.current;
    const child = el.children[i];
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };

  // ── Mouse drag with momentum ────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = track.current;
    drag.current = { x: e.clientX, left: el.scrollLeft, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      setDragging(true);
      track.current.setPointerCapture(d.id);
    }
    if (!d.moved) return;
    const now = performance.now();
    d.v = (e.clientX - d.lastX) / Math.max(1, now - d.lastT);
    d.lastX = e.clientX;
    d.lastT = now;
    track.current.scrollLeft = d.left - dx;
  };

  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    const el = track.current;
    // Glide on with the speed the drag ended at, slowing down, then let snapping settle it.
    let v = -d.v * 16;
    const glide = () => {
      if (Math.abs(v) < 0.5) { setDragging(false); return; }
      el.scrollLeft += v;
      v *= 0.92;
      requestAnimationFrame(glide);
    };
    requestAnimationFrame(glide);
  };

  // Swallow the click that ends a drag, so links inside do not fire.
  const onClickCapture = (e) => {
    if (dragging) { e.preventDefault(); e.stopPropagation(); }
  };

  return (
    <div className={styles.wrap} role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        className={`${styles.track} ${dragging ? styles.dragging : ''}`}
        style={{ '--item-width': itemWidth }}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        {items.map((child, i) => (
          <div key={child.key ?? i} className={styles.item} aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`}>
            {child}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={() => scrollByCard(-1)} disabled={atStart} aria-label="Previous">←</button>
          <div className={styles.dots}>
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${i === active ? styles.dotOn : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to ${i + 1}`}
                aria-current={i === active ? 'true' : undefined}
              />
            ))}
          </div>
          <button type="button" className={styles.arrow} onClick={() => scrollByCard(1)} disabled={atEnd} aria-label="Next">→</button>
        </div>
      )}
      <p className={styles.hint} aria-hidden="true">← drag or swipe →</p>
    </div>
  );
}
