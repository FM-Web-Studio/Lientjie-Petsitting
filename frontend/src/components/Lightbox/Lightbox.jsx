import { useEffect, useRef, useState } from 'react';
import styles from './Lightbox.module.css';

// Horizontal travel (px) needed before a touch counts as a swipe rather than a tap.
const SWIPE_THRESHOLD = 45;

export default function Lightbox({ image, images, onClose, onPrev, onNext, count, position }) {
  const [loaded, setLoaded] = useState(false);
  const touchX = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
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

  // Swipe between images on touch devices, the way a phone gallery expects.
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx > 0) onPrev?.(); else onNext?.();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        <div className={styles.stage} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {!loaded && <span className={styles.spinner} aria-hidden="true" />}
          <img
            key={image.url}
            src={image.url}
            alt={image.caption || 'Gallery image'}
            className={styles.img}
            style={{ opacity: loaded ? 1 : 0 }}
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
