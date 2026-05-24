import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { getImageUrl, handleImageError } from '../utils/imageUtils';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, MapPin, Calendar, Clock, ChevronRight, Settings, Ticket, X, Download, Star, Pencil, BadgeCheck, IndianRupee, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const Dashboard = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

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

  const { data: pendingBookings, isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['pendingBookings'],
    queryFn: async () => {
      const response = await api.get('/bookings/owner', {
        params: { paymentStatus: 'PENDING_VERIFICATION' }
      });
      return response.data;
    },
    enabled: user?.role === 'OWNER',
  });

  const { data: allOwnerBookings } = useQuery({
    queryKey: ['allOwnerBookings'],
    queryFn: async () => {
      const response = await api.get('/bookings/owner', {
        params: { size: 100 }
      });
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

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ bookingId, approved }) => {
      const response = await api.post(`/bookings/${bookingId}/verify`, null, {
        params: { approved }
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      alert(`Booking ${variables.approved ? 'approved' : 'rejected'} successfully.`);
      refetchPending();
      queryClient.invalidateQueries(['profile']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to verify payment.');
    }
  });

  const handleVerifyPayment = (bookingId, approved) => {
    const action = approved ? 'approve' : 'reject';
    if (window.confirm(`Are you sure you want to ${action} this booking payment?`)) {
      verifyPaymentMutation.mutate({ bookingId, approved });
    }
  };

  const submitReviewMutation = useMutation({
    mutationFn: async ({ bookingId, rating, comment }) => {
      const response = await api.post('/reviews', { bookingId, rating, comment });
      return response.data;
    },
    onSuccess: () => {
      alert('Thank you! Your review has been submitted successfully.');
      setReviewBooking(null);
      setRating(5);
      setComment('');
      refetchBookings();
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to submit review.');
    }
  });

  const handleSubmitReview = () => {
    if (!reviewBooking) return;
    submitReviewMutation.mutate({
      bookingId: reviewBooking.id,
      rating,
      comment
    });
  };

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

  const ownerStats = {
    totalTurfs: myTurfs?.length || 0,
    approvedTurfs: myTurfs?.filter(turf => turf.status === 'APPROVED').length || 0,
    averagePrice: myTurfs?.length
      ? Math.round(myTurfs.reduce((sum, turf) => sum + Number(turf.pricePerHour || 0), 0) / myTurfs.length)
      : 0,
  };

  const generateChartData = () => {
    if (!allOwnerBookings?.content) return [];
    
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, 'MMM dd');
    });

    const dataMap = last7Days.reduce((acc, dateStr) => {
      acc[dateStr] = { name: dateStr, revenue: 0, bookings: 0 };
      return acc;
    }, {});

    allOwnerBookings.content.forEach(booking => {
      if (booking.status === 'CONFIRMED' && booking.timeSlot?.slotDate) {
        const dateStr = format(new Date(booking.timeSlot.slotDate), 'MMM dd');
        if (dataMap[dateStr]) {
          dataMap[dateStr].revenue += booking.totalPrice || 0;
          dataMap[dateStr].bookings += 1;
        }
      }
    });

    return Object.values(dataMap);
  };
  
  const chartData = generateChartData();

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
              {user?.name?.[0]?.toUpperCase()}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                  <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Turfs</p>
                  <p className="text-3xl font-black text-lime mt-2">{ownerStats.totalTurfs}</p>
                </div>
                <div className="glass-card p-5">
                  <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Approved</p>
                  <p className="text-3xl font-black text-lime mt-2">{ownerStats.approvedTurfs}</p>
                </div>
                <div className="glass-card p-5">
                  <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Avg Price</p>
                  <p className="text-3xl font-black text-lime mt-2">₹{ownerStats.averagePrice}</p>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="glass-card p-6 mt-6">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                  <Activity className="text-lime" size={20} /> Revenue Analytics (7 Days)
                </h3>
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C5F135" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#C5F135" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A2113', borderColor: '#ffffff20', borderRadius: '1rem' }}
                          itemStyle={{ color: '#C5F135', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#C5F135" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-offwhite/40 text-sm">
                      No data available yet
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Payment Verifications */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 mt-8">
                  <IndianRupee className="text-lime" size={20} /> Pending Payment Verifications
                </h3>
                {loadingPending ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl"></div>)}
                  </div>
                ) : pendingBookings?.content?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {pendingBookings.content.map((booking) => (
                      <div key={booking.id} className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-lime/40 transition-all">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lime font-bold text-sm bg-lime/10 px-2 py-0.5 rounded">UTR: {booking.transactionId || 'N/A'}</span>
                            <span className="text-offwhite/60 text-xs">
                              {booking.timeSlot?.slotDate ? format(new Date(booking.timeSlot.slotDate), 'MMM dd, yyyy') : 'N/A'} | {booking.timeSlot?.startTime?.substring(0, 5)} - {booking.timeSlot?.endTime?.substring(0, 5)}
                            </span>
                          </div>
                          <h4 className="font-bold text-lg text-offwhite">{booking.turfName || 'Turf'}</h4>
                          <div className="text-sm text-offwhite/50 space-y-0.5">
                            <p>Player: <span className="text-offwhite font-medium">{booking.userName || 'Unknown'}</span> ({booking.userEmail || 'N/A'})</p>
                            <p className="text-xs text-offwhite/40">Ref: #{booking.bookingRef} | Price: <span className="text-lime font-black">₹{booking.totalPrice}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleVerifyPayment(booking.id, true)}
                            disabled={verifyPaymentMutation.isLoading}
                            className="px-4 py-2 bg-lime text-forest font-black rounded-xl hover:bg-lime/80 text-xs transition-all shadow-md shadow-lime/10"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(booking.id, false)}
                            disabled={verifyPaymentMutation.isLoading}
                            className="px-4 py-2 bg-red-500/20 text-red-400 font-bold border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white text-xs transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-6 text-center border-dashed py-8">
                    <p className="text-offwhite/40 text-sm font-medium">No pending payment verifications at the moment.</p>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold flex items-center gap-2 pt-6">
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
                            <img src={getImageUrl(turf.images[0])} alt={turf.name} onError={handleImageError} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 font-black">T</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-lime transition-colors">{turf.name}</h4>
                          <div className="flex items-center gap-3 text-offwhite/50 text-sm mt-1">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {turf.city}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span className="text-lime font-bold">₹{turf.pricePerHour}/hr</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span className="flex items-center gap-1 text-lime"><BadgeCheck size={14} /> {turf.status}</span>
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
                        <Link
                          to={`/turfs/${turf.id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl hover:bg-lime/20 text-xs font-bold transition-all border border-transparent hover:border-lime/30"
                        >
                          <Pencil size={14} /> Edit
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
              {myBookings?.content?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-card p-5">
                    <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Bookings</p>
                    <p className="text-3xl font-black text-lime mt-2">{myBookings.content.length}</p>
                  </div>
                  <div className="glass-card p-5">
                    <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Confirmed</p>
                    <p className="text-3xl font-black text-lime mt-2">{myBookings.content.filter(booking => booking.status === 'CONFIRMED').length}</p>
                  </div>
                  <div className="glass-card p-5">
                    <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Paid</p>
                    <p className="text-3xl font-black text-lime mt-2 flex items-center gap-2"><IndianRupee size={30} />{myBookings.content.filter(booking => booking.paymentStatus === 'PAID').length}</p>
                  </div>
                </div>
              )}
              
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
                           <p className="font-black text-lime">₹{booking.totalPrice}</p>
                        </div>
                        {booking.paymentStatus === 'PAID' && !booking.reviewed && (
                          <button
                            onClick={() => setReviewBooking(booking)}
                            className="px-3 py-2 bg-lime/10 border border-lime/30 text-lime rounded-xl hover:bg-lime hover:text-forest font-bold text-xs transition-all"
                          >
                            Leave a Review
                          </button>
                        )}
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
                        <p className={`text-sm font-black px-2 py-0.5 rounded-full inline-block ${
                          selectedBooking.status === 'CONFIRMED' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>{selectedBooking.status}</p>
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

      {/* Review Modal */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setReviewBooking(null);
                setRating(5);
                setComment('');
              }}
              className="absolute inset-0 bg-forest/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 border-lime/30 shadow-2xl z-10 bg-forest-dark"
            >
              <h3 className="text-2xl font-black mb-1">Rate Your Experience</h3>
              <p className="text-offwhite/50 text-sm mb-6">How was your time at <span className="text-lime font-bold">{reviewBooking.turfName || 'the turf'}</span>?</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-offwhite/40 uppercase tracking-widest block mb-2">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-lime hover:scale-110 transition-transform"
                      >
                        <Star size={32} fill={star <= rating ? '#C5F135' : 'none'} className="text-lime" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-offwhite/40 uppercase tracking-widest block mb-2">Your Review</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts on the turf quality, amenities, and overall experience..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-offwhite placeholder:text-offwhite/30 focus:outline-none focus:border-lime transition-all resize-none text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setReviewBooking(null);
                      setRating(5);
                      setComment('');
                    }}
                    className="flex-1 py-3 border border-white/15 hover:bg-white/5 rounded-xl font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isLoading}
                    className="flex-1 py-3 bg-lime text-forest font-black rounded-xl hover:bg-lime/95 text-sm transition-all shadow-lg shadow-lime/25"
                  >
                    {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>

              <button 
                onClick={() => {
                  setReviewBooking(null);
                  setRating(5);
                  setComment('');
                }}
                className="absolute top-6 right-6 p-2 text-offwhite/50 hover:text-offwhite transition-colors"
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
