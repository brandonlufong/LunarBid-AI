import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/newsreader/wght.css'
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

// After an update, an open tab may request page files (chunks) that no longer exist.
// Reload once to pick up the new version instead of showing the crash screen.
const isStaleChunk = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    String(error?.message || error)
  );

function reloadOnceForStaleChunk(error) {
  if (!isStaleChunk(error)) return false;
  const key = 'lunarbid-chunk-reload';
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last < 30000) return false; // already tried: show the crash screen
  sessionStorage.setItem(key, String(Date.now()));
  window.location.reload();
  return true;
}
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForStaleChunk(event.payload)) event.preventDefault();
});

// Shown if the app crashes, instead of a blank screen. It shows what failed and where,
// so the problem can be reported precisely.
const CrashScreen = ({ error }) => {
  const details = `${error?.name || 'Error'}: ${error?.message || String(error)}\nPage: ${window.location.pathname}${window.location.search}\nTime: ${new Date().toISOString()}`;
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 24, background: '#0b1020', color: '#e2e8f0' }}>
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, marginBottom: 8, color: '#fff' }}>Something went wrong</h1>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>Please reload the page. If it keeps happening, send the details below to support@lunarbid.ai.</p>
        <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#131a2e', border: '1px solid #1e293b', borderRadius: 10, padding: 12, fontSize: 12, color: '#cbd5e1' }}>{details}</pre>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 18px', borderRadius: 10, background: '#4f46e5', color: '#fff', border: 0, cursor: 'pointer' }}>Reload</button>
          <button onClick={() => navigator.clipboard?.writeText(details)} style={{ padding: '10px 18px', borderRadius: 10, background: 'transparent', color: '#e2e8f0', border: '1px solid #334155', cursor: 'pointer' }}>Copy details</button>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error }) => <CrashScreen error={error} />}
      onError={(error) => {
        console.error('LunarBid crashed:', error);
        reloadOnceForStaleChunk(error);
      }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
