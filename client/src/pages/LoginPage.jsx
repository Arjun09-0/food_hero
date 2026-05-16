import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.4 13.1 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.9 37.3 46.5 31.3 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.6 28.6A14.7 14.7 0 019.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A23.8 23.8 0 000 24c0 3.8.9 7.4 2.5 10.6l8.1-6z"/>
    <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.8 2.3-6.3 0-11.6-3.6-13.4-9l-8.1 6C6.7 42.6 14.7 48 24 48z"/>
  </svg>
);

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oauthError = params.get('error');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      toast.success(`Welcome back, ${data.name}! 👋`);
      setTimeout(() => navigate(`/${data.role}`), 400);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <Toaster position="top-center" />

      {/* Animated background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="stars" />
      </div>

      {/* Centered single-column card */}
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div className="slide-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="aurora-text float" style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
            🍱 FoodHero
          </div>
          <p style={{ color: '#7ba4c7', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Connecting surplus food with people who need it
          </p>
        </div>

        {/* Card with spinning glow border */}
        <div className="card-glow-border glow-pulse slide-up" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
          <div className="card-glow-border-inner">

            {oauthError && (
              <div className="notice-red" style={{ marginBottom: '1.2rem' }}>
                ⚠️ Google sign-in failed. Please try again or use email.
              </div>
            )}

            {/* Google OAuth — prominent */}
            <button
              className="btn-google shimmer-btn"
              onClick={() => window.location.href = 'http://localhost:5001/auth/google'}
            >
              {GOOGLE_SVG} Continue with Google
            </button>

            <div className="divider-text" style={{ margin: '1.3rem 0' }}>or sign in with email</div>

            {/* Email / password */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.9rem', top: '2.35rem', background: 'none', border: 'none', color: '#7ba4c7', cursor: 'pointer', padding: 0 }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <button
                className="btn btn-primary btn-lg shimmer-btn"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.3rem', fontSize: '0.85rem', color: '#7ba4c7' }}>
              New here?{' '}
              <Link to="/register" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
