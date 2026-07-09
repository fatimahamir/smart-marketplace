import { useState, useEffect } from 'react';
import { Container, Row, Col, Tabs, Tab, Table, Button, Form, Badge, Image } from 'react-bootstrap';
import { FaUsers, FaBoxOpen, FaCalendarCheck, FaStar, FaDollarSign, FaFlag } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const StatBox = ({ icon, label, value, color }) => (
  <div className="sm-card p-3 d-flex align-items-center gap-3 border-0">
    <div className="fs-3" style={{ color }}>{icon}</div>
    <div>
      <div className="text-muted small">{label}</div>
      <div className="fs-4 fw-bold">{value}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [pending, setPending] = useState({ products: [], services: [] });
  const [reportedReviews, setReportedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [{ data: s }, { data: u }, { data: p }, { data: r }] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers({ limit: 50 }),
        adminService.getPendingListings(),
        adminService.getReportedReviews(),
      ]);
      setStats(s.stats);
      setUsers(u.users);
      setPending({ products: p.products, services: p.services });
      setReportedReviews(r.reviews);
    } catch {
      toast.error('Could not load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const searchUsers = async () => {
    const { data } = await adminService.getUsers({ keyword: userSearch, limit: 50 });
    setUsers(data.users);
  };

  const toggleSuspend = async (u) => {
    try {
      if (u.isSuspended) await adminService.unsuspendUser(u._id);
      else await adminService.suspendUser(u._id);
      toast.success('User updated');
      searchUsers();
    } catch {
      toast.error('Action failed');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user and their listings?')) return;
    try {
      await adminService.deleteUser(id);
      toast.success('User deleted');
      searchUsers();
    } catch {
      toast.error('Could not delete user');
    }
  };

  const approveListing = async (type, id) => {
    await adminService.approveListing(type, id);
    toast.success('Listing approved');
    loadAll();
  };

  const removeListing = async (type, id) => {
    await adminService.removeListing(type, id);
    toast.success('Listing removed');
    loadAll();
  };

  const dismissReport = async (id) => {
    await adminService.dismissReport(id);
    toast.success('Report dismissed');
    loadAll();
  };

  const removeReview = async (id) => {
    await adminService.removeReportedReview(id);
    toast.success('Review removed');
    loadAll();
  };

  if (loading) return <Loader text="Loading admin panel..." />;

  return (
    <Container fluid className="py-4 px-4">
      <h3 className="sm-section-title">Admin Panel</h3>

      <Row className="g-3 mb-4">
        <Col md={2} sm={6}><StatBox icon={<FaUsers />} label="Users" value={stats.users.total} color="var(--sm-green)" /></Col>
        <Col md={2} sm={6}><StatBox icon={<FaBoxOpen />} label="Products" value={stats.products.total} color="var(--sm-green)" /></Col>
        <Col md={2} sm={6}><StatBox icon={<FaBoxOpen />} label="Services" value={stats.services.total} color="var(--sm-green)" /></Col>
        <Col md={2} sm={6}><StatBox icon={<FaCalendarCheck />} label="Bookings" value={stats.bookings.total} color="var(--sm-orange)" /></Col>
        <Col md={2} sm={6}><StatBox icon={<FaDollarSign />} label="Revenue" value={`$${stats.totalRevenue}`} color="var(--sm-orange)" /></Col>
        <Col md={2} sm={6}><StatBox icon={<FaFlag />} label="Reported" value={stats.reviews.reported} color="#dc3545" /></Col>
      </Row>

      <Tabs defaultActiveKey="users" className="sm-tab-nav mb-3">
        <Tab eventKey="users" title="Manage Users">
          <div className="py-3">
            <Form.Control
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              className="mb-3"
              style={{ maxWidth: 350 }}
            />
            <div className="sm-card border-0 p-2">
              <Table hover responsive className="mb-0 align-middle">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td className="text-capitalize">{u.role}</td>
                      <td>{u.isSuspended ? <Badge bg="danger">Suspended</Badge> : <Badge bg="success">Active</Badge>}</td>
                      <td className="d-flex gap-2">
                        <Button size="sm" variant={u.isSuspended ? 'outline-primary' : 'outline-danger'} onClick={() => toggleSuspend(u)}>
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => deleteUser(u._id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </Tab>

        <Tab eventKey="listings" title={`Pending Listings (${pending.products.length + pending.services.length})`}>
          <div className="py-3">
            {pending.products.length === 0 && pending.services.length === 0 ? (
              <EmptyState icon={<FaBoxOpen />} title="Nothing pending" text="All listings are approved." />
            ) : (
              <>
                {pending.products.map((p) => (
                  <div key={p._id} className="sm-card p-3 mb-2 border-0 d-flex justify-content-between align-items-center">
                    <div><strong>{p.title}</strong> <span className="text-muted small">by {p.seller?.fullName}</span></div>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => approveListing('product', p._id)}>Approve</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => removeListing('product', p._id)}>Remove</Button>
                    </div>
                  </div>
                ))}
                {pending.services.map((s) => (
                  <div key={s._id} className="sm-card p-3 mb-2 border-0 d-flex justify-content-between align-items-center">
                    <div><strong>{s.title}</strong> <span className="text-muted small">by {s.provider?.fullName}</span></div>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => approveListing('service', s._id)}>Approve</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => removeListing('service', s._id)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Tab>

        <Tab eventKey="reports" title={`Reported Reviews (${reportedReviews.length})`}>
          <div className="py-3">
            {reportedReviews.length === 0 ? (
              <EmptyState icon={<FaStar />} title="No reported reviews" text="Nothing to moderate right now." />
            ) : (
              reportedReviews.map((r) => (
                <div key={r._id} className="sm-card p-3 mb-2 border-0">
                  <div className="d-flex justify-content-between">
                    <strong>{r.reviewer?.fullName}</strong>
                    <span>{r.rating} ★</span>
                  </div>
                  <p className="small text-muted mb-1">{r.comment}</p>
                  <p className="small text-danger mb-2">Report reason: {r.reportReason}</p>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => dismissReport(r._id)}>Dismiss Report</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => removeReview(r._id)}>Remove Review</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminDashboard;
