import { Form, Row, Col, Button } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const CATEGORIES = [
  'Graphic Designing', 'Web Development', 'Photography', 'Home Services',
  'Tutoring', 'Content Writing', 'Digital Marketing', 'Video Editing', 'Other',
];

const ServiceFilters = ({ filters, onChange, onSubmit }) => {
  const handle = (e) => onChange({ ...filters, [e.target.name]: e.target.value });

  return (
    <Form onSubmit={onSubmit} className="sm-card p-3 mb-4 border-0">
      <Row className="g-2 align-items-end">
        <Col md={3}>
          <Form.Label className="small mb-1">Search</Form.Label>
          <Form.Control name="keyword" value={filters.keyword} onChange={handle} placeholder="What service do you need?" />
        </Col>
        <Col md={2}>
          <Form.Label className="small mb-1">Category</Form.Label>
          <Form.Select name="category" value={filters.category} onChange={handle}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Label className="small mb-1">City</Form.Label>
          <Form.Control name="city" value={filters.city} onChange={handle} placeholder="Any city" />
        </Col>
        <Col md={1}>
          <Form.Label className="small mb-1">Min $</Form.Label>
          <Form.Control name="minPrice" type="number" min="0" value={filters.minPrice} onChange={handle} />
        </Col>
        <Col md={1}>
          <Form.Label className="small mb-1">Max $</Form.Label>
          <Form.Control name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={handle} />
        </Col>
        <Col md={2}>
          <Form.Label className="small mb-1">Sort</Form.Label>
          <Form.Select name="sort" value={filters.sort} onChange={handle}>
            <option value="">Latest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Most Popular</option>
          </Form.Select>
        </Col>
        <Col md={1}>
          <Button type="submit" variant="primary" className="w-100"><FaSearch /></Button>
        </Col>
      </Row>
    </Form>
  );
};

export default ServiceFilters;
export { CATEGORIES as SERVICE_CATEGORIES };
