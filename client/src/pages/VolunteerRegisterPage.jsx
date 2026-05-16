import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.4 13.1 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.9 37.3 46.5 31.3 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.6 28.6A14.7 14.7 0 019.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A23.8 23.8 0 000 24c0 3.8.9 7.4 2.5 10.6l8.1-6z"/>
    <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.8 2.3-6.3 0-11.6-3.6-13.4-9l-8.1 6C6.7 42.6 14.7 48 24 48z"/>
  </svg>
);

const steps = ['Your Info', 'Message', 'Submitted'];

export default function VolunteerRegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/applications', form);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <Toaster position="top-center" />
      <div className="auth-card fade-in" style={{ maxWidth: 500 }}>

        {/* Back */}
        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#6b8f74', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
          ← Back to roles
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🚴</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 0 }}>
              Volunteer Application
            </div>
            <p style={{ color: '#6b8f74', fontSize: '0.83rem' }}>Admin will review and create your account</p>
          </div>
        </div>

        {/* Step indicator */}
        {step < 2 && (
          <div style={{ display: 'flex', gap: '0.5rem', margin: '1.2rem 0', alignItems: 'center' }}>
            {steps.slice(0, 2).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: i < 1 ? 'none' : 1 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800,
                  background: i <= step ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'var(--border)',
                  color: i <= step ? '#000' : '#6b8f74',
                  transition: 'all 0.3s',
                }}>{i + 1}</div>
                <span style={{ fontSize: '0.75rem', color: i === step ? '#f59e0b' : '#6b8f74', fontWeight: i === step ? 700 : 400 }}>{s}</span>
                {i < 1 && <div style={{ flex: 1, height: 1, background: step > i ? '#818cf8' : 'var(--border)', marginLeft: '0.4rem', transition: 'background 0.3s' }} />}
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 1, background: 'var(--border)', marginBottom: '1.2rem' }} />

        {/* Step 2: Success */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }} className="fade-in">
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', fontFamily: "'Outfit', sans-serif", marginBottom: '0.6rem' }}>Application Submitted!</div>
            <p style={{ color: '#6b8f74', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              An admin will review your application and create your volunteer account. You'll receive an email with login credentials once approved.
            </p>
            <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 14, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.83rem', color: '#a5b4fc' }}>
              💡 In the meantime, you can sign in with Google once your account is created using the same email address.
            </div>
            <Link to="/login" className="btn btn-accent btn-lg" style={{ width: '100%' }}>
              Go to Sign In →
            </Link>
          </div>
        )}

        {/* Step 0: Info */}
        {step === 0 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(1); }} className="fade-in">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={set('name')} placeholder="Your name" required />
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
            <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%' }}>
              Next: Tell us about yourself →
            </button>
          </form>
        )}

        {/* Step 1: Message */}
        {step === 1 && (
          <form onSubmit={submit} className="fade-in">
            <div className="form-group">
              <label className="form-label">Why do you want to volunteer?</label>
              <textarea className="form-input" rows={4} value={form.message} onChange={set('message')}
                placeholder="Tell us a bit about yourself, your availability, and why you'd like to volunteer with FoodHero..." />
            </div>

            {/* Preview */}
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '0.9rem', marginBottom: '1.2rem', fontSize: '0.82rem' }}>
              <div style={{ color: '#818cf8', fontWeight: 700, marginBottom: '0.4rem' }}>📋 Application preview</div>
              <div style={{ color: '#7ba4c7' }}><strong style={{ color: '#e0f2fe' }}>{form.name}</strong> · {form.email}</div>
              {form.phone && <div style={{ color: '#7ba4c7' }}>📞 {form.phone}</div>}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" className="btn btn-ghost btn-lg" style={{ flex: '0 0 auto' }} onClick={() => setStep(0)}>← Back</button>
              <button type="submit" className="btn btn-accent btn-lg" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Submitting…' : '🚴 Submit Application'}
              </button>
            </div>
          </form>
        )}

        {step < 2 && (
          <>
            <div className="divider-text" style={{ margin: '1.5rem 0' }}>already have an account?</div>
            <button className="btn-google" onClick={() => window.location.href = '/auth/google'}>
              {GOOGLE_SVG} Continue with Google
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b8f74', marginTop: '0.8rem' }}>
              Or <Link to="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>sign in with email</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
