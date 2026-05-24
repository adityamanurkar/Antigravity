import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { getImageUrl, handleImageError } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, IndianRupee, Calendar as CalendarIcon, CheckCircle, ChevronLeft, ChevronRight, ShieldCheck, Mail, Zap, Car, DoorOpen, Droplets, Bath, Activity, Video, Copy, Smartphone, QrCode, Star, X } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const TurfDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  
  // Reviews & ratings pagination state
  const [reviewsPage, setReviewsPage] = useState(0);
  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);

  const amenityIcons = {
    'LED Floodlights': <Zap size={18} />,
    'Parking': <Car size={18} />,
    'Changing Rooms': <DoorOpen size={18} />,
    'Drinking Water': <Droplets size={18} />,
    'Washrooms': <Bath size={18} />,
    'First Aid': <Activity size={18} />,
    'CCTV': <Video size={18} />,
  };

  // Fetch Turf Details
  const { data: turf, isLoading: loadingTurf, error: turfError } = useQuery({
    queryKey: ['turf', id],
    queryFn: async () => {
      const response = await api.get(`/turfs/${id}`);
      return response.data;
    }
  });

  // Fetch Available Slots
  const { data: slots, isLoading: loadingSlots, refetch: refetchSlots } = useQuery({
    queryKey: ['slots', id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await api.get(`/turfs/${id}/slots`, {
        params: { date: format(selectedDate, 'yyyy-MM-dd') }
      });
      return response.data;
    }
  });

  // Fetch Reviews
  const { data: reviewsData, isLoading: loadingReviews } = useQuery({
    queryKey: ['reviews', id, reviewsPage],
    queryFn: async () => {
      const response = await api.get(`/reviews/turf/${id}`, {
        params: { page: reviewsPage, size: 5 }
      });
      return response.data;
    }
  });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Booking Mutation for Razorpay
  const bookingMutation = useMutation({
    mutationFn: async ({ slotId }) => {
      // 1. Create booking
      const bookingRes = await api.post('/bookings', { 
        slotId,
        turfId: parseInt(id),
        numberOfPlayers: 1,
        transactionId: 'RAZORPAY_PENDING'
      });
      const booking = bookingRes.data;

      // 2. Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) throw new Error('Razorpay SDK failed to load');

      // 3. Create Order
      const orderRes = await api.post('/payments/create-order', { bookingId: booking.id });
      return { order: orderRes.data, bookingId: booking.id };
    },
    onSuccess: (data) => {
      const options = {
        key: data.order.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: turf?.name || "Turfiez",
        description: `Booking for ${format(selectedDate, 'MMM dd, yyyy')} at ${selectedSlotData?.startTime.substring(0,5)}`,
        order_id: data.order.orderId,
        handler: async function (response) {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: data.bookingId
            });
            setShowNotification(true);
            setTimeout(() => {
              setShowNotification(false);
              navigate('/dashboard');
            }, 2000);
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        theme: {
          color: "#C5F135" // Lime color
        }
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function () {
        alert('Payment failed! Please try again.');
      });
      paymentObject.open();
    },
    onError: (err) => {
      if (err.response?.data?.message === "Slot is not available") {
        refetchSlots();
        setShowConflictModal(true);
      } else {
        alert(err.response?.data?.message || err.message || 'Failed to process payment.');
      }
    }
  });

  const selectedSlotData = slots?.find(s => s.id === selectedSlot);
  
  let finalPrice = turf?.pricePerHour || 0;
  if (selectedSlotData && turf?.pricePerHour) {
    const startParts = selectedSlotData.startTime.split(':').map(Number);
    const endParts = selectedSlotData.endTime.split(':').map(Number);
    const startMins = startParts[0] * 60 + startParts[1];
    const endMins = endParts[0] * 60 + endParts[1];
    let durationMins = endMins - startMins;
    if (durationMins < 0) durationMins += 24 * 60;
    finalPrice = Number(((turf.pricePerHour * durationMins) / 60).toFixed(2));
  }

  // Removed manual UPI properties

  const nextImage = () => {
    if (turf?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % turf.images.length);
    }
  };

  const prevImage = () => {
    if (turf?.images?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + turf.images.length) % turf.images.length);
    }
  };

  if (loadingTurf) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-lime border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (turfError) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-red-500 mb-4"><ShieldCheck size={48} /></div>
      <h2 className="text-2xl font-black mb-2">Turf Not Found</h2>
      <p className="text-offwhite/60 mb-6">The turf you are looking for does not exist or has been removed.</p>
      <button onClick={() => navigate('/turfs')} className="btn-primary">Browse Turfs</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Media & Info */}
        <div className="space-y-8">
          {/* Image Gallery */}
          <div className="relative aspect-video rounded-3xl overflow-hidden glass-card group">
            {turf?.images?.length > 0 ? (
              <img 
                src={getImageUrl(turf.images[currentImageIndex])} 
                alt={turf.name} 
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-forest-light flex items-center justify-center text-white/20 font-black text-4xl">
                NO IMAGE AVAILABLE
              </div>
            )}
            
            {turf?.images?.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={24} />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {turf.images.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-lime w-6' : 'bg-white/30'}`}></div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
              <h1 className="text-5xl font-black flex flex-wrap items-center gap-4">
                <span>{turf?.name}</span>
                {turf?.averageRating > 0 && (
                  <div className="flex items-center gap-1.5 bg-lime/10 border border-lime/20 px-3 py-1 rounded-2xl text-sm text-lime font-black h-fit">
                    <Star size={16} fill="#C5F135" className="text-lime" />
                    <span>{turf.averageRating.toFixed(1)}</span>
                    <span className="text-offwhite/40 font-normal">({turf.reviewCount} {turf.reviewCount === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}
              </h1>
              <div className="flex items-center gap-2 text-offwhite/60">
                <MapPin size={18} className="text-lime" />
                <span>{turf?.address}, {turf?.city}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="glass-card flex-1 p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-lime/10 rounded-xl flex items-center justify-center text-lime">
                  <IndianRupee size={24} />
                </div>
                <div>
                  <p className="text-offwhite/40 text-xs font-bold uppercase tracking-widest">Price</p>
                  <p className="text-xl font-black">₹{turf?.pricePerHour}<span className="text-sm font-normal text-offwhite/40">/hr</span></p>
                </div>
              </div>
              <div className="glass-card flex-1 p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-lime/10 rounded-xl flex items-center justify-center text-lime">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-offwhite/40 text-xs font-bold uppercase tracking-widest">Timing</p>
                  <p className="text-xl font-black">{turf?.openingTime?.substring(0, 5)} - {turf?.closingTime?.substring(0, 5)}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 leading-relaxed text-offwhite/70">
              {turf?.description}
            </div>

            {/* Facility Amenities */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-6 italic tracking-tight uppercase">FACILITY AMENITIES</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {turf.amenities?.length > 0 ? turf.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-lime/30 transition-all">
                    <div className="text-lime group-hover:scale-110 transition-transform">
                      {amenityIcons[amenity] || <CheckCircle size={18} />}
                    </div>
                    <span className="text-sm font-bold text-offwhite/80">{amenity}</span>
                  </div>
                )) : (
                   <p className="text-offwhite/40 text-sm">No specific amenities listed.</p>
                )}
              </div>
            </div>

            {/* Location Map */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-6 italic tracking-tight uppercase">LOCATION MAP</h3>
              <div className="relative h-60 bg-white/5 rounded-2xl overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80" 
                  alt="Map Placeholder" 
                  className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-lime rounded-full flex items-center justify-center text-forest mb-4 shadow-lg shadow-lime/20 animate-bounce">
                    <MapPin size={24} />
                  </div>
                  <p className="text-offwhite font-bold">{turf.address}</p>
                  <p className="text-offwhite/40 text-xs mt-1 uppercase tracking-widest">{turf.city}</p>
                  <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">
                    GET DIRECTIONS
                  </button>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-6 italic tracking-tight uppercase flex items-center gap-2">
                <Star className="text-lime" size={20} fill="#C5F135" /> REVIEWS & RATINGS
              </h3>
              
              {loadingReviews ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl"></div>)}
                </div>
              ) : reviewsData?.content?.length > 0 ? (
                <div className="space-y-4">
                  {reviewsData.content.map((review) => (
                    <div key={review.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-offwhite">{review.userName || 'Anonymous'}</p>
                          <p className="text-[10px] text-offwhite/40">{review.createdAt ? format(new Date(review.createdAt), 'MMMM dd, yyyy') : 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-lime/10 px-2 py-0.5 rounded text-lime text-xs font-black">
                          <Star size={12} fill="#C5F135" className="text-lime" />
                          <span>{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-offwhite/70 leading-relaxed font-medium">{review.comment}</p>
                    </div>
                  ))}
                  
                  {/* Pagination Controls */}
                  {reviewsData.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-4">
                      <button
                        disabled={reviewsPage === 0}
                        onClick={() => setReviewsPage(prev => Math.max(0, prev - 1))}
                        className={`p-2 rounded-xl transition-all ${reviewsPage === 0 ? 'text-white/20 cursor-not-allowed' : 'bg-white/5 text-offwhite hover:bg-lime hover:text-forest'}`}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-xs font-bold text-offwhite/50">Page {reviewsPage + 1} of {reviewsData.totalPages}</span>
                      <button
                        disabled={reviewsPage >= reviewsData.totalPages - 1}
                        onClick={() => setReviewsPage(prev => prev + 1)}
                        className={`p-2 rounded-xl transition-all ${reviewsPage >= reviewsData.totalPages - 1 ? 'text-white/20 cursor-not-allowed' : 'bg-white/5 text-offwhite hover:bg-lime hover:text-forest'}`}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-offwhite/40 text-sm text-center py-6">No reviews yet for this turf. Be the first to play and rate!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Booking Widget */}
        <div className="lg:sticky lg:top-32 h-fit">
          <div className="glass-card p-8 border-lime/30 shadow-2xl shadow-lime/5">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <CalendarIcon className="text-lime" /> RESERVE A SLOT
            </h2>

            {/* Date Selection */}
            <div className="space-y-4 mb-8">
              <label className="text-xs font-black uppercase tracking-widest text-offwhite/40">Select Date</label>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                  const date = addDays(new Date(), offset);
                  const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  return (
                    <button
                      key={offset}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                      }}
                      className={`flex-shrink-0 w-20 py-4 rounded-2xl flex flex-col items-center transition-all ${
                        isSelected 
                          ? 'bg-lime text-forest shadow-lg shadow-lime/20 scale-105' 
                          : 'bg-white/5 text-offwhite/60 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase mb-1">{format(date, 'EEE')}</span>
                      <span className="text-xl font-black">{format(date, 'dd')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Selection */}
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-offwhite/40">Available Slots</label>
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-lime font-bold">
                  {slots?.filter(s => s.status === 'AVAILABLE').length || 0} SLOTS LEFT
                </span>
              </div>
              
              {loadingSlots ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse"></div>)}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {slots?.length > 0 ? (
                    slots.map((slot) => {
                      const isAvailable = slot.status === 'AVAILABLE';
                      const isSelected = selectedSlot === slot.id;
                      return (
                        <button
                          key={slot.id}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            !isAvailable 
                              ? 'bg-red-500/10 text-red-500/40 cursor-not-allowed border border-red-500/10' 
                              : isSelected
                                ? 'bg-lime text-forest scale-105 shadow-lg shadow-lime/10'
                                : 'bg-white/5 text-offwhite/80 hover:border-lime/40 border border-transparent'
                          }`}
                        >
                          {slot.startTime.substring(0, 5)}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-3 py-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-offwhite/40 text-sm">No slots generated for this date yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Booking Summary & Action */}
            <div className="space-y-6 pt-6 border-t border-white/10">
              {selectedSlotData && (
                <div className="flex justify-between items-center p-4 bg-lime/10 rounded-2xl border border-lime/20">
                  <div className="flex items-center gap-3 text-lime">
                    <CheckCircle size={20} />
                    <span className="font-bold">Slot Selected ({selectedSlotData.startTime.substring(0,5)} - {selectedSlotData.endTime.substring(0,5)})</span>
                  </div>
                  <span className="text-offwhite font-black">₹{finalPrice}</span>
                </div>
              )}

              {selectedSlot && !isAuthenticated && (
                <p className="text-xs text-center text-lime/80 font-bold tracking-tight uppercase flex items-center justify-center gap-1.5 bg-lime/5 py-2.5 rounded-xl border border-lime/10">
                  <span>🔒</span> Please log in to complete your reservation.
                </p>
              )}

              {!isAuthenticated ? (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-4 rounded-2xl text-lg font-black bg-lime text-forest hover:scale-[1.02] active:scale-95 shadow-xl shadow-lime/20 transition-all flex items-center justify-center gap-2"
                >
                  LOGIN TO BOOK
                </button>
              ) : (
                <button
                  disabled={!selectedSlot || bookingMutation.isPending}
                  onClick={() => bookingMutation.mutate({ slotId: selectedSlot })}
                  className={`w-full py-4 rounded-2xl text-lg font-black transition-all ${
                    !selectedSlot 
                      ? 'bg-white/5 text-offwhite/20 cursor-not-allowed' 
                      : 'bg-lime text-forest hover:scale-[1.02] active:scale-95 shadow-xl shadow-lime/20'
                  }`}
                >
                  {bookingMutation.isPending ? 'CONNECTING TO RAZORPAY...' : 'PROCEED TO PAY'}
                </button>
              )}
              
              <p className="text-[10px] text-center text-offwhite/30 font-bold uppercase tracking-tighter">
                Secure payment powered by Turfiez Pay
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual UPI Modal Removed */}

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-forest border border-lime/30 p-6 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px]"
          >
            <div className="w-12 h-12 bg-lime/20 rounded-full flex items-center justify-center text-lime animate-bounce">
              <Mail size={24} />
            </div>
            <div>
               <p className="text-lime font-black text-xs uppercase tracking-widest">Email Sent!</p>
               <p className="text-offwhite font-bold text-sm leading-tight">Confirmation sent to your inbox.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot Conflict Modal */}
      <AnimatePresence>
        {showConflictModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConflictModal(false)}
              className="absolute inset-0 bg-forest/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-card p-8 border-red-500/30 shadow-2xl z-10 bg-forest-dark"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/10 mx-auto">
                <ShieldCheck size={32} className="rotate-180 text-red-500" />
              </div>
              
              <h3 className="text-2xl font-black text-center mb-2 tracking-tighter">Slot Already Taken!</h3>
              <p className="text-offwhite/50 text-sm text-center mb-8">
                Oops! Someone just snatched this slot a split second before you. Don't worry, here are other available times for today:
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3 max-h-[200px] overflow-y-auto pr-1">
                  {slots?.filter(s => s.status === 'AVAILABLE').length > 0 ? (
                    slots.filter(s => s.status === 'AVAILABLE').map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => {
                          setSelectedSlot(slot.id);
                          setShowConflictModal(false);
                          bookingMutation.mutate({ slotId: slot.id });
                        }}
                        className="py-3 bg-white/5 border border-white/5 rounded-xl text-sm font-bold text-offwhite hover:border-lime/40 hover:bg-lime/10 hover:text-lime transition-all text-center"
                      >
                        {slot.startTime.substring(0, 5)}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 py-6 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-offwhite/40 text-sm">No other slots available for today.</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowConflictModal(false)}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-offwhite hover:bg-white/10 transition-all text-center"
                  >
                    Close
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowConflictModal(false)}
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

export default TurfDetail;
