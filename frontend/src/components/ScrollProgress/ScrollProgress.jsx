import { useEffect, useRef } from 'react';
import styles from './ScrollProgress.module.css';

/*
 * A thin bar along the top that fills as you read down the page, with a paw
 * walking along its end. Written straight to the DOM on each frame rather than
 * through React state, so scrolling never re-renders anything.
 */
export default function ScrollProgress() {
  const bar = useRef(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.current?.style.setProperty('--p', p.toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div ref={bar} className={styles.track} aria-hidden="true">
      <div className={styles.fill} />
      <span className={styles.paw}>🐾</span>
    </div>
  );
}
