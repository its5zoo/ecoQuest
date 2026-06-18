import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const html = document.documentElement;
    const originalScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, behavior: 'auto' });

    const restoreTimer = setTimeout(() => {
      html.style.scrollBehavior = originalScrollBehavior;
    }, 0);

    return () => clearTimeout(restoreTimer);
  }, [pathname]);

  const hideFooter = pathname === '/news';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content" style={{ flex: 1, paddingTop: '70px' }}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
