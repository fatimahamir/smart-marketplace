import { useState, useEffect } from 'react';
import { Container, Button, Badge } from 'react-bootstrap';
import { FaBell, FaCheckDouble, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { notificationService } from '../services/notificationService';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const TYPE_LABELS = {
  booking_request: 'Booking Request',
  booking_status: 'Booking Update',
  new_message: 'New Message',
  new_review: 'New Review',
  listing_approval: 'Listing Approval',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await notificationService.getAll({ limit: 50 });
      setNotifications(data.notifications);
    } catch {
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await notificationService.markAllAsRead();
    load();
  };

  const markRead = async (id) => {
    await notificationService.markAsRead(id);
    load();
  };

  const remove = async (id) => {
    await notificationService.remove(id);
    load();
  };

  if (loading) return <Loader text="Loading notifications..." />;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="sm-section-title mb-0">Notifications</h3>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="outline-primary" size="sm" onClick={markAllRead}>
            <FaCheckDouble className="me-2" />Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<FaBell />} title="No notifications" text="You're all caught up!" />
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            className="sm-card p-3 mb-2 border-0 d-flex justify-content-between align-items-center"
            style={{ background: n.isRead ? '#fff' : 'var(--sm-green-tint)', cursor: 'pointer' }}
            onClick={() => !n.isRead && markRead(n._id)}
          >
            <div>
              <Badge className="sm-badge-category mb-1">{TYPE_LABELS[n.type] || n.type}</Badge>
              <p className="mb-0">{n.message}</p>
              <small className="text-muted">{new Date(n.createdAt).toLocaleString()}</small>
            </div>
            <Button variant="link" className="text-danger" onClick={(e) => { e.stopPropagation(); remove(n._id); }}>
              <FaTrash />
            </Button>
          </div>
        ))
      )}
    </Container>
  );
};

export default Notifications;
