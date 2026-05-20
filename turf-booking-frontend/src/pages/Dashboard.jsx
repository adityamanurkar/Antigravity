import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { getImageUrl } from '../utils/imageUtils';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, MapPin, Calendar, Clock, ChevronRight, Settings, Ticket, X, Download, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useState } from 'react';

const Dashboard = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Sync profile for latest loyalty points
  useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      if (response.data) setUser(response.data);
      return response.data;
    },
    enabled: !!user,
  });

  const { data: myTurfs, isLoading: loadingTurfs } = useQuery({
    queryKey: ['myTurfs'],
    queryFn: async () => {
      const response = await api.get('/turfs/my');
      return response.data;
    },
    enabled: user?.role === 'OWNER',
  });

  const { data: myBookings, isLoading: loadingBookings, refetch: refetchBookings } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const response = await api.get('/bookings/my');
      return response.data;
    },
    enabled: user?.role === 'PLAYER',
  });

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await api.put(`/bookings/${bookingId}/cancel`);
        alert('Booking cancelled successfully.');
        setSelectedBooking(null);
        refetchBookings();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to cancel booking.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-lime font-bold tracking-widest text-sm mb-2">OVERVIEW</p>
          <h1 className="text-5xl font-black">DASHBOARD</h1>
        </div>
        {user?.role === 'OWNER' && (
          <button 
            onClick={() => navigate('/add-turf')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> List New Turf
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-8 border-lime/20">
            <div className="w-20 h-20 bg-lime rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-lime/20 text-forest text-3xl font-black">
              {user?.name?.[0].toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
            <p className="text-offwhite/50 text-sm mb-6 uppercase tracking-widest">{user?.role}</p>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-offwhite/60 text-sm">Status</span>
                    <span className="text-lime text-xs font-bold bg-lime/10 px-2 py-1 rounded">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-offwhite/60 text-sm">Account Type</span>
                    <span className="text-offwhite font-bold">{user?.role}</span>
                </div>
                {user?.role === 'PLAYER' && (
                  <div className="flex items-center justify-between p-4 bg-lime/10 rounded-xl border border-lime/20">
                      <div className="flex flex-col">
                        <span className="text-lime text-[10px] font-black uppercase tracking-widest">Loyalty Points</span>
                        <span className="text-xl font-black text-offwhite">{user?.loyaltyPoints || 0}</span>
                      </div>
                      <div className="w-10 h-10 bg-lime rounded-full flex items-center justify-center text-forest animate-pulse">
                        <Star size={20} fill="currentColor" />
                      </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {user?.role === 'OWNER' ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-lime" size={20} /> My Registered Turfs
              </h3>
              
              {loadingTurfs ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl"></div>)}
                </div>
              ) : myTurfs?.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {myTurfs.map((turf) => (
                    <div key={turf.id} className="glass-card p-6 flex items-center justify-between hover:border-lime/40 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10">
                          {turf.images?.[0] ? (
                            <img src={getImageUrl(turf.images[0])} alt={turf.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 font-black">T</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-lime transition-colors">{turf.name}</h4>
                          <div className="flex items-center gap-3 text-offwhite/50 text-sm mt-1">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {turf.city}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span className="text-lime font-bold">${turf.pricePerHour}/hr</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link 
                          to={`/turfs/${turf.id}/manage`} 
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl hover:bg-lime/20 text-xs font-bold transition-all border border-transparent hover:border-lime/30"
                        >
                          <Settings size={14} /> Manage Slots
                        </Link>
                        <Link to={`/turfs/${turf.id}`} className="p-3 bg-white/5 rounded-xl hover:bg-lime hover:text-forest transition-all">
                          <ChevronRight size={20} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center border-dashed">
                  <p className="text-offwhite/40 font-medium mb-6">No turfs listed yet. Start your business today!</p>
                  <button onClick={() => navigate('/add-turf')} className="btn-primary">Add Your First Turf</button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Clock className="text-lime" size={20} /> My Recent Bookings
              </h3>
              
              {loadingBookings ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl"></div>)}
                </div>
              ) : myBookings?.content?.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {myBookings.content.map((booking) => (
                    <div key={booking.id} className="glass-card p-6 flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-xl bg-lime/10 flex flex-col items-center justify-center border border-lime/20">
                          <span className="text-[10px] font-black text-lime uppercase">{format(new Date(booking.timeSlot.slotDate), 'MMM')}</span>
                          <span className="text-xl font-black text-offwhite">{format(new Date(booking.timeSlot.slotDate), 'dd')}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-lime transition-colors">Booking #{booking.bookingRef}</h4>
                          <div className="flex items-center gap-3 text-offwhite/50 text-sm mt-1">
                            <span className="flex items-center gap-1 font-medium"><Clock size={14} className="text-lime" /> {booking.timeSlot.startTime.substring(0, 5)} - {booking.timeSlot.endTime.substring(0, 5)}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                              booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}>{booking.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                           <p className="text-xs text-offwhite/40 font-bold uppercase tracking-widest">Total</p>
                           <p className="font-black text-lime">${booking.totalPrice}</p>
                        </div>
                        {booking.status === 'CONFIRMED' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelBooking(booking.id);
                            }}
                            className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            title="Cancel Booking"
                          >
                            <X size={20} />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedBooking(booking)}
                          className="p-3 bg-white/5 rounded-xl hover:bg-lime hover:text-forest transition-all"
                        >
                          <Ticket size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center border-dashed">
                  <p className="text-offwhite/40 font-medium mb-6">No bookings found. Ready for a game?</p>
                  <button onClick={() => navigate('/turfs')} className="btn-primary">Find a Turf</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-forest/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#F0EDE6] rounded-[2rem] overflow-hidden shadow-2xl"
            >
               {/* Ticket Top */}
               <div className="bg-forest p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-lime/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <div className="w-12 h-12 bg-lime rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-forest font-black text-xl">T</span>
                  </div>
                  <h3 className="text-offwhite font-black text-xl tracking-tighter">TURFIEZ DIGITAL PASS</h3>
                  <p className="text-lime text-[10px] font-black tracking-[0.2em] mt-1">VERIFIED BOOKING</p>
               </div>

               {/* Ticket Perforation */}
               <div className="relative h-6 bg-[#F0EDE6]">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-forest rounded-full -ml-3"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-forest rounded-full -mr-3"></div>
                  <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-forest/10"></div>
               </div>

               {/* Ticket Body */}
               <div className="p-8 text-forest">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black opacity-30 uppercase">Booking Reference</p>
                        <p className="text-lg font-black tracking-tight">#{selectedBooking.bookingRef}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black opacity-30 uppercase">Status</p>
                        <p className="text-sm font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block">CONFIRMED</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-forest/5">
                        <div>
                          <p className="text-[10px] font-black opacity-30 uppercase">Date</p>
                          <p className="font-bold">{format(new Date(selectedBooking.timeSlot.slotDate), 'MMMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black opacity-30 uppercase">Time</p>
                          <p className="font-bold">{selectedBooking.timeSlot.startTime.substring(0, 5)} - {selectedBooking.timeSlot.endTime.substring(0, 5)}</p>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-inner border border-forest/5">
                           <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedBooking.bookingRef}`} 
                            alt="QR Code" 
                            className="w-32 h-32"
                           />
                        </div>
                        <p className="text-[10px] font-black opacity-20 text-center leading-tight uppercase">
                          Scan this code at the turf entry<br/>to verify your reservation
                        </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedBooking(null)}
                    className="w-full mt-6 py-4 bg-forest text-offwhite rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    <Download size={18} className="text-lime" /> SAVE TO DEVICE
                  </button>

                  {selectedBooking.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      className="w-full mt-3 py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <X size={18} /> CANCEL BOOKING
                    </button>
                  )}
               </div>

               <button 
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 p-2 text-offwhite/50 hover:text-offwhite transition-colors"
               >
                <X size={20} />
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
