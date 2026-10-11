import { Link } from 'react-router-dom';
import { PageContainer } from '../components/ui';

export default function NotFoundPage() {
  return (
    <PageContainer className="text-center">
      <p className="text-7xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold text-navy-800">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="btn-primary mt-8">Back to home</Link>
    </PageContainer>
  );
}
