import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminPage() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [fetching, setFetching] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [volunteers, setVolunteers] = useState([]);
  const [assignOpen, setAssignOpen] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [adminTab, setAdminTab] = useState('donations');
  const [verifyLoading, setVerifyLoading] = useState({});
  const [volForm, setVolForm] = useState({ name: '', email: '', password: '', phone: '', lat: '', lng: '' });
  const [volFormLoading, setVolFormLoading] = useState(false);
  const [showVolForm, setShowVolForm] = useState(false);
  const [applications, setApplications] = useState([]);
  const [pendingAppCount, setPendingAppCount] = useState(0);
  const [approveModal, setApproveModal] = useState(null); // application object
  const [approveForm, setApproveForm] = useState({ password: '', lat: '', lng: '' });
  const [approveLoading, setApproveLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [donRes, statRes] = await Promise.all([
        api.get('/admin/all'),
        api.get('/admin/stats'),
      ]);
      setDonations(donRes.data);
      setStats(statRes.data);
      setLastRefresh(new Date());
      try {
        const v = await api.get('/admin/volunteers');
        setVolunteers(v.data);
      } catch (e) { console.warn('Failed to load volunteers', e); }
      try {
        const a = await api.get('/applications');
        setApplications(a.data.applications || []);
        setPendingAppCount(a.data.pendingCount || 0);
      } catch (e) { console.warn('Failed to load applications', e); }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = filter === 'all' ? donations
    : filter === 'high' ? donations.filter((d) => d.urgency === 'HIGH')
    : donations.filter((d) => d.status === filter);

  const fmtTime = (min) => {
    if (min < 60) return `${min}m`;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };

  const exportCsv = () => {
    window.open('/admin/export/csv', '_blank');
  };

  const toggleVerify = async (volId, currentStatus) => {
    setVerifyLoading((p) => ({ ...p, [volId]: true }));
    try {
      const { data } = await api.patch(`/admin/volunteer/${volId}/verify`);
      toast.success(data.message);
      setVolunteers((prev) => prev.map((v) => v._id === volId ? { ...v, isVerified: data.isVerified } : v));
    } catch (err) {
      toast.error('Failed to update volunteer status');
    } finally {
      setVerifyLoading((p) => ({ ...p, [volId]: false }));
    }
  };

  const setVol = (k) => (e) => setVolForm((p) => ({ ...p, [k]: e.target.value }));

  const createVolunteer = async (e) => {
    e.preventDefault();
    if (!volForm.lat || !volForm.lng) return toast.error('Please enter location coordinates');
    setVolFormLoading(true);
    try {
      await api.post('/admin/volunteer/create', {
        ...volForm,
        location: { lat: Number(volForm.lat), lng: Number(volForm.lng), address: `${Number(volForm.lat).toFixed(4)}, ${Number(volForm.lng).toFixed(4)}` },
      });
      toast.success(`🚴 Volunteer account created for ${volForm.name}!`);
      setVolForm({ name: '', email: '', password: '', phone: '', lat: '', lng: '' });
      setShowVolForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create volunteer');
    } finally {
      setVolFormLoading(false);
    }
  };

  const rejectApp = async (appId) => {
    try {
      await api.patch(`/applications/${appId}/reject`);
      toast.success('Application rejected');
      fetchData();
    } catch (err) { toast.error('Failed to reject'); }
  };

  const approveApp = async (e) => {
    e.preventDefault();
    if (!approveForm.password) return toast.error('Password is required');
    setApproveLoading(true);
    try {
      await api.post(`/applications/${approveModal._id}/approve`, approveForm);
      toast.success(`✅ Volunteer account created for ${approveModal.name}!`);
      setApproveModal(null);
      setApproveForm({ password: '', lat: '', lng: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally { setApproveLoading(false); }
  };

  return (
    <>
      <Toaster position="top-right" />

      {/* Approve Application Modal */}
      {approveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setApproveModal(null); } }}>
          <div style={{ background: '#111814', border: '1px solid #1e3a27', borderRadius: 18, padding: '1.8rem', maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '0.3rem' }}>✅ Approve Application</h3>
            <p style={{ color: '#6b8f74', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Create account for <strong style={{ color: '#f0fdf4' }}>{approveModal.name}</strong> ({approveModal.email})</p>
            <form onSubmit={approveApp}>
              <div className="form-group">
                <label className="form-label">Set Password for Volunteer</label>
                <input className="form-input" type="password" value={approveForm.password} onChange={(e) => setApproveForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" required minLength={6} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" value={approveForm.lat} onChange={(e) => setApproveForm((p) => ({ ...p, lat: e.target.value }))} placeholder="e.g. 12.9716" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" value={approveForm.lng} onChange={(e) => setApproveForm((p) => ({ ...p, lng: e.target.value }))} placeholder="e.g. 77.5946" required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button className="btn btn-primary btn-sm" disabled={approveLoading}>{approveLoading ? 'Creating...' : 'Create Account'}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setApproveModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Navbar />
      <div className="page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>👑 Admin Dashboard</h1>
            <p style={{ color: '#6b8f74', fontSize: '0.85rem' }}>
              Auto-refreshing every 10s · Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={exportCsv}>📅 Export CSV</button>
            <button className="btn btn-ghost btn-sm" onClick={fetchData}>↻ Refresh Now</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Total Donations', value: stats.total ?? '—', color: '#f0fdf4' },
            { label: '🔥 High Urgency', value: stats.highUrgency ?? '—', color: '#ef4444' },
            { label: 'Pending Match', value: stats.pending ?? '—', color: '#f59e0b' },
            { label: '✅ Delivered', value: stats.delivered ?? '—', color: '#16a34a' },
            { label: '⏰ Expired', value: stats.expired ?? '—', color: '#6b8f74' },
            { label: 'Volunteers', value: stats.volunteers ?? '—', color: '#22d3ee' },
          ].map(({ label, value, color }) => (
            <div className="stat-card" key={label}>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Impact Metric */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ background: '#16a34a0d', border: '1px solid #16a34a33', borderRadius: 14, padding: '1rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>🍱</div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a' }}>{stats.kgSaved ?? 0} kg</div>
              <div style={{ fontSize: '0.75rem', color: '#6b8f74' }}>Total Food Saved</div>
            </div>
          </div>
        </div>

        {/* Admin Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[['donations', '📋 Donations'], ['volunteers', '👥 Volunteer Management']].map(([key, label]) => (
            <button key={key} onClick={() => setAdminTab(key)}
              className={`btn btn-sm ${adminTab === key ? 'btn-primary' : 'btn-ghost'}`}>{label}</button>
          ))}
          <button onClick={() => setAdminTab('applications')}
            className={`btn btn-sm ${adminTab === 'applications' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ position: 'relative' }}>
            📋 Applications
            {pendingAppCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: '0.6rem', fontWeight: 800, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0f0d' }}>
                {pendingAppCount}
              </span>
            )}
          </button>
        </div>
        {/* Donations Tab */}
        {adminTab === 'donations' && (<>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            ['all', 'All'],
            ['high', '🔥 High Urgency'],
            ['pending', 'Pending'],
            ['matched', 'Matched'],
            ['delivered', 'Delivered'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-ghost'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {fetching ? (
          <p style={{ color: '#6b8f74' }}>Loading data…</p>
        ) : (
          <div className="table-wrap fade-in">
            <table>
              <thead>
                <tr>
                  <th>Urgency</th>
                  <th>Food</th>
                  <th>Qty</th>
                  <th>Donor</th>
                  <th>Location</th>
                  <th>Pickup By</th>
                  <th>Status</th>
                  <th>Volunteer</th>
                  <th>Score</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', color: '#6b8f74', padding: '3rem' }}>
                      No donations match this filter
                    </td>
                  </tr>
                ) : filtered.map((d) => (
                  <tr key={d._id} className={d.urgency === 'HIGH' ? 'high-urgency' : ''}>
                    <td><UrgencyBadge urgency={d.urgency} /></td>
                    <td style={{ fontWeight: 600 }}>{d.foodType}</td>
                    <td><span style={{ color: '#16a34a', fontWeight: 700 }}>{d.quantity} kg</span></td>
                    <td style={{ color: '#6b8f74', fontSize: '0.82rem' }}>{d.donor?.name}</td>
                    <td style={{ color: '#6b8f74', fontSize: '0.8rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.location?.address}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: new Date(d.pickupBy) < new Date() ? '#ef4444' : '#6b8f74' }}>
                      {new Date(d.pickupBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div style={{ fontSize: '0.72rem' }}>{new Date(d.pickupBy).toLocaleDateString()}</div>
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {d.match?.volunteer ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{d.match.volunteer.name}</div>
                          {d.match.distanceKm && (
                            <div style={{ color: '#6b8f74', fontSize: '0.75rem' }}>
                              {d.match.distanceKm.toFixed(1)} km · {d.match.volunteer.deliveryCount} deliveries
                            </div>
                          )}
                        </div>
                      ) : <span style={{ color: '#2d4a35' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#818cf8' }}>
                      {d.match?.score ? d.match.score.toFixed(0) : '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#6b8f74' }}>
                      {fmtTime(d.timeElapsedMin)}
                    </td>
                    <td style={{ width: 220 }}>
                      {d.match?.volunteer ? (
                        <span style={{ color: '#2d4a35' }}>Assigned</span>
                      ) : d.status === 'pending' ? (
                        assignOpen === d._id ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select value={selectedVolunteer || ''} onChange={(e) => setSelectedVolunteer(e.target.value)}>
                              <option value="">Select volunteer</option>
                              {volunteers.map((v) => (
                                <option key={v._id} value={v._id}>{v.name} — {v.email}</option>
                              ))}
                            </select>
                            <button className="btn btn-primary btn-sm" onClick={async () => {
                              if (!selectedVolunteer) return toast.error('Select a volunteer');
                                try {
                                await api.patch(`/admin/donation/${d._id}/reassign`, { volunteerId: selectedVolunteer });
                                toast.success('Assigned');
                                setAssignOpen(null);
                                setSelectedVolunteer(null);
                                fetchData();
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Assign failed');
                              }
                            }}>Assign</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setAssignOpen(null); setSelectedVolunteer(null); }}>Cancel</button>
                          </div>
                        ) : (
                          <button className="btn btn-accent btn-sm" onClick={() => setAssignOpen(d._id)}>Assign</button>
                        )
                      ) : (
                        <span style={{ color: '#6b8f74' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>)}

        {/* Volunteer Management Tab */}
        {adminTab === 'volunteers' && (
          <div className="table-wrap fade-in">
          {/* ── Create Volunteer Form ── */}
          <div style={{ marginBottom: '1.5rem' }}>
            {!showVolForm ? (
              <button className="btn btn-accent btn-sm" onClick={() => setShowVolForm(true)}>
                + Create Volunteer Account
              </button>
            ) : (
              <div className="card-flat fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>🚴 New Volunteer Account</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowVolForm(false)}>Cancel</button>
                </div>
                <form onSubmit={createVolunteer}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={volForm.name} onChange={setVol('name')} placeholder="Volunteer name" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={volForm.email} onChange={setVol('email')} placeholder="vol@example.com" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input className="form-input" type="password" value={volForm.password} onChange={setVol('password')} placeholder="Min 6 characters" required minLength={6} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone <span style={{ color: '#6b8f74', fontSize: '0.78rem' }}>(optional)</span></label>
                      <input className="form-input" type="tel" value={volForm.phone} onChange={setVol('phone')} placeholder="+91 98765 43210" />
                    </div>

                  </div>
                  <button className="btn btn-primary btn-sm" disabled={volFormLoading}>
                    {volFormLoading ? 'Creating…' : '✅ Create Volunteer'}
                  </button>
                </form>
              </div>
            )}
          </div>

            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Deliveries</th>
                  <th>⭐ Rating</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b8f74', padding: '2rem' }}>No volunteers found</td></tr>
                ) : volunteers.map((v) => (
                  <tr key={v._id}>
                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                    <td style={{ color: '#6b8f74', fontSize: '0.82rem' }}>{v.email}</td>
                    <td style={{ color: '#16a34a', fontWeight: 700 }}>{v.deliveryCount}</td>
                    <td style={{ color: '#fbbf24' }}>{v.avgRating ? `⭐ ${v.avgRating} (${v.ratingCount})` : '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: v.isAvailable ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                        {v.isAvailable ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: v.isVerified ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                        {v.isVerified ? '✅ Approved' : '⛔ Suspended'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${v.isVerified ? 'btn-ghost' : 'btn-accent'}`}
                        disabled={verifyLoading[v._id]}
                        onClick={() => toggleVerify(v._id, v.isVerified)}
                      >
                        {verifyLoading[v._id] ? '...' : v.isVerified ? 'Suspend' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Applications Tab */}
        {adminTab === 'applications' && (
          <div className="fade-in">
            {applications.length === 0 ? (
              <div style={{ color: '#6b8f74', textAlign: 'center', padding: '3rem' }}>No applications yet</div>
            ) : applications.map((app) => (
              <div key={app._id} className="card" style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700 }}>{app.name}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 6,
                      background: app.status === 'pending' ? 'rgba(245,158,11,0.15)' : app.status === 'approved' ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.12)',
                      color: app.status === 'pending' ? '#f59e0b' : app.status === 'approved' ? '#16a34a' : '#ef4444',
                    }}>
                      {app.status === 'pending' ? '⏳ Pending' : app.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#6b8f74' }}>{app.email}{app.phone && ` · ${app.phone}`}</div>
                  {app.message && <div style={{ fontSize: '0.82rem', color: '#a0c4a8', marginTop: '0.3rem', fontStyle: 'italic' }}>"{app.message}"</div>}
                  <div style={{ fontSize: '0.72rem', color: '#4a7a54', marginTop: '0.3rem' }}>Applied {new Date(app.createdAt).toLocaleDateString()}</div>
                </div>
                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button className="btn btn-accent btn-sm" onClick={() => setApproveModal(app)}>✅ Approve</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => rejectApp(app._id)}>✗ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
