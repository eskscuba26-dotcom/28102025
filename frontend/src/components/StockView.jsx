import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StockView = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API}/stock`);
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
                  <TableHead className="text-slate-200 font-semibold">Model</TableHead>
                  <TableHead className="text-slate-200 font-semibold">Kalınlık (mm)</TableHead>
                  <TableHead className="text-slate-200 font-semibold">En (cm)</TableHead>
                  <TableHead className="text-slate-200 font-semibold">Toplam Metre</TableHead>
                  <TableHead className="text-slate-200 font-semibold">Toplam Metrekare</TableHead>
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
                    <TableCell className="text-white font-medium">{stock.model}</TableCell>
                    <TableCell className="text-slate-300">{stock.kalinlik}</TableCell>
                    <TableCell className="text-slate-300">{stock.en}</TableCell>
                    <TableCell className="text-slate-300">{stock.toplam_metre.toFixed(2)}</TableCell>
                    <TableCell className="text-emerald-400 font-semibold">
                      {stock.toplam_metrekare.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-slate-300">{stock.toplam_adet}</TableCell>
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