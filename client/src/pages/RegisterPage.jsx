import { Navigate } from 'react-router-dom';
// Old /register redirects to new role-selection page
export default function RegisterPage() {
  return <Navigate to="/register" replace />;
}
