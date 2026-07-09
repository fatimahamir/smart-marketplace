import { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, ButtonGroup, Button } from 'react-bootstrap';
import { FaCalendarCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { bookingService } from '../services/bookingService';
import BookingCard from '../components/booking/BookingCard';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const STATUS_TABS = ['all', 'pending', 'accepted', 'completed', 'cancelled', 'rejected'];

const Bookings = () => {
  const [role, setRole] = useState('buyer');
  const [status, setStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role };
      if (status !== 'all') params.status = status;
      const { data } = await bookingService.getMy(params);
      setBookings(data.bookings);
    } catch {
      toast.error('Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, [role, status]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (action, id, ...args) => {
    try {
      await action(id, ...args);
      toast.success('Booking updated');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <Container className="py-4">
      <h3 className="sm-section-title">My Bookings</h3>

      <Tabs activeKey={role} onSelect={(k) => setRole(k)} className="sm-tab-nav mb-3">
        <Tab eventKey="buyer" title="As Buyer" />
        <Tab eventKey="provider" title="As Provider" />
      </Tabs>

      <ButtonGroup className="mb-4 flex-wrap">
        {STATUS_TABS.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? 'primary' : 'outline-primary'}
            onClick={() => setStatus(s)}
            className="text-capitalize"
          >
            {s}
          </Button>
        ))}
      </ButtonGroup>

      {loading ? (
        <Loader text="Loading bookings..." />
      ) : bookings.length === 0 ? (
        <EmptyState icon={<FaCalendarCheck />} title="No bookings found" text="Nothing here yet." />
      ) : (
        bookings.map((b) => (
          <BookingCard
            key={b._id}
            booking={b}
            role={role}
            onAccept={(id) => handleAction(bookingService.accept, id)}
            onReject={(id) => handleAction(bookingService.reject, id)}
            onComplete={(id) => handleAction(bookingService.complete, id)}
            onCancel={(id) => handleAction(bookingService.cancel, id)}
          />
        ))
      )}
    </Container>
  );
};

export default Bookings;
