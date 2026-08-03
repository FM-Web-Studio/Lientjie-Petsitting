import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { signInWithGoogle, logOut } from '../../firebase/auth.js';
import AboutSection from './sections/AboutSection.jsx';
import ContactInfoSection from './sections/ContactInfoSection.jsx';
import SiteCopySection from './sections/SiteCopySection.jsx';
import ServicesSection from './sections/ServicesSection.jsx';
import GallerySection from './sections/GallerySection.jsx';
import MessagesSection from './sections/MessagesSection.jsx';
import ReviewsSection from './sections/ReviewsSection.jsx';
import styles from './Admin.module.css';
import '../../styles/admin.css';

const GROUPS = ['Identity', 'Content', 'Gallery', 'Inbox'];

const SECTIONS = [
  { id: 'about',    group: 'Identity', title: 'About / Bio',   icon: '👤' },
  { id: 'contact',  group: 'Identity', title: 'Contact Info',  icon: '📇' },
  { id: 'copy',     group: 'Content',  title: 'Site Copy',     icon: '📝' },
  { id: 'services', group: 'Content',  title: 'Services',      icon: '🐾' },
  { id: 'gallery',  group: 'Gallery',  title: 'Gallery Posts', icon: '📸' },
  { id: 'messages', group: 'Inbox',    title: 'Messages',      icon: '💬' },
  { id: 'reviews',  group: 'Inbox',    title: 'Reviews',       icon: '⭐' },
];

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { addToast } = useToast();
  const { reload: reloadPublicData } = useData();
  const navigate = useNavigate();

  /*
   * The public pages read from a shared cache that is loaded once per session,
   * so an admin who saves a change and clicks straight through to the site would
   * otherwise be shown the data from before the edit. Refresh it on the way out.
   */
  const viewSite = () => { reloadPublicData(); navigate('/'); };
  const [view, setView] = useState('about');
  const [signingIn, setSigningIn] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const openSection = (id) => { setView(id); setNavOpen(false); };

  const handleSignIn = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); }
    catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') addToast('Sign-in failed. Please try again.', 'error');
    } finally { setSigningIn(false); }
  };

  const handleSignOut = async () => {
    try { await logOut(); } catch { addToast('Sign-out failed.', 'error'); }
  };

  if (loading) {
    return (
      <div className={`admin-scope ${styles.page}`}>
        <div className={styles.authScreen}><div className={styles.spinner} /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`admin-scope ${styles.page}`}>
        <div className={styles.authScreen}>
          <div className={styles.authCard}>
            <span className={styles.authIcon}>🐾</span>
            <h2 className={styles.authTitle}>Petsitting Admin</h2>
            <p className={styles.authSub}>Sign in with your Google account to continue.</p>
            <button className="btn btn-primary" onClick={handleSignIn} disabled={signingIn}>
              {signingIn ? 'Signing in…' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={`admin-scope ${styles.page}`}>
        <div className={styles.authScreen}>
          <div className={styles.authCard}>
            <p className={styles.notAllowed}>Access denied.</p>
            <p className={styles.authSub}>{user.email} is not on the admin list.</p>
            <button className="btn btn-secondary" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  const activeSection = SECTIONS.find((s) => s.id === view) ?? SECTIONS[0];

  const renderSection = () => {
    switch (view) {
      case 'about':    return <AboutSection />;
      case 'contact':  return <ContactInfoSection />;
      case 'copy':     return <SiteCopySection />;
      case 'services': return <ServicesSection />;
      case 'gallery':  return <GallerySection />;
      case 'messages': return <MessagesSection />;
      case 'reviews':  return <ReviewsSection />;
      default:         return null;
    }
  };

  return (
    <div className={`admin-scope ${styles.page}`}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button type="button" className={styles.menuBtn} onClick={() => setNavOpen(true)} aria-label="Open sections menu">☰</button>
          <span className={styles.topbarIcon}>🐾</span>
          <span className={styles.topbarTitle}>Petsitting Admin</span>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.userEmail}>{user.email}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={viewSite}>View site</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      <div className={styles.shell}>
        {navOpen && <div className={styles.navBackdrop} onClick={() => setNavOpen(false)} aria-hidden="true" />}
        <aside className={[styles.nav, navOpen ? styles.navOpen : ''].join(' ')} aria-label="Sections">
          {GROUPS.map((group) => (
            <div key={group} className={styles.navGroup}>
              <p className={styles.navGroupLabel}>{group}</p>
              {SECTIONS.filter((s) => s.group === group).map((s) => {
                const active = s.id === view;
                return (
                  <div key={s.id} className={[styles.navItem, active ? styles.navItemActive : ''].join(' ')}>
                    <button
                      type="button"
                      className={styles.navItemBtn}
                      onClick={() => openSection(s.id)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className={styles.navIcon} aria-hidden="true">{s.icon}</span>
                      <span className={styles.navLabel}>{s.title}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </aside>

        <main className={styles.content}>
          <h2 className={styles.sectionTitle}>{activeSection.title}</h2>
          <div key={view} className={styles.sectionBody}>
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
