import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Shield, Users, XCircle } from 'lucide-react';
import api from '../api/axiosConfig';

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  const { data: turfs = [], isLoading: loadingTurfs } = useQuery({
    queryKey: ['adminTurfs'],
    queryFn: async () => (await api.get('/admin/turfs')).data,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/admin/users')).data,
  });

  const updateStatus = async (id, status) => {
    await api.put(`/turfs/${id}/status`, null, { params: { status } });
    queryClient.invalidateQueries({ queryKey: ['adminTurfs'] });
    queryClient.invalidateQueries({ queryKey: ['turfs'] });
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
          <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Pending</p>
          <p className="text-3xl font-black text-lime mt-2">{stats.pending}</p>
        </div>
        <div className="glass-card p-5">
          <CheckCircle className="text-lime mb-3" />
          <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Approved</p>
          <p className="text-3xl font-black text-lime mt-2">{stats.approved}</p>
        </div>
        <div className="glass-card p-5">
          <XCircle className="text-lime mb-3" />
          <p className="text-xs font-black text-offwhite/40 uppercase tracking-widest">Rejected</p>
          <p className="text-3xl font-black text-lime mt-2">{stats.rejected}</p>
        </div>
      </div>

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
    </div>
  );
};

export default AdminDashboard;
