import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Package, Scissors, Truck, BarChart3, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Home from '@/pages/Home';
import ProductionForm from '@/components/ProductionForm';
import CutProductForm from '@/components/CutProductForm';
import ShipmentForm from '@/components/ShipmentForm';
import StockView from '@/components/StockView';
import logo from '@/assets/logo.png';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';

function SidebarNav() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Ana Sayfa' },
    { path: '/production', icon: Package, label: 'Üretim Girişi' },
    { path: '/cut-product', icon: Scissors, label: 'Kesilmiş Ürün' },
    { path: '/shipment', icon: Truck, label: 'Sevkiyat' },
    { path: '/stock', icon: BarChart3, label: 'Stok Görünümü' }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 text-white bg-slate-900 hover:bg-slate-800"
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-slate-950 border-r border-slate-800 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SAR Ambalaj" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                SAR Ambalaj
              </h1>
              <p className="text-xs text-slate-400">Yönetim Sistemi</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
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
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SidebarNav />
      
      {/* Main Content */}
      <main className="lg:ml-64 p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/production" element={<ProductionForm />} />
          <Route path="/cut-product" element={<CutProductForm />} />
          <Route path="/shipment" element={<ShipmentForm />} />
          <Route path="/stock" element={<StockView />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;