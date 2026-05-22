import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Shield, Users, XCircle, Ban, Ticket, CalendarX2 } from 'lucide-react';
import { useState } from 'react';
import api from '../api/axiosConfig';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('turfs');

  const { data: turfs = [], isLoading: loadingTurfs } = useQuery({
    queryKey: ['adminTurfs'],
    queryFn: async () => (await api.get('/admin/turfs')).data,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/admin/users')).data,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: async () => (await api.get('/admin/bookings')).data,
  });

  const updateStatus = async (id, status) => {
    await api.put(`/turfs/${id}/status`, null, { params: { status } });
    queryClient.invalidateQueries({ queryKey: ['adminTurfs'] });
    queryClient.invalidateQueries({ queryKey: ['turfs'] });
  };

  const toggleUserStatus = async (id) => {
    await api.put(`/admin/users/${id}/status`);
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  };

  const cancelBooking = async (id) => {
    if (window.confirm("Are you sure you want to forcefully cancel this booking?")) {
        await api.put(`/admin/bookings/${id}/cancel`);
        queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
    }
  };

  const stats = {
    pending: turfs.filter(turf => turf.status === 'PENDING').length,
    approved: turfs.filter(turf => turf.status === 'APPROVED').length,
    rejected: turfs.filter(turf => turf.status === 'REJECTED').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-lime font-bold tracking-widest text-sm mb-2">CONTROL ROOM</p>
        <h1 className="text-5xl font-black">ADMIN</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
        <div className="glass-card p-5">
          <Users className="text-lime mb-3" />
          <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Users</p>
          <p className="text-3xl font-black text-lime mt-2">{users.length}</p>
        </div>
        <div className="glass-card p-5">
          <Clock className="text-lime mb-3" />
          <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Pending Turfs</p>
          <p className="text-3xl font-black text-lime mt-2">{stats.pending}</p>
        </div>
        <div className="glass-card p-5">
          <Ticket className="text-lime mb-3" />
          <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Total Bookings</p>
          <p className="text-3xl font-black text-lime mt-2">{bookings.length}</p>
        </div>
        <div className="glass-card p-5">
          <CheckCircle className="text-lime mb-3" />
          <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Approved Turfs</p>
          <p className="text-3xl font-black text-lime mt-2">{stats.approved}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('turfs')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'turfs' ? 'bg-lime text-forest' : 'text-offwhite/50 hover:text-offwhite hover:bg-white/5'}`}
        >
          Turf Approvals
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-lime text-forest' : 'text-offwhite/50 hover:text-offwhite hover:bg-white/5'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'bookings' ? 'bg-lime text-forest' : 'text-offwhite/50 hover:text-offwhite hover:bg-white/5'}`}
        >
          Platform Bookings
        </button>
      </div>

      {activeTab === 'turfs' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <Shield className="text-lime" /> Turf Review
          </h2>
          {loadingTurfs ? (
            <div className="py-16 text-center text-offwhite/50 font-bold">Loading turfs...</div>
          ) : (
            <div className="space-y-4">
              {turfs.map((turf) => (
                <div key={turf.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <h3 className="text-lg font-black">{turf.name}</h3>
                    <p className="text-sm text-offwhite/50">{turf.city} · ${turf.pricePerHour}/hr · Owner #{turf.ownerId}</p>
                    <p className="text-xs font-black text-lime mt-2">{turf.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateStatus(turf.id, 'APPROVED')} className="px-4 py-2 bg-lime text-forest rounded-xl text-xs font-black">
                      Approve
                    </button>
                    <button onClick={() => updateStatus(turf.id, 'PENDING')} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-black">
                      Pending
                    </button>
                    <button onClick={() => updateStatus(turf.id, 'REJECTED')} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl text-xs font-black">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <Users className="text-lime" /> User Management
          </h2>
          {loadingUsers ? (
            <div className="py-16 text-center text-offwhite/50 font-bold">Loading users...</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      {user.name} 
                      {!user.isActive && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Banned</span>}
                    </h3>
                    <p className="text-sm text-offwhite/50">{user.email} · Role: {user.role} · Points: {user.loyaltyPoints}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => toggleUserStatus(user.id)} 
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${user.isActive ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-lime/20 text-lime hover:bg-lime/30'}`}
                    >
                      <Ban size={14} /> {user.isActive ? 'Ban User' : 'Activate User'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <Ticket className="text-lime" /> Platform Bookings
          </h2>
          {loadingBookings ? (
            <div className="py-16 text-center text-offwhite/50 font-bold">Loading bookings...</div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <h3 className="text-lg font-black">Booking #{booking.bookingRef}</h3>
                    <p className="text-sm text-offwhite/50">Turf ID: {booking.turfId} · User ID: {booking.userId} · ${booking.totalPrice}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${booking.status === 'CONFIRMED' ? 'bg-lime/10 text-lime' : 'bg-red-500/10 text-red-400'}`}>{booking.status}</span>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${booking.paymentStatus === 'PAID' ? 'bg-lime/10 text-lime' : 'bg-white/10 text-white/50'}`}>{booking.paymentStatus}</span>
                    </div>
                  </div>
                  {booking.status === 'CONFIRMED' && (
                      <div className="flex gap-2">
                        <button 
                            onClick={() => cancelBooking(booking.id)} 
                            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-red-500/30"
                        >
                          <CalendarX2 size={14} /> Cancel Booking
                        </button>
                      </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
