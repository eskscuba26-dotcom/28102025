import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Scissors, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';

const Home = () => {
  const [stats, setStats] = useState({
    normalStock: 0,
    cutStock: 0,
    totalProduction: 0,
    totalShipment: 0,
    rawMaterials: {
      gaz: 0,
      petkim: 0,
      estol: 0,
      talk: 0,
      masura100: 0,
      masura120: 0,
      masura150: 0,
      masura200: 0,
      sari: 0
    }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [stockRes, prodRes, shipRes, rawMatRes, consumptionRes] = await Promise.all([
        api.get('/stock'),
        api.get('/production'),
        api.get('/shipment'),
        api.get('/raw-materials'),
        api.get('/daily-consumption')
      ]);

      const stocks = stockRes.data;
      const normalStock = stocks
        .filter(s => s.urun_tipi === 'Normal')
        .reduce((sum, s) => sum + s.toplam_adet, 0);
      
      const cutStock = stocks
        .filter(s => s.urun_tipi === 'Kesilmiş')
        .reduce((sum, s) => sum + s.toplam_adet, 0);

      // Calculate raw material stocks - start with inputs
      const rawMaterials = {
        gaz: 0,
        petkim: 0,
        estol: 0,
        talk: 0,
        masura100: 0,
        masura120: 0,
        masura150: 0,
        masura200: 0,
        sari: 0
      };

      // Add raw material inputs
      rawMatRes.data.forEach(mat => {
        const name = mat.malzeme_adi.toLowerCase();
        const miktar = mat.miktar || 0;
        
        if (name.includes('gaz')) {
          rawMaterials.gaz += miktar;
        } else if (name.includes('petkim') || name.includes('pet')) {
          rawMaterials.petkim += miktar;
        } else if (name.includes('estol')) {
          rawMaterials.estol += miktar;
        } else if (name.includes('talk')) {
          rawMaterials.talk += miktar;
        } else if (name.includes('masura') && name.includes('100')) {
          rawMaterials.masura100 += miktar;
        } else if (name.includes('masura') && name.includes('120')) {
          rawMaterials.masura120 += miktar;
        } else if (name.includes('masura') && name.includes('150')) {
          rawMaterials.masura150 += miktar;
        } else if (name.includes('masura') && name.includes('200')) {
          rawMaterials.masura200 += miktar;
        } else if (name.includes('sarı') || name.includes('sari')) {
          rawMaterials.sari += miktar;
        }
      });

      // Subtract consumption from daily consumption records
      consumptionRes.data.forEach(cons => {
        rawMaterials.petkim -= cons.toplam_petkim_tuketim || 0;
        rawMaterials.estol -= cons.toplam_estol_tuketim || 0;
        rawMaterials.talk -= cons.toplam_talk_tuketim || 0;
      });

      // Subtract masura used in production (1 adet per production)
      prodRes.data.forEach(prod => {
        const masuraTipi = prod.masura_tipi;
        if (!masuraTipi) return;
        
        // Handle both "100" and "Masura 100" formats
        if (masuraTipi.includes('100')) {
          rawMaterials.masura100 -= 1;
        } else if (masuraTipi.includes('120')) {
          rawMaterials.masura120 -= 1;
        } else if (masuraTipi.includes('150')) {
          rawMaterials.masura150 -= 1;
        } else if (masuraTipi.includes('200')) {
          rawMaterials.masura200 -= 1;
        }
      });

      setStats({
        normalStock,
        cutStock,
        totalProduction: prodRes.data.filter(p => p.urun_tipi === 'Normal').length,
        totalShipment: shipRes.data.length,
        rawMaterials
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

      {/* Hammadde Stokları */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Hammadde Stokları
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Gaz */}
          <Card className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 border-purple-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-200">Gaz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.gaz.toFixed(0)}</div>
              <p className="text-xs text-purple-300">kg</p>
            </CardContent>
          </Card>

          {/* Petkim */}
          <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Petkim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.petkim.toFixed(0)}</div>
              <p className="text-xs text-blue-300">kg</p>
            </CardContent>
          </Card>

          {/* Estol */}
          <Card className="bg-gradient-to-br from-cyan-950/50 to-cyan-900/30 border-cyan-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cyan-200">Estol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.estol.toFixed(0)}</div>
              <p className="text-xs text-cyan-300">kg</p>
            </CardContent>
          </Card>

          {/* Talk */}
          <Card className="bg-gradient-to-br from-teal-950/50 to-teal-900/30 border-teal-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-teal-200">Talk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.talk.toFixed(0)}</div>
              <p className="text-xs text-teal-300">kg</p>
            </CardContent>
          </Card>

          {/* Masura 100 */}
          <Card className="bg-gradient-to-br from-green-950/50 to-green-900/30 border-green-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-200">Masura 100</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.masura100.toFixed(0)}</div>
              <p className="text-xs text-green-300">adet</p>
            </CardContent>
          </Card>

          {/* Masura 120 */}
          <Card className="bg-gradient-to-br from-lime-950/50 to-lime-900/30 border-lime-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-lime-200">Masura 120</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.masura120.toFixed(0)}</div>
              <p className="text-xs text-lime-300">adet</p>
            </CardContent>
          </Card>

          {/* Masura 150 */}
          <Card className="bg-gradient-to-br from-yellow-950/50 to-yellow-900/30 border-yellow-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-200">Masura 150</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.masura150.toFixed(0)}</div>
              <p className="text-xs text-yellow-300">adet</p>
            </CardContent>
          </Card>

          {/* Masura 200 */}
          <Card className="bg-gradient-to-br from-orange-950/50 to-orange-900/30 border-orange-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-200">Masura 200</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.masura200.toFixed(0)}</div>
              <p className="text-xs text-orange-300">adet</p>
            </CardContent>
          </Card>

          {/* Sarı */}
          <Card className="bg-gradient-to-br from-amber-950/50 to-amber-900/30 border-amber-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-200">Sarı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rawMaterials.sari.toFixed(0)}</div>
              <p className="text-xs text-amber-300">kg</p>
            </CardContent>
          </Card>
        </div>
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
