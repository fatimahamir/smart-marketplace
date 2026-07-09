import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Row, Col, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { productService } from '../../services/productService';
import { PRODUCT_CATEGORIES } from '../../components/product/ProductFilters';

const emptyForm = {
  title: '', description: '', category: '', price: '', stock: 1, tags: '',
  location: { city: '', country: '' },
};

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    productService.getOne(id).then(({ data }) => {
      const p = data.product;
      setForm({
        title: p.title, description: p.description, category: p.category,
        price: p.price, stock: p.stock, tags: (p.tags || []).join(', '),
        location: p.location || { city: '', country: '' },
      });
      setExistingImages(p.images || []);
    }).catch(() => toast.error('Could not load product'));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city' || name === 'country') {
      setForm({ ...form, location: { ...form.location, [name]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      let productId = id;

      if (isEdit) {
        await productService.update(id, payload);
      } else {
        const { data } = await productService.create(payload);
        productId = data.product._id;
      }

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append('images', img));
        await productService.uploadImages(productId, formData);
      }

      toast.success(isEdit ? 'Product updated' : 'Product listed successfully');
      navigate(`/products/${productId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <h3 className="sm-section-title">{isEdit ? 'Edit Product' : 'Create Product Listing'}</h3>
      <Form onSubmit={handleSubmit} className="sm-card p-4 border-0">
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
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
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Price ($)</Form.Label>
              <Form.Control type="number" min="0" name="price" value={form.price} onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control type="number" min="0" name="stock" value={form.stock} onChange={handleChange} />
            </Form.Group>
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

        <Form.Group className="mb-3">
          <Form.Label>Tags (comma separated)</Form.Label>
          <Form.Control name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. handmade, new, discount" />
        </Form.Group>

        {existingImages.length > 0 && (
          <div className="mb-3">
            <Form.Label>Current Images</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              {existingImages.map((img, i) => (
                <Image key={i} src={img} style={{ width: 70, height: 70, objectFit: 'cover' }} className="rounded-3" />
              ))}
            </div>
          </div>
        )}

        <Form.Group className="mb-4">
          <Form.Label>{isEdit ? 'Add More Images' : 'Upload Images'}</Form.Label>
          <Form.Control type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} />
        </Form.Group>

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Listing'}
        </Button>
      </Form>
    </Container>
  );
};

export default ProductForm;
