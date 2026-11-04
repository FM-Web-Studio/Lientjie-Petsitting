import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContent } from '../../context/ContentContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { signInWithGoogle, logOut, isListedAdmin } from '../../firebase/auth.js';
import { NAV_LINKS } from '../Navigation/Navigation.jsx';
import styles from './Footer.module.css';

const SECRET_TAPS = 5;
const SECRET_WINDOW_MS = 3000;

/*
 * The hidden way into the admin panel: tap the copyright line five times within
 * three seconds. There is no visible admin link anywhere on the public site.
 * Anyone who stumbles on it only gets a Google sign-in, and an account that is
 * not on the admin list is signed straight back out. firestore.rules is what
 * actually keeps everyone else out; this only keeps the door out of sight.
 */
function useSecretAdminEntry() {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const taps = useRef([]);
  const [goAdmin, setGoAdmin] = useState(false);

  // Navigate only once the app itself knows this is an admin, so /admin opens the panel, not the 404.
  useEffect(() => {
    if (goAdmin && isAdmin) { setGoAdmin(false); navigate('/admin'); }
  }, [goAdmin, isAdmin, navigate]);

  return async () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < SECRET_WINDOW_MS), now];
    if (taps.current.length < SECRET_TAPS) return;
    taps.current = [];
    if (isAdmin) { navigate('/admin'); return; }
    try {
      const user = await signInWithGoogle();
      if (user.emailVerified && await isListedAdmin(user.email)) {
        setGoAdmin(true);
      } else {
        await logOut();
        addToast('That account cannot open this.', 'error');
      }
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        addToast('Sign-in did not work. Please try again.', 'error');
      }
    }
  };
}

export default function Footer() {
  const onSecretTap = useSecretAdminEntry();
  const { copy } = useContent();
  const brand = copy('brand');
  const info = copy('contact');
  const socials = [
    info.instagram && { label: 'Instagram', icon: '📷', href: info.instagram },
    info.facebook && { label: 'Facebook', icon: '👍', href: info.facebook },
    info.whatsapp && { label: 'WhatsApp', icon: '💬', href: info.whatsapp },
  ].filter(Boolean);

  return (
    <footer className={styles.footer}>
      <svg className={styles.wave} viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40 C 200 0 420 70 720 34 S 1240 0 1440 38 L1440 70 L0 70 Z" />
      </svg>

      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logoRow}>
            <img src="/logo.png" alt="" className={styles.logoImg} width="52" height="52" />
            <span className={styles.logo}>{brand.brandName}</span>
          </Link>
          <p className={styles.tagline}>{brand.footerTagline}</p>
          {socials.length > 0 && (
            <div className={styles.socials}>
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.social}>
                  <span aria-hidden="true">{s.icon}</span> {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <nav className={styles.col} aria-label="Footer">
          <h2 className={styles.colTitle}>Explore</h2>
          {NAV_LINKS.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
        </nav>

        <div className={styles.col}>
          <h2 className={styles.colTitle}>Say hello</h2>
          {info.location && <p>📍 {info.location}</p>}
          {info.phone && <a href={`tel:${info.phone.replace(/\s+/g, '')}`}>📞 {info.phone}</a>}
          {info.email && <a href={`mailto:${info.email}`}>✉️ {info.email}</a>}
          {info.responseTime && <p>⏰ Replies {info.responseTime.charAt(0).toLowerCase() + info.responseTime.slice(1)}</p>}
          <Link to="/contact" className={`btn btn-yellow btn-sm ${styles.cta}`}>Book a sit 🐾</Link>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p className={styles.copyright} onClick={onSecretTap} data-no-burst>
          © {new Date().getFullYear()} {brand.brandName}. {brand.footerNote}
        </p>
        <nav className={styles.legal} aria-label="Legal">
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of use</Link>
        </nav>
      </div>
    </footer>
  );
}
