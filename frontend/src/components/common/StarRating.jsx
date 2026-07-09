import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const StarRating = ({ rating = 0, count, size = 14 }) => {
  const stars = [];
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push(<FaStar key={i} size={size} />);
    else if (i === full && half) stars.push(<FaStarHalfAlt key={i} size={size} />);
    else stars.push(<FaRegStar key={i} size={size} />);
  }

  return (
    <span className="sm-rating d-inline-flex align-items-center gap-1">
      <span className="d-flex gap-1">{stars}</span>
      {rating > 0 && <span className="small">{rating.toFixed(1)}</span>}
      {typeof count === 'number' && <span className="small text-muted">({count})</span>}
    </span>
  );
};

export default StarRating;
