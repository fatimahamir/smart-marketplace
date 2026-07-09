import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Badge, Button, Image, Tab, Tabs, Form, Alert } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { productService } from '../../services/productService';
import { userService } from '../../services/userService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';

import StarRating from '../../components/common/StarRating';
import Loader from '../../components/common/Loader';

const PLACEHOLDER = 'https://placehold.co/700x500/E8F5E9/1E8449?text=No+Image';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const isOwner = user && product && product.seller._id === user.id;

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: prodData }, { data: revData }] = await Promise.all([
        productService.getOne(id),
        reviewService.getForTarget('product', id),
      ]);
      setProduct(prodData.product);
      setReviews(revData.reviews);

      if (isAuthenticated) {
        const { data: favData } = await userService.getFavorites();
        setIsFavorite(favData.favorites.products.some((p) => p._id === id));
      }
    } catch (err) {
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) return toast.info('Please login to save favorites');
    try {
      if (isFavorite) {
        await userService.removeFavorite('product', id);
      } else {
        await userService.addFavorite('product', id);
      }
      setIsFavorite(!isFavorite);
    } catch {
      toast.error('Could not update favorites');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      await productService.remove(id);
      toast.success('Product deleted');
      navigate('/products');
    } catch {
      toast.error('Could not delete product');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewService.create({ targetType: 'product', targetId: id, ...reviewForm });
      toast.success('Review submitted');
      setReviewForm({ rating: 5, comment: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loader text="Loading product..." />;
  if (!product) return null;

  const images = product.images?.length ? product.images : [PLACEHOLDER];

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col lg={6}>
          <Image src={images[activeImg]} className="w-100 rounded-4 mb-2" style={{ height: 420, objectFit: 'cover' }} onError={(e) => (e.target.src = PLACEHOLDER)} />
          {images.length > 1 && (
            <div className="d-flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  onClick={() => setActiveImg(i)}
                  className="rounded-3"
                  style={{ width: 70, height: 70, objectFit: 'cover', cursor: 'pointer', border: i === activeImg ? '2px solid var(--sm-green)' : '1px solid var(--sm-border)' }}
                />
              ))}
            </div>
          )}
        </Col>

        <Col lg={6}>
          <Badge className="sm-badge-category mb-2">{product.category}</Badge>
          <div className="d-flex justify-content-between align-items-start">
            <h2>{product.title}</h2>
            <button className="btn btn-light rounded-circle" onClick={toggleFavorite}>
              {isFavorite ? <FaHeart color="var(--sm-orange)" /> : <FaRegHeart />}
            </button>
          </div>
          <StarRating rating={product.averageRating} count={product.totalReviews} size={16} />
          <h3 className="sm-price my-3">${product.price}</h3>
          <p className="text-muted">{product.description}</p>

          {product.location?.city && (
            <p className="small text-muted"><FaMapMarkerAlt className="me-1" />{product.location.city}{product.location.country && `, ${product.location.country}`}</p>
          )}

          <div className="sm-card p-3 d-flex align-items-center gap-3 mt-3 border-0">
            <Image
              src={product.seller.profilePicture || 'https://placehold.co/60x60/E8F5E9/1E8449?text=U'}
              roundedCircle
              style={{ width: 50, height: 50, objectFit: 'cover' }}
            />
            <div>
              <Link to={`/users/${product.seller._id}`} className="fw-semibold text-decoration-none text-dark">
                {product.seller.fullName}
              </Link>
              <div><StarRating rating={product.seller.averageRating || 0} size={12} /></div>
            </div>
          </div>

          {isOwner ? (
            <div className="d-flex gap-2 mt-4">
              <Button as={Link} to={`/products/${id}/edit`} variant="outline-primary"><FaEdit className="me-2" />Edit</Button>
              <Button variant="outline-danger" onClick={handleDelete}><FaTrash className="me-2" />Delete</Button>
            </div>
          ) : (
            isAuthenticated && (
              <Button as={Link} to={`/messages?to=${product.seller._id}`} variant="primary" className="mt-4">
                Message Seller
              </Button>
            )
          )}
        </Col>
      </Row>

      <Tabs defaultActiveKey="reviews" className="mt-5">
        <Tab eventKey="reviews" title={`Reviews (${reviews.length})`}>
          <div className="py-4">
            {isAuthenticated && !isOwner && (
              <Form onSubmit={submitReview} className="sm-card p-3 mb-4 border-0">
                <h6>Leave a review</h6>
                <Form.Group className="mb-2">
                  <Form.Select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                  >
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 && 's'}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Share your experience..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                </Form.Group>
                <Button type="submit" variant="secondary" className="text-white" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </Form>
            )}

            {reviews.length === 0 ? (
              <Alert variant="light">No reviews yet. Be the first to review!</Alert>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="sm-card p-3 mb-3 border-0">
                  <div className="d-flex justify-content-between">
                    <strong>{r.reviewer.fullName}</strong>
                    <StarRating rating={r.rating} size={12} />
                  </div>
                  <p className="mb-0 text-muted small mt-1">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default ProductDetail;
