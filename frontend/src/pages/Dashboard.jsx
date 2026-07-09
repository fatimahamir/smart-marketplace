import { useState, useEffect } from 'react';
import { Container, Row, Col, Tab, Tabs, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaTools, FaCalendarCheck, FaDollarSign, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import ServiceCard from '../components/service/ServiceCard';
import BookingCard from '../components/booking/BookingCard';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { bookingService } from '../services/bookingService';

const StatCard = ({ icon, label, value, color }) => (
  <div className="sm-card p-3 d-flex align-items-center gap-3 border-0">
    <div className="fs-3" style={{ color }}>{icon}</div>
    <div>
      <div className="text-muted small">{label}</div>
      <div className="fs-4 fw-bold">{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await userService.getDashboard();
      setDashboard(data.dashboard);
    } catch {
      toast.error('Could not load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (action, id, ...args) => {
    try {
      await action(id, ...args);
      toast.success('Updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <Loader text="Loading your dashboard..." />;
  if (!dashboard) return null;

  const { activeListings, serviceRequests, bookingHistory, earnings, recentNotifications } = dashboard;

  return (
    <Container className="py-4">
      <h3 className="sm-section-title">Welcome back, {user?.fullName?.split(' ')[0]}!</h3>

      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <StatCard icon={<FaBoxOpen />} label="Active Products" value={activeListings.products.length} color="var(--sm-green)" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon={<FaTools />} label="Active Services" value={activeListings.services.length} color="var(--sm-green)" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon={<FaCalendarCheck />} label="Pending Requests" value={serviceRequests.length} color="var(--sm-orange)" />
        </Col>
        <Col md={3} sm={6}>
          <StatCard icon={<FaDollarSign />} label="Earnings (est.)" value={`$${earnings}`} color="var(--sm-orange)" />
        </Col>
      </Row>

      <Tabs defaultActiveKey="listings" className="sm-tab-nav mb-3">
        <Tab eventKey="listings" title="My Listings">
          <div className="py-3">
            <h6>Products</h6>
            {activeListings.products.length === 0 ? (
              <EmptyState icon={<FaBoxOpen />} title="No products yet" text="Start selling today." actionText="Create Listing" actionTo="/products/new" />
            ) : (
              <Row className="g-3 mb-4">
                {activeListings.products.map((p) => (
                  <Col key={p._id} md={3} sm={6}><ProductCard product={p} /></Col>
                ))}
              </Row>
            )}

            <h6>Services</h6>
            {activeListings.services.length === 0 ? (
              <EmptyState icon={<FaTools />} title="No services yet" text="Start offering your skills." actionText="Create Listing" actionTo="/services/new" />
            ) : (
              <Row className="g-3">
                {activeListings.services.map((s) => (
                  <Col key={s._id} md={3} sm={6}><ServiceCard service={s} /></Col>
                ))}
              </Row>
            )}
          </div>
        </Tab>

        <Tab eventKey="requests" title={<>Service Requests {serviceRequests.length > 0 && <Badge bg="secondary">{serviceRequests.length}</Badge>}</>}>
          <div className="py-3">
            {serviceRequests.length === 0 ? (
              <EmptyState icon={<FaCalendarCheck />} title="No pending requests" text="You're all caught up." />
            ) : (
              serviceRequests.map((b) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  role="provider"
                  onAccept={(id) => handleAction(bookingService.accept, id)}
                  onReject={(id) => handleAction(bookingService.reject, id)}
                  onComplete={(id) => handleAction(bookingService.complete, id)}
                  onCancel={(id) => handleAction(bookingService.cancel, id)}
                />
              ))
            )}
          </div>
        </Tab>

        <Tab eventKey="notifications" title="Recent Activity">
          <div className="py-3">
            {recentNotifications.length === 0 ? (
              <EmptyState icon={<FaBell />} title="No recent activity" text="Notifications will show up here." />
            ) : (
              recentNotifications.map((n) => (
                <div key={n._id} className="sm-card p-3 mb-2 border-0 d-flex justify-content-between">
                  <span>{n.message}</span>
                  <small className="text-muted">{new Date(n.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            )}
            <div className="text-center mt-3">
              <Link to="/notifications" className="small">View all notifications →</Link>
            </div>
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Dashboard;
