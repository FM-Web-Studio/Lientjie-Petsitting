import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ContentProvider } from './context/ContentContext.jsx';
import Navigation from './components/Navigation/Navigation.jsx';
import Footer from './components/Footer/Footer.jsx';
import Toast from './components/Toast/Toast.jsx';
import useMomentumScroll from './hooks/useMomentumScroll.js';
import { Home, Services, Gallery, Contact, Bio, Admin, NotFound } from './pages/index.js';
import styles from './App.module.css';

// Public site chrome - nav + footer. The admin panel is standalone (no chrome),
// and momentum scrolling is only mounted here so admin keeps native scrolling.
function PublicLayout() {
  useMomentumScroll();
  return (
    <div className={styles.layout}>
      <Navigation />
      <main className={styles.main}><Outlet /></main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ContentProvider>
            <BrowserRouter>
              <Routes>
                {/* Admin - standalone, self-gating, no public nav/footer */}
                <Route path="/admin" element={<Admin />} />

                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about" element={<Bio />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
              <Toast />
            </BrowserRouter>
          </ContentProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
