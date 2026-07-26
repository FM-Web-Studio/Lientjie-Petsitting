import { Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext.jsx';
import styles from './Footer.module.css';

export default function Footer() {
  const { copy } = useContent();
  const brand = copy('brand');
  const info = copy('contact');
  const socials = [
    info.instagram && { label: 'Instagram', href: info.instagram },
    info.facebook && { label: 'Facebook', href: info.facebook },
    info.whatsapp && { label: 'WhatsApp', href: info.whatsapp },
  ].filter(Boolean);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="" className={styles.logoImg} />
          <span className={styles.logo}>{brand.brandName}</span>
          <p>{brand.footerTagline}</p>
          {socials.length > 0 && (
            <p style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label}</a>
              ))}
            </p>
          )}
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <p className={styles.copy}>© {new Date().getFullYear()} {brand.brandName}. {brand.footerNote}</p>
      </div>
    </footer>
  );
}
