import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { ArrowLeft, Plus, Calendar, Clock, Trash2, CheckCircle } from 'lucide-react';
import { format, startOfToday } from 'date-fns';

const ManageSlots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  
  const [generateData, setGenerateData] = useState({
    startDate: format(startOfToday(), 'yyyy-MM-dd'),
    endDate: format(startOfToday(), 'yyyy-MM-dd'),
    slotDuration: 60,
    price: ''
  });

  // Fetch Turf Details
  const { data: turf } = useQuery({
    queryKey: ['turf', id],
    queryFn: async () => {
      const response = await api.get(`/turfs/${id}`);
      return response.data;
    }
  });

  // Fetch Slots for current view
  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', id, selectedDate],
    queryFn: async () => {
      const response = await api.get(`/turfs/${id}/slots`, {
        params: { date: selectedDate }
      });
      return response.data;
    }
  });

  // Generate Slots Mutation
  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/turfs/${id}/slots/generate`, {
        startDate: data.startDate,
        endDate: data.endDate,
        slotDurationMinutes: parseInt(data.slotDuration),
        price: parseFloat(data.price || turf?.pricePerHour || 0)
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots', id] });
      alert('Slots generated successfully!');
    }
  });

  const blockMutation = useMutation({
    mutationFn: async ({ slotId, block }) => {
      const endpoint = block ? `/slots/${slotId}/block` : `/slots/${slotId}/unblock`;
      await api.put(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots', id, selectedDate] });
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-lime hover:text-lime/80 mb-6 font-bold transition-colors">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Generate Slots Form */}
        <div className="lg:col-span-1">
          <div className="glass-card p-8 sticky top-32">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Plus className="text-lime" /> GENERATE SLOTS
            </h2>
            <p className="text-offwhite/50 text-sm mb-8 italic">Quickly create slots for multiple days.</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-offwhite/40 uppercase tracking-widest">Start Date</label>
                <input 
                  type="date" 
                  value={generateData.startDate}
                  onChange={(e) => setGenerateData({...generateData, startDate: e.target.value})}
                  className="input-field w-full" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-offwhite/40 uppercase tracking-widest">End Date</label>
                <input 
                  type="date" 
                  value={generateData.endDate}
                  onChange={(e) => setGenerateData({...generateData, endDate: e.target.value})}
                  className="input-field w-full" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-offwhite/40 uppercase tracking-widest">Price Override (Optional)</label>
                <input 
                  type="number" 
                  placeholder={`Default: ₹${turf?.pricePerHour}`}
                  value={generateData.price}
                  onChange={(e) => setGenerateData({...generateData, price: e.target.value})}
                  className="input-field w-full" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-offwhite/40 uppercase tracking-widest">Slot Duration (Minutes)</label>
                <select 
                  value={generateData.slotDuration}
                  onChange={(e) => setGenerateData({...generateData, slotDuration: e.target.value})}
                  className="input-field w-full"
                >
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="90">90 Minutes</option>
                  <option value="120">120 Minutes</option>
                </select>
              </div>
              
              <button 
                onClick={() => generateMutation.mutate(generateData)}
                disabled={generateMutation.isPending || !turf}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                {generateMutation.isPending ? 'GENERATING...' : 'GENERATE SLOTS'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Slot Viewer & Management */}
        <div className="lg:col-span-2">
          <div className="glass-card p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
              <div>
                <h2 className="text-2xl font-black mb-1">MANAGE SLOTS</h2>
                <p className="text-offwhite/50 text-sm uppercase tracking-widest font-bold">FOR {turf?.name}</p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                <Calendar size={18} className="text-lime ml-2" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-offwhite font-bold text-sm"
                />
              </div>
            </div>

            {loadingSlots ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>)}
              </div>
            ) : slots?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {slots.map((slot) => (
                  <div key={slot.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    slot.status === 'BLOCKED' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-lime font-black">
                        <Clock size={16} />
                        <span>{slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded ${
                        slot.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-500' :
                        slot.status === 'BOOKED' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {slot.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {slot.status === 'AVAILABLE' && (
                        <button 
                          onClick={() => blockMutation.mutate({ slotId: slot.id, block: true })}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Block Slot"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      {slot.status === 'BLOCKED' && (
                        <button 
                          onClick={() => blockMutation.mutate({ slotId: slot.id, block: false })}
                          className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Unblock Slot"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <Clock size={40} className="mx-auto mb-4 text-offwhite/20" />
                <p className="text-offwhite/40 font-bold uppercase tracking-widest text-sm">No slots for this date</p>
                <p className="text-offwhite/20 text-xs mt-2">Use the generator on the left to create them.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageSlots;
