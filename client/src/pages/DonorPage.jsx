import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DonationCard from '../components/DonationCard';
import MapPicker from '../components/MapPicker';
import toast, { Toaster } from 'react-hot-toast';

const DEFAULT_FORM = {
  foodType: '', quantity: '', description: '',
  pickupBy: '', location: null,
};

const SAFETY_ITEMS = [
  'Food is freshly prepared and within safe consumption time',
  'Food is properly covered and packaged',
  'Temperature is maintained (hot food hot, cold food cold)',
];

function StarRating({ matchId, onDone }) {
  const [hover, setHover] = useState(0);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!score) return toast.error('Please select a star rating');
    setSubmitting(true);
    try {
      await api.post('/ratings', { matchId, score, comment });
      toast.success('⭐ Rating submitted! Thank you!');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rating failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)',
      borderRadius: 12, padding: '0.9rem 1.1rem', marginTop: '-0.5rem', marginBottom: '1rem',
    }}>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', fontWeight: 700, marginBottom: '0.4rem' }}>
        ⭐ Rate your volunteer
      </div>
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.6rem', fontSize: '1.6rem' }}>
        {[1,2,3,4,5].map((s) => (
          <span key={s} style={{ cursor: 'pointer', color: s <= (hover || score) ? '#fbbf24' : '#2d4a35', transition: 'color 0.15s' }}
            onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            onClick={() => setScore(s)}>&#9733;</span>
        ))}
      </div>
      <input className="form-input" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
        placeholder="Leave a comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-accent btn-sm" onClick={submit} disabled={submitting || !score}>
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  );
}

export default function DonorPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [safetyChecks, setSafetyChecks] = useState([false, false, false]);
  const [donations, setDonations] = useState([]);
  const [ratedMatches, setRatedMatches] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const fetchMine = async () => {
    try {
      const { data } = await api.get('/donations/mine');
      setDonations(data);
    } catch { /* silent */ } finally { setFetching(false); }
  };

  useEffect(() => { fetchMine(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location) return toast.error('Click the map to drop a pickup pin!');
    if (!safetyChecks.every(Boolean)) return toast.error('Please confirm all food safety checkpoints');
    setLoading(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity), safetyChecked: true };
      const { data } = await api.post('/donations', payload);
      toast.success(data.matched
        ? `Matched to volunteer ${data.volunteer}! 🎉`
        : 'Donation posted! Looking for volunteers…');
      setForm(DEFAULT_FORM);
      setSafetyChecks([false, false, false]);
      setShowForm(false);
      fetchMine();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post donation');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: donations.length,
    pending: donations.filter((d) => d.status === 'pending').length,
    matched: donations.filter((d) => ['matched', 'picked_up'].includes(d.status)).length,
    delivered: donations.filter((d) => d.status === 'delivered').length,
  };

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <div className="page">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>
            🍲 Donor Dashboard
          </h1>
          <p style={{ color: '#6b8f74' }}>Share surplus food and track your donations in real time</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Total Posted', value: stats.total, color: '#f0fdf4' },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'In Progress', value: stats.matched, color: '#818cf8' },
            { label: 'Delivered', value: stats.delivered, color: '#16a34a' },
          ].map(({ label, value, color }) => (
            <div className="stat-card" key={label}>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Post button / form */}
        <div style={{ marginBottom: '2rem' }}>
          {!showForm ? (
            <button className="btn btn-primary btn-lg" onClick={() => setShowForm(true)}>
              + Post New Donation
            </button>
          ) : (
            <div className="card-flat fade-in" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h2 className="section-heading" style={{ margin: 0 }}>📝 New Donation</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Food Type</label>
                    <input className="form-input" value={form.foodType} onChange={set('foodType')} placeholder="e.g. Biryani, Rice, Sweets" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity (kg)</label>
                    <input className="form-input" type="number" min="0.1" step="0.1" value={form.quantity} onChange={set('quantity')} placeholder="e.g. 30" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea className="form-input" value={form.description} onChange={set('description')} placeholder="Any details about the food…" />
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Deadline</label>
                  <input className="form-input" type="datetime-local" value={form.pickupBy} onChange={set('pickupBy')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Pickup Location — click map to drop pin {form.location && '✅'}
                  </label>
                  <div style={{ height: 280 }}>
                    <MapPicker
                      center={user?.location}
                      onSelect={(loc) => setForm((p) => ({ ...p, location: { ...loc, address: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` } }))}
                    />
                  </div>
                  {form.location && (
                    <div style={{ fontSize: '0.8rem', color: '#6b8f74', marginTop: '0.4rem' }}>
                      📍 Lat {form.location.lat.toFixed(5)}, Lng {form.location.lng.toFixed(5)}
                    </div>
                  )}
                </div>

                {form.quantity > 0 && form.pickupBy && (
                  <div style={{
                    background: form.quantity > 20 || ((new Date(form.pickupBy) - new Date()) / 3600000 < 4) ? 'var(--high-bg)' : 'var(--low-bg)',
                    border: `1px solid ${form.quantity > 20 || ((new Date(form.pickupBy) - new Date()) / 3600000 < 4) ? 'rgba(239,68,68,0.3)' : 'rgba(22,163,74,0.3)'}`,
                    borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem',
                  }}>
                    Auto-tag preview:{' '}
                    <strong>{form.quantity > 20 || ((new Date(form.pickupBy) - new Date()) / 3600000 < 4) ? '🔥 HIGH URGENCY' : '✅ LOW URGENCY'}</strong>
                  </div>
                )}

                {/* ── Food Safety Checklist ── */}
                <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#16a34a', fontWeight: 700, marginBottom: '0.5rem' }}>
                    🛡️ Food Safety Checklist
                  </div>
                  {SAFETY_ITEMS.map((item, i) => (
                    <label key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={safetyChecks[i]} onChange={(e) => setSafetyChecks((prev) => prev.map((v, j) => j === i ? e.target.checked : v))} style={{ width: 16, height: 16, accentColor: '#16a34a', cursor: 'pointer' }} />
                      <span style={{ color: safetyChecks[i] ? '#f0fdf4' : '#6b8f74' }}>{item}</span>
                    </label>
                  ))}
                </div>

                <button className="btn btn-primary btn-lg" disabled={loading || !safetyChecks.every(Boolean)}>
                  {loading ? 'Posting…' : '🍱 Post Donation'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* My Donations */}
        <h2 className="section-heading">📋 My Donations</h2>
        {fetching ? (
          <p style={{ color: '#6b8f74' }}>Loading…</p>
        ) : donations.length === 0 ? (
          <div className="card-flat" style={{ textAlign: 'center', padding: '3rem', color: '#6b8f74' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
            <p>You haven't posted any donations yet.</p>
          </div>
        ) : (
          donations.map((d) => (
            <div key={d._id}>
              <DonationCard donation={d} />

              {/* ── Pickup OTP Card (Ola/Uber style) ───────────────────── */}
              {d.match?.pickupOtp && ['matched', 'accepted'].includes(d.status) && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(16,185,129,0.08))',
                  border: '1.5px solid rgba(22,163,74,0.4)',
                  borderRadius: 14,
                  padding: '1rem 1.2rem',
                  marginTop: '-0.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.8rem',
                  boxShadow: '0 0 24px rgba(22,163,74,0.1)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#16a34a', fontWeight: 700, marginBottom: '0.3rem' }}>
                      🔒 Pickup Confirmation Code
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#6b8f74', marginBottom: '0.4rem' }}>
                      Share this code with the volunteer when they arrive
                    </div>
                    <div style={{
                      fontSize: '2.2rem',
                      fontWeight: 900,
                      letterSpacing: '0.4rem',
                      color: '#f0fdf4',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {d.match.pickupOtp}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', background: 'rgba(22,163,74,0.1)', borderRadius: 10, padding: '0.6rem 1rem' }}>
                    <div style={{ fontSize: '1.6rem' }}>🚗</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b8f74', marginTop: '0.2rem' }}>Volunteer<br />en route</div>
                  </div>
                </div>
              )}

              {/* ── Star Rating (for delivered donations without a rating yet) ── */}
              {d.status === 'delivered' && d.match && !ratedMatches[d.match._id] && (
                <StarRating matchId={d.match._id} onDone={() => setRatedMatches((p) => ({ ...p, [d.match._id]: true }))} />
              )}
              {ratedMatches[d.match?._id] && d.status === 'delivered' && (
                <div style={{ fontSize: '0.82rem', color: '#fbbf24', marginTop: '-0.5rem', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                  ⭐ You rated this delivery. Thank you!
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
