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
import { Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/axios';

const RENK_KATEGORILER = ['Renkli', 'Renksiz', 'Şeffaf'];
const RENKLER = {
  'Renkli': ['Sarı', 'Kırmızı', 'Mavi', 'Yeşil', 'Siyah', 'Beyaz'],
  'Renksiz': ['Doğal'],
  'Şeffaf': ['Şeffaf']
};

const ProductionForm = () => {
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    makine: '',
    kalinlik: '',
    en: '',
    metre: '',
    adet: '',
    masura_tipi: '',
    renk_kategori: '',
    renk: ''
  });

  const [metrekare, setMetrekare] = useState(0);
  const [productions, setProductions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async () => {
    try {
      const response = await api.get('/production');
      setProductions(response.data.filter(p => p.urun_tipi === 'Normal'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'renk_kategori') {
        updated.renk = '';
      }
      
      return updated;
    });

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

      if (editingId) {
        await api.put(`/production/${editingId}`, payload);
        toast.success('Üretim kaydı güncellendi!');
        setEditingId(null);
        setIsEditDialogOpen(false);
      } else {
        await api.post('/production', payload);
        toast.success('Üretim kaydı eklendi!');
      }
      
      setFormData({
        tarih: new Date().toISOString().split('T')[0],
        makine: '',
        kalinlik: '',
        en: '',
        metre: '',
        adet: '',
        masura_tipi: '',
        renk_kategori: '',
        renk: ''
      });
      setMetrekare(0);
      fetchProductions();
    } catch (error) {
      toast.error('Hata oluştu!');
      console.error(error);
    }
  };

  const handleEdit = (prod) => {
    setFormData({
      tarih: prod.tarih,
      makine: prod.makine,
      kalinlik: prod.kalinlik.toString(),
      en: prod.en.toString(),
      metre: prod.metre.toString(),
      adet: prod.adet.toString(),
      masura_tipi: prod.masura_tipi,
      renk_kategori: prod.renk_kategori,
      renk: prod.renk
    });
    setMetrekare(prod.metrekare.toFixed(2));
    setEditingId(prod.id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/production/${id}`);
      toast.success('Üretim kaydı silindi!');
      fetchProductions();
    } catch (error) {
      toast.error('Silme hatası!');
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsEditDialogOpen(false);
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      makine: '',
      kalinlik: '',
      en: '',
      metre: '',
      adet: '',
      masura_tipi: '',
      renk_kategori: '',
      renk: ''
    });
    setMetrekare(0);
  };

  return (
    <div className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="renk_kategori" className="text-slate-200">Renk Kategorisi</Label>
                <Select value={formData.renk_kategori} onValueChange={(value) => handleChange('renk_kategori', value)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="production-renk-kategori">
                    <SelectValue placeholder="Renk kategorisi seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {RENK_KATEGORILER.map(kategori => (
                      <SelectItem key={kategori} value={kategori} className="text-white">{kategori}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renk" className="text-slate-200">Renk</Label>
                <Select 
                  value={formData.renk} 
                  onValueChange={(value) => handleChange('renk', value)} 
                  required
                  disabled={!formData.renk_kategori}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="production-renk">
                    <SelectValue placeholder="Renk seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {formData.renk_kategori && RENKLER[formData.renk_kategori]?.map(renk => (
                      <SelectItem key={renk} value={renk} className="text-white">{renk}</SelectItem>
                    ))}
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

      {/* Production List */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Üretim Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Henüz üretim kaydı yok</div>
          ) : (
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-200">Tarih</TableHead>
                    <TableHead className="text-slate-200">Makine</TableHead>
                    <TableHead className="text-slate-200">Kalınlık</TableHead>
                    <TableHead className="text-slate-200">En</TableHead>
                    <TableHead className="text-slate-200">Metre</TableHead>
                    <TableHead className="text-slate-200">m²</TableHead>
                    <TableHead className="text-slate-200">Adet</TableHead>
                    <TableHead className="text-slate-200">Renk</TableHead>
                    <TableHead className="text-slate-200 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productions.map((prod) => (
                    <TableRow key={prod.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="text-slate-300">{prod.tarih}</TableCell>
                      <TableCell className="text-slate-300">{prod.makine}</TableCell>
                      <TableCell className="text-slate-300">{prod.kalinlik} mm</TableCell>
                      <TableCell className="text-slate-300">{prod.en} cm</TableCell>
                      <TableCell className="text-slate-300">{prod.metre} m</TableCell>
                      <TableCell className="text-emerald-400 font-semibold">{prod.metrekare.toFixed(2)}</TableCell>
                      <TableCell className="text-slate-300">{prod.adet}</TableCell>
                      <TableCell className="text-slate-300">{prod.renk}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(prod)}
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
                                  Bu üretim kaydı silinecek. Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">İptal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(prod.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
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
            <DialogTitle className="text-white">Üretim Kaydını Düzenle</DialogTitle>
            <DialogDescription className="text-slate-400">
              Kayıt bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Tarih</Label>
                <Input
                  type="date"
                  value={formData.tarih}
                  onChange={(e) => handleChange('tarih', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Makine</Label>
                <Select value={formData.makine} onValueChange={(value) => handleChange('makine', value)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Makine 1" className="text-white">Makine 1</SelectItem>
                    <SelectItem value="Makine 2" className="text-white">Makine 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Kalınlık (mm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.kalinlik}
                  onChange={(e) => handleChange('kalinlik', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">En (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.en}
                  onChange={(e) => handleChange('en', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Metre</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.metre}
                  onChange={(e) => handleChange('metre', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Adet</Label>
                <Input
                  type="number"
                  value={formData.adet}
                  onChange={(e) => handleChange('adet', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={handleCancelEdit} className="text-white">
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

export default ProductionForm;