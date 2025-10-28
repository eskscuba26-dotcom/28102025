import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CutProductForm = () => {
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    kalinlik: '',
    en: '',
    kesilmis_en: '',
    kesilmis_boy: '',
    adet: '',
    aciklama: ''
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        kalinlik: parseFloat(formData.kalinlik),
        en: parseFloat(formData.en),
        kesilmis_en: parseFloat(formData.kesilmis_en),
        kesilmis_boy: parseFloat(formData.kesilmis_boy),
        adet: parseInt(formData.adet)
      };

      await axios.post(`${API}/cut-product`, payload);
      toast.success('Kesilmiş ürün kaydı başarıyla eklendi!');
      
      // Reset form
      setFormData({
        tarih: new Date().toISOString().split('T')[0],
        kalinlik: '',
        en: '',
        kesilmis_en: '',
        kesilmis_boy: '',
        adet: '',
        aciklama: ''
      });
    } catch (error) {
      toast.error('Kesilmiş ürün kaydı eklenirken hata oluştu!');
      console.error(error);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Kesilmiş Ürün Girişi
        </CardTitle>
        <CardDescription className="text-slate-400">
          Üretimden kesilerek hazırlanmış ürünleri kaydedin
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
                data-testid="cut-tarih"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kalinlik" className="text-slate-200">Ham Malzeme Kalınlık (mm)</Label>
              <Input
                id="kalinlik"
                type="number"
                step="0.01"
                value={formData.kalinlik}
                onChange={(e) => handleChange('kalinlik', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="cut-kalinlik"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="en" className="text-slate-200">Ham Malzeme En (cm)</Label>
              <Input
                id="en"
                type="number"
                step="0.01"
                value={formData.en}
                onChange={(e) => handleChange('en', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="cut-en"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kesilmis_en" className="text-slate-200">Kesilmiş En (cm)</Label>
              <Input
                id="kesilmis_en"
                type="number"
                step="0.01"
                value={formData.kesilmis_en}
                onChange={(e) => handleChange('kesilmis_en', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="cut-kesilmis-en"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kesilmis_boy" className="text-slate-200">Kesilmiş Boy (cm)</Label>
              <Input
                id="kesilmis_boy"
                type="number"
                step="0.01"
                value={formData.kesilmis_boy}
                onChange={(e) => handleChange('kesilmis_boy', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="cut-kesilmis-boy"
                required
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
                data-testid="cut-adet"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="aciklama" className="text-slate-200">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="aciklama"
                value={formData.aciklama}
                onChange={(e) => handleChange('aciklama', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="cut-aciklama"
                rows={3}
                placeholder="Ek açıklama girebilirsiniz..."
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            data-testid="cut-submit"
          >
            Kesilmiş Ürün Kaydı Ekle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CutProductForm;