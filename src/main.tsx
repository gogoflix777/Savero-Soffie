import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for instant offline loading, caching, and background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Automatically check for new updates
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('[SW] Service worker registration failed:', err);
      });
  });
}
