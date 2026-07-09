import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sm-auth-wrapper">
      <div className="sm-auth-card">
        <h2 className="mb-1">Welcome back</h2>
        <p className="text-muted mb-4">Login to continue to your account</p>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" name="password" value={form.password} onChange={handleChange} placeholder="Your password" required />
          </Form.Group>

          <div className="text-end mb-3">
            <Link to="/forgot-password" className="small" style={{ color: 'var(--sm-green)' }}>Forgot password?</Link>
          </div>

          <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </Button>
        </Form>

        <p className="text-center mt-4 mb-0 small">
          Don't have an account? <Link to="/register" style={{ color: 'var(--sm-orange)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
