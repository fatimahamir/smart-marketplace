import { useState, useEffect } from 'react';
import { Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { userService } from '../services/userService';
import ProductCard from '../components/product/ProductCard';
import ServiceCard from '../components/service/ServiceCard';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const Favorites = () => {
  const [favorites, setFavorites] = useState({ products: [], services: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await userService.getFavorites();
      setFavorites(data.favorites);
    } catch {
      toast.error('Could not load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const removeFavorite = async (type, id) => {
    try {
      await userService.removeFavorite(type, id);
      load();
    } catch {
      toast.error('Could not remove favorite');
    }
  };

  if (loading) return <Loader text="Loading favorites..." />;

  return (
    <Container className="py-4">
      <h3 className="sm-section-title">My Favorites</h3>

      <Tabs defaultActiveKey="products" className="sm-tab-nav mb-3">
        <Tab eventKey="products" title={`Products (${favorites.products.length})`}>
          <div className="py-3">
            {favorites.products.length === 0 ? (
              <EmptyState icon={<FaHeart />} title="No favorite products" text="Save products you love to find them here." actionText="Browse Products" actionTo="/products" />
            ) : (
              <Row className="g-3">
                {favorites.products.map((p) => (
                  <Col key={p._id} md={3} sm={6}>
                    <ProductCard product={p} isFavorite onToggleFavorite={(id) => removeFavorite('product', id)} />
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </Tab>
        <Tab eventKey="services" title={`Services (${favorites.services.length})`}>
          <div className="py-3">
            {favorites.services.length === 0 ? (
              <EmptyState icon={<FaHeart />} title="No favorite services" text="Save services you love to find them here." actionText="Browse Services" actionTo="/services" />
            ) : (
              <Row className="g-3">
                {favorites.services.map((s) => (
                  <Col key={s._id} md={3} sm={6}>
                    <ServiceCard service={s} isFavorite onToggleFavorite={(id) => removeFavorite('service', id)} />
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Favorites;
