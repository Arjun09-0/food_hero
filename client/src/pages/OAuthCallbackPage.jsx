import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallbackPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    const name = params.get('name');

    if (!token || !role) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Store user in context (same shape as normal login)
    login({ token, role, name: decodeURIComponent(name || '') });

    // Redirect to dashboard
    navigate(`/${role}`);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#0a0f0d',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f0fdf4' }}>
        Signing you in with Google…
      </div>
      <div style={{
        width: 40, height: 4, background: 'linear-gradient(90deg, #16a34a, #22d3ee)',
        borderRadius: 2, marginTop: '1.2rem',
        animation: 'pulse 1.2s ease-in-out infinite',
      }} />
    </div>
  );
}
