import { useRef } from 'react';
import styles from './Tilt.module.css';

const canTilt = () => typeof window !== 'undefined'
  && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * Leans its child towards the mouse in 3D, with a soft shine following the
 * pointer - cards feel like things you could pick up.
 *
 * Mouse only: on touch there is no hover, and tilting under a finger fights
 * the scroll. Off for anyone who prefers reduced motion.
 *
 *   <Tilt max={8}><ServiceCard … /></Tilt>
 */
export default function Tilt({ max = 7, className = '', children }) {
  const ref = useRef(null);
  const frame = useRef(0);

  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || !canTilt()) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;   // 0..1
    const y = (e.clientY - r.top) / r.height;   // 0..1
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
      el.dataset.active = 'true';
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    delete el.dataset.active;
  };

  return (
    <div ref={ref} className={`${styles.tilt} ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className={styles.inner}>
        {children}
        <span className={styles.shine} aria-hidden="true" />
      </div>
    </div>
  );
}
