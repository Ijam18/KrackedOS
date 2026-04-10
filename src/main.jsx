import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';
import './index.css';

const isElectronRuntime = typeof window !== 'undefined' && Boolean(window.krackedOS);

if (import.meta.env.DEV) {
  import('react-grab');
  import('react-grab/dist/styles.css');
}

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {});
    });
  });

  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key).catch(() => {});
      });
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {!isElectronRuntime ? <Analytics /> : null}
  </React.StrictMode>
);

// Keep the service worker out of dev so Vite HMR and React refresh stay clean.
if (import.meta.env.PROD && !isElectronRuntime && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
  });
}
