import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TurfListing from './pages/TurfListing';
import Dashboard from './pages/Dashboard';
import AddTurf from './pages/AddTurf';
import AdminDashboard from './pages/AdminDashboard';
import TurfDetail from './pages/TurfDetail';
import ManageSlots from './pages/ManageSlots';
import { useAuthStore } from './store/authStore';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/turfs" element={<TurfListing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/add-turf" element={<ProtectedRoute allowedRoles={['OWNER']}><AddTurf /></ProtectedRoute>} />
            <Route path="/turfs/:id/edit" element={<ProtectedRoute allowedRoles={['OWNER']}><AddTurf /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/turfs/:id" element={<TurfDetail />} />
            <Route path="/turfs/:id/manage" element={<ProtectedRoute allowedRoles={['OWNER']}><ManageSlots /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
