import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; message: string }
interface ToastApi { show: (message: string, kind?: ToastKind) => void }

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  const colors: Record<ToastKind, string> = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-navy-700',
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(90vw,360px)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`animate-slideIn pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${colors[t.kind]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
