// src/components/UI/Toast.jsx
// Lightweight, themed, animated toast system. Replaces window.alert().
// Usage:  const toast = useToast();  toast.success('Saved!');  toast.error('Oops');
import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext.jsx';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft so a missing provider never crashes the app.
    return { success: () => {}, error: () => {}, info: () => {}, show: () => {} };
  }
  return ctx;
};

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ICON_COLOR = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-accent-text',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { t: translate } = useLanguage();

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration) setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const api = {
    show,
    success: (m, d) => show(m, 'success', d),
    error: (m, d) => show(m, 'error', d),
    info: (m, d) => show(m, 'info', d),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div role="status" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
            <>
              {toasts.map((t) => {
                const Icon = ICONS[t.type] || Info;
                return (
                  <div key={t.id} className="animate-pop pointer-events-auto w-full flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-fg shadow-pop"
                  >
                    <Icon aria-hidden="true" className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ICON_COLOR[t.type] || ICON_COLOR.info}`} />
                    <p className="flex-1 text-body leading-snug">{t.message}</p>
                    <button aria-label={translate('a11y.dismiss')} onClick={() => remove(t.id)} className="flex-shrink-0 rounded text-muted hover:text-fg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
