import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <Container className="text-center py-5">
    <h1 style={{ color: 'var(--sm-green)', fontSize: '5rem' }}>404</h1>
    <p className="lead">The page you're looking for doesn't exist.</p>
    <Button as={Link} to="/" variant="primary">Go Home</Button>
  </Container>
);

export default NotFound;
