// src/pages/landlord/CreateListingPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusSquare, MapPin, Upload, X, ShieldAlert, Sparkles } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LandlordSidebar from '../../components/LandlordSidebar';
import MapboxLocationPicker from '../../components/MapboxLocationPicker';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NEIGHBORHOODS = ['Adweso', 'Nsukwao', 'Effiduase', 'Oyoko', 'Ashanti Nkwanta', 'Akwadum'];
const ROOM_TYPES = ['Single', 'Shared', 'Self-contained', 'Apartment'];
const AMENITIES_LIST = ['Water Flow', 'Electricity (Prepaid)', 'WiFi Internet', 'Generator Backup', 'Study Room', 'Fenced Yard', 'Security Guard', 'Air Conditioner'];

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600'
];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [roomType, setRoomType] = useState('');
  const [price, setPrice] = useState('');
  const [occupancy, setOccupancy] = useState('1');
  const [description, setDescription] = useState('');
  
  // Coordinate states
  const [lat, setLat] = useState('6.0900');
  const [lng, setLng] = useState('-0.2573');

  // Amenities and images states
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const handleCoordsChange = (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
  };

  const handleAmenityChange = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handlePhotoUploadMock = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedUrls.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images.');
      return;
    }

    const newUrls = [];
    for (let i = 0; i < files.length; i++) {
      const idx = (uploadedUrls.length + i) % MOCK_PHOTOS.length;
      newUrls.push(MOCK_PHOTOS[idx]);
    }

    setUploadedUrls([...uploadedUrls, ...newUrls]);
    toast.success(`${files.length} photo(s) selected (Dev Mode: placeholders used)`);
  };

  const handleRemovePhoto = (index) => {
    setUploadedUrls(uploadedUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!neighborhood) return toast.error('Please select a neighborhood.');
    if (!roomType) return toast.error('Please select a room type.');
    if (uploadedUrls.length === 0) return toast.error('Please add at least 1 property photo.');

    try {
      setLoading(true);
      await api.post('/properties', {
        title,
        address,
        neighborhood,
        room_type: roomType,
        price_per_semester: parseFloat(price),
        max_occupancy: parseInt(occupancy),
        description,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        amenities: selectedAmenities,
        image_urls: uploadedUrls
      });

      toast.success('Listing created and submitted for admin review!');
      navigate('/landlord/listings');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit listing.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <LandlordSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0" style={{ maxWidth: '900px' }}>
            
            {/* Header */}
            <div className="mb-4">
              <h2 className="mb-1">Create Property Listing</h2>
              <p className="text-muted-custom mb-0">List a new hostel room. It will require administrator verification before it is visible.</p>
            </div>
            
            <hr className="divider-orange mb-4" />

            <form onSubmit={handleSubmit} className="row g-4">
              
              {/* Column 1: Details */}
              <div className="col-md-7">
                <div className="card p-4 border-custom bg-surface rounded-custom d-flex flex-column gap-3">
                  <h5 className="mb-0" style={{ fontFamily: 'Outfit,sans-serif' }}>Listing Details</h5>

                  <div>
                    <label className="form-label">Property Title</label>
                    <input type="text" className="form-control" required placeholder="e.g. Asantewaa Villa (Self-contain)" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>

                  <div>
                    <label className="form-label">Physical Address</label>
                    <input type="text" className="form-control" required placeholder="e.g. 15 Adweso High St, near Shell" value={address} onChange={e => setAddress(e.target.value)} />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label">Neighborhood</label>
                      <select className="form-select" required value={neighborhood} onChange={e => setNeighborhood(e.target.value)}>
                        <option value="">Select Neighborhood</option>
                        {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Room Type</label>
                      <select className="form-select" required value={roomType} onChange={e => setRoomType(e.target.value)}>
                        <option value="">Select Room Type</option>
                        {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label">Price per Semester (GHS)</label>
                      <input type="number" className="form-control" required placeholder="e.g. 1500" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Max Occupancy</label>
                      <input type="number" className="form-control" required min="1" value={occupancy} onChange={e => setOccupancy(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows="4" placeholder="Describe the hostel, security features, distance from main road..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
                  </div>
                </div>
              </div>

              {/* Column 2: Uploads & Amenities & Map */}
              <div className="col-md-5 d-flex flex-column gap-4">
                
                {/* Image Upload Widget */}
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <h5 className="mb-2 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit,sans-serif' }}>
                    <Upload size={18} className="text-orange" /> Property Photos
                  </h5>
                  <p className="text-muted-custom mb-3" style={{ fontSize: '0.8rem' }}>Upload up to 5 photos (Min 1 required).</p>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {uploadedUrls.map((url, i) => (
                      <div key={i} className="position-relative" style={{ width: '70px', height: '55px', borderRadius: '6px', overflow: 'hidden' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" className="btn btn-sm bg-danger text-white p-0 position-absolute top-0 end-0 m-0.5 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '18px', height: '18px' }} onClick={() => handleRemovePhoto(i)}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {uploadedUrls.length < 5 && (
                      <label className="d-flex flex-column align-items-center justify-content-center border-custom bg-surface-2 rounded-custom cursor-pointer" style={{ width: '70px', height: '55px', border: '1px dashed var(--border)' }}>
                        <Upload size={14} className="text-muted-custom" />
                        <input type="file" multiple accept="image/*" className="d-none" onChange={handlePhotoUploadMock} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Amenities checklist */}
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <h5 className="mb-2" style={{ fontFamily: 'Outfit,sans-serif' }}>Amenities</h5>
                  <div className="row g-2">
                    {AMENITIES_LIST.map(amenity => (
                      <div key={amenity} className="col-12 col-sm-6">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={amenity} 
                            checked={selectedAmenities.includes(amenity)}
                            onChange={() => handleAmenityChange(amenity)}
                          />
                          <label className="form-check-label text-muted-custom" style={{ fontSize: '0.82rem' }} htmlFor={amenity}>
                            {amenity}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mapbox coordinates picker */}
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <h5 className="mb-2 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit,sans-serif' }}>
                    <MapPin size={18} className="text-gold" /> Mapbox Location Pin
                  </h5>
                  <p className="text-muted-custom mb-3" style={{ fontSize: '0.8rem' }}>Click or drag pin on the map to pinpoint hostel location.</p>
                  
                  <div className="mb-3">
                    <MapboxLocationPicker
                      lat={lat}
                      lng={lng}
                      onChangeCoords={handleCoordsChange}
                      height="210px"
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Latitude</label>
                      <input type="number" step="0.000001" className="form-control form-control-sm" required value={lat} onChange={e => handleCoordsChange(e.target.value, lng)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Longitude</label>
                      <input type="number" step="0.000001" className="form-control form-control-sm" required value={lng} onChange={e => handleCoordsChange(lat, e.target.value)} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Form submit */}
              <div className="col-12">
                <button type="submit" className="btn btn-primary w-100 py-2.5" disabled={loading}>
                  {loading ? 'Submitting Listing...' : 'Submit Listing for Approval'}
                </button>
              </div>

            </form>

          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
