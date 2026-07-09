import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const EmptyState = ({ icon, title, text, actionText, actionTo }) => (
  <div className="text-center py-5">
    <div className="fs-1 mb-3 text-muted">{icon}</div>
    <h5>{title}</h5>
    <p className="text-muted">{text}</p>
    {actionText && actionTo && (
      <Button as={Link} to={actionTo} variant="primary" className="mt-2">
        {actionText}
      </Button>
    )}
  </div>
);

export default EmptyState;
