import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaShoppingBag, 
  FaTools, 
  FaComments, 
  FaShieldAlt,
  FaBoxOpen,
  FaStar,
  FaQuoteLeft,
  FaUserCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';

// Correct imports based on your folder structure
import { productService } from '../services/productService';
import { serviceListingService } from '../services/serviceListingService';
import ProductCard from '../components/product/ProductCard';
import ServiceCard from '../components/service/ServiceCard';
import Loader from '../components/common/Loader';

const features = [
  { icon: <FaShoppingBag />, title: 'Local Marketplace', text: 'Buy and sell products within your community.' },
  { icon: <FaTools />, title: 'Trusted Services', text: 'Hire verified freelancers for any job, big or small.' },
  { icon: <FaComments />, title: 'Real-Time Chat', text: 'Message sellers and providers instantly.' },
  { icon: <FaShieldAlt />, title: 'Secure & Rated', text: 'Every listing is reviewed and rated by real users.' },
];

// Testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Sarah Ahmed',
    role: 'Freelance Designer',
    image: 'https://ui-avatars.com/api/?name=Sarah+Ahmed&background=2d8f4e&color=fff&size=60',
    text: 'Smart Market helped me find amazing clients for my design services. The platform is easy to use and the community is incredibly supportive!',
    rating: 5,
    date: '2 months ago'
  },
  {
    id: 2,
    name: 'Usman Khan',
    role: 'Small Business Owner',
    image: 'https://ui-avatars.com/api/?name=Usman+Khan&background=2d8f4e&color=fff&size=60',
    text: 'I\'ve been selling my handmade products here and the response has been overwhelming. Best decision I made for my business!',
    rating: 5,
    date: '1 month ago'
  },
  {
    id: 3,
    name: 'Ayesha Malik',
    role: 'Verified Buyer',
    image: 'https://ui-avatars.com/api/?name=Ayesha+Malik&background=2d8f4e&color=fff&size=60',
    text: 'The variety of services and products available is incredible. I found a local electrician and a graphic designer within minutes!',
    rating: 4,
    date: '3 weeks ago'
  }
];

const Home = () => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentServices, setRecentServices] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Fetch recent products
  const fetchRecentProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { data } = await productService.getAll({ page: 1, limit: 4 });
      setRecentProducts(data.products || []);
    } catch (err) {
      toast.error('Could not load recent products');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch recent services
  const fetchRecentServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const { data } = await serviceListingService.getAll({ page: 1, limit: 4 });
      setRecentServices(data.services || []);
    } catch (err) {
      toast.error('Could not load recent services');
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentProducts();
    fetchRecentServices();
  }, [fetchRecentProducts, fetchRecentServices]);

  const toggleFavorite = async (type, id) => {
    // Implement favorite toggle if needed
    toast.info('Login to save favorites');
  };

  // Helper to render section header
  const SectionHeader = ({ title, link, linkText = 'Browse More →' }) => (
    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 className="sm-section-title mb-0">{title}</h3>
      <Button as={Link} to={link} variant="outline-secondary" size="sm">
        {linkText}
      </Button>
    </div>
  );

  // Render star ratings
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar 
        key={i} 
        style={{ 
          color: i < rating ? '#ffc107' : '#e0e0e0',
          fontSize: '14px'
        }} 
      />
    ));
  };

  return (
    <Container className="py-4">
      {/* Original Hero Section - UNCHANGED */}
      <div className="sm-hero text-center mb-5">
        <h1 className="display-5">Find trusted services & products near you</h1>
        <p className="lead mb-4">Your community's marketplace for local products, professional services, and everything in between.</p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Button as={Link} to="/products" variant="light" size="lg">Browse Products</Button>
          <Button as={Link} to="/services" variant="outline-light" size="lg">Explore Services</Button>
        </div>
      </div>

      {/* NEW: Recent Products Section */}
      <div className="mt-5">
        <SectionHeader title="Latest Products" link="/products" linkText="Browse All Products →" />
        
        {loadingProducts ? (
          <Loader text="Loading products..." />
        ) : recentProducts.length === 0 ? (
          <div className="text-center py-4">
            <FaBoxOpen className="text-muted" size={40} />
            <p className="text-muted mt-2">No products available yet</p>
          </div>
        ) : (
          <Row className="g-4">
            {recentProducts.map((product) => (
              <Col key={product._id} lg={3} md={4} sm={6}>
                <ProductCard
                  product={product}
                  isFavorite={favoriteIds.has(product._id)}
                  onToggleFavorite={(id) => toggleFavorite('product', id)}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* NEW: Recent Services Section */}
      <div className="mt-5">
        <SectionHeader title="Latest Services" link="/services" linkText="Browse All Services →" />
        
        {loadingServices ? (
          <Loader text="Loading services..." />
        ) : recentServices.length === 0 ? (
          <div className="text-center py-4">
            <FaTools className="text-muted" size={40} />
            <p className="text-muted mt-2">No services available yet</p>
          </div>
        ) : (
          <Row className="g-4">
            {recentServices.map((service) => (
              <Col key={service._id} lg={3} md={4} sm={6}>
                <ServiceCard
                  service={service}
                  isFavorite={favoriteIds.has(service._id)}
                  onToggleFavorite={(id) => toggleFavorite('service', id)}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
      
      {/* Why Smart Market Section */}
      <h3 className="sm-section-title mt-5">Why Smart Market?</h3>
      <Row className="g-4">
        {features.map((f, i) => (
          <Col md={3} sm={6} key={i}>
            <div className="sm-card p-4 h-100 text-center">
              <div className="fs-1 mb-3" style={{ color: 'var(--sm-green)' }}>{f.icon}</div>
              <h5>{f.title}</h5>
              <p className="text-muted small mb-0">{f.text}</p>
            </div>
          </Col>
        ))}
      </Row>

      {/* NEW: Testimonials Section */}
      <div className="mt-5">
        <div className="text-left mb-4">
          <h3 className="sm-section-title">What Our Community Says</h3>
          <p className="text-muted">Real stories from real users who trust Smart Market</p>
        </div>
        
        <Row className="g-4">
          {testimonials.map((testimonial) => (
            <Col md={4} key={testimonial.id}>
              <Card className="h-100 border-0 shadow-sm" style={{
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
              }}>
                <Card.Body className="p-4">
                  {/* Quote Icon */}
                  <div className="mb-3" style={{ color: 'var(--sm-green)', opacity: 0.3 }}>
                    <FaQuoteLeft size={30} />
                  </div>
                  
                  {/* Testimonial Text */}
                  <p className="mb-3" style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>
                    "{testimonial.text}"
                  </p>
                  
                  {/* Rating Stars */}
                  <div className="mb-3">
                    {renderStars(testimonial.rating)}
                    <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>
                      {testimonial.date}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div className="d-flex align-items-center">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%',
                        marginRight: '12px'
                      }}
                    />
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
                        {testimonial.name}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Trust Badges */}
        <div className="mt-4 text-center">
          <div className="d-flex justify-content-center gap-4 flex-wrap" style={{ opacity: 0.6 }}>
            <span className="d-flex align-items-center gap-2">
              <FaStar style={{ color: '#ffc107' }} /> 4.8/5 Average Rating
            </span>
            <span className="d-flex align-items-center gap-2">
              <FaUserCircle style={{ color: 'var(--sm-green)' }} /> 10,000+ Happy Users
            </span>
            <span className="d-flex align-items-center gap-2">
              <FaShieldAlt style={{ color: 'var(--sm-green)' }} /> Verified Reviews
            </span>
          </div>
        </div>
      </div>

    </Container>
  );
};

export default Home;