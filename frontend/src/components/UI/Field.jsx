import React, { cloneElement, isValidElement, useId } from 'react';
import { cn } from './cn';

export const controlClass = cn(
  'w-full rounded-md border border-line-strong bg-surface px-3 text-body text-fg shadow-xs',
  'placeholder:text-muted transition-colors duration-150',
  'hover:border-muted focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20',
  'disabled:bg-subtle disabled:text-muted aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20'
);

/**
 * Labelled form field. Wires the label, hint, error and counter to the single child control
 * (id, aria-describedby, aria-invalid, required) so every field is accessible by default.
 */
export function Field({ label, hint, error, required, optional, counter, className, children, id: idProp, labelAction }) {
  const autoId = useId();
  const id = idProp || children?.props?.id || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required: children.props.required ?? required })
    : children;
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-small font-medium text-fg">
            {label}
            {required && <span className="text-danger" aria-hidden="true"> *</span>}
            {optional && <span className="ml-1.5 font-normal text-muted">{optional}</span>}
          </label>
          {labelAction}
        </div>
      )}
      {control}
      {(hint || counter) && !error && (
        <div className="flex justify-between gap-3 text-caption text-muted">
          <span id={hintId}>{hint}</span>
          {counter && <span aria-live="polite">{counter}</span>}
        </div>
      )}
      {error && <p id={errorId} role="alert" className="text-caption text-danger">{error}</p>}
    </div>
  );
}

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClass, 'h-10', className)} {...props} />;
});

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlClass, 'min-h-28 py-2.5 leading-relaxed resize-y', className)} {...props} />;
});

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(controlClass, 'h-10 pr-8 appearance-none bg-no-repeat bg-[right_0.6rem_center] bg-[length:1rem]', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23667085'%3E%3Cpath d='M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z'/%3E%3C/svg%3E\")" }}
      {...props}>
      {children}
    </select>
  );
});
