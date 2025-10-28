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
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';

const RENK_KATEGORILER = ['Renkli', 'Renksiz', 'Şeffaf'];
const RENKLER = {
  'Renkli': ['Sarı', 'Kırmızı', 'Mavi', 'Yeşil', 'Siyah', 'Beyaz'],
  'Renksiz': ['Doğal'],
  'Şeffaf': ['Şeffaf']
};

const ShipmentForm = () => {
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    alici_firma: '',
    urun_tipi: 'Normal',
    kalinlik: '',
    en: '',
    metre: '',
    adet: '',
    renk_kategori: '',
    renk: '',
    irsaliye_no: '',
    arac_plaka: '',
    sofor: '',
    cikis_saati: ''
  });

  const [metrekare, setMetrekare] = useState(0);
  const [shipments, setShipments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await api.get('/shipment');
      setShipments(response.data);
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
        await axios.put(`${API}/shipment/${editingId}`, payload);
        toast.success('Sevkiyat kaydı güncellendi!');
        setEditingId(null);
        setIsEditDialogOpen(false);
      } else {
        await axios.post(`${API}/shipment`, payload);
        toast.success('Sevkiyat kaydı eklendi!');
      }
      
      setFormData({
        tarih: new Date().toISOString().split('T')[0],
        alici_firma: '',
        urun_tipi: 'Normal',
        kalinlik: '',
        en: '',
        metre: '',
        adet: '',
        renk_kategori: '',
        renk: '',
        irsaliye_no: '',
        arac_plaka: '',
        sofor: '',
        cikis_saati: ''
      });
      setMetrekare(0);
      fetchShipments();
    } catch (error) {
      toast.error('Hata oluştu!');
      console.error(error);
    }
  };

  const handleEdit = (ship) => {
    setFormData({
      tarih: ship.tarih,
      alici_firma: ship.alici_firma,
      urun_tipi: ship.urun_tipi,
      kalinlik: ship.kalinlik.toString(),
      en: ship.en.toString(),
      metre: ship.metre.toString(),
      adet: ship.adet.toString(),
      renk_kategori: ship.renk_kategori,
      renk: ship.renk,
      irsaliye_no: ship.irsaliye_no,
      arac_plaka: ship.arac_plaka,
      sofor: ship.sofor,
      cikis_saati: ship.cikis_saati
    });
    setMetrekare(ship.metrekare.toFixed(2));
    setEditingId(ship.id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/shipment/${id}`);
      toast.success('Sevkiyat kaydı silindi!');
      fetchShipments();
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
      alici_firma: '',
      urun_tipi: 'Normal',
      kalinlik: '',
      en: '',
      metre: '',
      adet: '',
      renk_kategori: '',
      renk: '',
      irsaliye_no: '',
      arac_plaka: '',
      sofor: '',
      cikis_saati: ''
    });
    setMetrekare(0);
  };

  return (
    <div className="space-y-6">
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
                <Label htmlFor="urun_tipi" className="text-slate-200">Ürün Tipi</Label>
                <Select value={formData.urun_tipi} onValueChange={(value) => handleChange('urun_tipi', value)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="shipment-urun-tipi">
                    <SelectValue placeholder="Ürün tipi seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Normal" className="text-white">Normal Ürün</SelectItem>
                    <SelectItem value="Kesilmiş" className="text-white">Kesilmiş Ürün</SelectItem>
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
                <Label htmlFor="metre" className="text-slate-200">{formData.urun_tipi === 'Kesilmiş' ? 'Boy (cm)' : 'Metre'}</Label>
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
                <Label htmlFor="renk_kategori" className="text-slate-200">Renk Kategorisi</Label>
                <Select value={formData.renk_kategori} onValueChange={(value) => handleChange('renk_kategori', value)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="shipment-renk-kategori">
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
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="shipment-renk">
                    <SelectValue placeholder="Renk seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {formData.renk_kategori && RENKLER[formData.renk_kategori]?.map(renk => (
                      <SelectItem key={renk} value={renk} className="text-white">{renk}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Shipment List */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Sevkiyat Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Henüz sevkiyat kaydı yok</div>
          ) : (
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-200">Tarih</TableHead>
                    <TableHead className="text-slate-200">Alıcı</TableHead>
                    <TableHead className="text-slate-200">Tip</TableHead>
                    <TableHead className="text-slate-200">Ebat</TableHead>
                    <TableHead className="text-slate-200">m²</TableHead>
                    <TableHead className="text-slate-200">Adet</TableHead>
                    <TableHead className="text-slate-200">Renk</TableHead>
                    <TableHead className="text-slate-200">İrsaliye</TableHead>
                    <TableHead className="text-slate-200 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((ship) => (
                    <TableRow key={ship.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="text-slate-300">{ship.tarih}</TableCell>
                      <TableCell className="text-slate-300">{ship.alici_firma}</TableCell>
                      <TableCell>
                        {ship.urun_tipi === 'Kesilmiş' ? (
                          <Badge className="bg-amber-600">Kesilmiş</Badge>
                        ) : (
                          <Badge className="bg-emerald-600">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {ship.kalinlik}mm x {ship.en}cm x {ship.metre}m
                      </TableCell>
                      <TableCell className="text-emerald-400 font-semibold">{ship.metrekare.toFixed(2)}</TableCell>
                      <TableCell className="text-slate-300">{ship.adet}</TableCell>
                      <TableCell className="text-slate-300">{ship.renk}</TableCell>
                      <TableCell className="text-slate-300">{ship.irsaliye_no}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(ship)}
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
                                  Bu sevkiyat kaydı silinecek. Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">İptal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(ship.id)}
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
        <DialogContent className="bg-slate-900 border-slate-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Sevkiyat Kaydını Düzenle</DialogTitle>
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
                <Label className="text-slate-200">Alıcı Firma</Label>
                <Input
                  value={formData.alici_firma}
                  onChange={(e) => handleChange('alici_firma', e.target.value)}
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

export default ShipmentForm;
