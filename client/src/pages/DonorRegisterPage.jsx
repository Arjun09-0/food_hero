import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import toast, { Toaster } from 'react-hot-toast';

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.4 13.1 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.9 37.3 46.5 31.3 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.6 28.6A14.7 14.7 0 019.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A23.8 23.8 0 000 24c0 3.8.9 7.4 2.5 10.6l8.1-6z"/>
    <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.8 2.3-6.3 0-11.6-3.6-13.4-9l-8.1 6C6.7 42.6 14.7 48 24 48z"/>
  </svg>
);

export default function DonorRegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', location: null });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const handleMapSelect = ({ lat, lng }) =>
    setForm((p) => ({ ...p, location: { lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location) return toast.error('Please click the map to set your location');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { ...form, role: 'donor' });
      login(data);
      toast.success('Welcome to FoodHero! 🎉');
      setTimeout(() => navigate('/donor'), 400);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <Toaster position="top-center" />
      <div className="auth-card fade-in" style={{ maxWidth: 520 }}>

        {/* Back */}
        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#6b8f74', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
          ← Back to roles
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🍲</div>
          <div>
            <div className="auth-logo" style={{ fontSize: '1.5rem', marginBottom: 0, background: 'linear-gradient(135deg, #38bdf8, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Food Donor</div>
            <p style={{ color: '#6b8f74', fontSize: '0.83rem' }}>Create your donor account</p>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '1.2rem 0' }} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="Raj Sharma" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone <span style={{ color: '#4a7a54', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required minLength={6} />
          </div>

          <div className="form-group">
            <label className="form-label">Your Location {form.location && '✅'}</label>
            <p style={{ fontSize: '0.78rem', color: '#4a7a54', marginBottom: '0.5rem' }}>Click the map to set your pin — volunteers will be matched by proximity</p>
            <div style={{ height: 220, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <MapPicker onSelect={handleMapSelect} />
            </div>
            {form.location && (
              <div style={{ fontSize: '0.78rem', color: '#7dd3fc', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                📍 {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Creating account…' : '🍲 Create Donor Account →'}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-text" style={{ margin: '1.5rem 0' }}>or continue with</div>

        <button className="btn-google" onClick={() => window.location.href = '/auth/google'}>
          {GOOGLE_SVG} Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#7ba4c7', marginTop: '1.2rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
