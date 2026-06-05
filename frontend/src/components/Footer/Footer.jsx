import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>🐾 Lientjie's Petsitting</span>
          <p>Professional, loving care for your furry family members.</p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <p className={styles.copy}>© {new Date().getFullYear()} Lientjie's Petsitting. Made with 💛</p>
      </div>
    </footer>
  );
}
