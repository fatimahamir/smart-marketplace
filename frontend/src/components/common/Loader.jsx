import { Spinner } from 'react-bootstrap';

const Loader = ({ text = 'Loading...' }) => (
  <div className="sm-spinner-wrap flex-column">
    <Spinner animation="border" style={{ color: 'var(--sm-green)' }} />
    <p className="mt-3 text-muted">{text}</p>
  </div>
);

export default Loader;
