import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductionForm = () => {
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    makine: '',
    kalinlik: '',
    en: '',
    metre: '',
    adet: '',
    masura_tipi: ''
  });

  const [metrekare, setMetrekare] = useState(0);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto calculate metrekare
    if (name === 'en' || name === 'metre') {
      const en = name === 'en' ? parseFloat(value) : parseFloat(formData.en);
      const metre = name === 'metre' ? parseFloat(value) : parseFloat(formData.metre);
      
      if (!isNaN(en) && !isNaN(metre)) {
        const calculatedMetrekare = (en / 100) * metre;
        setMetrekare(calculatedMetrekare.toFixed(2));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        kalinlik: parseFloat(formData.kalinlik),
        en: parseFloat(formData.en),
        metre: parseFloat(formData.metre),
        metrekare: parseFloat(metrekare),
        adet: parseInt(formData.adet)
      };

      await axios.post(`${API}/production`, payload);
      toast.success('Üretim kaydı başarıyla eklendi!');
      
      // Reset form
      setFormData({
        tarih: new Date().toISOString().split('T')[0],
        makine: '',
        kalinlik: '',
        en: '',
        metre: '',
        adet: '',
        masura_tipi: ''
      });
      setMetrekare(0);
    } catch (error) {
      toast.error('Üretim kaydı eklenirken hata oluştu!');
      console.error(error);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Üretim Girişi
        </CardTitle>
        <CardDescription className="text-slate-400">
          Yeni üretim kaydı oluşturun
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tarih" className="text-slate-200">Tarih</Label>
              <Input
                id="tarih"
                type="date"
                value={formData.tarih}
                onChange={(e) => handleChange('tarih', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="production-tarih"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="makine" className="text-slate-200">Makine</Label>
              <Select value={formData.makine} onValueChange={(value) => handleChange('makine', value)} required>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="production-makine">
                  <SelectValue placeholder="Makine seçiniz" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Makine 1" className="text-white">Makine 1</SelectItem>
                  <SelectItem value="Makine 2" className="text-white">Makine 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kalinlik" className="text-slate-200">Kalınlık (mm)</Label>
              <Input
                id="kalinlik"
                type="number"
                step="0.01"
                value={formData.kalinlik}
                onChange={(e) => handleChange('kalinlik', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="production-kalinlik"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="en" className="text-slate-200">En (cm)</Label>
              <Input
                id="en"
                type="number"
                step="0.01"
                value={formData.en}
                onChange={(e) => handleChange('en', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="production-en"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metre" className="text-slate-200">Metre</Label>
              <Input
                id="metre"
                type="number"
                step="0.01"
                value={formData.metre}
                onChange={(e) => handleChange('metre', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="production-metre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metrekare" className="text-slate-200">Metrekare (Otomatik)</Label>
              <Input
                id="metrekare"
                type="text"
                value={metrekare}
                className="bg-slate-800/30 border-slate-700 text-emerald-400 font-semibold"
                data-testid="production-metrekare"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adet" className="text-slate-200">Adet</Label>
              <Input
                id="adet"
                type="number"
                value={formData.adet}
                onChange={(e) => handleChange('adet', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="production-adet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="masura_tipi" className="text-slate-200">Masura Tipi</Label>
              <Select value={formData.masura_tipi} onValueChange={(value) => handleChange('masura_tipi', value)} required>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="production-masura">
                  <SelectValue placeholder="Masura tipi seçiniz" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Masura 100" className="text-white">Masura 100</SelectItem>
                  <SelectItem value="Masura 120" className="text-white">Masura 120</SelectItem>
                  <SelectItem value="Masura 150" className="text-white">Masura 150</SelectItem>
                  <SelectItem value="Masura 200" className="text-white">Masura 200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="production-submit"
          >
            Üretim Kaydı Ekle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductionForm;