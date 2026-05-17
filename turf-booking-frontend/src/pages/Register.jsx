import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'PLAYER'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        const errorMsg = Object.values(err.response.data).join(', ') || 'Registration failed';
        setError(errorMsg);
      } else {
        setError('Failed to register. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime/10 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl glass-card p-8 sm:p-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">CREATE ACCOUNT</h1>
          <p className="text-offwhite/60">Join the ultimate turf booking platform</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-start gap-3 mb-6"
          >
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setFormData({...formData, role: 'PLAYER'})}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${formData.role === 'PLAYER' ? 'border-lime bg-lime/10 text-lime' : 'border-white/10 text-offwhite/60 hover:border-white/30'}`}
            >
              <User size={24} />
              <span className="font-bold">Player</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, role: 'OWNER'})}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${formData.role === 'OWNER' ? 'border-lime bg-lime/10 text-lime' : 'border-white/10 text-offwhite/60 hover:border-white/30'}`}
            >
              <ShieldCheck size={24} />
              <span className="font-bold">Turf Owner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-offwhite/80">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-offwhite/40" />
                </div>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input-field pl-11" placeholder="John Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-offwhite/80">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-offwhite/40" />
                </div>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field pl-11" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-offwhite/80">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-offwhite/40" />
              </div>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="input-field pl-11" placeholder="you@example.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-offwhite/80">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-offwhite/40" />
              </div>
              <input type="password" name="password" required minLength="8" value={formData.password} onChange={handleChange} className="input-field pl-11" placeholder="••••••••" />
            </div>
            
            {/* Password Strength Indicator */}
            <div className="mt-2 space-y-1">
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map((i) => {
                  const strength = formData.password.length === 0 ? 0 : 
                                   formData.password.length < 6 ? 1 :
                                   formData.password.length < 10 ? 2 :
                                   /[!@#$%^&*]/.test(formData.password) ? 4 : 3;
                  return (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full transition-all duration-500 ${
                        i <= strength 
                          ? strength === 1 ? 'bg-red-500' : 
                            strength === 2 ? 'bg-yellow-500' : 
                            strength >= 3 ? 'bg-lime' : 'bg-white/10'
                          : 'bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-offwhite/30">
                {formData.password.length === 0 ? 'Enter Password' :
                 formData.password.length < 6 ? 'Too Weak' :
                 formData.password.length < 10 ? 'Fairly Strong' : 'Ultra Secure'}
              </p>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-8">
            {isLoading ? <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin" /> : <>Create Account <ArrowRight className="ml-2" size={18} /></>}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-offwhite/60">
          Already have an account?{' '}
          <Link to="/login" className="text-lime font-bold hover:underline">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
