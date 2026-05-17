import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { ArrowLeft, MapPin, Clock, DollarSign, Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AddTurf = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    pricePerHour: '',
    surfaceType: 'Artificial Grass',
    sportTypes: [],
    amenities: [],
    openingTime: '06:00',
    closingTime: '23:00',
    imageUrls: []
  });

  const availableSports = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Pickleball'];
  const availableAmenities = ['LED Floodlights', 'Parking', 'Changing Rooms', 'Drinking Water', 'Washrooms', 'First Aid', 'CCTV'];
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.url;
      });

      const newUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...newUrls]
      }));
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload some images.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };
  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        pricePerHour: parseFloat(data.pricePerHour),
        sportTypes: data.sportTypes,
        amenities: data.amenities,
        imageUrls: data.imageUrls,
        latitude: 0,
        longitude: 0
      };
      const response = await api.post('/turfs', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTurfs'] });
      navigate('/dashboard');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-lime hover:text-lime/80 mb-6 font-bold transition-colors">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="glass-card p-8">
        <h1 className="text-3xl font-black mb-8">LIST NEW TURF</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-offwhite/80">Turf Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input-field w-full" placeholder="e.g. Green Arena" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-offwhite/80">City</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-offwhite/40" size={18} />
                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="input-field w-full pl-11" placeholder="e.g. New York" />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-offwhite/80">Full Address</label>
              <input required type="text" name="address" value={formData.address} onChange={handleChange} className="input-field w-full" placeholder="123 Sports Avenue..." />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-offwhite/80">Description</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} className="input-field w-full h-24 py-3" placeholder="Describe your turf facilities..."></textarea>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full my-8"></div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-offwhite/80">Price Per Hour ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-offwhite/40" size={18} />
                <input required type="number" name="pricePerHour" value={formData.pricePerHour} onChange={handleChange} className="input-field w-full pl-11" placeholder="50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-offwhite/80">Surface Type</label>
              <input required type="text" name="surfaceType" value={formData.surfaceType} onChange={handleChange} className="input-field w-full" placeholder="e.g. Artificial Grass" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <label className="text-sm font-bold text-offwhite/80">Supported Sports</label>
              <div className="flex flex-wrap gap-2">
                {availableSports.map(sport => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => {
                      const current = formData.sportTypes;
                      setFormData({...formData, sportTypes: current.includes(sport) ? current.filter(s => s !== sport) : [...current, sport]});
                    }}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${formData.sportTypes.includes(sport) ? 'bg-lime text-forest border-lime' : 'border-white/10 text-offwhite/40 hover:border-white/30'}`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className="text-sm font-bold text-offwhite/80">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {availableAmenities.map(amenity => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => {
                      const current = formData.amenities;
                      setFormData({...formData, amenities: current.includes(amenity) ? current.filter(a => a !== amenity) : [...current, amenity]});
                    }}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${formData.amenities.includes(amenity) ? 'bg-lime text-forest border-lime' : 'border-white/10 text-offwhite/40 hover:border-white/30'}`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full my-8"></div>

          {/* Timings & Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-offwhite/80">Opening Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-offwhite/40" size={18} />
                <input required type="time" name="openingTime" value={formData.openingTime} onChange={handleChange} className="input-field w-full pl-11" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-offwhite/80">Closing Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-offwhite/40" size={18} />
                <input required type="time" name="closingTime" value={formData.closingTime} onChange={handleChange} className="input-field w-full pl-11" />
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <label className="text-sm font-bold text-offwhite/80">Turf Gallery</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AnimatePresence>
                  {formData.imageUrls.map((url, index) => (
                    <motion.div 
                      key={url}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative aspect-square rounded-2xl overflow-hidden group"
                    >
                      <img src={url} alt="Turf" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-lime/40 hover:bg-lime/5 transition-all group">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  {uploading ? (
                    <Loader2 className="text-lime animate-spin" size={24} />
                  ) : (
                    <Upload className="text-offwhite/40 group-hover:text-lime transition-colors" size={24} />
                  )}
                  <span className="text-[10px] font-black text-offwhite/40 uppercase group-hover:text-lime transition-colors">
                    {uploading ? 'Uploading...' : 'Add Photos'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full mt-8 py-4 text-lg">
            {mutation.isPending ? 'Publishing Turf...' : 'Publish Turf'}
          </button>
          
          {mutation.isError && (
            <p className="text-red-400 text-center mt-4 text-sm font-bold">Failed to create turf. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddTurf;
