import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductionForm from '@/components/ProductionForm';
import ShipmentForm from '@/components/ShipmentForm';
import CutProductForm from '@/components/CutProductForm';
import StockView from '@/components/StockView';
import logo from '@/assets/logo.png';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('production');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="SAR Ambalaj" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  SAR Ambalaj
                </h1>
                <p className="text-sm text-slate-400">Üretim Yönetim Sistemi</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-800">
            <TabsTrigger 
              value="production" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              data-testid="tab-production"
            >
              Üretim Girişi
            </TabsTrigger>
            <TabsTrigger 
              value="cut-product" 
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              data-testid="tab-cut-product"
            >
              Kesilmiş Ürün
            </TabsTrigger>
            <TabsTrigger 
              value="shipment" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              data-testid="tab-shipment"
            >
              Sevkiyat Girişi
            </TabsTrigger>
            <TabsTrigger 
              value="stock" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              data-testid="tab-stock"
            >
              Stok Görünümü
            </TabsTrigger>
          </TabsList>

          <TabsContent value="production" className="mt-6">
            <ProductionForm />
          </TabsContent>

          <TabsContent value="cut-product" className="mt-6">
            <CutProductForm />
          </TabsContent>

          <TabsContent value="shipment" className="mt-6">
            <ShipmentForm />
          </TabsContent>

          <TabsContent value="stock" className="mt-6">
            <StockView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;