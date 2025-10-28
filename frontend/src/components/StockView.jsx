import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/axios';

const StockView = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStocks = async () => {
    try {
      const response = await api.get('/stock');
      setStocks(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Stok verileri yüklenirken hata oluştu!');
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    // Refresh every 5 seconds
    const interval = setInterval(fetchStocks, 5000);
    return () => clearInterval(interval);
  }, []);

  const getUrunTipiBadge = (tip) => {
    if (tip === 'Kesilmiş') {
      return <Badge className="bg-amber-600 hover:bg-amber-700">Kesilmiş</Badge>;
    }
    return <Badge className="bg-emerald-600 hover:bg-emerald-700">Normal</Badge>;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Stok Görünümü
        </CardTitle>
        <CardDescription className="text-slate-400">
          Güncel stok durumunu görüntüleyin
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-8 text-slate-400" data-testid="stock-empty">
            Henüz stok kaydı bulunmuyor.
          </div>
        ) : (
          <div className="rounded-md border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-800/50">
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-200 font-semibold">Ürün Tipi</TableHead>
                  <TableHead className="text-slate-200 font-semibold">Kalınlık (mm)</TableHead>
                  <TableHead className="text-slate-200 font-semibold">En (cm)</TableHead>
                  <TableHead className="text-slate-200 font-semibold">Metre / Boy</TableHead>
                  <TableHead className="text-slate-200 font-semibold">Renk</TableHead>
                  <TableHead className="text-slate-200 font-semibold">Toplam m²</TableHead>
                  <TableHead className="text-slate-200 font-semibold">Toplam Adet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock, index) => (
                  <TableRow 
                    key={index} 
                    className="border-slate-800 hover:bg-slate-800/30"
                    data-testid={`stock-row-${index}`}
                  >
                    <TableCell className="text-white">{getUrunTipiBadge(stock.urun_tipi)}</TableCell>
                    <TableCell className="text-slate-300">{stock.kalinlik}</TableCell>
                    <TableCell className="text-slate-300">{stock.en}</TableCell>
                    <TableCell className="text-slate-300">
                      {stock.urun_tipi === 'Normal' ? (
                        <span>{stock.toplam_metre ? stock.toplam_metre.toFixed(0) + ' m' : '-'}</span>
                      ) : (
                        <span>{stock.boy ? parseFloat(stock.boy.toFixed(1)) + ' cm' : '-'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                        {stock.renk_kategori}
                      </span>
                      {' '}
                      <span className="font-semibold">{stock.renk}</span>
                    </TableCell>
                    <TableCell className="text-emerald-400 font-semibold">
                      {stock.toplam_metrekare.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-slate-300 font-semibold">{stock.toplam_adet}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockView;