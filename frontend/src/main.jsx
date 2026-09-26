import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext';
import * as Sentry from '@sentry/react';

// Error reporting: active only when VITE_SENTRY_DSN is set at build time.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
  });
}

// Shown if the app crashes, instead of a blank screen.
const CrashScreen = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 24, textAlign: 'center' }}>
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
      <p style={{ color: '#64748b', marginBottom: 16 }}>Please reload the page. If it keeps happening, contact support@lunarbid.ai.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 18px', borderRadius: 10, background: '#4f46e5', color: '#fff', border: 0, cursor: 'pointer' }}>Reload</button>
    </div>
  </div>
);

// Optional: Read from localStorage to persist theme
const isDark = localStorage.getItem('theme') === 'dark';
if (isDark) document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<CrashScreen />}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
