import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Badge, Button, Image, Tab, Tabs, Form, Alert, Modal } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaEdit, FaTrash, FaClock, FaCalendarCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { serviceListingService } from '../../services/serviceListingService';
import { userService } from '../../services/userService';
import { reviewService } from '../../services/reviewService';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

import StarRating from '../../components/common/StarRating';
import Loader from '../../components/common/Loader';

const PLACEHOLDER = 'https://placehold.co/700x500/FFF4E6/F5820D?text=Service';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [service, setService] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ preferredDate: '', preferredTime: '', notes: '' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const isOwner = user && service && service.provider._id === user.id;

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: svcData }, { data: revData }] = await Promise.all([
        serviceListingService.getOne(id),
        reviewService.getForTarget('service', id),
      ]);
      setService(svcData.service);
      setReviews(revData.reviews);

      if (isAuthenticated) {
        const { data: favData } = await userService.getFavorites();
        setIsFavorite(favData.favorites.services.some((s) => s._id === id));
      }
    } catch (err) {
      toast.error('Service not found');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) return toast.info('Please login to save favorites');
    try {
      if (isFavorite) await userService.removeFavorite('service', id);
      else await userService.addFavorite('service', id);
      setIsFavorite(!isFavorite);
    } catch {
      toast.error('Could not update favorites');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this service listing permanently?')) return;
    try {
      await serviceListingService.remove(id);
      toast.success('Service deleted');
      navigate('/services');
    } catch {
      toast.error('Could not delete service');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewService.create({ targetType: 'service', targetId: id, ...reviewForm });
      toast.success('Review submitted');
      setReviewForm({ rating: 5, comment: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setBookingSubmitting(true);
    try {
      await bookingService.create({ serviceId: id, ...bookingForm });
      toast.success('Booking request sent!');
      setShowBooking(false);
      setBookingForm({ preferredDate: '', preferredTime: '', notes: '' });
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading service..." />;
  if (!service) return null;

  const images = service.portfolioImages?.length ? service.portfolioImages : [PLACEHOLDER];

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col lg={6}>
          <Image src={images[activeImg]} className="w-100 rounded-4 mb-2" style={{ height: 420, objectFit: 'cover' }} onError={(e) => (e.target.src = PLACEHOLDER)} />
          {images.length > 1 && (
            <div className="d-flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <Image key={i} src={img} onClick={() => setActiveImg(i)} className="rounded-3"
                  style={{ width: 70, height: 70, objectFit: 'cover', cursor: 'pointer', border: i === activeImg ? '2px solid var(--sm-green)' : '1px solid var(--sm-border)' }} />
              ))}
            </div>
          )}
        </Col>

        <Col lg={6}>
          <Badge className="sm-badge-category mb-2">{service.category}</Badge>
          <div className="d-flex justify-content-between align-items-start">
            <h2>{service.title}</h2>
            <button className="btn btn-light rounded-circle" onClick={toggleFavorite}>
              {isFavorite ? <FaHeart color="var(--sm-orange)" /> : <FaRegHeart />}
            </button>
          </div>
          <StarRating rating={service.averageRating} count={service.totalReviews} size={16} />
          <h3 className="sm-price my-3">
            ${service.pricing?.amount}{service.pricing?.type === 'hourly' && <small className="fs-6">/hour</small>}
          </h3>
          <p className="text-muted">{service.description}</p>

          <div className="d-flex gap-4 small text-muted mb-2">
            <span><FaClock className="me-1" />{service.deliveryTime}</span>
            <span>
              <FaCalendarCheck className="me-1" />
              {service.availability ? <span className="text-success">Available now</span> : <span className="text-danger">Currently unavailable</span>}
            </span>
          </div>

          {service.location?.city && (
            <p className="small text-muted"><FaMapMarkerAlt className="me-1" />{service.location.city}{service.location.country && `, ${service.location.country}`}</p>
          )}

          <div className="sm-card p-3 d-flex align-items-center gap-3 mt-3 border-0">
            <Image src={service.provider.profilePicture || 'https://placehold.co/60x60/FFF4E6/F5820D?text=U'} roundedCircle style={{ width: 50, height: 50, objectFit: 'cover' }} />
            <div>
              <Link to={`/users/${service.provider._id}`} className="fw-semibold text-decoration-none text-dark">{service.provider.fullName}</Link>
              <div><StarRating rating={service.provider.averageRating || 0} size={12} /></div>
            </div>
          </div>

          {isOwner ? (
            <div className="d-flex gap-2 mt-4">
              <Button as={Link} to={`/services/${id}/edit`} variant="outline-primary"><FaEdit className="me-2" />Edit</Button>
              <Button variant="outline-danger" onClick={handleDelete}><FaTrash className="me-2" />Delete</Button>
            </div>
          ) : (
            isAuthenticated && (
              <div className="d-flex gap-2 mt-4">
                <Button variant="primary" disabled={!service.availability} onClick={() => setShowBooking(true)}>
                  Request Booking
                </Button>
                <Button as={Link} to={`/messages?to=${service.provider._id}`} variant="outline-primary">Message Provider</Button>
              </div>
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
                  <Form.Select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 && 's'}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control as="textarea" rows={2} placeholder="Share your experience..." value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
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

      <Modal show={showBooking} onHide={() => setShowBooking(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Request "{service.title}"</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitBooking}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Preferred Date</Form.Label>
              <Form.Control type="date" required min={new Date().toISOString().split('T')[0]}
                value={bookingForm.preferredDate}
                onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Preferred Time</Form.Label>
              <Form.Control type="time" required
                value={bookingForm.preferredTime}
                onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes (optional)</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Any details the provider should know..."
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowBooking(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={bookingSubmitting}>
              {bookingSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ServiceDetail;
