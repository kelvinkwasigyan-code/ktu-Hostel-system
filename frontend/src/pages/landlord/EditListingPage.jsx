// src/pages/landlord/EditListingPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PlusSquare, MapPin, Upload, X, Edit3, CreditCard } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LandlordSidebar from '../../components/LandlordSidebar';
import MapboxLocationPicker from '../../components/MapboxLocationPicker';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { processAndUploadFile, compressImageFile } from '../../utils/fileUpload';

const NEIGHBORHOODS = ['Adweso', 'Nsukwao', 'Effiduase', 'Oyoko', 'Ashanti Nkwanta', 'Akwadum', 'Okorase'];
const ROOM_TYPES = ['Single', 'Shared', 'Self-contained', 'Apartment'];
const AMENITIES_LIST = [
  'Water Flow', 'Electricity (Prepaid)', 'WiFi Internet', 'Generator Backup',
  'Study Room', 'Fenced Yard', 'Security Guard', 'Air Conditioner'
];

export default function EditListingPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [genderPolicy, setGenderPolicy] = useState('Mixed');
  const [description, setDescription] = useState('');

  // Payment / contact states
  const [paymentPhone, setPaymentPhone] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoName, setMomoName] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');

  // Room rates
  const [roomRates, setRoomRates] = useState([
    { room_type: 'Single', price_per_semester: '', max_occupancy: '1' }
  ]);

  // Location
  const [lat, setLat] = useState('6.0900');
  const [lng, setLng] = useState('-0.2573');

  // Amenities & photos
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  // Photos: { file: File|null, previewUrl: string, storedUrl: string|null }
  const [photos, setPhotos] = useState([]);

  // ── Load existing property data ──────────────────────────────────────────────
  useEffect(() => {
    const loadProperty = async () => {
      try {
        setPageLoading(true);
        const res = await api.get(`/properties/${id}`);
        const p = res.data.property || res.data;

        setTitle(p.title || '');
        setAddress(p.address || '');
        setNeighborhood(p.neighborhood || '');
        setGenderPolicy(p.gender_policy || 'Mixed');
        setDescription(p.description || '');
        setLat(String(p.latitude || '6.0900'));
        setLng(String(p.longitude || '-0.2573'));

        // Room rates
        let rates = [];
        if (p.room_rates) {
          try {
            rates = typeof p.room_rates === 'string' ? JSON.parse(p.room_rates) : p.room_rates;
          } catch (_) {}
        }
        if (!rates || rates.length === 0) {
          rates = [{ room_type: p.room_type || 'Single', price_per_semester: String(p.price_per_semester || ''), max_occupancy: String(p.max_occupancy || '1') }];
        }
        setRoomRates(rates.map(r => ({
          room_type: r.room_type || 'Single',
          price_per_semester: String(r.price_per_semester || ''),
          max_occupancy: String(r.max_occupancy || '1')
        })));

        // Amenities
        let amenList = [];
        if (p.amenities) {
          try {
            amenList = typeof p.amenities === 'string' ? JSON.parse(p.amenities) : p.amenities;
          } catch (_) { amenList = []; }
        }
        setSelectedAmenities(Array.isArray(amenList) ? amenList : []);

        // Payment contact
        let pc = {};
        if (p.payment_contact_info) {
          try {
            pc = typeof p.payment_contact_info === 'string' ? JSON.parse(p.payment_contact_info) : p.payment_contact_info;
          } catch (_) {}
        }
        setPaymentPhone(pc.phone || '');
        setMomoNumber(pc.momo_number || '');
        setMomoName(pc.momo_name || '');
        setPaymentInstructions(pc.payment_instructions || '');

        // Existing images — treat as cloud-stored URLs
        const imgs = (p.property_images || [])
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(img => ({
            file: null,
            previewUrl: img.image_path,
            storedUrl: img.image_path.startsWith('http') ? img.image_path : null
          }));
        setPhotos(imgs);

      } catch (err) {
        console.error('Failed to load listing:', err);
        toast.error('Could not load listing data.');
        navigate('/landlord/listings');
      } finally {
        setPageLoading(false);
      }
    };
    loadProperty();
  }, [id]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCoordsChange = (newLat, newLng) => { setLat(newLat); setLng(newLng); };

  const handleAmenityChange = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddRoomRate = () => {
    setRoomRates(prev => [...prev, { room_type: 'Shared', price_per_semester: '', max_occupancy: '2' }]);
  };

  const handleRemoveRoomRate = (index) => {
    if (roomRates.length <= 1) return;
    setRoomRates(roomRates.filter((_, i) => i !== index));
  };

  const handleRoomRateChange = (index, field, value) => {
    const updated = [...roomRates];
    updated[index] = { ...updated[index], [field]: value };
    setRoomRates(updated);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed.');
      return;
    }
    setUploadingPhotos(true);
    const loadingToast = toast.loading(`Uploading ${files.length} photo(s)...`);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const previewUrl = URL.createObjectURL(file);
          try {
            const stored = await processAndUploadFile(file, 'properties');
            if (stored && stored.startsWith('http')) return { file, previewUrl, storedUrl: stored };
          } catch (_) {}
          return { file, previewUrl, storedUrl: null };
        })
      );
      setPhotos(prev => [...prev, ...results]);
      const failed = results.filter(r => !r.storedUrl).length;
      toast.dismiss(loadingToast);
      if (failed === 0) toast.success(`${files.length} photo(s) uploaded!`);
      else toast.success(`${files.length - failed} uploaded, ${failed} will retry on save.`);
    } catch (_) {
      toast.dismiss(loadingToast);
      toast.error('Failed to process photos.');
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit (PUT) ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return toast.error('Please enter the physical address.');
    if (!neighborhood) return toast.error('Please select a neighborhood.');
    if (roomRates.length === 0) return toast.error('Please add at least one room option.');
    for (let i = 0; i < roomRates.length; i++) {
      const r = roomRates[i];
      if (!r.room_type) return toast.error(`Select a room type for Option #${i + 1}.`);
      if (!r.price_per_semester || parseFloat(r.price_per_semester) <= 0)
        return toast.error(`Enter a valid price for Option #${i + 1}.`);
    }
    if (photos.length === 0) return toast.error('Please add at least 1 property photo.');

    const minPrice = Math.min(...roomRates.map(r => parseFloat(r.price_per_semester)));
    const maxOcc   = Math.max(...roomRates.map(r => parseInt(r.max_occupancy || 1)));
    const ALLOWED  = ['Single', 'Shared', 'Self-contained', 'Apartment'];
    const primaryRoomType = ALLOWED.includes(roomRates[0]?.room_type) ? roomRates[0].room_type : 'Single';

    try {
      setLoading(true);

      // Finalise photos — retry storage for any pending ones
      const retryToast = toast.loading('Finalising photo uploads...');
      const finalPhotos = await Promise.all(
        photos.map(async (p) => {
          if (p.storedUrl) return p.storedUrl;
          if (!p.file) return null;
          try {
            const stored = await processAndUploadFile(p.file, 'properties');
            if (stored && stored.startsWith('http')) return stored;
          } catch (_) {}
          try {
            const base64 = await compressImageFile(p.file, 600, 600, 0.5);
            if (base64.length < 200000) return base64;
          } catch (_) {}
          return null;
        })
      );
      toast.dismiss(retryToast);

      const imageUrls = finalPhotos.filter(Boolean);
      const cloudUrls = imageUrls.filter(u => u.startsWith('http'));
      const dataUrls  = imageUrls.filter(u => u.startsWith('data:'));

      // Safety check: warn if payload is large
      const dataUrlSize = dataUrls.reduce((sum, u) => sum + u.length, 0);
      if (dataUrlSize > 3_000_000) {
        toast.error('Photos are too large to submit. Please use smaller images or try again — some photos may not have uploaded to cloud yet.');
        setLoading(false);
        return;
      }

      await api.put(`/properties/${id}`, {
        title,
        address,
        neighborhood,
        gender_policy: genderPolicy,
        room_type: primaryRoomType,
        price_per_semester: minPrice,
        max_occupancy: maxOcc,
        room_rates: roomRates.map(r => ({
          room_type: r.room_type,
          price_per_semester: parseFloat(r.price_per_semester),
          max_occupancy: parseInt(r.max_occupancy || 1)
        })),
        description,
        payment_phone: paymentPhone,
        momo_number: momoNumber,
        momo_name: momoName,
        payment_instructions: paymentInstructions,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        amenities: selectedAmenities,
        image_urls: cloudUrls,
        image_data_urls: dataUrls
      });

      toast.success('Listing updated and re-submitted for admin review!');
      navigate('/landlord/listings');
    } catch (err) {
      console.error('Edit listing error:', err);
      if (!err.response) {
        toast.error('Network error: Could not reach the server. Check your connection or try reducing photo sizes.');
      } else {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update listing.';
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <>
        <Navbar />
        <div className="d-flex">
          <LandlordSidebar />
          <main className="main-content flex-grow-1 d-flex align-items-center justify-content-center">
            <div className="page-loader"><div className="spinner-ring" /></div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <LandlordSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0" style={{ maxWidth: '900px' }}>

            {/* Header */}
            <div className="mb-4">
              <h2 className="mb-1 d-flex align-items-center gap-2">
                <Edit3 size={24} className="text-orange" /> Edit Listing
              </h2>
              <p className="text-muted-custom mb-0">
                Update your property details. Changes will re-trigger admin review before going live.
              </p>
            </div>

            <hr className="divider-orange mb-4" />

            <form onSubmit={handleSubmit} className="row g-4">

              {/* Column 1: Details */}
              <div className="col-md-7">
                <div className="card p-4 border-custom bg-surface rounded-custom d-flex flex-column gap-3">
                  <h5 className="mb-0" style={{ fontFamily: 'Outfit,sans-serif' }}>Listing Details</h5>

                  <div>
                    <label className="form-label">Property Title</label>
                    <input type="text" className="form-control" required
                      placeholder="e.g. Asantewaa Villa (Self-contain)"
                      value={title} onChange={e => setTitle(e.target.value)} />
                  </div>

                  <div>
                    <label className="form-label">Physical Address</label>
                    <input type="text" className="form-control" required
                      placeholder="e.g. 15 Adweso High St, near Shell"
                      value={address} onChange={e => setAddress(e.target.value)} />
                  </div>

                  <div>
                    <label className="form-label">Neighborhood</label>
                    <select className="form-select" required value={neighborhood} onChange={e => setNeighborhood(e.target.value)}>
                      <option value="">Select Neighborhood</option>
                      {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label d-block fw-semibold mb-1">Gender Policy</label>
                    <small className="text-muted-custom d-block mb-2" style={{ fontSize: '0.78rem' }}>Specify who is allowed to stay at this property</small>
                    <div className="d-flex gap-2">
                      {[
                        { value: 'Mixed', label: '🚻 Mixed (Co-ed)' },
                        { value: 'Boys only', label: '🚹 Boys only' },
                        { value: 'Girls only', label: '🚺 Girls only' }
                      ].map(g => (
                        <button
                          key={g.value}
                          type="button"
                          className={`btn btn-sm flex-grow-1 ${genderPolicy === g.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '0.82rem', fontWeight: 600 }}
                          onClick={() => setGenderPolicy(g.value)}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Room Options & Rates */}
                  <div className="p-3 bg-surface-2 rounded-custom border-custom d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <h6 className="mb-0 fw-bold text-orange" style={{ fontFamily: 'Outfit,sans-serif', fontSize: '0.92rem' }}>
                          🏢 Room Types & Prices
                        </h6>
                        <small className="text-muted-custom" style={{ fontSize: '0.76rem' }}>Specify prices for each available room option</small>
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1 py-1"
                        onClick={handleAddRoomRate} style={{ fontSize: '0.78rem' }}>
                        <PlusSquare size={13} /> Add Room Option
                      </button>
                    </div>

                    {roomRates.map((rate, idx) => (
                      <div key={idx} className="p-3 bg-surface rounded-custom border-custom position-relative">
                        <div className="row g-2 align-items-center">
                          <div className="col-md-5">
                            <label className="form-label mb-1" style={{ fontSize: '0.78rem' }}>Room Type</label>
                            <select className="form-select form-select-sm" required
                              value={rate.room_type}
                              onChange={e => handleRoomRateChange(idx, 'room_type', e.target.value)}>
                              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="col-md-4 col-7">
                            <label className="form-label mb-1" style={{ fontSize: '0.78rem' }}>Price / Sem (GHS)</label>
                            <input type="number" className="form-control form-control-sm" required
                              placeholder="e.g. 1500"
                              value={rate.price_per_semester}
                              onChange={e => handleRoomRateChange(idx, 'price_per_semester', e.target.value)} />
                          </div>
                          <div className="col-md-2 col-3">
                            <label className="form-label mb-1" style={{ fontSize: '0.78rem' }}>Max Occ.</label>
                            <input type="number" className="form-control form-control-sm" required min="1"
                              value={rate.max_occupancy}
                              onChange={e => handleRoomRateChange(idx, 'max_occupancy', e.target.value)} />
                          </div>
                          {roomRates.length > 1 && (
                            <div className="col-md-1 col-2 text-end pt-3">
                              <button type="button" className="btn btn-sm text-danger p-1"
                                title="Remove room option"
                                onClick={() => handleRemoveRoomRate(idx)}>
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows="4"
                      placeholder="Describe the hostel, security features, distance from main road..."
                      value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                </div>

                {/* Payment & Contact */}
                <div className="card p-4 border-custom bg-surface rounded-custom mt-4">
                  <h5 className="mb-2 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit,sans-serif' }}>
                    <CreditCard size={18} className="text-warning" /> Payment & Landlord Contact Info
                  </h5>
                  <p className="text-muted-custom mb-3" style={{ fontSize: '0.82rem' }}>
                    Students can view these payment details & contact info to arrange payments for this property.
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Direct Contact Phone</label>
                      <input type="tel" className="form-control form-control-sm"
                        placeholder="e.g. +233 24 123 4567"
                        value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>MoMo Phone Number</label>
                      <input type="tel" className="form-control form-control-sm"
                        placeholder="e.g. 024 123 4567"
                        value={momoNumber} onChange={e => setMomoNumber(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>MoMo Registered Account Name</label>
                      <input type="text" className="form-control form-control-sm"
                        placeholder="e.g. Kwame Asante Boateng"
                        value={momoName} onChange={e => setMomoName(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Payment Instructions (Optional)</label>
                      <input type="text" className="form-control form-control-sm"
                        placeholder="e.g. Pay deposit to MoMo. Use full name as reference."
                        value={paymentInstructions} onChange={e => setPaymentInstructions(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Photos, Amenities, Map */}
              <div className="col-md-5 d-flex flex-column gap-4">

                {/* Photos */}
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <h5 className="mb-2 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit,sans-serif' }}>
                    <Upload size={18} className="text-orange" /> Property Photos
                  </h5>
                  <p className="text-muted-custom mb-3" style={{ fontSize: '0.8rem' }}>
                    Upload up to 5 photos. Existing photos shown below.
                  </p>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {photos.map((p, i) => (
                      <div key={i} className="position-relative" style={{ width: '70px', height: '55px', borderRadius: '6px', overflow: 'hidden' }}>
                        <img src={p.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span
                          title={p.storedUrl ? 'Uploaded to cloud' : 'Will retry on save'}
                          style={{
                            position: 'absolute', bottom: 2, left: 2,
                            width: 7, height: 7, borderRadius: '50%',
                            background: p.storedUrl ? '#22c55e' : '#f59e0b',
                            border: '1px solid #000'
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm bg-danger text-white p-0 position-absolute top-0 end-0 rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '18px', height: '18px' }}
                          onClick={() => handleRemovePhoto(i)}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <label className="d-flex flex-column align-items-center justify-content-center border-custom bg-surface-2 rounded-custom cursor-pointer"
                        style={{ width: '70px', height: '55px', border: '1px dashed var(--border)', opacity: uploadingPhotos ? 0.6 : 1 }}>
                        {uploadingPhotos ? (
                          <div className="spinner-border spinner-border-sm text-warning" style={{ width: '14px', height: '14px' }} />
                        ) : (
                          <>
                            <Upload size={14} className="text-muted-custom" />
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Add</span>
                          </>
                        )}
                        <input type="file" multiple accept="image/*" className="d-none"
                          disabled={uploadingPhotos} onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <h5 className="mb-2" style={{ fontFamily: 'Outfit,sans-serif' }}>Amenities</h5>
                  <div className="row g-2">
                    {AMENITIES_LIST.map(amenity => (
                      <div key={amenity} className="col-12 col-sm-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`edit-${amenity}`}
                            checked={selectedAmenities.includes(amenity)}
                            onChange={() => handleAmenityChange(amenity)}
                          />
                          <label className="form-check-label text-muted-custom" style={{ fontSize: '0.82rem' }} htmlFor={`edit-${amenity}`}>
                            {amenity}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map */}
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <h5 className="mb-2 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit,sans-serif' }}>
                    <MapPin size={18} className="text-gold" /> Location Pin
                  </h5>
                  <p className="text-muted-custom mb-3" style={{ fontSize: '0.8rem' }}>Drag the pin to update the hostel location.</p>
                  <div className="mb-3">
                    <MapboxLocationPicker lat={lat} lng={lng} onChangeCoords={handleCoordsChange} height="210px" />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Latitude</label>
                      <input type="number" step="0.000001" className="form-control form-control-sm" required
                        value={lat} onChange={e => handleCoordsChange(e.target.value, lng)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Longitude</label>
                      <input type="number" step="0.000001" className="form-control form-control-sm" required
                        value={lng} onChange={e => handleCoordsChange(lat, e.target.value)} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit */}
              <div className="col-12">
                {/* Notice about re-review */}
                <div className="alert border-custom mb-3 d-flex align-items-start gap-2" style={{ background: 'rgba(245,166,35,0.08)', borderColor: 'var(--brand-gold)', fontSize: '0.83rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                  <span className="text-muted-custom">
                    After saving, your listing will be set to <strong className="text-gold">Pending Review</strong> and must be re-approved by an admin before it is visible to students.
                  </span>
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                  {loading ? 'Saving Changes...' : 'Save Changes & Submit for Review'}
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
