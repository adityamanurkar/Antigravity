import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { getImageUrl, handleImageError } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, DollarSign, Calendar as CalendarIcon, CheckCircle, ChevronLeft, ChevronRight, ShieldCheck, Mail, Zap, Car, DoorOpen, Droplets, Bath, Activity, Video, Copy, Smartphone, QrCode } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const TurfDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('input'); // 'input' | 'processing' | 'success'
  const [showNotification, setShowNotification] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);

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
  const { data: turf, isLoading: loadingTurf } = useQuery({
    queryKey: ['turf', id],
    queryFn: async () => {
      const response = await api.get(`/turfs/${id}`);
      return response.data;
    }
  });

  // Fetch Available Slots
  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await api.get(`/turfs/${id}/slots`, {
        params: { date: format(selectedDate, 'yyyy-MM-dd') }
      });
      return response.data;
    }
  });

  // Booking Mutation
  const bookingMutation = useMutation({
    mutationFn: async ({ slotId, transactionId }) => {
      const response = await api.post('/bookings', { 
        slotId,
        turfId: parseInt(id),
        numberOfPlayers: 1,
        transactionId
      });
      return response.data;
    },
    onSuccess: () => {
      setShowPaymentModal(false);
      setPaymentStep('input');
      setUtrNumber('');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        navigate('/dashboard');
      }, 3000);
    },
    onError: (err) => {
      setPaymentStep('input');
      alert(err.response?.data?.message || 'Failed to book slot.');
    }
  });

  const upiId = turf?.upiId || 'turfiez@okaxis';
  const upiAmount = turf?.pricePerHour || 0;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(turf?.name || 'Turfiez')}&am=${upiAmount}&cu=INR&tn=Booking-${turf?.name || 'Turf'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <div>
              <h1 className="text-5xl font-black mb-4">{turf?.name}</h1>
              <div className="flex items-center gap-2 text-offwhite/60">
                <MapPin size={18} className="text-lime" />
                <span>{turf?.address}, {turf?.city}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="glass-card flex-1 p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-lime/10 rounded-xl flex items-center justify-center text-lime">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-offwhite/40 text-xs font-bold uppercase tracking-widest">Price</p>
                  <p className="text-xl font-black">${turf?.pricePerHour}<span className="text-sm font-normal text-offwhite/40">/hr</span></p>
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
              {selectedSlot && (
                <div className="flex justify-between items-center p-4 bg-lime/10 rounded-2xl border border-lime/20">
                  <div className="flex items-center gap-3 text-lime">
                    <CheckCircle size={20} />
                    <span className="font-bold">Slot Selected</span>
                  </div>
                  <span className="text-offwhite font-black">${turf?.pricePerHour}</span>
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
                  onClick={() => setShowPaymentModal(true)}
                  className={`w-full py-4 rounded-2xl text-lg font-black transition-all ${
                    !selectedSlot 
                      ? 'bg-white/5 text-offwhite/20 cursor-not-allowed' 
                      : 'bg-lime text-forest hover:scale-[1.02] active:scale-95 shadow-xl shadow-lime/20'
                  }`}
                >
                  {bookingMutation.isPending ? 'PROCESSING...' : 'PROCEED TO PAY'}
                </button>
              )}
              
              <p className="text-[10px] text-center text-offwhite/30 font-bold uppercase tracking-tighter">
                Secure payment powered by Turfiez Pay
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !bookingMutation.isPending && (setShowPaymentModal(false), setPaymentStep('input'), setUtrNumber(''))}
              className="absolute inset-0 bg-forest/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 border-lime/30 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-lime/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: paymentStep === 'processing' ? '100%' : '0%' }}
                  transition={{ duration: 2 }}
                  className="h-full bg-lime shadow-[0_0_10px_#C5F135]"
                />
              </div>

              {paymentStep === 'input' && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black">UPI CHECKOUT</h3>
                    <div className="bg-lime/10 p-2 rounded-lg text-lime">
                      <QrCode size={20} />
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-offwhite/50">Turf Fee</span>
                      <span className="text-offwhite font-bold">₹{turf?.pricePerHour}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-offwhite/50">Platform Fee</span>
                      <span className="text-lime font-bold">₹0.00</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total Payable</span>
                      <span className="text-lime font-black">₹{turf?.pricePerHour}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-2xl shadow-xl shadow-lime/10">
                      <img src={qrCodeUrl} alt="UPI QR Code" className="w-[200px] h-[200px]" />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-offwhite/50 font-bold uppercase tracking-widest">
                      <Smartphone size={12} /> Scan with GPay, PhonePe, Paytm or BHIM
                    </div>
                  </div>

                  {/* Copyable UPI ID */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-offwhite/40 uppercase">Or Pay Manually to UPI ID</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={upiId} 
                        readOnly 
                        className="input-field w-full text-lime font-bold" 
                      />
                      <button 
                        onClick={copyUpiId}
                        className={`px-4 rounded-xl border transition-all font-bold text-xs flex items-center gap-1.5 ${
                          copied 
                            ? 'bg-lime/20 border-lime/40 text-lime' 
                            : 'border-white/10 text-offwhite/60 hover:border-lime/30 hover:text-lime'
                        }`}
                      >
                        <Copy size={14} />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* UTR Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-offwhite/40 uppercase">UPI Transaction ID (UTR Number)</label>
                    <input 
                      type="text" 
                      value={utrNumber} 
                      onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 22))}
                      className="input-field w-full" 
                      placeholder="Enter 12-digit UTR after payment" 
                    />
                    <p className="text-[9px] text-offwhite/30 font-bold uppercase">
                      Find your UTR in GPay → Activity → Transaction Details
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-offwhite/40 font-bold uppercase tracking-widest justify-center">
                    <ShieldCheck size={14} className="text-lime" /> Zero Fees · Direct to Owner
                  </div>

                  <button
                    disabled={utrNumber.trim().length < 8}
                    onClick={() => {
                      setPaymentStep('processing');
                      setTimeout(() => {
                        bookingMutation.mutate({ slotId: selectedSlot, transactionId: utrNumber.trim() });
                      }, 2000);
                    }}
                    className={`w-full py-4 rounded-2xl text-lg font-black transition-all ${
                      utrNumber.trim().length < 8
                        ? 'bg-white/5 text-offwhite/20 cursor-not-allowed'
                        : 'bg-lime text-forest hover:scale-[1.02] active:scale-95 shadow-xl shadow-lime/20'
                    }`}
                  >
                    CONFIRM PAYMENT
                  </button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-20 text-center space-y-6">
                  <div className="w-20 h-20 border-4 border-lime border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <h3 className="text-2xl font-black mb-2 tracking-tighter">VERIFYING PAYMENT</h3>
                    <p className="text-offwhite/50 text-sm">Confirming your UPI transaction... Please wait.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    </div>
  );
};

export default TurfDetail;
