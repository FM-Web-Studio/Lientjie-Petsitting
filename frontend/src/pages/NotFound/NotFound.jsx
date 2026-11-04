import { Link } from 'react-router-dom';
import { NAV_LINKS } from '../../components/Navigation/Navigation.jsx';
import styles from './NotFound.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function NotFound() {
  usePageMeta({ title: 'Page not found', noindex: true });
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.scene} aria-hidden="true">
          <span className={styles.dog}>🐕</span>
          <span className={styles.trail}>🐾 🐾 🐾</span>
        </div>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Oops! This page ran off after a squirrel.</h2>
        <p className={styles.text}>We sniffed everywhere and could not find it. Try one of these instead:</p>
        <nav className={styles.links} aria-label="Pages">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={styles.link}>
              <span aria-hidden="true">{l.icon}</span> {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
