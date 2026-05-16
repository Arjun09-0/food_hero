import { StatusBadge, UrgencyBadge } from './StatusBadge';

export default function DonationCard({ donation, actions }) {
  const pickup = new Date(donation.pickupBy);
  const now = new Date();
  const hoursLeft = Math.max(0, ((pickup - now) / 3600000)).toFixed(1);

  return (
    <div className="card fade-in" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>{donation.foodType}</h3>
          <p style={{ fontSize: '0.82rem', color: '#6b8f74' }}>{donation.donor?.name || 'Anonymous'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <UrgencyBadge urgency={donation.urgency} />
          <StatusBadge status={donation.status} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '0.8rem' }}>
        <div style={{ background: '#0a0f0d', borderRadius: 10, padding: '0.6rem 0.8rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#6b8f74', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>{donation.quantity} kg</div>
        </div>
        <div style={{ background: '#0a0f0d', borderRadius: 10, padding: '0.6rem 0.8rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#6b8f74', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Left</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: hoursLeft < 2 ? '#ef4444' : '#f59e0b' }}>{hoursLeft}h</div>
        </div>
        <div style={{ background: '#0a0f0d', borderRadius: 10, padding: '0.6rem 0.8rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#6b8f74', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distance</div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>
            {donation.distanceKm != null ? `${donation.distanceKm.toFixed(1)} km` : '—'}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: '#6b8f74', marginBottom: '0.6rem' }}>
        📍 {donation.location?.address}
      </div>

      {donation.description && (
        <div style={{ fontSize: '0.82rem', color: '#6b8f74', fontStyle: 'italic', marginBottom: '0.8rem' }}>
          "{donation.description}"
        </div>
      )}

      {donation.match && (
        <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 10, padding: '0.6rem 0.8rem', marginBottom: '0.8rem', fontSize: '0.82rem' }}>
          🚴 Volunteer: <strong>{donation.match.volunteer?.name}</strong>
          {donation.match.distanceKm && <span style={{ color: '#6b8f74' }}> · {donation.match.distanceKm.toFixed(1)} km away</span>}
        </div>
      )}

      {actions && <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}
