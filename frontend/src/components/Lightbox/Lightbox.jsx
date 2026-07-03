import { useEffect } from 'react';
import styles from './Lightbox.module.css';

export default function Lightbox({ image, onClose, onPrev, onNext, count, position }) {
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

  if (!image) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        {onPrev && <button className={`${styles.arrow} ${styles.left}`} onClick={onPrev} aria-label="Previous">‹</button>}
        <img src={image.url} alt={image.caption || 'Gallery image'} className={styles.img} />
        {onNext && <button className={`${styles.arrow} ${styles.right}`} onClick={onNext} aria-label="Next">›</button>}
        {count > 1 && <span className={styles.counter}>{position} / {count}</span>}
        {image.caption && <p className={styles.caption}>{image.caption}</p>}
      </div>
    </div>
  );
}
