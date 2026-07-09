import { Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';

const STATUS_CLASS = {
  pending: 'sm-status-pending',
  accepted: 'sm-status-accepted',
  completed: 'sm-status-completed',
  rejected: 'sm-status-rejected',
  cancelled: 'sm-status-cancelled',
};

const BookingCard = ({ booking, role, onAccept, onReject, onComplete, onCancel }) => {
  const otherParty = role === 'provider' ? booking.buyer : booking.provider;
  const image = booking.service?.images?.[0] || booking.service?.portfolioImages?.[0]
    || 'https://placehold.co/80x80/E8F5E9/1E8449?text=S';

  return (
    <div className="sm-card p-3 mb-3 border-0">
      <div className="d-flex gap-3 align-items-start flex-wrap">
        <Image src={image} style={{ width: 70, height: 70, objectFit: 'cover' }} className="rounded-3" />
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <Link to={`/services/${booking.service?._id}`} className="fw-semibold text-decoration-none text-dark">
                {booking.service?.title}
              </Link>
              <div className="small text-muted">
                {role === 'provider' ? 'Requested by' : 'Provider'}: <strong>{otherParty?.fullName}</strong>
              </div>
            </div>
            <span className={`sm-status-badge ${STATUS_CLASS[booking.status]}`}>{booking.status}</span>
          </div>

          <div className="d-flex gap-3 small text-muted mt-2">
            <span><FaCalendarAlt className="me-1" />{new Date(booking.preferredDate).toLocaleDateString()}</span>
            <span><FaClock className="me-1" />{booking.preferredTime}</span>
            <span className="sm-price">${booking.price}</span>
          </div>

          {booking.notes && <p className="small mt-2 mb-0 text-muted">"{booking.notes}"</p>}

          <div className="d-flex gap-2 mt-3 flex-wrap">
            {role === 'provider' && booking.status === 'pending' && (
              <>
                <Button size="sm" variant="primary" onClick={() => onAccept(booking._id)}>Accept</Button>
                <Button size="sm" variant="outline-danger" onClick={() => onReject(booking._id)}>Reject</Button>
              </>
            )}
            {role === 'provider' && booking.status === 'accepted' && (
              <Button size="sm" variant="secondary" className="text-white" onClick={() => onComplete(booking._id)}>Mark Completed</Button>
            )}
            {['pending', 'accepted'].includes(booking.status) && (
              <Button size="sm" variant="outline-secondary" onClick={() => onCancel(booking._id)}>Cancel</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
