import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaEnvelope, FaHeart } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

const AppNavbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationService.getUnreadCount().then(({ data }) => setUnread(data.unreadCount)).catch(() => {});
    const interval = setInterval(() => {
      notificationService.getUnreadCount().then(({ data }) => setUnread(data.unreadCount)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="sm-navbar sticky-top py-2" collapseOnSelect>
      <Container>
        <Navbar.Brand as={Link} to="/">Smart<span>Market</span></Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/products">Products</Nav.Link>
            <Nav.Link as={Link} to="/services">Services</Nav.Link>
            {isAuthenticated && <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>}
            {isAdmin && <Nav.Link as={Link} to="/admin">Admin</Nav.Link>}
          </Nav>

          <Nav className="align-items-lg-center gap-lg-3">
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/favorites" title="Favorites"><FaHeart /></Nav.Link>
                <Nav.Link as={Link} to="/messages" title="Messages"><FaEnvelope /></Nav.Link>
                <Nav.Link as={Link} to="/notifications" title="Notifications" className="position-relative">
                  <FaBell />
                  {unread > 0 && (
                    <Badge bg="secondary" pill className="position-absolute top-0 start-100 translate-middle">{unread}</Badge>
                  )}
                </Nav.Link>
                <NavDropdown title={user?.fullName?.split(' ')[0] || 'Account'} id="account-dropdown" align="end">
                  <NavDropdown.Item as={Link} to="/profile">My Profile</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/dashboard">Dashboard</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/bookings">My Bookings</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register" className="btn btn-secondary text-white px-3 ms-lg-2">Sign Up</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
