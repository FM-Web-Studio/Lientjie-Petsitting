import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ContentProvider } from './context/ContentContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Toast from './components/Toast';
import BackToTop from './components/BackToTop';
import PageSkeleton from './components/PageSkeleton';
import ScrollProgress from './components/ScrollProgress';
import PawBurst from './components/PawBurst';
import useMomentumScroll, { getLenis } from './hooks/useMomentumScroll.js';
import { Home, Services, Gallery, Reviews, Contact, Bio, Admin, NotFound, Privacy, Terms } from './pages';
import styles from './App.module.css';

// Public site chrome - nav + footer. The admin panel is standalone (no chrome),
// and momentum scrolling is only mounted here so admin keeps native scrolling.
function PublicLayout() {
  useMomentumScroll();
  const { pathname, search } = useLocation();

  // A new page starts at the top, not wherever the last page was scrolled to.
  useEffect(() => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, search]);

  return (
    <div className={styles.layout}>
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollProgress />
      <Navigation />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
      </main>
      <Footer />
      <BackToTop />
      <PawBurst />
    </div>
  );
}

/*
 * /admin for anyone who is not a signed-in admin: the ordinary 404 page, exactly
 * what any made-up address shows, so nothing hints that an admin area exists.
 * While sign-in is still being checked it shows the normal page skeleton, so an
 * admin reloading the panel does not see a 404 flash first.
 * (The real lock is firestore.rules - this only keeps the door out of sight.)
 */
function HiddenAdmin() {
  const { loading } = useAuth();
  return loading ? <PageSkeleton /> : <NotFound />;
}

function AppRoutes() {
  const { isAdmin } = useAuth();
  return (
    <Routes>
      {/* Admin - standalone, no public nav/footer, and only routed at all for an admin */}
      {isAdmin && (
        <Route path="/admin" element={<Suspense fallback={<PageSkeleton variant="admin" />}><Admin /></Suspense>} />
      )}

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<Bio />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {!isAdmin && <Route path="/admin" element={<HiddenAdmin />} />}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ContentProvider>
            <DataProvider>
              <BrowserRouter>
                <AppRoutes />
                <Toast />
              </BrowserRouter>
            </DataProvider>
          </ContentProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
