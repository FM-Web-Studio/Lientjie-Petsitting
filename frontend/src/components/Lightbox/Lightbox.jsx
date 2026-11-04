import { useEffect, useRef, useState } from 'react';
import { getLenis } from '../../hooks/useMomentumScroll.js';
import styles from './Lightbox.module.css';

// Horizontal travel (px) needed before a drag counts as a swipe rather than a tap.
const SWIPE_THRESHOLD = 60;

export default function Lightbox({ image, images, onClose, onPrev, onNext, count, position }) {
  const [loaded, setLoaded] = useState(false);
  const [dx, setDx] = useState(0);
  const dragStart = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    document.addEventListener('keydown', onKey);
    // Smooth scrolling moves the page itself on wheel events, past overflow:hidden, so stop it too.
    document.body.style.overflow = 'hidden';
    getLenis()?.stop();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      getLenis()?.start();
    };
  }, [onClose, onPrev, onNext]);

  // Reset the loading state whenever the visible image changes.
  useEffect(() => { setLoaded(false); }, [image?.url]);

  // Preload the neighbouring images so tapping prev/next is instant.
  useEffect(() => {
    if (!images?.length) return undefined;
    const current = position - 1;
    const neighbours = [current - 1, current + 1].filter((i) => i >= 0 && i < images.length);
    const preloaded = neighbours.map((i) => {
      const img = new Image();
      img.src = images[i].url;
      return img;
    });
    return () => preloaded.forEach((img) => { img.src = ''; });
  }, [images, position]);

  if (!image) return null;

  /*
   * Drag the photo itself, with a finger or the mouse: it follows the pointer and
   * tilts a little, a far enough fling changes photo, and anything shorter springs
   * back. With only one photo it still moves, but only a little, and returns.
   */
  const canSwipe = !!(onPrev || onNext);
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('button')) return;
    dragStart.current = { x: e.clientX, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragStart.current) return;
    const raw = e.clientX - dragStart.current.x;
    setDx(canSwipe ? raw : raw * 0.25);
  };
  const onPointerUp = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    const moved = dx;
    setDx(0);
    if (!canSwipe || Math.abs(moved) < SWIPE_THRESHOLD) return;
    if (moved > 0) onPrev?.(); else onNext?.();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        <div
          className={`${styles.stage} ${dx ? styles.dragging : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDragStart={(e) => e.preventDefault()}
        >
          {!loaded && <span className={styles.spinner} aria-hidden="true" />}
          <img
            key={image.url}
            src={image.url}
            alt={image.caption || 'Gallery image'}
            className={styles.img}
            draggable={false}
            style={{
              opacity: loaded ? 1 - Math.min(0.5, Math.abs(dx) / 600) : 0,
              transform: `translateX(${dx}px) rotate(${dx / 40}deg)`,
            }}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
          {onPrev && <button className={`${styles.arrow} ${styles.left}`} onClick={onPrev} aria-label="Previous image">‹</button>}
          {onNext && <button className={`${styles.arrow} ${styles.right}`} onClick={onNext} aria-label="Next image">›</button>}
        </div>
        {count > 1 && <span className={styles.counter}>{position} / {count}</span>}
        {image.caption && <p className={styles.caption}>{image.caption}</p>}
      </div>
    </div>
  );
}
