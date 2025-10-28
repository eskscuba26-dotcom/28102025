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
import { Pencil, Trash2, Factory, Flame } from 'lucide-react';
import api from '@/lib/axios';

const MAKINELER = ['Makine 1', 'Makine 2'];

const ConsumptionForm = ({ userRole }) => {
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    makine: '',
    petkim_kg: '',
    fire_kg: ''
  });

  const [estolKg, setEstolKg] = useState(0);
  const [talkKg, setTalkKg] = useState(0);
  const [consumptions, setConsumptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchConsumptions();
  }, []);

  const fetchConsumptions = async () => {
    try {
      const response = await api.get('/daily-consumption');
      setConsumptions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Recalculate estol and talk when petkim or fire changes
      if (name === 'petkim_kg' || name === 'fire_kg') {
        const petkimValue = parseFloat(name === 'petkim_kg' ? value : updated.petkim_kg) || 0;
        const fireValue = parseFloat(name === 'fire_kg' ? value : updated.fire_kg) || 0;
        
        const toplamPetkim = petkimValue + fireValue;
        setEstolKg(toplamPetkim * 0.03);  // 3%
        setTalkKg(toplamPetkim * 0.015);   // 1.5%
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        tarih: formData.tarih,
        makine: formData.makine,
        petkim_kg: parseFloat(formData.petkim_kg),
        fire_kg: parseFloat(formData.fire_kg)
      };

      if (editingId) {
        await api.put(`/daily-consumption/${editingId}`, payload);
        toast.success('Tüketim kaydı güncellendi!');
        setEditingId(null);
        setIsEditDialogOpen(false);
      } else {
        await api.post('/daily-consumption', payload);
        toast.success('Tüketim kaydı eklendi!');
      }
      
      fetchConsumptions();
      resetForm();
    } catch (error) {
      toast.error('İşlem başarısız!');
      console.error(error);
    }
  };

  const handleEdit = (consumption) => {
    setFormData({
      tarih: consumption.tarih,
      makine: consumption.makine,
      petkim_kg: consumption.petkim_kg.toString(),
      fire_kg: consumption.fire_kg.toString()
    });
    setEstolKg(consumption.toplam_estol_tuketim);
    setTalkKg(consumption.toplam_talk_tuketim);
    setEditingId(consumption.id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/daily-consumption/${id}`);
      toast.success('Tüketim kaydı silindi!');
      fetchConsumptions();
    } catch (error) {
      toast.error('Silme işlemi başarısız!');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      makine: '',
      petkim_kg: '',
      fire_kg: ''
    });
    setEstolKg(0);
    setTalkKg(0);
  };

  const getTotals = () => {
    return consumptions.reduce((totals, cons) => ({
      petkim: totals.petkim + (cons.toplam_petkim_tuketim || 0),
      estol: totals.estol + (cons.toplam_estol_tuketim || 0),
      talk: totals.talk + (cons.toplam_talk_tuketim || 0),
      fire: totals.fire + (cons.fire_kg || 0)
    }), { petkim: 0, estol: 0, talk: 0, fire: 0 });
  };

  const totals = getTotals();

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Factory className="h-5 w-5" />
              Günlük Tüketim Girişi
            </CardTitle>
            <CardDescription className="text-slate-400">
              Makine tüketimi ve fire kayıtlarını girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Tarih</Label>
                  <Input
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => handleChange('tarih', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Makine</Label>
                  <Select value={formData.makine} onValueChange={(value) => handleChange('makine', value)} required>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {MAKINELER.map(makine => (
                        <SelectItem key={makine} value={makine} className="text-white">
                          {makine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Petkim (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.petkim_kg}
                    onChange={(e) => handleChange('petkim_kg', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Manuel giriş"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Fire (kg)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.fire_kg}
                    onChange={(e) => handleChange('fire_kg', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Manuel giriş"
                    required
                  />
                </div>
              </div>

              {(formData.petkim_kg || formData.fire_kg) && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <Label className="text-slate-400 text-sm mb-3 block">
                    Toplam Tüketim (Petkim + Fire dahil)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">Toplam Petkim</Label>
                      <p className="text-xl font-bold text-white">
                        {((parseFloat(formData.petkim_kg) || 0) + (parseFloat(formData.fire_kg) || 0)).toFixed(2)} kg
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Toplam Estol (3%)</Label>
                      <p className="text-xl font-bold text-blue-400">
                        {estolKg.toFixed(2)} kg
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Toplam Talk (1.5%)</Label>
                      <p className="text-xl font-bold text-emerald-400">
                        {talkKg.toFixed(2)} kg
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Tüketim Kaydı Ekle
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Consumption List */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Günlük Tüketim Kayıtları {!isAdmin && '(Sadece Görüntüleme)'}
            </CardTitle>
          </div>
          {consumptions.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400">Toplam Petkim</p>
                <p className="text-lg font-bold text-white">{totals.petkim.toFixed(2)} kg</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400">Toplam Estol</p>
                <p className="text-lg font-bold text-blue-400">{totals.estol.toFixed(2)} kg</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400">Toplam Talk</p>
                <p className="text-lg font-bold text-emerald-400">{totals.talk.toFixed(2)} kg</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400">Toplam Fire</p>
                <p className="text-lg font-bold text-red-400">{totals.fire.toFixed(2)} kg</p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {consumptions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Henüz tüketim kaydı yok</div>
          ) : (
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-200">Tarih</TableHead>
                    <TableHead className="text-slate-200">Makine</TableHead>
                    <TableHead className="text-slate-200">Petkim Giriş (kg)</TableHead>
                    <TableHead className="text-slate-200">Fire (kg)</TableHead>
                    <TableHead className="text-slate-200">Toplam Petkim (kg)</TableHead>
                    <TableHead className="text-slate-200">Toplam Estol (kg)</TableHead>
                    <TableHead className="text-slate-200">Toplam Talk (kg)</TableHead>
                    {isAdmin && <TableHead className="text-slate-200 text-right">İşlemler</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumptions.map((cons) => (
                    <TableRow key={cons.id} className="border-slate-800">
                      <TableCell className="text-slate-300">{cons.tarih}</TableCell>
                      <TableCell className="text-white font-medium">{cons.makine}</TableCell>
                      <TableCell className="text-slate-300">{cons.petkim_kg.toFixed(2)}</TableCell>
                      <TableCell className="text-red-400">{cons.fire_kg.toFixed(2)}</TableCell>
                      <TableCell className="text-white font-semibold">{(cons.toplam_petkim_tuketim || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-blue-400">{(cons.toplam_estol_tuketim || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-emerald-400">{(cons.toplam_talk_tuketim || 0).toFixed(2)}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cons)}
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
                                    Bu tüketim kaydı silinecek. Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">İptal</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(cons.id)}
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
            <DialogTitle className="text-white">Tüketim Düzenle</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tüketim bilgilerini güncelleyin
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
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Makine</Label>
                <Select value={formData.makine} onValueChange={(value) => handleChange('makine', value)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {MAKINELER.map(makine => (
                      <SelectItem key={makine} value={makine} className="text-white">{makine}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Petkim (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.petkim_kg}
                  onChange={(e) => handleChange('petkim_kg', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Fire (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.fire_kg}
                  onChange={(e) => handleChange('fire_kg', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>
            </div>

            {(formData.petkim_kg || formData.fire_kg) && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <Label className="text-slate-400 text-sm mb-2 block">Toplam Tüketim (Petkim + Fire dahil)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Toplam Petkim</Label>
                    <p className="text-lg font-bold text-white">
                      {((parseFloat(formData.petkim_kg) || 0) + (parseFloat(formData.fire_kg) || 0)).toFixed(2)} kg
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Toplam Estol (3%)</Label>
                    <p className="text-lg font-bold text-blue-400">{estolKg.toFixed(2)} kg</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Toplam Talk (1.5%)</Label>
                    <p className="text-lg font-bold text-emerald-400">{talkKg.toFixed(2)} kg</p>
                  </div>
                </div>
              </div>
            )}

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

export default ConsumptionForm;
