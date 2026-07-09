import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="sm-footer">
    <Container>
      <Row className="gy-3">
        <Col md={4}>
          <h5 className="text-white">Smart<span style={{ color: '#FFA94D' }}>Market</span></h5>
          <p className="small mb-0">A community-driven marketplace to hire trusted local services and buy from local sellers.</p>
        </Col>
        <Col md={4}>
          <h6 className="text-white">Explore</h6>
          <ul className="list-unstyled small">
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/register">Become a Seller</Link></li>
          </ul>
        </Col>
        <Col md={4}>
          <h6 className="text-white">Account</h6>
          <ul className="list-unstyled small">
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </Col>
      </Row>
      <hr className="border-secondary" />
      <p className="small mb-0 text-center">© {new Date().getFullYear()} Smart Community Marketplace. All rights reserved.</p>
    </Container>
  </footer>
);

export default Footer;
