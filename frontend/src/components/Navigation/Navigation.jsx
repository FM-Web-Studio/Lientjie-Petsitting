import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { logOut } from '../../firebase/auth.js';
import Skeleton from '../Skeleton';
import styles from './Navigation.module.css';

/*
 * Two navs from one list:
 *   - desktop: a floating top bar with every page, the theme switch and a Book button
 *   - phones:  a slim top bar (logo, theme) plus a bottom tab bar holding every
 *              page, where a thumb can reach it. No hidden burger menu - every
 *              page is always one tap away.
 */
export const NAV_LINKS = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/services', label: 'Services', icon: '🦴' },
  { to: '/gallery', label: 'Gallery', short: 'Photos', icon: '📸' },
  { to: '/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/about', label: 'About', icon: '👋' },
  { to: '/contact', label: 'Contact', icon: '💬' },
];

export default function Navigation() {
  const { isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { copy, loaded } = useContent();
  const brandName = copy('brand').brandName;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const themeLabel = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;

  return (
    <>
      <header className={`${styles.bar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={`container ${styles.inner}`}>
          <Link to="/" className={styles.logo} aria-label={`${brandName} - home`}>
            <img src="/logo.png" alt="" className={styles.logoImg} width="44" height="44" />
            {loaded
              ? <span className={styles.logoText}>{brandName}</span>
              : <Skeleton style={{ width: '9.5rem', height: '1.2rem' }} />}
          </Link>

          <nav className={styles.links} aria-label="Main">
            {NAV_LINKS.filter((l) => l.to !== '/contact').map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.actions}>
            {isAdmin && (
              <>
                <Link to="/admin" className={styles.adminChip}>⚙️ <span>Admin</span></Link>
                <button type="button" className={styles.signOut} onClick={() => logOut()}>Sign out</button>
              </>
            )}
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
            >
              <span className={styles.themeIcon} key={theme} aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
            </button>
            <Link to="/contact" className={`btn btn-primary btn-sm ${styles.bookBtn}`}>Book a sit 🐾</Link>
          </div>
        </div>
      </header>

      <nav className={styles.tabbar} aria-label="Main">
        {NAV_LINKS.map(({ to, label, short, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `${styles.tab} ${to === '/contact' ? styles.tabCta : ''} ${isActive ? styles.tabActive : ''}`}
          >
            <span className={styles.tabIcon} aria-hidden="true">{icon}</span>
            <span className={styles.tabLabel}>{short || label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
