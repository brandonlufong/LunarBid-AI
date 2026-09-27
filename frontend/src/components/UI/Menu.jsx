import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from './cn';

/**
 * Dropdown menu. `trigger` receives props to spread on the trigger button.
 * items: [{ label, icon, onSelect, danger?, disabled? } | 'separator']
 * side: 'auto' (default) opens downward, or upward when there isn't room below — e.g. the
 * account menu at the bottom of the desktop sidebar.
 */
export function Menu({ trigger, items, align = 'end', side = 'auto', className }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState('bottom');
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    itemRefs.current.find(Boolean)?.focus();
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Measure before paint so the menu never flashes off-screen.
  useLayoutEffect(() => {
    if (!open || side !== 'auto') return;
    const trigger = rootRef.current?.getBoundingClientRect();
    const menu = menuRef.current?.getBoundingClientRect();
    if (!trigger || !menu) return;
    const below = window.innerHeight - trigger.bottom;
    const above = trigger.top;
    setPlacement(below < menu.height + 12 && above > below ? 'top' : 'bottom'); // eslint-disable-line react-hooks/set-state-in-effect
  }, [open, side]);
  const up = side === 'top' || (side === 'auto' && placement === 'top');

  const real = items.filter((i) => i !== 'separator');
  const onKey = (e) => {
    const els = itemRefs.current.filter(Boolean);
    const at = els.indexOf(document.activeElement);
    if (e.key === 'Escape') { setOpen(false); rootRef.current?.querySelector('[aria-haspopup]')?.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); els[(at + 1) % els.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); els[(at - 1 + els.length) % els.length]?.focus(); }
    if (e.key === 'Tab') setOpen(false);
  };

  // Index of each actionable item (separators excluded), computed up front for keyboard focus.
  const indexed = items.map((item, i) => ({ item, i, idx: items.slice(0, i).filter((x) => x !== 'separator').length }));
  return (
    <div ref={rootRef} className={cn('relative inline-block', className)} onKeyDown={onKey}>
      {trigger({ 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': open ? menuId : undefined, onClick: () => setOpen((v) => !v) })}
      {open && (
        <div id={menuId} ref={menuRef} role="menu"
          className={cn('animate-pop absolute z-50 min-w-48 rounded-md border border-line bg-surface p-1 shadow-pop',
            up ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            align === 'end' ? 'right-0' : 'left-0')}>
          {indexed.map(({ item, i, idx }) => {
            if (item === 'separator') return <div key={`s${i}`} className="my-1 h-px bg-line" role="separator" />;
            const Icon = item.icon;
            return (
              <button key={item.label} ref={(el) => (itemRefs.current[idx] = el)} type="button" role="menuitem"
                disabled={item.disabled}
                onClick={() => { setOpen(false); item.onSelect?.(); }}
                className={cn('flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left text-small outline-none',
                  'hover:bg-subtle focus-visible:bg-subtle disabled:opacity-50',
                  item.danger ? 'text-danger' : 'text-fg')}>
                {Icon && <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
                <span className="flex-1">{item.label}</span>
                {item.hint && <span className="text-caption text-muted">{item.hint}</span>}
              </button>
            );
          })}
          {real.length === 0 && <p className="px-2.5 py-2 text-small text-muted">—</p>}
        </div>
      )}
    </div>
  );
}
