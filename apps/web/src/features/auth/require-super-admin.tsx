import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './use-auth';

/** Route gate for Super Admin–only screens (ADR-039). */
export function RequireSuperAdmin() {
  const auth = useAuth();
  if (!auth.user?.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
