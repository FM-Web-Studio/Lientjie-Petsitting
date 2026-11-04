import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { signInWithGoogle, logOut } from '../../firebase/auth.js';
import { getMessages } from '../../firebase/contact.js';
import { getAllReviews, getAllCommentsFlat } from '../../firebase/reviews.js';
import OverviewSection from './sections/OverviewSection';
import PageSkeleton from '../../components/PageSkeleton';
import AboutSection from './sections/AboutSection';
import ContactInfoSection from './sections/ContactInfoSection';
import SiteCopySection from './sections/SiteCopySection';
import ServicesSection from './sections/ServicesSection';
import GallerySection from './sections/GallerySection';
import MessagesSection from './sections/MessagesSection';
import ReviewsSection from './sections/ReviewsSection';
import styles from './Admin.module.css';
import '../../styles/admin.css';

const GROUPS = ['Home', 'Inbox', 'Content', 'Gallery', 'Identity'];

// Signed out after this long with no clicks, typing or scrolling.
const IDLE_LIMIT_MS = 30 * 60 * 1000;
const IDLE_WARN_MS = IDLE_LIMIT_MS - 60 * 1000;

const SECTIONS = [
  { id: 'overview', group: 'Home',     title: 'Overview',      icon: '🏡' },
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
  const [view, setView] = useState('overview');
  const [counts, setCounts] = useState({ unread: 0, pendingReviews: 0, pendingComments: 0 });
  const [countsLoading, setCountsLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const openSection = (id) => { setView(id); setNavOpen(false); };

  // What is waiting: unread messages and anything not yet approved. Re-read on every
  // section change, so the badges clear as soon as items are dealt with.
  const refreshCounts = useCallback(async () => {
    try {
      const [messages, reviews, comments] = await Promise.all([getMessages(), getAllReviews(), getAllCommentsFlat()]);
      setCounts({
        unread: messages.filter((m) => !m.read).length,
        pendingReviews: reviews.filter((r) => !r.approved).length,
        pendingComments: comments.filter((c) => !c.approved).length,
      });
    } catch (err) {
      console.error('Could not load admin counts:', err);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) refreshCounts(); }, [isAdmin, view, refreshCounts]);

  /*
   * Idle sign-out. Sign-in already ends when the browser closes (firebase/auth.js);
   * this also closes the panel on a computer left unattended while it is still open.
   */
  const lastActive = useRef(Date.now());
  const warned = useRef(false);
  useEffect(() => {
    if (!isAdmin) return undefined;
    const bump = () => { lastActive.current = Date.now(); warned.current = false; };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    bump();
    const timer = setInterval(() => {
      const idle = Date.now() - lastActive.current;
      if (idle >= IDLE_LIMIT_MS) {
        logOut().finally(() => {
          navigate('/');
          addToast('You were signed out after 30 minutes without activity.', 'info', 8000);
        });
      } else if (idle >= IDLE_WARN_MS && !warned.current) {
        warned.current = true;
        addToast('Still there? You will be signed out in a minute unless you click or type something.', 'warning', 15000);
      }
    }, 15000);
    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [isAdmin, addToast, navigate]);

  const badgeFor = (id) => {
    if (id === 'messages') return counts.unread;
    if (id === 'reviews') return counts.pendingReviews + counts.pendingComments;
    return 0;
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); }
    catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') addToast('Sign-in failed. Please try again.', 'error');
    } finally { setSigningIn(false); }
  };

  // Signing out leaves the panel for the home page; staying on /admin would show the 404.
  const handleSignOut = async () => {
    try { await logOut(); navigate('/'); } catch { addToast('Sign-out failed.', 'error'); }
  };

  if (loading) return <PageSkeleton variant="admin" />;

  if (!user) {
    return (
      <div className={`admin-scope ${styles.page}`}>
        <div className={styles.authScreen}>
          <div className={styles.authCard}>
            <span className={styles.authIcon}>🐾</span>
            <h2 className={styles.authTitle}>Petsitting Admin</h2>
            <p className={styles.authSub}>Sign in with the Google account on the admin list. Other accounts cannot see or change anything.</p>
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
            <span className={styles.authIcon}>🔒</span>
            <p className={styles.notAllowed}>This area is private.</p>
            <p className={styles.authSub}>
              {user.email} is not on the admin list{user.emailVerified ? '' : ', and its email address is not verified'}.
            </p>
            <button className="btn btn-secondary" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  const activeSection = SECTIONS.find((s) => s.id === view) ?? SECTIONS[0];

  const renderSection = () => {
    switch (view) {
      case 'overview': return <OverviewSection counts={counts} loading={countsLoading} onOpen={openSection} />;
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
                      {badgeFor(s.id) > 0 && (
                        <span className={styles.navBadge} aria-label={`${badgeFor(s.id)} waiting`}>{badgeFor(s.id)}</span>
                      )}
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
