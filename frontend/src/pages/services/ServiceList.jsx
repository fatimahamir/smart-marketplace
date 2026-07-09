import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaTools, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { serviceListingService } from '../../services/serviceListingService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

import ServiceCard from '../../components/service/ServiceCard';
import ServiceFilters from '../../components/service/ServiceFilters';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const initialFilters = { keyword: '', category: '', city: '', minPrice: '', maxPrice: '', sort: '' };

const ServiceList = () => {
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await serviceListingService.getAll(params);
      setServices(data.services);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Could not load services');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  useEffect(() => {
    if (!isAuthenticated) return;
    userService.getFavorites().then(({ data }) => {
      setFavoriteIds(new Set(data.favorites.services.map((s) => s._id)));
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchServices();
  };

  const toggleFavorite = async (serviceId) => {
    if (!isAuthenticated) return toast.info('Please login to save favorites');
    const isFav = favoriteIds.has(serviceId);
    try {
      if (isFav) {
        await userService.removeFavorite('service', serviceId);
        setFavoriteIds((prev) => { const next = new Set(prev); next.delete(serviceId); return next; });
      } else {
        await userService.addFavorite('service', serviceId);
        setFavoriteIds((prev) => new Set(prev).add(serviceId));
      }
    } catch {
      toast.error('Could not update favorites');
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="sm-section-title mb-0">Service Marketplace</h3>
        {isAuthenticated && (
          <Button as={Link} to="/services/new" variant="secondary" className="text-white">
            <FaPlus className="me-2" />Offer a Service
          </Button>
        )}
      </div>

      <ServiceFilters filters={filters} onChange={setFilters} onSubmit={handleFilterSubmit} />

      {loading ? (
        <Loader text="Loading services..." />
      ) : services.length === 0 ? (
        <EmptyState icon={<FaTools />} title="No services found" text="Try adjusting your filters or check back later." />
      ) : (
        <>
          <Row className="g-4">
            {services.map((s) => (
              <Col key={s._id} lg={3} md={4} sm={6}>
                <ServiceCard service={s} isFavorite={favoriteIds.has(s._id)} onToggleFavorite={toggleFavorite} />
              </Col>
            ))}
          </Row>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </Container>
  );
};

export default ServiceList;
