import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ShipmentForm = () => {
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    alici_firma: '',
    kalinlik: '',
    en: '',
    metre: '',
    adet: '',
    irsaliye_no: '',
    arac_plaka: '',
    sofor: '',
    cikis_saati: ''
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

      await axios.post(`${API}/shipment`, payload);
      toast.success('Sevkiyat kaydı başarıyla eklendi!');
      
      // Reset form
      setFormData({
        tarih: new Date().toISOString().split('T')[0],
        alici_firma: '',
        kalinlik: '',
        en: '',
        metre: '',
        adet: '',
        irsaliye_no: '',
        arac_plaka: '',
        sofor: '',
        cikis_saati: ''
      });
      setMetrekare(0);
    } catch (error) {
      toast.error('Sevkiyat kaydı eklenirken hata oluştu!');
      console.error(error);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Sevkiyat Girişi
        </CardTitle>
        <CardDescription className="text-slate-400">
          Yeni sevkiyat kaydı oluşturun
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
                data-testid="shipment-tarih"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alici_firma" className="text-slate-200">Alıcı Firma</Label>
              <Input
                id="alici_firma"
                type="text"
                value={formData.alici_firma}
                onChange={(e) => handleChange('alici_firma', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="shipment-alici"
                required
              />
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
                data-testid="shipment-kalinlik"
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
                data-testid="shipment-en"
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
                data-testid="shipment-metre"
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
                data-testid="shipment-metrekare"
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
                data-testid="shipment-adet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="irsaliye_no" className="text-slate-200">İrsaliye Numarası</Label>
              <Input
                id="irsaliye_no"
                type="text"
                value={formData.irsaliye_no}
                onChange={(e) => handleChange('irsaliye_no', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="shipment-irsaliye"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arac_plaka" className="text-slate-200">Araç Plakası</Label>
              <Input
                id="arac_plaka"
                type="text"
                value={formData.arac_plaka}
                onChange={(e) => handleChange('arac_plaka', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="shipment-plaka"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sofor" className="text-slate-200">Şoför</Label>
              <Input
                id="sofor"
                type="text"
                value={formData.sofor}
                onChange={(e) => handleChange('sofor', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="shipment-sofor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cikis_saati" className="text-slate-200">Çıkış Saati</Label>
              <Input
                id="cikis_saati"
                type="time"
                value={formData.cikis_saati}
                onChange={(e) => handleChange('cikis_saati', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="shipment-saat"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="shipment-submit"
          >
            Sevkiyat Kaydı Ekle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShipmentForm;