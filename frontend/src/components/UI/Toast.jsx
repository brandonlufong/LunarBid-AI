// src/components/UI/Toast.jsx
// Lightweight, themed, animated toast system. Replaces window.alert().
// Usage:  const toast = useToast();  toast.success('Saved!');  toast.error('Oops');
import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

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

const STYLES = {
  success: 'border-green-500/40 bg-green-50 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  error: 'border-red-500/40 bg-red-50 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  info: 'border-indigo-500/40 bg-indigo-50 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
};

const ICON_COLOR = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-indigo-500',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

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
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
            <AnimatePresence>
              {toasts.map((t) => {
                const Icon = ICONS[t.type] || Info;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`pointer-events-auto w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 shadow-xl backdrop-blur-sm ${STYLES[t.type] || STYLES.info}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ICON_COLOR[t.type] || ICON_COLOR.info}`} />
                    <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
                    <button onClick={() => remove(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
