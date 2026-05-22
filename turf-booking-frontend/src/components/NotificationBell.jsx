import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch notifications – auto-refetch every 30 seconds
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 rounded-full text-offwhite/60 hover:text-lime hover:bg-white/5 transition-all"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-500/30 px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-[360px] max-h-[480px] rounded-2xl border border-white/10 bg-forest-dark/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black tracking-tight text-offwhite">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-lime/10 text-lime font-black px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-[10px] font-bold text-offwhite/40 hover:text-lime transition-colors px-2 py-1 rounded-lg hover:bg-white/5 flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck size={12} /> All read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-offwhite/30 hover:text-offwhite hover:bg-white/5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-offwhite/20">
                    <Bell size={28} />
                  </div>
                  <p className="text-sm font-bold text-offwhite/30">No notifications yet</p>
                  <p className="text-[11px] text-offwhite/20 mt-1">
                    We'll notify you when something happens
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`group relative px-5 py-3.5 flex gap-3 cursor-pointer transition-colors ${
                        n.isRead
                          ? 'hover:bg-white/[0.02]'
                          : 'bg-lime/[0.03] hover:bg-lime/[0.06]'
                      }`}
                      onClick={() => {
                        if (!n.isRead) markReadMutation.mutate(n.id);
                      }}
                    >
                      {/* Unread indicator */}
                      {!n.isRead && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-lime rounded-full shadow-sm shadow-lime/40" />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-snug ${n.isRead ? 'text-offwhite/50' : 'text-offwhite'}`}>
                          {n.title}
                        </p>
                        <p className={`text-[11px] leading-snug mt-0.5 line-clamp-2 ${n.isRead ? 'text-offwhite/30' : 'text-offwhite/60'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-offwhite/20 mt-1 font-medium">
                          {n.createdAt
                            ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
                            : ''}
                        </p>
                      </div>

                      {/* Single read action */}
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate(n.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 self-center p-1.5 rounded-lg text-offwhite/30 hover:text-lime hover:bg-lime/10 transition-all"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-white/5 text-center">
                <span className="text-[10px] font-bold text-offwhite/20 uppercase tracking-widest">
                  Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
