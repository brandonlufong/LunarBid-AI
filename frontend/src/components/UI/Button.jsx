import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

const VARIANTS = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-xs',
  secondary: 'bg-surface text-fg border border-line-strong hover:bg-subtle shadow-xs',
  ghost: 'text-fg-2 hover:bg-subtle hover:text-fg',
  danger: 'bg-danger text-white hover:opacity-90 shadow-xs',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
  link: 'text-accent-text hover:underline underline-offset-4 px-0 h-auto',
};
const SIZES = {
  sm: 'h-8 px-3 text-small gap-1.5 rounded-md',
  md: 'h-10 px-4 text-body gap-2 rounded-md',
  lg: 'h-11 px-5 text-body-lg gap-2 rounded-lg',
};

/**
 * Button. `as` renders another element (e.g. react-router Link) with button styling.
 * `loading` shows a spinner and disables the button; `leftIcon`/`rightIcon` take icon components.
 */
export const Button = forwardRef(function Button(
  { as: As = 'button', variant = 'primary', size = 'md', loading = false, leftIcon: Left, rightIcon: Right,
    className, children, disabled, type, ...props },
  ref
) {
  const isButton = As === 'button';
  return (
    <As
      ref={ref}
      type={isButton ? type || 'button' : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-colors duration-150',
        'disabled:opacity-55 disabled:cursor-not-allowed aria-disabled:opacity-55',
        VARIANTS[variant], variant !== 'link' && SIZES[size], className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Left && <Left className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {children}
      {Right && !loading && <Right className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </As>
  );
});

/** Icon-only button. `label` is required: it becomes the accessible name and tooltip. */
export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', className, ...props }, ref
) {
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn('inline-flex items-center justify-center rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant], dims, className)}
      {...props}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
});
