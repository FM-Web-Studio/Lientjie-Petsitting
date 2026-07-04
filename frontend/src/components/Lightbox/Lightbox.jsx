import { useEffect, useState } from 'react';
import styles from './Lightbox.module.css';

export default function Lightbox({ image, images, onClose, onPrev, onNext, count, position }) {
  const [loaded, setLoaded] = useState(false);

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

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        {onPrev && <button className={`${styles.arrow} ${styles.left}`} onClick={onPrev} aria-label="Previous">‹</button>}
        <div className={styles.stage}>
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
        </div>
        {onNext && <button className={`${styles.arrow} ${styles.right}`} onClick={onNext} aria-label="Next">›</button>}
        {count > 1 && <span className={styles.counter}>{position} / {count}</span>}
        {image.caption && <p className={styles.caption}>{image.caption}</p>}
      </div>
    </div>
  );
}
