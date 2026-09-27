import React, { useRef } from 'react';
import { cn } from './cn';

/**
 * Single-choice control rendered as a radio group (arrow keys move the selection).
 * options: [{ value, label, description? }]
 */
export function Segmented({ label, value, onChange, options, className, size = 'md', describedBy }) {
  const refs = useRef([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const move = (delta) => {
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} aria-describedby={describedBy}
      className={cn('inline-flex w-full rounded-md border border-line bg-subtle p-0.5', className)}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button key={o.value} ref={(el) => (refs.current[i] = el)} type="button" role="radio" aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
            }}
            className={cn('flex-1 rounded-[5px] px-3 font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 text-caption' : 'h-8 text-small',
              selected ? 'bg-surface text-fg shadow-xs ring-1 ring-line' : 'text-muted hover:text-fg')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
