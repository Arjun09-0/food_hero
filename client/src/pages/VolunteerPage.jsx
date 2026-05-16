import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DonationCard from '../components/DonationCard';
import MapPicker from '../components/MapPicker';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import toast, { Toaster } from 'react-hot-toast';

export default function VolunteerPage() {
  const { user, login } = useAuth();
  const [open, setOpen] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [tab, setTab] = useState('map');
  const [loading, setLoading] = useState({});
  const [fetching, setFetching] = useState(true);
  const [available, setAvailable] = useState(user?.isAvailable ?? true);
  const [availLoading, setAvailLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  // OTP modal state — which match is awaiting pickup OTP entry
  const [otpModal, setOtpModal] = useState(null); // matchId | null
  const [otpInput, setOtpInput] = useState('');

  const fetchAll = async () => {
    try {
      const [openRes, matchRes] = await Promise.all([
        api.get('/donations/open'),
        api.get('/donations/my-matches'),
      ]);
      setOpen(openRes.data);
      setMyMatches(matchRes.data);
    } catch { /* silent */ } finally { setFetching(false); }
  };

  useEffect(() => {
    fetchAll();
    api.get('/leaderboard').then(({ data }) => setLeaderboard(data.ranked || [])).catch(() => {});
  }, []);

  const toggleAvailability = async () => {
    setAvailLoading(true);
    try {
      const { data } = await api.patch('/auth/availability');
      setAvailable(data.isAvailable);
      toast.success(data.message);
    } catch (err) {
      toast.error('Failed to update availability');
    } finally {
      setAvailLoading(false);
    }
  };

  const act = async (matchId, action) => {
    setLoading((p) => ({ ...p, [matchId]: true }));
    try {
      await api.patch(`/donations/match/${matchId}/${action}`);
      toast.success(action === 'deliver' ? '🎉 Delivery confirmed! Thank you!' : 'Updated!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading((p) => ({ ...p, [matchId]: false }));
    }
  };

  // Pickup requires OTP from donor (like Ola/Uber)
  const pickupWithOtp = async (matchId) => {
    if (otpInput.length !== 4) return toast.error('Enter the 4-digit code from the donor');
    setLoading((p) => ({ ...p, [matchId]: true }));
    try {
      await api.patch(`/donations/match/${matchId}/pickup`, { otp: otpInput });
      toast.success('📦 Pickup confirmed!');
      setOtpModal(null);
      setOtpInput('');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wrong OTP');
    } finally {
      setLoading((p) => ({ ...p, [matchId]: false }));
    }
  };

  const claim = async (donationId) => {
    setLoading((p) => ({ ...p, [donationId]: true }));
    try {
      await api.patch(`/donations/${donationId}/claim`);
      toast.success('Claimed!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Claim failed');
    } finally {
      setLoading((p) => ({ ...p, [donationId]: false }));
    }
  };

  // Map markers from open donations
  const mapMarkers = open.map((d) => ({
    lat: d.location.lat, lng: d.location.lng,
    label: d.foodType, sub: `${d.quantity}kg · ${d.urgency}`,
    type: d.urgency === 'HIGH' ? 'high' : 'normal',
  }));

  const activeMatches = myMatches.filter((m) => !['delivered', 'declined'].includes(m.status));
  const completedMatches = myMatches.filter((m) => m.status === 'delivered');

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>🚴 Volunteer Dashboard</h1>
            <p style={{ color: '#6b8f74' }}>Find nearby donations and make deliveries count</p>
          </div>
          {/* Availability Toggle */}
          <button
            onClick={toggleAvailability}
            disabled={availLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: available ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${available ? 'rgba(22,163,74,0.4)' : 'rgba(239,68,68,0.4)'}`,
              borderRadius: 10, padding: '0.5rem 1rem', cursor: 'pointer',
              color: available ? '#16a34a' : '#ef4444', fontWeight: 700, fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: available ? '#16a34a' : '#ef4444', display: 'inline-block' }} />
            {availLoading ? 'Updating...' : available ? 'Online — accepting donations' : 'Offline — not accepting'}
          </button>
        </div>

        {/* Stats row */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Open Near You', value: open.length, color: '#f59e0b' },
            { label: 'My Active', value: activeMatches.length, color: '#818cf8' },
            { label: 'Delivered', value: completedMatches.length, color: '#16a34a' },
          ].map(({ label, value, color }) => (
            <div className="stat-card" key={label}>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[['map', '🗺️ Map View'], ['list', '📋 Open List'], ['mine', '🚀 My Tasks'], ['board', '🏆 Leaderboard']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Map Tab */}
        {tab === 'map' && (
          <div className="card-flat fade-in">
            <div style={{ height: 420 }}>
              <MapPicker markers={mapMarkers} readonly />
            </div>
            <p style={{ marginTop: '0.8rem', color: '#6b8f74', fontSize: '0.85rem' }}>
              🟢 Low urgency · 🔴 High urgency — Switch to List view to accept donations
            </p>
          </div>
        )}

        {/* Open List Tab */}
        {tab === 'list' && (
          <div className="fade-in">
            {fetching ? <p style={{ color: '#6b8f74' }}>Loading…</p>
              : open.length === 0 ? (
                <div className="card-flat" style={{ textAlign: 'center', padding: '3rem', color: '#6b8f74' }}>
                  <div style={{ fontSize: '3rem' }}>🎉</div>
                  <p style={{ marginTop: '1rem' }}>All caught up! No open donations near you.</p>
                </div>
              ) : open.map((d) => (
                <DonationCard key={d._id} donation={d} actions={(
                  <button className="btn btn-accent btn-sm" disabled={loading[d._id]} onClick={() => claim(d._id)}>
                    ✅ Claim
                  </button>
                )} />
              ))}
          </div>
        )}

        {/* My Tasks Tab */}
        {tab === 'mine' && (
          <div className="fade-in">
            {activeMatches.length === 0 && completedMatches.length === 0 ? (
              <div className="card-flat" style={{ textAlign: 'center', padding: '3rem', color: '#6b8f74' }}>
                <div style={{ fontSize: '3rem' }}>📭</div>
                <p style={{ marginTop: '1rem' }}>No assigned deliveries yet. Check the open list!</p>
              </div>
            ) : (
              <>
                {activeMatches.length > 0 && (
                  <>
                    <h3 className="section-heading">Active Deliveries</h3>
                    {activeMatches.map((m) => (
                      <div className="card fade-in" key={m._id} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                          <div>
                            <h3 style={{ fontWeight: 700 }}>{m.donation?.foodType}</h3>
                            <p style={{ fontSize: '0.82rem', color: '#6b8f74' }}>{m.donation?.donor?.name}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <UrgencyBadge urgency={m.donation?.urgency} />
                            <StatusBadge status={m.status} />
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#6b8f74', marginBottom: '0.8rem' }}>
                          📍 {m.donation?.location?.address} · {m.donation?.quantity} kg
                        </p>

                        {/* ── Donor Contact Card ──────────────────────── */}
                        {m.donation?.donor && (
                          <div style={{
                            background: 'rgba(22,163,74,0.07)',
                            border: '1px solid rgba(22,163,74,0.25)',
                            borderRadius: 12,
                            padding: '0.75rem 1rem',
                            marginBottom: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.6rem',
                          }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b8f74', marginBottom: '0.2rem' }}>Donor Contact</div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.donation.donor.name}</div>
                              {m.donation.donor.phone ? (
                                <div style={{ fontSize: '0.82rem', color: '#6b8f74' }}>{m.donation.donor.phone}</div>
                              ) : (
                                <div style={{ fontSize: '0.8rem', color: '#6b8f74', fontStyle: 'italic' }}>No phone on file</div>
                              )}
                            </div>
                            {m.donation.donor.phone && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <a
                                  href={`tel:${m.donation.donor.phone.replace(/\s/g, '')}`}
                                  className="btn btn-accent btn-sm"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                  📞 Call
                                </a>
                                <a
                                  href={`https://wa.me/${m.donation.donor.phone.replace(/[^\d]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-ghost btn-sm"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                  💬 WhatsApp
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>

                          {m.status === 'assigned' && (
                            <button className="btn btn-accent btn-sm" disabled={loading[m._id]}
                              onClick={() => act(m._id, 'accept')}>
                              ✅ Accept
                            </button>
                          )}

                          {m.status === 'accepted' && (
                            otpModal === m._id ? (
                              /* ── OTP Input Prompt ─────────────────────── */
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'rgba(129,140,248,0.08)',
                                border: '1px solid rgba(129,140,248,0.25)',
                                borderRadius: 10, padding: '0.5rem 0.8rem',
                                width: '100%', flexWrap: 'wrap',
                              }}>
                                <span style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: 600 }}>🔒 Donor's code:</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={4}
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                  placeholder="• • • •"
                                  autoFocus
                                  style={{
                                    width: 90, textAlign: 'center', fontSize: '1.3rem',
                                    letterSpacing: '0.4rem', fontWeight: 800,
                                    background: '#0a0f0d', border: '1px solid #2d4a35',
                                    borderRadius: 8, padding: '0.3rem 0.5rem', color: '#f0fdf4',
                                  }}
                                />
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={loading[m._id] || otpInput.length !== 4}
                                  onClick={() => pickupWithOtp(m._id)}
                                >
                                  {loading[m._id] ? '...' : '✔️ Confirm'}
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => { setOtpModal(null); setOtpInput(''); }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={loading[m._id]}
                                onClick={() => { setOtpModal(m._id); setOtpInput(''); }}
                              >
                                📦 Mark Picked Up
                              </button>
                            )
                          )}

                          {m.status === 'picked_up' && (
                            <button className="btn btn-primary btn-sm" disabled={loading[m._id]}
                              onClick={() => act(m._id, 'deliver')}>
                              🎉 Mark Delivered
                            </button>
                          )}

                          {/* Google Maps Directions */}
                          {m.donation?.location?.lat && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${m.donation.location.lat},${m.donation.location.lng}`}
                              target="_blank" rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              🗺️ Directions
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {completedMatches.length > 0 && (
                  <>
                    <h3 className="section-heading" style={{ marginTop: '1.5rem' }}>✅ Completed</h3>
                    {completedMatches.map((m) => (
                      <div className="card" key={m._id} style={{ marginBottom: '0.8rem', opacity: 0.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.donation?.foodType}</h3>
                            <p style={{ fontSize: '0.8rem', color: '#6b8f74' }}>{m.donation?.quantity} kg · {m.donation?.location?.address}</p>
                          </div>
                          <StatusBadge status={m.status} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === 'board' && (
          <div className="fade-in">
            <h2 className="section-heading">🏆 Volunteer Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p style={{ color: '#6b8f74' }}>No data yet</p>
            ) : leaderboard.map((v) => (
              <div className="card fade-in" key={v._id} style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Rank */}
                <div style={{ fontSize: v.rank <= 3 ? '1.8rem' : '1.1rem', fontWeight: 900, minWidth: 40, textAlign: 'center', color: v.rank === 1 ? '#fbbf24' : v.rank === 2 ? '#94a3b8' : v.rank === 3 ? '#b87333' : '#6b8f74' }}>
                  {v.rank <= 3 ? ['', '🥇', '🥈', '🥉'][v.rank] : `#${v.rank}`}
                </div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{v.name}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: v.badge.color, background: `${v.badge.color}18`, border: `1px solid ${v.badge.color}44`, borderRadius: 6, padding: '0.15rem 0.5rem' }}>{v.badge.label}</span>
                    <span style={{ fontSize: '0.72rem', color: v.isAvailable ? '#16a34a' : '#ef4444', fontWeight: 600 }}>{v.isAvailable ? '🟢 Online' : '🔴 Offline'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b8f74', marginTop: '0.2rem' }}>
                    {v.deliveryCount} deliveries
                    {v.ratingCount > 0 && <span> · ⭐ {v.avgRating} ({v.ratingCount} ratings)</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#16a34a' }}>{v.deliveryCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#6b8f74' }}>deliveries</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
