import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosConfig';
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Backend logout failed', error);
    }
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-50 bg-forest/80 backdrop-blur-lg border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-lime rounded-lg flex items-center justify-center transform transition-transform group-hover:rotate-12">
                <span className="text-forest font-archivo text-xl font-black">T</span>
              </div>
              <span className="font-archivo text-2xl tracking-tighter text-offwhite">
                TURF<span className="text-lime">IEZ</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/turfs" className="text-offwhite/80 hover:text-lime px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Browse Turfs
              </Link>
              {isAuthenticated ? (
                <div className="flex items-center gap-6">
                  <Link to="/dashboard" className="text-offwhite/80 hover:text-lime px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="text-offwhite/80 hover:text-lime px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Admin
                    </Link>
                  )}
                  <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-forest-light border border-lime/30 flex items-center justify-center text-lime">
                        <UserIcon size={16} />
                      </div>
                      <span className="text-sm font-medium text-offwhite">{user?.name}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-offwhite/60 hover:text-red-400 transition-colors rounded-full hover:bg-white/5"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-offwhite hover:text-lime font-medium transition-colors">
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2 px-5">
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-offwhite hover:text-lime focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-forest-dark border-b border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/turfs" onClick={() => setIsOpen(false)} className="text-offwhite hover:text-lime block px-3 py-2 rounded-md text-base font-medium">
                Browse Turfs
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-offwhite hover:text-lime block px-3 py-2 rounded-md text-base font-medium">
                    Dashboard
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setIsOpen(false)} className="text-offwhite hover:text-lime block px-3 py-2 rounded-md text-base font-medium">
                      Admin
                    </Link>
                  )}
                  <button onClick={() => { setIsOpen(false); handleLogout(); }} className="text-red-400 hover:text-red-300 w-full text-left block px-3 py-2 rounded-md text-base font-medium">
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="text-offwhite hover:text-lime block px-3 py-2 rounded-md text-base font-medium">
                    Log in
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="text-lime font-bold block px-3 py-2 rounded-md text-base">
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
