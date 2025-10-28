import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Scissors, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';

const Home = () => {
  const [stats, setStats] = useState({
    normalStock: 0,
    cutStock: 0,
    totalProduction: 0,
    totalShipment: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [stockRes, prodRes, shipRes] = await Promise.all([
        api.get('/stock'),
        api.get('/production'),
        api.get('/shipment')
      ]);

      const stocks = stockRes.data;
      const normalStock = stocks
        .filter(s => s.urun_tipi === 'Normal')
        .reduce((sum, s) => sum + s.toplam_adet, 0);
      
      const cutStock = stocks
        .filter(s => s.urun_tipi === 'Kesilmiş')
        .reduce((sum, s) => sum + s.toplam_adet, 0);

      setStats({
        normalStock,
        cutStock,
        totalProduction: prodRes.data.filter(p => p.urun_tipi === 'Normal').length,
        totalShipment: shipRes.data.length
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Hoş Geldiniz
        </h1>
        <p className="text-slate-400">SAR Ambalaj Üretim Yönetim Sistemi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Normal Ürün Stok */}
        <Card className="bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border-emerald-800/50 backdrop-blur-sm hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-200">
              Toplam Normal Ürün Stoğu
            </CardTitle>
            <Package className="h-8 w-8 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.normalStock}
            </div>
            <p className="text-xs text-emerald-300">
              Rulo/Adet
            </p>
          </CardContent>
        </Card>

        {/* Kesilmiş Ürün Stok */}
        <Card className="bg-gradient-to-br from-amber-950/50 to-amber-900/30 border-amber-800/50 backdrop-blur-sm hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-200">
              Toplam Kesilmiş Ürün Stoğu
            </CardTitle>
            <Scissors className="h-8 w-8 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.cutStock}
            </div>
            <p className="text-xs text-amber-300">
              Parça/Adet
            </p>
          </CardContent>
        </Card>

        {/* Toplam Üretim */}
        <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/50 backdrop-blur-sm hover:scale-105 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-200">
              Toplam Üretim Kaydı
            </CardTitle>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.totalProduction}
            </div>
            <p className="text-xs text-blue-300">
              Kayıt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Bilgiler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Sistem Özeti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Normal Ürün Stoğu</span>
              <span className="text-emerald-400 font-bold text-xl">{stats.normalStock} adet</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Kesilmiş Ürün Stoğu</span>
              <span className="text-amber-400 font-bold text-xl">{stats.cutStock} adet</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400">Toplam Sevkiyat</span>
              <span className="text-blue-400 font-bold text-xl">{stats.totalShipment} kayıt</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Hızlı Erişim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-400 text-sm">
              Sol menüden istediğiniz sayfaya hızlıca erişebilirsiniz:
            </p>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Üretim Girişi - Yeni üretim kayıtları ekleyin</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Kesilmiş Ürün - Ebatlama işlemleri</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Sevkiyat - Çıkış kayıtları</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Stok Görünümü - Anlık stok durumu</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
