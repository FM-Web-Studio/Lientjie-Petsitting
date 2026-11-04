import { useEffect, useState } from 'react';
import { getLenis } from '../../hooks/useMomentumScroll.js';
import styles from './BackToTop.module.css';

// A paw that appears once the visitor is well down a long page and takes them back up.
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      className={`${styles.btn} ${show ? styles.show : ''}`}
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
    >
      <span aria-hidden="true">🐾</span>
      <span className={styles.arrow} aria-hidden="true">↑</span>
    </button>
  );
}
