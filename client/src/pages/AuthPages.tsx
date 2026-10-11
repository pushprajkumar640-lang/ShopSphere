import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FieldError, PageContainer } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../services/api';
import { validateRegister } from '../utils/validation';

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <PageContainer className="flex max-w-md items-center">
      <div className="card w-full p-8">
        <h1 className="text-2xl font-extrabold text-navy-800">{title}</h1>
        <p className="mb-6 mt-1 text-slate-500">{subtitle}</p>
        {children}
        <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
      </div>
    </PageContainer>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || '/account';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const v: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) v.email = 'Enter a valid email';
    if (!password) v.password = 'Password is required';
    setErrors(v);
    if (Object.keys(v).length) return;

    setBusy(true);
    try {
      await login(email, password);
      toast.show('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setFormError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Access your orders and account." footer={<>New to ShopSphere? <Link className="font-semibold text-brand hover:underline" to="/register">Create an account</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} />
          <FieldError message={errors.email} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className={`input ${errors.password ? 'input-error' : ''}`} value={password} onChange={(e) => setPassword(e.target.value)} />
          <FieldError message={errors.password} />
        </div>
        {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const v = validateRegister(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.show('Account created. Welcome to ShopSphere!');
      navigate('/account', { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      setErrors((prev) => ({ ...prev, ...apiErr.fieldErrors }));
      setFormError(apiErr.message);
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof typeof form, label: string, type = 'text', autoComplete?: string) => (
    <div>
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} type={type} autoComplete={autoComplete} className={`input ${errors[k] ? 'input-error' : ''}`} value={form[k]} onChange={set(k)} />
      <FieldError message={errors[k]} />
    </div>
  );

  return (
    <AuthShell title="Create account" subtitle="It takes less than a minute." footer={<>Already have an account? <Link className="font-semibold text-brand hover:underline" to="/login">Sign in</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {field('name', 'Full name', 'text', 'name')}
        {field('email', 'Email', 'email', 'email')}
        {field('password', 'Password (min 8 chars, letters + numbers)', 'password', 'new-password')}
        {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
