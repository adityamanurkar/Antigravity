import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ArrowRight, Radar } from 'lucide-react';
import api from '../api/axiosConfig';
import { getImageUrl, handleImageError } from '../utils/imageUtils';

const TurfListing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [isRadarScanning, setIsRadarScanning] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  const { data, isLoading, error } = useQuery({
    queryKey: ['turfs', searchTerm, selectedSport, priceRange.min, priceRange.max, selectedDate, selectedAmenities],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSport) params.append('sport', selectedSport);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      if (selectedDate) params.append('availableDate', selectedDate);
      selectedAmenities.forEach(a => params.append('amenities', a));
      params.append('size', '50');

      const response = await api.get('/turfs', { params });
      return response.data.content;
    }
  });

  const filteredTurfs = data;

  const sortedTurfs = useMemo(() => {
    if (!filteredTurfs) return [];
    let turfs = [...filteredTurfs];
    if (sortBy === 'price_asc') turfs.sort((a, b) => a.pricePerHour - b.pricePerHour);
    else if (sortBy === 'price_desc') turfs.sort((a, b) => b.pricePerHour - a.pricePerHour);
    else if (sortBy === 'rating') turfs.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    return turfs;
  }, [filteredTurfs, sortBy]);

  const sports = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Pickleball'];
  const amenities = ['LED Floodlights', 'Parking', 'Changing Rooms', 'Drinking Water', 'Washrooms', 'First Aid', 'CCTV'];

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleRadarScan = () => {
    setIsRadarScanning(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(() => {
        // In a real app, we'd send lat/long to backend
        // For now, we simulate finding the user's city
        setTimeout(() => {
          setSearchTerm('New York'); // Simulate finding turfs in a specific city
          setIsRadarScanning(false);
        }, 2000);
      }, () => {
        alert('Location access denied.');
        setIsRadarScanning(false);
      });
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsRadarScanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2">FIND YOUR TURF</h1>
          <p className="text-offwhite/60">Discover and book the best sports facilities</p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-offwhite/40" size={18} />
            <input 
              type="text" 
              placeholder="Search by city or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-11 w-full bg-forest-light/50"
            />
          </div>
          
          <button 
            onClick={handleRadarScan}
            disabled={isRadarScanning}
            className={`btn-outline px-4 py-3 flex items-center justify-center gap-2 group transition-all ${isRadarScanning ? 'bg-lime/20 border-lime' : ''}`}
          >
            <Radar size={18} className={isRadarScanning ? 'animate-spin text-lime' : 'group-hover:text-lime'} />
            <span className={isRadarScanning ? 'text-lime font-bold' : ''}>
              {isRadarScanning ? 'Scanning...' : 'Radar Scan'}
            </span>
          </button>
        </div>
      </div>

      {/* Sport Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${showFilters ? 'bg-lime text-forest' : 'border border-white/10 text-offwhite hover:border-white/30'}`}
        >
          <Search size={16} /> Filters
        </button>
        <div className="w-px h-6 bg-white/20 mx-2"></div>
        <button 
          onClick={() => setSelectedSport('')}
          className={`px-5 py-2 rounded-full font-medium transition-all ${selectedSport === '' ? 'bg-lime text-forest' : 'bg-forest-light text-offwhite hover:bg-forest-light/80'}`}
        >
          All Sports
        </button>
        {sports.map(sport => (
          <button 
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-5 py-2 rounded-full font-medium transition-all ${selectedSport === sport ? 'bg-lime text-forest' : 'bg-forest-light text-offwhite hover:bg-forest-light/80'}`}
          >
            {sport}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-offwhite/40 text-xs font-bold uppercase tracking-widest">Sort by</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-forest-light border border-white/10 text-offwhite rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-lime"
          >
            <option value="recommended">Recommended</option>
            <option value="rating">Highest Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Advanced Filters Sidebar */}
        {showFilters && (
          <div className="w-full lg:w-64 flex-shrink-0 glass-card p-6 h-fit space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Filters</h3>
              <button 
                onClick={() => {
                  setPriceRange({ min: '', max: '' });
                  setSelectedDate('');
                  setSelectedAmenities([]);
                }}
                className="text-xs text-lime hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-offwhite/60 uppercase tracking-wider">Date Availability</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field w-full text-sm py-2"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-offwhite/60 uppercase tracking-wider">Price Range (₹/hr)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="input-field w-full text-sm py-2"
                />
                <span className="text-offwhite/40">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  className="input-field w-full text-sm py-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-offwhite/60 uppercase tracking-wider">Amenities</label>
              <div className="space-y-2">
                {amenities.map(amenity => (
                  <label key={amenity} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 rounded border-white/20 bg-forest-light text-lime focus:ring-lime focus:ring-offset-forest"
                    />
                    <span className="text-sm text-offwhite/80 group-hover:text-offwhite">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="glass-card animate-pulse">
                  <div className="h-60 bg-forest-light/50" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-forest-light/50 rounded w-3/4" />
                    <div className="h-4 bg-forest-light/50 rounded w-1/2" />
                    <div className="h-4 bg-forest-light/50 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400">Failed to load turfs. Please try again later.</p>
            </div>
          ) : sortedTurfs?.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-forest-light rounded-full flex items-center justify-center mx-auto mb-6 text-offwhite/30">
                <Search size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">No turfs found</h3>
              <p className="text-offwhite/60">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${showFilters ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-3'} gap-8`}>
          {sortedTurfs?.map(turf => (
            <div key={turf.id} className="glass-card flex flex-col h-full group">
              <div className="relative h-60 overflow-hidden">
                <img 
                  src={getImageUrl(turf.images?.[0])} 
                  alt={turf.name} 
                  onError={handleImageError}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {turf.sportTypes?.slice(0,2).map(sport => (
                    <span key={sport} className="bg-lime text-forest text-xs font-bold px-3 py-1 rounded-full">
                      {sport}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold group-hover:text-lime transition-colors">{turf.name}</h3>
                  {turf.averageRating > 0 && (
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded text-xs font-bold">
                      <Star size={14} className="fill-lime text-lime" />
                      <span>{turf.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-offwhite/50 text-sm mb-6">
                  <MapPin size={16} />
                  <span>{turf.city}</span>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-black text-offwhite/30 uppercase tracking-widest">Starting from</p>
                    <p className="text-xl font-black text-lime">₹{turf.pricePerHour}<span className="text-sm font-normal text-offwhite/40">/hr</span></p>
                  </div>
                  <Link 
                    to={`/turfs/${turf.id}`}
                    className="flex items-center gap-2 bg-white/5 hover:bg-lime hover:text-forest px-4 py-2 rounded-xl text-sm font-bold transition-all group/btn"
                  >
                    View Details
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default TurfListing;
