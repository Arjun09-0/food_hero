import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = { donor: '#16a34a', volunteer: '#f59e0b', admin: '#818cf8' };

  return (
    <nav style={{
      background: 'rgba(10,15,13,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1e3a27', position: 'sticky', top: 0, zIndex: 1000,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🍱</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#16a34a' }}>FoodHero</span>
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: roleColor[user.role] + '22', border: `1px solid ${roleColor[user.role]}44`,
                fontSize: '0.85rem', fontWeight: 700, color: roleColor[user.role],
              }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0fdf4' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: roleColor[user.role] }}>{user.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <NotificationBell />
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
