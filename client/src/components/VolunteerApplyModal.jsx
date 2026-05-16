import { useState } from 'react';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';

const GOOGLE_OAUTH_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID || true); // show always, error is graceful

export default function VolunteerApplyModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/applications', form);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Toaster position="top-center" />
      <div style={{
        background: '#111814', border: '1px solid #1e3a27', borderRadius: 18,
        padding: '2rem', width: '100%', maxWidth: 480,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>✅</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Application Submitted!</h2>
            <p style={{ color: '#6b8f74', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              An admin will review your application and create your volunteer account shortly.
            </p>
            <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.2rem' }}>🚴 Apply to Volunteer</h2>
                <p style={{ fontSize: '0.8rem', color: '#6b8f74' }}>An admin will review and create your account</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b8f74', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={set('name')} placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span style={{ color: '#6b8f74', fontSize: '0.78rem' }}>(optional)</span></label>
                <input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">Why do you want to volunteer? <span style={{ color: '#6b8f74', fontSize: '0.78rem' }}>(optional)</span></label>
                <textarea className="form-input" rows={3} value={form.message} onChange={set('message')} placeholder="Tell us a bit about yourself…" style={{ resize: 'vertical' }} />
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Submitting…' : '📋 Submit Application'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
