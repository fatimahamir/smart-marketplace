import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Row, Col, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { serviceListingService } from '../../services/serviceListingService';
import { SERVICE_CATEGORIES } from '../../components/service/ServiceFilters';

const emptyForm = {
  title: '', description: '', category: '',
  pricing: { amount: '', type: 'fixed' },
  deliveryTime: '', availability: true,
  location: { city: '', country: '' },
};

const ServiceForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    serviceListingService.getOne(id).then(({ data }) => {
      const s = data.service;
      setForm({
        title: s.title, description: s.description, category: s.category,
        pricing: s.pricing, deliveryTime: s.deliveryTime, availability: s.availability,
        location: s.location || { city: '', country: '' },
      });
      setExistingImages(s.portfolioImages || []);
    }).catch(() => toast.error('Could not load service'));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'amount' || name === 'pricingType') {
      setForm({ ...form, pricing: { ...form.pricing, [name === 'amount' ? 'amount' : 'type']: value } });
    } else if (name === 'city' || name === 'country') {
      setForm({ ...form, location: { ...form.location, [name]: value } });
    } else if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, pricing: { ...form.pricing, amount: Number(form.pricing.amount) } };
      let serviceId = id;

      if (isEdit) {
        await serviceListingService.update(id, payload);
      } else {
        const { data } = await serviceListingService.create(payload);
        serviceId = data.service._id;
      }

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append('images', img));
        await serviceListingService.uploadImages(serviceId, formData);
      }

      toast.success(isEdit ? 'Service updated' : 'Service listed successfully');
      navigate(`/services/${serviceId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <h3 className="sm-section-title">{isEdit ? 'Edit Service' : 'Offer a New Service'}</h3>
      <Form onSubmit={handleSubmit} className="sm-card p-4 border-0">
        <Form.Group className="mb-3">
          <Form.Label>Service Title</Form.Label>
          <Form.Control name="title" value={form.title} onChange={handleChange} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" rows={4} name="description" value={form.description} onChange={handleChange} required />
        </Form.Group>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Price ($)</Form.Label>
              <Form.Control type="number" min="0" name="amount" value={form.pricing.amount} onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Pricing Type</Form.Label>
              <Form.Select name="pricingType" value={form.pricing.type} onChange={handleChange}>
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Estimated Delivery Time</Form.Label>
              <Form.Control name="deliveryTime" value={form.deliveryTime} onChange={handleChange} placeholder="e.g. 3 days" required />
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex align-items-center">
            <Form.Check
              type="switch"
              id="availability-switch"
              name="availability"
              label="Currently available for bookings"
              checked={form.availability}
              onChange={handleChange}
              className="mt-4"
            />
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control name="city" value={form.location.city} onChange={handleChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Control name="country" value={form.location.country} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        {existingImages.length > 0 && (
          <div className="mb-3">
            <Form.Label>Current Portfolio Images</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              {existingImages.map((img, i) => (
                <Image key={i} src={img} style={{ width: 70, height: 70, objectFit: 'cover' }} className="rounded-3" />
              ))}
            </div>
          </div>
        )}

        <Form.Group className="mb-4">
          <Form.Label>{isEdit ? 'Add More Portfolio Images' : 'Upload Portfolio Images'}</Form.Label>
          <Form.Control type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} />
        </Form.Group>

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update Service' : 'Publish Service'}
        </Button>
      </Form>
    </Container>
  );
};

export default ServiceForm;
