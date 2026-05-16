import { useState, useEffect, useRef } from 'react';
import api from '../api';

const TYPE_ICON = {
  claim: '🚴',
  deliver: '🎉',
  assign: '📦',
  expire: '⏰',
  rating: '⭐',
  approve: '✅',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications/mine');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleOpen = () => {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) markAllRead();
  };

  const fmtTime = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          position: 'relative', padding: '4px 6px', borderRadius: 8,
          transition: 'background 0.2s',
          color: '#f0fdf4', fontSize: '1.3rem', lineHeight: 1,
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', fontSize: '0.6rem', fontWeight: 800,
            width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0a0f0d',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0,
          width: 320, maxHeight: 420, overflowY: 'auto',
          background: '#111814', border: '1px solid #1e3a27',
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 2000,
        }}>
          <div style={{ padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e3a27' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔔 Notifications</span>
            {notifications.some((n) => !n.read) && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b8f74', fontSize: '0.85rem' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n._id} style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #1a2e1e',
                background: n.read ? 'transparent' : 'rgba(22,163,74,0.06)',
                display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.1rem', marginTop: 1 }}>{TYPE_ICON[n.type] || '📢'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', color: n.read ? '#6b8f74' : '#f0fdf4', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: '0.7rem', color: '#4a7a54', marginTop: '0.2rem' }}>{fmtTime(n.createdAt)}</div>
                </div>
                {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', marginTop: 4, flexShrink: 0 }} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
