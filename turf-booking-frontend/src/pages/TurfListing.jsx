import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ArrowRight, Radar } from 'lucide-react';
import api from '../api/axiosConfig';
import { getImageUrl, handleImageError } from '../utils/imageUtils';

const TurfListing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [isRadarScanning, setIsRadarScanning] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['turfs', searchTerm, selectedSport],
    queryFn: async () => {
      const response = await api.get('/turfs', {
        params: {
          search: searchTerm || undefined,
          sport: selectedSport || undefined,
          size: 50,
        }
      });
      return response.data.content;
    }
  });

  const filteredTurfs = data;

  const sports = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Pickleball'];

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
      <div className="flex flex-wrap gap-3 mb-10">
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
      </div>

      {/* Grid */}
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
      ) : filteredTurfs?.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-forest-light rounded-full flex items-center justify-center mx-auto mb-6 text-offwhite/30">
            <Search size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2">No turfs found</h3>
          <p className="text-offwhite/60">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTurfs?.map(turf => (
            <div key={turf.id} className="glass-card flex flex-col h-full group">
              <div className="relative h-60 overflow-hidden">
                <img 
                  src={getImageUrl(turf.images?.[0])} 
                  alt={turf.name} 
                  onError={handleImageError}
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
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded text-xs font-bold">
                    <Star size={14} className="fill-lime text-lime" />
                    <span>4.8</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-offwhite/50 text-sm mb-6">
                  <MapPin size={16} />
                  <span>{turf.city}</span>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-black text-offwhite/30 uppercase tracking-widest">Starting from</p>
                    <p className="text-xl font-black text-lime">${turf.pricePerHour}<span className="text-sm font-normal text-offwhite/40">/hr</span></p>
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
  );
};

export default TurfListing;
