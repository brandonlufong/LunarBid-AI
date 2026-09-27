import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: focus moves inside on open, Tab cycles within, Escape and the
 * backdrop close it, and focus returns to the element that opened it.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', initialFocusRef }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const first = initialFocusRef?.current || panel?.querySelector(FOCUSABLE);
    (first || panel)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); }
      if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)];
        if (!items.length) return;
        const [firstEl, lastEl] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="animate-fade absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn('animate-pop relative flex max-h-[92vh] w-full flex-col rounded-t-xl border border-line bg-surface shadow-modal sm:rounded-xl', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="text-h2 font-semibold text-fg">{title}</h2>
            {description && <p id={descId} className="mt-0.5 text-small text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" title="Close"
            className="-mr-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-fg">
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3.5 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
