import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from './cn';

export function Card({ as: As = 'section', className, padded = true, children, ...props }) {
  return (
    <As className={cn('rounded-lg border border-line bg-surface shadow-card', padded && 'p-5 sm:p-6', className)} {...props}>
      {children}
    </As>
  );
}

export function CardHeader({ title, description, actions, icon: Icon, className, titleId, as: Heading = 'h2' }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-text">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <Heading id={titleId} className="text-h2 font-semibold text-fg">{title}</Heading>
          {description && <p className="mt-0.5 text-small text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

const BADGE_TONES = {
  neutral: 'bg-subtle text-fg-2 ring-line',
  accent: 'bg-accent-soft text-accent-text ring-accent/20',
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/25',
  danger: 'bg-danger-soft text-danger ring-danger/20',
};
export function Badge({ tone = 'neutral', className, children, dot }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset whitespace-nowrap', BADGE_TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

const ALERT = {
  info: { cls: 'bg-accent-soft border-accent/25 text-fg', icon: Info, iconCls: 'text-accent-text' },
  success: { cls: 'bg-success-soft border-success/25 text-fg', icon: CheckCircle2, iconCls: 'text-success' },
  warning: { cls: 'bg-warning-soft border-warning/30 text-fg', icon: AlertTriangle, iconCls: 'text-warning' },
  danger: { cls: 'bg-danger-soft border-danger/25 text-fg', icon: XCircle, iconCls: 'text-danger' },
};
/** Inline message. Use tone="danger"/"warning" for problems; `action` renders on the right. */
export function Alert({ tone = 'info', title, children, action, className, role }) {
  const a = ALERT[tone];
  const Icon = a.icon;
  return (
    <div role={role || (tone === 'danger' || tone === 'warning' ? 'alert' : 'status')}
      className={cn('flex flex-col gap-3 rounded-md border p-3.5 sm:flex-row sm:items-center', a.cls, className)}>
      <div className="flex flex-1 items-start gap-2.5">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', a.iconCls)} aria-hidden="true" />
        <div className="text-small">
          {title && <p className="font-semibold text-fg">{title}</p>}
          {children && <div className={cn(title && 'mt-0.5', 'text-fg-2')}>{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:ml-2">{action}</div>}
    </div>
  );
}

/** Explains an empty area and offers the next step. */
export function EmptyState({ icon: Icon, title, description, actions, children, className }) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center px-4 py-12 text-center', className)}>
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-subtle text-fg-2">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-h2 font-semibold text-fg">{title}</h3>
      {description && <p className="mt-2 text-body text-muted">{description}</p>}
      {children}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton h-4', className)} aria-hidden="true" {...props} />;
}

/** Page title block used at the top of every app screen. */
export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-small font-medium text-accent-text">{eyebrow}</p>}
        <h1 className="text-h1 font-semibold text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-body text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Usage against a plan limit. `limit` null means unlimited. */
export function UsageMeter({ label, used = 0, limit, unlimitedLabel, className }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const near = limit && pct >= 80;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-small">
        <span className="text-fg-2">{label}</span>
        <span className="font-medium tabular-nums text-fg">{limit ? `${used} / ${limit}` : `${used} · ${unlimitedLabel}`}</span>
      </div>
      {limit ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label={label}
          aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(used, limit)}>
          <div className={cn('h-full rounded-full transition-[width] duration-300', near ? 'bg-warning' : 'bg-accent')} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export function Avatar({ name = '', src, size = 32, className }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
  return src ? (
    <img src={src} alt="" width={size} height={size} className={cn('rounded-full object-cover', className)} style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden="true" className={cn('inline-flex items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-text', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>
  );
}
