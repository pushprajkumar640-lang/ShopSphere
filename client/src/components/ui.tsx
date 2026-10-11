import type { ReactNode } from 'react';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-navy-100 border-t-brand" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto my-8 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-700">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-ghost">Try again</button>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-50 text-2xl" aria-hidden>📭</div>
      <h2 className="text-lg font-semibold text-navy-800">{title}</h2>
      {body && <p className="max-w-sm text-slate-500">{body}</p>}
      {action}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-1 text-sm" aria-label={`Rated ${rating} out of 5`}>
      <span className="text-amber-500" aria-hidden>{'★'.repeat(full)}<span className="text-slate-300">{'★'.repeat(5 - full)}</span></span>
      <span className="text-slate-500">{rating.toFixed(1)}</span>
    </span>
  );
}

export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}>{children}</main>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{message}</p>;
}
