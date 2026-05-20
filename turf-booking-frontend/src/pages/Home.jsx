import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Zap } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-lime/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-900/40 blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-lime/10 border border-lime/20 text-lime text-sm font-bold tracking-wider mb-6">
                THE PREMIER TURF BOOKING PLATFORM
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              BOOK YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-emerald-400">TURF.</span><br />
              PLAY YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-emerald-400">GAME.</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-offwhite/70 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Instant bookings, real-time availability, and the best sports facilities in your city. Elevate your game today.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link to="/turfs" className="btn-primary w-full sm:w-auto text-lg px-8 py-4">
                Browse Turfs <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link to="/register" className="btn-outline w-full sm:w-auto text-lg px-8 py-4">
                List Your Turf
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-forest-dark relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">WHY CHOOSE TURFIEZ</h2>
            <p className="text-offwhite/60 text-lg max-w-2xl mx-auto">We've simplified the process so you can focus on what matters most: playing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Instant Booking", desc: "No phone calls needed. Book your favorite turf in less than 60 seconds." },
              { icon: Calendar, title: "Real-time Availability", desc: "See exactly what slots are open right now. No double bookings ever." },
              { icon: MapPin, title: "Discover Venues", desc: "Find hidden gems and top-rated facilities near your location instantly." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-8 group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-14 h-14 bg-lime/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-lime group-hover:text-forest text-lime transition-colors duration-300">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-offwhite/60 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
