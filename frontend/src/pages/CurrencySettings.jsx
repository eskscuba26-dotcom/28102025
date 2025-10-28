import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DollarSign, Euro, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';

const CurrencySettings = () => {
  const [rates, setRates] = useState({
    usd_rate: '',
    eur_rate: ''
  });
  const [currentRates, setCurrentRates] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await api.get('/currency-rates');
      setCurrentRates(response.data);
      setRates({
        usd_rate: response.data.usd_rate || '',
        eur_rate: response.data.eur_rate || ''
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/currency-rates', {
        usd_rate: parseFloat(rates.usd_rate),
        eur_rate: parseFloat(rates.eur_rate)
      });
      
      toast.success('Kur değerleri güncellendi!');
      fetchRates();
    } catch (error) {
      toast.error('Kur güncellenemedi!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Kur Ayarları
        </h1>
        <p className="text-slate-400">Döviz kurlarını manuel olarak güncelleyin</p>
      </div>

      {currentRates && (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Güncel Kurlar
            </CardTitle>
            <CardDescription className="text-slate-400">
              Son güncelleme: {new Date(currentRates.updated_at).toLocaleString('tr-TR')}
              {currentRates.updated_by && ` - ${currentRates.updated_by}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300 font-medium">1 USD</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {currentRates.usd_rate.toFixed(2)} ₺
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Euro className="h-5 w-5 text-blue-400" />
                  <span className="text-slate-300 font-medium">1 EUR</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {currentRates.eur_rate.toFixed(2)} ₺
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Kur Güncelle</CardTitle>
          <CardDescription className="text-slate-400">
            Yeni kur değerlerini girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Dolar Kuru (1 USD = ? TL)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rates.usd_rate}
                  onChange={(e) => setRates({...rates, usd_rate: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  placeholder="Örn: 32.50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Euro Kuru (1 EUR = ? TL)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rates.eur_rate}
                  onChange={(e) => setRates({...rates, eur_rate: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  placeholder="Örn: 35.20"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Güncelleniyor...' : 'Kurları Güncelle'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencySettings;
