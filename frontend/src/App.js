import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Package, Scissors, Truck, BarChart3, Menu, X, Users, LogOut, DollarSign, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import UserManagement from '@/pages/UserManagement';
import CurrencySettings from '@/pages/CurrencySettings';
import ProductionForm from '@/components/ProductionForm';
import CutProductForm from '@/components/CutProductForm';
import ShipmentForm from '@/components/ShipmentForm';
import StockView from '@/components/StockView';
import RawMaterialForm from '@/components/RawMaterialForm';
import logo from '@/assets/logo.png';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function SidebarNav({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Ana Sayfa' },
    { path: '/production', icon: Package, label: 'Üretim Girişi' },
    { path: '/cut-product', icon: Scissors, label: 'Kesilmiş Ürün' },
    { path: '/shipment', icon: Truck, label: 'Sevkiyat' },
    { path: '/stock', icon: BarChart3, label: 'Stok Görünümü' },
    { path: '/raw-materials', icon: ShoppingCart, label: 'Hammadde Yönetimi' },
    { path: '/currency', icon: DollarSign, label: 'Kur Ayarları' }
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/users', icon: Users, label: 'Kullanıcı Yönetimi' });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 text-white bg-slate-900 hover:bg-slate-800"
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <aside 
        className={`fixed top-0 left-0 h-full bg-slate-950 border-r border-slate-800 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SAR Ambalaj" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                SAR Ambalaj
              </h1>
              <p className="text-xs text-slate-400">{user?.username}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function AppContent({ user, onLogout }) {
  // If user is null, don't render anything (ProtectedRoute will handle redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SidebarNav user={user} onLogout={onLogout} />
      
      <main className="lg:ml-64 p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/production" element={<ProductionForm userRole={user.role} />} />
          <Route path="/cut-product" element={<CutProductForm userRole={user.role} />} />
          <Route path="/shipment" element={<ShipmentForm userRole={user.role} />} />
          <Route path="/stock" element={<StockView userRole={user.role} />} />
          <Route path="/raw-materials" element={<RawMaterialForm userRole={user.role} />} />
          <Route path="/currency" element={user.role === 'admin' ? <CurrencySettings /> : <Navigate to="/" />} />
          <Route path="/users" element={user.role === 'admin' ? <UserManagement /> : <Navigate to="/" />} />
        </Routes>
      </main>
          <Route path="/shipment" element={<ShipmentForm userRole={user.role} />} />
          <Route path="/stock" element={<StockView userRole={user.role} />} />
          <Route path="/users" element={user.role === 'admin' ? <UserManagement /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    
    if (token && role && username) {
      setUser({ token, role, username });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setUser(null);
    toast.success('Çıkış yapıldı');
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppContent user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;