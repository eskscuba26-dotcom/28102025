import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import api from '@/lib/axios';

const RENK_KATEGORILER = ['Renkli', 'Renksiz', 'Şeffaf'];
const RENKLER = {
  'Renkli': ['Sarı', 'Kırmızı', 'Mavi', 'Yeşil', 'Siyah', 'Beyaz'],
  'Renksiz': ['Doğal'],
  'Şeffaf': ['Şeffaf']
};

const CutProductForm = () => {
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    ana_kalinlik: '',
    ana_en: '',
    ana_metre: '',
    ana_renk_kategori: '',
    ana_renk: '',
    kesim_kalinlik: '',
    kesim_en: '',
    kesim_boy: '',
    kesim_renk_kategori: '',
    kesim_renk: '',
    kesim_adet: ''
  });

  const [anaMetrekare, setAnaMetrekare] = useState(0);
  const [kullanilanAnaAdet, setKullanilanAnaAdet] = useState(0);
  const [cutProducts, setCutProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchCutProducts();
  }, []);

  const fetchCutProducts = async () => {
    try {
      const response = await api.get('/cut-product');
      setCutProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const en = parseFloat(formData.ana_en);
    const metre = parseFloat(formData.ana_metre);
    
    if (!isNaN(en) && !isNaN(metre) && en > 0 && metre > 0) {
      const m2 = (en / 100) * metre;
      setAnaMetrekare(m2.toFixed(2));
      calculateUsedAnaAdet(m2);
    } else {
      setAnaMetrekare(0);
    }
  }, [formData.ana_en, formData.ana_metre, formData.kesim_en, formData.kesim_boy, formData.kesim_adet]);

  const calculateUsedAnaAdet = (anaM2 = null) => {
    const kesimEn = parseFloat(formData.kesim_en);
    const kesimBoy = parseFloat(formData.kesim_boy);
    const kesimAdet = parseInt(formData.kesim_adet);
    const anaMetrekareValue = anaM2 !== null ? anaM2 : parseFloat(anaMetrekare);

    if (!isNaN(kesimEn) && !isNaN(kesimBoy) && !isNaN(kesimAdet) && 
        kesimEn > 0 && kesimBoy > 0 && kesimAdet > 0 && anaMetrekareValue > 0) {
      
      const kesimM2 = (kesimEn / 100) * (kesimBoy / 100);
      const toplamKesimM2 = kesimM2 * kesimAdet;
      const gerekliAnaAdet = Math.ceil(toplamKesimM2 / anaMetrekareValue);
      
      setKullanilanAnaAdet(gerekliAnaAdet);
    } else {
      setKullanilanAnaAdet(0);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'ana_renk_kategori') {
        updated.ana_renk = '';
      }
      if (name === 'kesim_renk_kategori') {
        updated.kesim_renk = '';
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (kullanilanAnaAdet === 0) {
      toast.error('Hesaplama hatası! Lütfen tüm alanları doldurun.');
      return;
    }
    
    try {
      const payload = {
        tarih: formData.tarih,
        ana_kalinlik: parseFloat(formData.ana_kalinlik),
        ana_en: parseFloat(formData.ana_en),
        ana_metre: parseFloat(formData.ana_metre),
        ana_metrekare: parseFloat(anaMetrekare),
        ana_renk_kategori: formData.ana_renk_kategori,
        ana_renk: formData.ana_renk,
        kesim_kalinlik: parseFloat(formData.kesim_kalinlik),
        kesim_en: parseFloat(formData.kesim_en),
        kesim_boy: parseFloat(formData.kesim_boy),
        kesim_renk_kategori: formData.kesim_renk_kategori,
        kesim_renk: formData.kesim_renk,
        kesim_adet: parseInt(formData.kesim_adet),
        kullanilan_ana_adet: kullanilanAnaAdet
      };

      if (editingId) {
        // For edit, we can't change cut product, so just show message
        toast.info('Kesilmiş ürün düzenleme henüz desteklenmiyor. Silip yeniden ekleyin.');
        setEditingId(null);
        setIsEditDialogOpen(false);
      } else {
        await api.post('/cut-product', payload);
        toast.success(`Kesilmiş ürün kaydı eklendi! ${kullanilanAnaAdet} adet ana malzeme stoktan düştü.`);
      }
      
      setFormData({
        tarih: new Date().toISOString().split('T')[0],
        ana_kalinlik: '',
        ana_en: '',
        ana_metre: '',
        ana_renk_kategori: '',
        ana_renk: '',
        kesim_kalinlik: '',
        kesim_en: '',
        kesim_boy: '',
        kesim_renk_kategori: '',
        kesim_renk: '',
        kesim_adet: ''
      });
      setAnaMetrekare(0);
      setKullanilanAnaAdet(0);
      fetchCutProducts();
    } catch (error) {
      toast.error('Kesilmiş ürün kaydı eklenirken hata oluştu!');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/cut-product/${id}`);
      toast.success('Kesilmiş ürün kaydı silindi!');
      fetchCutProducts();
    } catch (error) {
      toast.error('Silme hatası!');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
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
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Ana Malzeme Bölümü */}
            <div className="border border-slate-700 rounded-lg p-4 space-y-4 bg-slate-800/30">
              <h3 className="text-lg font-semibold text-emerald-400">Ana Malzeme</h3>
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ana_kalinlik" className="text-slate-200">Kalınlık (mm)</Label>
                  <Input
                    id="ana_kalinlik"
                    type="number"
                    step="0.01"
                    value={formData.ana_kalinlik}
                    onChange={(e) => handleChange('ana_kalinlik', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    data-testid="cut-ana-kalinlik"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ana_en" className="text-slate-200">En (cm)</Label>
                  <Input
                    id="ana_en"
                    type="number"
                    step="0.01"
                    value={formData.ana_en}
                    onChange={(e) => handleChange('ana_en', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    data-testid="cut-ana-en"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ana_metre" className="text-slate-200">Metre</Label>
                  <Input
                    id="ana_metre"
                    type="number"
                    step="0.01"
                    value={formData.ana_metre}
                    onChange={(e) => handleChange('ana_metre', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    data-testid="cut-ana-metre"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ana_metrekare" className="text-slate-200">Metrekare (Otomatik)</Label>
                  <Input
                    id="ana_metrekare"
                    type="text"
                    value={anaMetrekare}
                    className="bg-slate-800/30 border-slate-700 text-emerald-400 font-semibold"
                    data-testid="cut-ana-metrekare"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ana_renk_kategori" className="text-slate-200">Renk Kategorisi</Label>
                  <Select value={formData.ana_renk_kategori} onValueChange={(value) => handleChange('ana_renk_kategori', value)} required>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="cut-ana-renk-kategori">
                      <SelectValue placeholder="Renk kategorisi" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {RENK_KATEGORILER.map(kategori => (
                        <SelectItem key={kategori} value={kategori} className="text-white">{kategori}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ana_renk" className="text-slate-200">Renk</Label>
                  <Select 
                    value={formData.ana_renk} 
                    onValueChange={(value) => handleChange('ana_renk', value)} 
                    required
                    disabled={!formData.ana_renk_kategori}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="cut-ana-renk">
                      <SelectValue placeholder="Renk seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {formData.ana_renk_kategori && RENKLER[formData.ana_renk_kategori]?.map(renk => (
                        <SelectItem key={renk} value={renk} className="text-white">{renk}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hesaplama Sonucu - Büyük Kutu */}
              {kullanilanAnaAdet > 0 && (
                <div className="mt-4 bg-gradient-to-r from-emerald-950/80 to-emerald-900/50 border-2 border-emerald-500 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-300 text-sm font-medium">
                        Kesilecek Ürün İçin Gerekli Ana Malzeme:
                      </p>
                      <p className="text-emerald-300 text-xs mt-1">
                        ({formData.kesim_adet} adet x {formData.kesim_en}cm x {formData.kesim_boy}cm = {((parseFloat(formData.kesim_en || 0) / 100) * (parseFloat(formData.kesim_boy || 0) / 100) * parseInt(formData.kesim_adet || 0)).toFixed(2)} m²)
                      </p>
                    </div>
                    <div className="bg-emerald-600 px-6 py-3 rounded-lg">
                      <p className="text-white text-3xl font-bold text-center">
                        {kullanilanAnaAdet}
                      </p>
                      <p className="text-emerald-100 text-xs text-center font-semibold">
                        ADET
                      </p>
                    </div>
                  </div>
                  <p className="text-emerald-400 text-xs mt-2 font-semibold">
                    ⚠️ Bu miktar stoktan otomatik olarak düşecektir
                  </p>
                </div>
              )}
            </div>

            {/* Kesilecek/Ebatlanacak Model Bölümü */}
            <div className="border border-slate-700 rounded-lg p-4 space-y-4 bg-slate-800/30">
              <h3 className="text-lg font-semibold text-amber-400">Kesilecek / Ebatlanacak Model</h3>
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kesim_kalinlik" className="text-slate-200">Kalınlık (mm)</Label>
                  <Input
                    id="kesim_kalinlik"
                    type="number"
                    step="0.01"
                    value={formData.kesim_kalinlik}
                    onChange={(e) => handleChange('kesim_kalinlik', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    data-testid="cut-kesim-kalinlik"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kesim_en" className="text-slate-200">En (cm)</Label>
                  <Input
                    id="kesim_en"
                    type="number"
                    step="0.01"
                    value={formData.kesim_en}
                    onChange={(e) => handleChange('kesim_en', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    data-testid="cut-kesim-en"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kesim_boy" className="text-slate-200">Boy (cm)</Label>
                  <Input
                    id="kesim_boy"
                    type="number"
                    step="0.01"
                    value={formData.kesim_boy}
                    onChange={(e) => handleChange('kesim_boy', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    data-testid="cut-kesim-boy"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kesim_adet" className="text-slate-200">Adet (İstenen)</Label>
                  <Input
                    id="kesim_adet"
                    type="number"
                    value={formData.kesim_adet}
                    onChange={(e) => handleChange('kesim_adet', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    data-testid="cut-kesim-adet"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kesim_renk_kategori" className="text-slate-200">Renk Kategorisi</Label>
                  <Select value={formData.kesim_renk_kategori} onValueChange={(value) => handleChange('kesim_renk_kategori', value)} required>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="cut-kesim-renk-kategori">
                      <SelectValue placeholder="Renk kategorisi" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {RENK_KATEGORILER.map(kategori => (
                        <SelectItem key={kategori} value={kategori} className="text-white">{kategori}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kesim_renk" className="text-slate-200">Renk</Label>
                  <Select 
                    value={formData.kesim_renk} 
                    onValueChange={(value) => handleChange('kesim_renk', value)} 
                    required
                    disabled={!formData.kesim_renk_kategori}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="cut-kesim-renk">
                      <SelectValue placeholder="Renk seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {formData.kesim_renk_kategori && RENKLER[formData.kesim_renk_kategori]?.map(renk => (
                        <SelectItem key={renk} value={renk} className="text-white">{renk}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              data-testid="cut-submit"
            >
              Kesilmiş Ürün Kaydı Ekle
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cut Products List */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Kesilmiş Ürün Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cutProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Henüz kesilmiş ürün kaydı yok</div>
          ) : (
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-200">Tarih</TableHead>
                    <TableHead className="text-slate-200">Ana Malzeme</TableHead>
                    <TableHead className="text-slate-200">Kesilmiş Ebat</TableHead>
                    <TableHead className="text-slate-200">Kesilmiş Adet</TableHead>
                    <TableHead className="text-slate-200">Kullanılan Ana</TableHead>
                    <TableHead className="text-slate-200">Renk</TableHead>
                    <TableHead className="text-slate-200 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cutProducts.map((cut) => (
                    <TableRow key={cut.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="text-slate-300">{cut.tarih}</TableCell>
                      <TableCell className="text-slate-300">
                        {cut.ana_kalinlik}mm x {cut.ana_en}cm x {cut.ana_metre}m
                        <br />
                        <span className="text-xs text-slate-500">({cut.ana_metrekare.toFixed(2)} m²)</span>
                      </TableCell>
                      <TableCell className="text-amber-400 font-semibold">
                        {cut.kesim_kalinlik}mm x {cut.kesim_en}cm x {cut.kesim_boy}cm
                      </TableCell>
                      <TableCell className="text-amber-400 font-bold">{cut.kesim_adet}</TableCell>
                      <TableCell className="text-emerald-400 font-bold text-lg">{cut.kullanilan_ana_adet} adet</TableCell>
                      <TableCell className="text-slate-300">{cut.kesim_renk}</TableCell>
                      <TableCell className="text-right">
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
                                Bu kesilmiş ürün kaydı silinecek. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">İptal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(cut.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CutProductForm;