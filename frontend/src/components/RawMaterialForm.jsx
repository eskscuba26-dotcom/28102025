import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, DollarSign, Package } from 'lucide-react';
import api from '@/lib/axios';

const BIRIMLER = ['Kilogram', 'Adet', 'Litre'];
const PARA_BIRIMLERI = ['TL', 'USD', 'EUR'];

const RawMaterialForm = ({ userRole }) => {
  const [formData, setFormData] = useState({
    giris_tarihi: new Date().toISOString().split('T')[0],
    malzeme_adi: '',
    birim: '',
    miktar: '',
    para_birimi: 'TL',
    birim_fiyat: ''
  });

  const [toplamTutar, setToplamTutar] = useState(0);
  const [tlTutar, setTlTutar] = useState(0);
  const [materials, setMaterials] = useState([]);
  const [currencyRates, setCurrencyRates] = useState({ usd_rate: 1, eur_rate: 1 });
  const [editingId, setEditingId] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchMaterials();
    fetchCurrencyRates();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/raw-materials');
      setMaterials(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCurrencyRates = async () => {
    try {
      const response = await api.get('/currency-rates');
      setCurrencyRates({
        usd_rate: response.data.usd_rate || 1,
        eur_rate: response.data.eur_rate || 1
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Recalculate totals when relevant fields change
      if (name === 'miktar' || name === 'birim_fiyat' || name === 'para_birimi') {
        const miktar = name === 'miktar' ? parseFloat(value) : parseFloat(updated.miktar);
        const birimFiyat = name === 'birim_fiyat' ? parseFloat(value) : parseFloat(updated.birim_fiyat);
        const paraBirimi = name === 'para_birimi' ? value : updated.para_birimi;

        if (!isNaN(miktar) && !isNaN(birimFiyat)) {
          const toplam = miktar * birimFiyat;
          setToplamTutar(toplam);

          let tlTutarHesap = toplam;
          if (paraBirimi === 'USD') {
            tlTutarHesap = toplam * currencyRates.usd_rate;
          } else if (paraBirimi === 'EUR') {
            tlTutarHesap = toplam * currencyRates.eur_rate;
          }
          setTlTutar(tlTutarHesap);
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        giris_tarihi: formData.giris_tarihi,
        malzeme_adi: formData.malzeme_adi,
        birim: formData.birim,
        miktar: parseFloat(formData.miktar),
        para_birimi: formData.para_birimi,
        birim_fiyat: parseFloat(formData.birim_fiyat)
      };

      if (editingId) {
        await api.put(`/raw-materials/${editingId}`, payload);
        toast.success('Hammadde kaydı güncellendi!');
        setEditingId(null);
        setIsEditDialogOpen(false);
      } else {
        await api.post('/raw-materials', payload);
        toast.success('Hammadde kaydı eklendi!');
      }
      
      fetchMaterials();
      resetForm();
    } catch (error) {
      toast.error('İşlem başarısız!');
      console.error(error);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      giris_tarihi: material.giris_tarihi,
      malzeme_adi: material.malzeme_adi,
      birim: material.birim,
      miktar: material.miktar.toString(),
      para_birimi: material.para_birimi,
      birim_fiyat: material.birim_fiyat.toString()
    });
    setEditingId(material.id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/raw-materials/${id}`);
      toast.success('Hammadde kaydı silindi!');
      fetchMaterials();
    } catch (error) {
      toast.error('Silme işlemi başarısız!');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      giris_tarihi: new Date().toISOString().split('T')[0],
      malzeme_adi: '',
      birim: '',
      miktar: '',
      para_birimi: 'TL',
      birim_fiyat: ''
    });
    setToplamTutar(0);
    setTlTutar(0);
  };

  const getTotalTL = () => {
    return materials.reduce((sum, mat) => sum + mat.tl_tutar, 0);
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Package className="h-5 w-5" />
              Hammadde Girişi
            </CardTitle>
            <CardDescription className="text-slate-400">
              Yeni hammadde kaydı oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Giriş Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.giris_tarihi}
                    onChange={(e) => handleChange('giris_tarihi', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-200">Malzeme Adı</Label>
                  <Input
                    value={formData.malzeme_adi}
                    onChange={(e) => handleChange('malzeme_adi', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Örn: Polietilen Granül"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Birim</Label>
                  <Select value={formData.birim} onValueChange={(value) => handleChange('birim', value)} required>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {BIRIMLER.map(birim => (
                        <SelectItem key={birim} value={birim} className="text-white">
                          {birim}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Miktar</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.miktar}
                    onChange={(e) => handleChange('miktar', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Para Birimi</Label>
                  <Select value={formData.para_birimi} onValueChange={(value) => handleChange('para_birimi', value)} required>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {PARA_BIRIMLERI.map(pb => (
                        <SelectItem key={pb} value={pb} className="text-white">
                          {pb}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Birim Fiyat</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.birim_fiyat}
                    onChange={(e) => handleChange('birim_fiyat', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Kur ({formData.para_birimi})</Label>
                  <Input
                    value={formData.para_birimi === 'USD' ? currencyRates.usd_rate.toFixed(2) : 
                           formData.para_birimi === 'EUR' ? currencyRates.eur_rate.toFixed(2) : '1.00'}
                    className="bg-slate-800/50 border-slate-700 text-slate-400"
                    disabled
                  />
                </div>
              </div>

              {(toplamTutar > 0 || tlTutar > 0) && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">Toplam Tutar</Label>
                      <p className="text-xl font-bold text-white">
                        {toplamTutar.toFixed(2)} {formData.para_birimi}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">TL Karşılığı</Label>
                      <p className="text-xl font-bold text-emerald-400">
                        {tlTutar.toFixed(2)} ₺
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Hammadde Kaydı Ekle
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Materials List */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Hammadde Kayıtları {!isAdmin && '(Sadece Görüntüleme)'}
            </CardTitle>
            <div className="text-right">
              <p className="text-sm text-slate-400">Toplam Maliyet</p>
              <p className="text-2xl font-bold text-emerald-400">
                {getTotalTL().toFixed(2)} ₺
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Henüz hammadde kaydı yok</div>
          ) : (
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-200">Tarih</TableHead>
                    <TableHead className="text-slate-200">Malzeme</TableHead>
                    <TableHead className="text-slate-200">Miktar</TableHead>
                    <TableHead className="text-slate-200">Birim Fiyat</TableHead>
                    <TableHead className="text-slate-200">Toplam</TableHead>
                    <TableHead className="text-slate-200">Kur</TableHead>
                    <TableHead className="text-slate-200">TL Tutar</TableHead>
                    {isAdmin && <TableHead className="text-slate-200 text-right">İşlemler</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((mat) => (
                    <TableRow key={mat.id} className="border-slate-800">
                      <TableCell className="text-slate-300">{mat.giris_tarihi}</TableCell>
                      <TableCell className="text-white font-medium">{mat.malzeme_adi}</TableCell>
                      <TableCell className="text-slate-300">{mat.miktar} {mat.birim}</TableCell>
                      <TableCell className="text-slate-300">{mat.birim_fiyat.toFixed(2)} {mat.para_birimi}</TableCell>
                      <TableCell className="text-slate-300">{mat.toplam_tutar.toFixed(2)} {mat.para_birimi}</TableCell>
                      <TableCell className="text-slate-300">{mat.kur.toFixed(2)}</TableCell>
                      <TableCell className="text-emerald-400 font-semibold">{mat.tl_tutar.toFixed(2)} ₺</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(mat)}
                              className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-900 border-slate-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Emin misiniz?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400">
                                    Bu hammadde kaydı silinecek. Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">İptal</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(mat.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Hammadde Düzenle</DialogTitle>
            <DialogDescription className="text-slate-400">
              Hammadde bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Giriş Tarihi</Label>
                <Input
                  type="date"
                  value={formData.giris_tarihi}
                  onChange={(e) => handleChange('giris_tarihi', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Malzeme Adı</Label>
                <Input
                  value={formData.malzeme_adi}
                  onChange={(e) => handleChange('malzeme_adi', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Birim</Label>
                <Select value={formData.birim} onValueChange={(value) => handleChange('birim', value)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {BIRIMLER.map(birim => (
                      <SelectItem key={birim} value={birim} className="text-white">{birim}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Miktar</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.miktar}
                  onChange={(e) => handleChange('miktar', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Para Birimi</Label>
                <Select value={formData.para_birimi} onValueChange={(value) => handleChange('para_birimi', value)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PARA_BIRIMLERI.map(pb => (
                      <SelectItem key={pb} value={pb} className="text-white">{pb}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Birim Fiyat</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.birim_fiyat}
                  onChange={(e) => handleChange('birim_fiyat', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="text-white">
                İptal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Güncelle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RawMaterialForm;
