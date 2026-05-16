export const StatusBadge = ({ status }) => {
  const map = {
    pending: { label: 'Pending', cls: 'badge-pending' },
    matched: { label: 'Matched', cls: 'badge-matched' },
    picked_up: { label: 'Picked Up', cls: 'badge-picked_up' },
    delivered: { label: 'Delivered', cls: 'badge-delivered' },
    expired: { label: 'Expired', cls: 'badge-pending' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`badge ${cls}`}>{label}</span>;
};

export const UrgencyBadge = ({ urgency }) => (
  <span className={`badge ${urgency === 'HIGH' ? 'badge-high pulse-high' : 'badge-low'}`}>
    {urgency === 'HIGH' ? '🔥 HIGH' : '✅ LOW'}
  </span>
);
