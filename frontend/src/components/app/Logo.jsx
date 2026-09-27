import React from 'react';
import { cn } from '../ui/cn';

/** LunarBid mark: a crescent with a small moonlight-gold star, on the brand indigo. */
export function LogoMark({ size = 28, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={cn('shrink-0', className)}>
      <rect width="64" height="64" rx="15" fill="#4f46e5" />
      <path d="M40 15a17.5 17.5 0 1 0 10.5 28A14.5 14.5 0 0 1 40 15z" fill="#fff" />
      <circle cx="47.5" cy="17.5" r="3.5" fill="#f5b544" />
    </svg>
  );
}

export function Logo({ className, size = 28, product = 'LunarBid' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span className="text-[1.0625rem] font-semibold tracking-tight text-fg">{product}</span>
    </span>
  );
}
