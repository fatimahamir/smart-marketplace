import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { productService } from '../../services/productService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

import ProductCard from '../../components/product/ProductCard';
import ProductFilters from '../../components/product/ProductFilters';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const initialFilters = { keyword: '', category: '', city: '', minPrice: '', maxPrice: '', sort: '' };

const ProductList = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await productService.getAll(params);
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (!isAuthenticated) return;
    userService.getFavorites().then(({ data }) => {
      setFavoriteIds(new Set(data.favorites.products.map((p) => p._id)));
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const toggleFavorite = async (productId) => {
    if (!isAuthenticated) return toast.info('Please login to save favorites');
    const isFav = favoriteIds.has(productId);
    try {
      if (isFav) {
        await userService.removeFavorite('product', productId);
        setFavoriteIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
      } else {
        await userService.addFavorite('product', productId);
        setFavoriteIds((prev) => new Set(prev).add(productId));
      }
    } catch {
      toast.error('Could not update favorites');
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="sm-section-title mb-0">Product Marketplace</h3>
        {isAuthenticated && (
          <Button as={Link} to="/products/new" variant="secondary" className="text-white">
            <FaPlus className="me-2" />Sell a Product
          </Button>
        )}
      </div>

      <ProductFilters filters={filters} onChange={setFilters} onSubmit={handleFilterSubmit} />

      {loading ? (
        <Loader text="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<FaBoxOpen />}
          title="No products found"
          text="Try adjusting your filters or check back later."
        />
      ) : (
        <>
          <Row className="g-4">
            {products.map((p) => (
              <Col key={p._id} lg={3} md={4} sm={6}>
                <ProductCard
                  product={p}
                  isFavorite={favoriteIds.has(p._id)}
                  onToggleFavorite={toggleFavorite}
                />
              </Col>
            ))}
          </Row>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </Container>
  );
};

export default ProductList;
