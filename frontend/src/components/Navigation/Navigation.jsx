import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { logOut } from '../../firebase/auth.js';
import styles from './Navigation.module.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navigation() {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>

        <Link to="/" className={styles.logo} onClick={close}>
          <span className={styles.pawIcon}>🐾</span>
          <span className={styles.logoText}>Lientjie's <span>Petsitting</span></span>
        </Link>

        <div className={styles.rightGroup}>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className={styles.themeIcon}>{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          <button
            className={`${styles.burger} ${menuOpen ? styles.open : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        <div className={`${styles.links} ${menuOpen ? styles.mobileOpen : ''}`}>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              onClick={close}
            >
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <NavLink
                to="/admin"
                className={({ isActive }) => `${styles.link} ${styles.adminLink} ${isActive ? styles.active : ''}`}
                onClick={close}
              >
                Admin
              </NavLink>
              <button
                className={`${styles.link} ${styles.logoutBtn}`}
                onClick={() => { logOut(); close(); }}
              >
                Sign Out
              </button>
            </>
          )}
        </div>

      </div>

      {menuOpen && <div className={styles.backdrop} onClick={close} />}
    </nav>
  );
}
