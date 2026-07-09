import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaClock } from 'react-icons/fa';
import StarRating from '../common/StarRating';

const PLACEHOLDER = 'https://placehold.co/400x300/FFF4E6/F5820D?text=Service';

const ServiceCard = ({ service, isFavorite, onToggleFavorite }) => {
  const image = service.portfolioImages?.[0] || PLACEHOLDER;

  return (
    <Card className="sm-card h-100 border-0">
      <div className="position-relative">
        <Link to={`/services/${service._id}`}>
          <Card.Img variant="top" src={image} style={{ height: 190, objectFit: 'cover' }} onError={(e) => (e.target.src = PLACEHOLDER)} />
        </Link>
        {onToggleFavorite && (
          <button
            className="btn btn-light btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm"
            onClick={() => onToggleFavorite(service._id)}
          >
            {isFavorite ? <FaHeart color="var(--sm-orange)" /> : <FaRegHeart />}
          </button>
        )}
        <span className="sm-badge-category position-absolute bottom-0 start-0 m-2">{service.category}</span>
        {!service.availability && (
          <span className="position-absolute top-0 start-0 m-2 badge bg-secondary">Unavailable</span>
        )}
      </div>
      <Card.Body>
        <Link to={`/services/${service._id}`} className="text-decoration-none text-dark">
          <Card.Title className="fs-6 mb-1 text-truncate">{service.title}</Card.Title>
        </Link>
        <div className="mb-2">
          <StarRating rating={service.averageRating} count={service.totalReviews} />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="sm-price fs-5">
            ${service.pricing?.amount}{service.pricing?.type === 'hourly' && '/hr'}
          </span>
        </div>
        <small className="text-muted d-flex align-items-center gap-1">
          <FaClock size={11} /> {service.deliveryTime}
        </small>
      </Card.Body>
    </Card>
  );
};

export default ServiceCard;
