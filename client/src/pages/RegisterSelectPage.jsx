import { useRef } from 'react';
import { Link } from 'react-router-dom';

const GOOGLE_SVG = (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.4 13.1 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.9 37.3 46.5 31.3 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.6 28.6A14.7 14.7 0 019.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A23.8 23.8 0 000 24c0 3.8.9 7.4 2.5 10.6l8.1-6z"/>
    <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.8 2.3-6.3 0-11.6-3.6-13.4-9l-8.1 6C6.7 42.6 14.7 48 24 48z"/>
  </svg>
);

const roles = [
  {
    key: 'donor', icon: '🍲', title: 'Food Donor',
    subtitle: 'Restaurants · Hotels · Households',
    desc: 'Post surplus food instantly. Track pickups in real-time. See your direct impact on reducing waste.',
    color: '#38bdf8', glow: 'rgba(56,189,248,0.4)',
    shadowColor: 'rgba(56,189,248,0.25)',
    link: '/register/donor', btnClass: 'btn-primary', btnLabel: 'Register as Donor',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(34,211,238,0.05))',
    border: 'rgba(56,189,248,0.3)',
    perks: ['Real-time tracking', 'Impact dashboard', 'Tax receipts'],
  },
  {
    key: 'volunteer', icon: '🚴', title: 'Volunteer',
    subtitle: 'Riders · Drivers · Heroes',
    desc: 'Pick up food, deliver hope. Earn badges, climb the leaderboard, and build your impact story.',
    color: '#818cf8', glow: 'rgba(129,140,248,0.4)',
    shadowColor: 'rgba(129,140,248,0.25)',
    link: '/register/volunteer', btnClass: 'btn-accent', btnLabel: 'Apply to Volunteer',
    gradient: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(167,139,250,0.05))',
    border: 'rgba(129,140,248,0.3)',
    perks: ['Leaderboard rankings', 'Achievement badges', 'Community rewards'],
  },
  {
    key: 'admin', icon: '👑', title: 'Administrator',
    subtitle: 'Managers · Coordinators',
    desc: 'Full platform oversight. Manage volunteers, approve applications, and export analytics reports.',
    color: '#22d3ee', glow: 'rgba(34,211,238,0.4)',
    shadowColor: 'rgba(34,211,238,0.25)',
    link: '/login', btnClass: 'btn-cyan', btnLabel: 'Admin Sign In',
    gradient: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(56,189,248,0.05))',
    border: 'rgba(34,211,238,0.3)',
    perks: ['Volunteer management', 'Analytics & CSV export', 'Application approvals'],
  },
];

function RoleCard({ r, index }) {
  const cardRef = useRef(null);

  const handleMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-10px) scale(1.02)`;
    card.style.boxShadow = `${-x * 25}px ${y * 10}px 60px ${r.shadowColor}, 0 20px 60px rgba(0,0,0,0.4)`;
    card.style.borderColor = r.border;
  };

  const handleLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.borderColor = '';
    card.style.transition = 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)';
    setTimeout(() => { if (card) card.style.transition = ''; }, 500);
  };

  return (
    <Link to={r.link} style={{ textDecoration: 'none' }}>
      <div
        ref={cardRef}
        className="role-card fade-in"
        style={{
          animationDelay: `${index * 0.12}s`, animationFillMode: 'both',
          background: r.gradient,
          height: '100%',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {/* Glowing icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 22, margin: '0 auto 1.4rem',
          background: `radial-gradient(ellipse at 40% 40%, ${r.glow.replace('0.4','0.15')}, transparent 70%)`,
          border: `1px solid ${r.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.2rem', position: 'relative',
          boxShadow: `0 0 30px ${r.glow.replace('0.4','0.2')}`,
        }}>
          {r.icon}
          {/* Pulsing ring */}
          <div style={{
            position: 'absolute', inset: -4, borderRadius: 26,
            border: `1px solid ${r.border}`,
            animation: 'glowPulse 3s ease-in-out infinite',
            animationDelay: `${index * 0.5}s`,
          }} />
        </div>

        {/* Title */}
        <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#f0f9ff', marginBottom: '0.3rem' }}>
          {r.title}
        </div>
        <div style={{ fontSize: '0.72rem', color: r.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.8rem' }}>
          {r.subtitle}
        </div>
        <p style={{ fontSize: '0.85rem', color: '#7ba4c7', lineHeight: 1.7, marginBottom: '1.2rem' }}>
          {r.desc}
        </p>

        {/* Perks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          {r.perks.map((p) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#7ba4c7' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0, boxShadow: `0 0 6px ${r.color}` }} />
              {p}
            </div>
          ))}
        </div>

        <button className={`btn ${r.btnClass} btn-lg shimmer-btn`} style={{ width: '100%' }}>
          {r.btnLabel} →
        </button>
      </div>
    </Link>
  );
}

export default function RegisterSelectPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', position: 'relative', overflow: 'hidden' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="stars" />
      </div>

      {/* Header */}
      <div className="slide-up" style={{ textAlign: 'center', marginBottom: '3.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 999, padding: '0.4rem 1rem', fontSize: '0.78rem', color: '#7dd3fc', fontWeight: 600, marginBottom: '1.2rem', letterSpacing: '0.05em' }}>
          ✦ JOIN THE MOVEMENT
        </div>
        <div className="aurora-text" style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1, marginBottom: '1rem' }}>
          🍱 FoodHero
        </div>
        <p style={{ color: '#7ba4c7', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
          Every meal saved is a story told. Choose your role and start making a difference today.
        </p>
      </div>

      {/* Role Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem', maxWidth: '1000px', width: '100%', position: 'relative', zIndex: 1 }}>
        {roles.map((r, i) => <RoleCard key={r.key} r={r} index={i} />)}
      </div>

      {/* Google OAuth */}
      <div className="fade-in" style={{ marginTop: '2.5rem', width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, animationDelay: '0.4s', animationFillMode: 'both' }}>
        <div className="divider-text">already have an account? sign in with Google</div>
        <button className="btn-google shimmer-btn" onClick={() => window.location.href = 'http://localhost:5001/auth/google'}>
          {GOOGLE_SVG} Continue with Google
        </button>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.83rem', color: '#7ba4c7' }}>
          Already signed up?{' '}
          <Link to="/login" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
