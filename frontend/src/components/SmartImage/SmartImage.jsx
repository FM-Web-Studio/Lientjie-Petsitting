import { useEffect, useRef, useState } from 'react';
import styles from './SmartImage.module.css';

/*
 * An <img> that shows a shimmering skeleton in its place until the photo has
 * actually arrived, then fades it in. Without it a slow photo leaves a blank
 * box, which reads as broken.
 *
 * Fills its parent: the parent decides the size and shape (aspect-ratio, height).
 * A cached image that is already complete on mount skips the shimmer entirely.
 */
export default function SmartImage({ src, alt = '', className = '', imgClassName = '', style, ...imgProps }) {
  const ref = useRef(null);
  const [state, setState] = useState('loading'); // loading | loaded | error

  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setState('loaded');
    else setState('loading');
  }, [src]);

  return (
    <span className={`${styles.wrap} ${className}`} style={style} data-state={state}>
      {state !== 'loaded' && (
        <span className={styles.shimmer} aria-hidden="true">
          {state === 'error' && <span className={styles.fallback}>🐾</span>}
        </span>
      )}
      {src && (
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={`${styles.img} ${imgClassName}`}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          draggable={false}
          {...imgProps}
        />
      )}
    </span>
  );
}
