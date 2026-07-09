import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import StarRating from '../common/StarRating';

const PLACEHOLDER = 'https://placehold.co/400x300/E8F5E9/1E8449?text=No+Image';

const ProductCard = ({ product, isFavorite, onToggleFavorite }) => {
  const image = product.images?.[0] || PLACEHOLDER;

  return (
    <Card className="sm-card h-100 border-0">
      <div className="position-relative">
        <Link to={`/products/${product._id}`}>
          <Card.Img
            variant="top"
            src={image}
            style={{ height: 190, objectFit: 'cover' }}
            onError={(e) => (e.target.src = PLACEHOLDER)}
          />
        </Link>
        {onToggleFavorite && (
          <button
            className="btn btn-light btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm"
            onClick={() => onToggleFavorite(product._id)}
            title="Toggle favorite"
          >
            {isFavorite ? <FaHeart color="var(--sm-orange)" /> : <FaRegHeart />}
          </button>
        )}
        <span className="sm-badge-category position-absolute bottom-0 start-0 m-2">
          {product.category}
        </span>
      </div>
      <Card.Body>
        <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">
          <Card.Title className="fs-6 mb-1 text-truncate">{product.title}</Card.Title>
        </Link>
        <div className="mb-2">
          <StarRating rating={product.averageRating} count={product.totalReviews} />
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span className="sm-price fs-5">${product.price}</span>
          {product.location?.city && (
            <small className="text-muted">{product.location.city}</small>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
