import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Image, Form, Button, Tab, Tabs } from 'react-bootstrap';
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/common/StarRating';
import ProductCard from '../components/product/ProductCard';
import ServiceCard from '../components/service/ServiceCard';
import Loader from '../components/common/Loader';

const PLACEHOLDER = 'https://placehold.co/150x150/E8F5E9/1E8449?text=User';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const profileId = id || currentUser?.id;
  const isOwnProfile = !id || id === currentUser?.id;

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState({ products: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', bio: '', phone: '', skills: '', city: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await userService.getProfile(profileId);
      setProfile(data.user);
      setListings(data.activeListings);
      setForm({
        fullName: data.user.fullName,
        bio: data.user.bio || '',
        phone: data.user.phone || '',
        skills: (data.user.skills || []).join(', '),
        city: data.user.location?.city || '',
        country: data.user.location?.country || '',
      });
    } catch {
      toast.error('Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (profileId) load(); /* eslint-disable-next-line */ }, [profileId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userService.updateProfile({
        fullName: form.fullName,
        bio: form.bio,
        phone: form.phone,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        location: { city: form.city, country: form.country },
      });
      setProfile(data.user);
      setUser(data.user);
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await userService.uploadProfilePicture(formData);
      setProfile(data.user);
      setUser(data.user);
      toast.success('Profile picture updated');
    } catch {
      toast.error('Could not upload picture');
    } finally {
      setUploadingPic(false);
    }
  };

  if (loading) return <Loader text="Loading profile..." />;
  if (!profile) return null;

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col md={4}>
          <div className="sm-card p-4 text-center border-0">
            <div className="position-relative d-inline-block mb-3">
              <Image src={profile.profilePicture || PLACEHOLDER} roundedCircle style={{ width: 130, height: 130, objectFit: 'cover' }} />
              {isOwnProfile && (
                <label className="btn btn-sm btn-secondary text-white rounded-circle position-absolute bottom-0 end-0" style={{ cursor: 'pointer' }}>
                  <FaCamera />
                  <input type="file" accept="image/*" hidden onChange={handlePictureUpload} disabled={uploadingPic} />
                </label>
              )}
            </div>
            <h4>{profile.fullName}</h4>
            <StarRating rating={profile.averageRating} count={profile.totalReviews} />
            {profile.location?.city && (
              <p className="small text-muted mt-2"><FaMapMarkerAlt className="me-1" />{profile.location.city}{profile.location.country && `, ${profile.location.country}`}</p>
            )}
            {profile.bio && <p className="small mt-2">{profile.bio}</p>}
            {profile.skills?.length > 0 && (
              <div className="d-flex flex-wrap gap-1 justify-content-center mt-2">
                {profile.skills.map((s, i) => <span key={i} className="sm-badge-category">{s}</span>)}
              </div>
            )}
            {isOwnProfile && (
              <Button variant="outline-primary" size="sm" className="mt-3" onClick={() => setEditing(!editing)}>
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
            )}
          </div>

          {editing && (
            <Form onSubmit={handleSave} className="sm-card p-3 mt-3 border-0">
              <Form.Group className="mb-2">
                <Form.Label className="small">Full Name</Form.Label>
                <Form.Control value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small">Bio</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small">Phone</Form.Label>
                <Form.Control value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small">Skills (comma separated)</Form.Label>
                <Form.Control value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              </Form.Group>
              <Row>
                <Col>
                  <Form.Group className="mb-2">
                    <Form.Label className="small">City</Form.Label>
                    <Form.Control value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Country</Form.Label>
                    <Form.Control value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>
              <Button type="submit" variant="primary" className="w-100 mt-2" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Form>
          )}
        </Col>

        <Col md={8}>
          <Tabs defaultActiveKey="products" className="sm-tab-nav mb-3">
            <Tab eventKey="products" title={`Products (${listings.products.length})`}>
              <Row className="g-3 mt-1">
                {listings.products.map((p) => <Col key={p._id} md={4} sm={6}><ProductCard product={p} /></Col>)}
              </Row>
            </Tab>
            <Tab eventKey="services" title={`Services (${listings.services.length})`}>
              <Row className="g-3 mt-1">
                {listings.services.map((s) => <Col key={s._id} md={4} sm={6}><ServiceCard service={s} /></Col>)}
              </Row>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
