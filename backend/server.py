from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Production(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str
    makine: str
    kalinlik: float  # mm
    en: float  # cm
    metre: float
    metrekare: float
    adet: int
    masura_tipi: str
    renk_kategori: str
    renk: str
    urun_tipi: str = "Normal"  # Normal or Kesilmiş
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductionCreate(BaseModel):
    tarih: str
    makine: str
    kalinlik: float
    en: float
    metre: float
    metrekare: float
    adet: int
    masura_tipi: str
    renk_kategori: str
    renk: str

class Shipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str
    alici_firma: str
    urun_tipi: str  # Normal or Kesilmiş
    kalinlik: float  # mm
    en: float  # cm
    metre: float
    metrekare: float
    adet: int
    renk_kategori: str
    renk: str
    irsaliye_no: str
    arac_plaka: str
    sofor: str
    cikis_saati: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShipmentCreate(BaseModel):
    tarih: str
    alici_firma: str
    urun_tipi: str
    kalinlik: float
    en: float
    metre: float
    metrekare: float
    adet: int
    renk_kategori: str
    renk: str
    irsaliye_no: str
    arac_plaka: str
    sofor: str
    cikis_saati: str

class CutProduct(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str
    # Ana malzeme
    ana_kalinlik: float  # mm
    ana_en: float  # cm
    ana_metre: float
    ana_metrekare: float
    ana_renk_kategori: str
    ana_renk: str
    # Kesilecek model
    kesim_kalinlik: float  # mm
    kesim_en: float  # cm
    kesim_boy: float  # cm
    kesim_renk_kategori: str
    kesim_renk: str
    kesim_adet: int  # İstenen kesilmiş ürün adedi
    kullanilan_ana_adet: int  # Ana malzemeden kaç adet kullanıldı (otomatik hesaplanır)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CutProductCreate(BaseModel):
    tarih: str
    ana_kalinlik: float
    ana_en: float
    ana_metre: float
    ana_metrekare: float
    ana_renk_kategori: str
    ana_renk: str
    kesim_kalinlik: float
    kesim_en: float
    kesim_boy: float
    kesim_renk_kategori: str
    kesim_renk: str
    kesim_adet: int
    kullanilan_ana_adet: int

class Stock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    urun_tipi: str  # Normal or Kesilmiş
    kalinlik: float
    en: float
    boy: Optional[float] = None  # Sadece kesilmiş ürünlerde
    renk_kategori: str
    renk: str
    toplam_metre: Optional[float] = 0
    toplam_metrekare: float
    toplam_adet: int

# Production endpoints
@api_router.post("/production", response_model=Production)
async def create_production(input: ProductionCreate):
    prod_dict = input.model_dump()
    prod_obj = Production(**prod_dict)
    
    doc = prod_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.productions.insert_one(doc)
    return prod_obj

@api_router.get("/production", response_model=List[Production])
async def get_productions():
    productions = await db.productions.find({}, {"_id": 0}).to_list(1000)
    
    for prod in productions:
        if isinstance(prod['timestamp'], str):
            prod['timestamp'] = datetime.fromisoformat(prod['timestamp'])
        if 'urun_tipi' not in prod:
            prod['urun_tipi'] = 'Normal'
    
    return productions

# Shipment endpoints
@api_router.post("/shipment", response_model=Shipment)
async def create_shipment(input: ShipmentCreate):
    ship_dict = input.model_dump()
    ship_obj = Shipment(**ship_dict)
    
    doc = ship_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.shipments.insert_one(doc)
    return ship_obj

@api_router.get("/shipment", response_model=List[Shipment])
async def get_shipments():
    shipments = await db.shipments.find({}, {"_id": 0}).to_list(1000)
    
    for ship in shipments:
        if isinstance(ship['timestamp'], str):
            ship['timestamp'] = datetime.fromisoformat(ship['timestamp'])
        # Handle old records
        if 'urun_tipi' not in ship:
            ship['urun_tipi'] = 'Normal'
        if 'renk_kategori' not in ship:
            ship['renk_kategori'] = 'Renksiz'
            ship['renk'] = 'Doğal'
    
    return shipments

# Cut Product endpoints
@api_router.post("/cut-product", response_model=CutProduct)
async def create_cut_product(input: CutProductCreate):
    cut_dict = input.model_dump()
    cut_obj = CutProduct(**cut_dict)
    
    doc = cut_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.cut_products.insert_one(doc)
    
    # Also add to productions as a cut product
    cut_production = Production(
        tarih=cut_obj.tarih,
        makine="Kesim",
        kalinlik=cut_obj.kesim_kalinlik,
        en=cut_obj.kesim_en,
        metre=cut_obj.kesim_boy / 100,  # cm to m
        metrekare=(cut_obj.kesim_en / 100) * (cut_obj.kesim_boy / 100) * cut_obj.kesim_adet,
        adet=cut_obj.kesim_adet,
        masura_tipi="Kesilmiş",
        renk_kategori=cut_obj.kesim_renk_kategori,
        renk=cut_obj.kesim_renk,
        urun_tipi="Kesilmiş"
    )
    
    prod_doc = cut_production.model_dump()
    prod_doc['timestamp'] = prod_doc['timestamp'].isoformat()
    await db.productions.insert_one(prod_doc)
    
    return cut_obj

@api_router.get("/cut-product", response_model=List[CutProduct])
async def get_cut_products():
    cut_products = await db.cut_products.find({}, {"_id": 0}).to_list(1000)
    
    for cut in cut_products:
        if isinstance(cut['timestamp'], str):
            cut['timestamp'] = datetime.fromisoformat(cut['timestamp'])
        # Handle old records
        if 'ana_renk_kategori' not in cut:
            cut['ana_renk_kategori'] = 'Renksiz'
            cut['ana_renk'] = 'Doğal'
    
    return cut_products

# Stock endpoint
@api_router.get("/stock", response_model=List[Stock])
async def get_stock():
    # Get all productions
    productions = await db.productions.find({}, {"_id": 0}).to_list(10000)
    
    # Get all shipments
    shipments = await db.shipments.find({}, {"_id": 0}).to_list(10000)
    
    # Get all cut products
    cut_products = await db.cut_products.find({}, {"_id": 0}).to_list(10000)
    
    # Calculate stock by grouping
    stock_dict = {}
    
    # Add productions (both normal and cut)
    for prod in productions:
        urun_tipi = prod.get('urun_tipi', 'Normal')
        renk_kategori = prod.get('renk_kategori', 'Renksiz')
        renk = prod.get('renk', 'Doğal')
        
        if urun_tipi == 'Kesilmiş':
            # Kesilmiş ürün: kalinlik_en_boy_renk_kategori_renk
            boy = prod.get('metre', 0) * 100  # metre to cm
            key = f"Kesilmiş_{prod['kalinlik']}_{prod['en']}_{boy}_{renk_kategori}_{renk}"
            if key not in stock_dict:
                stock_dict[key] = {
                    'urun_tipi': 'Kesilmiş',
                    'kalinlik': prod['kalinlik'],
                    'en': prod['en'],
                    'boy': boy,
                    'renk_kategori': renk_kategori,
                    'renk': renk,
                    'toplam_metre': 0,
                    'toplam_metrekare': 0,
                    'toplam_adet': 0
                }
            stock_dict[key]['toplam_metrekare'] += prod.get('metrekare', 0)
            stock_dict[key]['toplam_adet'] += prod['adet']
        else:
            # Normal ürün: kalinlik_en_renk_kategori_renk
            key = f"Normal_{prod['kalinlik']}_{prod['en']}_{renk_kategori}_{renk}"
            if key not in stock_dict:
                stock_dict[key] = {
                    'urun_tipi': 'Normal',
                    'kalinlik': prod['kalinlik'],
                    'en': prod['en'],
                    'boy': None,
                    'renk_kategori': renk_kategori,
                    'renk': renk,
                    'toplam_metre': 0,
                    'toplam_metrekare': 0,
                    'toplam_adet': 0
                }
            stock_dict[key]['toplam_metre'] += prod.get('metre', 0)
            stock_dict[key]['toplam_metrekare'] += prod.get('metrekare', 0)
            stock_dict[key]['toplam_adet'] += prod['adet']
    
    # Subtract shipments
    for ship in shipments:
        urun_tipi = ship.get('urun_tipi', 'Normal')
        renk_kategori = ship.get('renk_kategori', 'Renksiz')
        renk = ship.get('renk', 'Doğal')
        
        if urun_tipi == 'Kesilmiş':
            boy = ship.get('metre', 0) * 100
            key = f"Kesilmiş_{ship['kalinlik']}_{ship['en']}_{boy}_{renk_kategori}_{renk}"
        else:
            key = f"Normal_{ship['kalinlik']}_{ship['en']}_{renk_kategori}_{renk}"
        
        if key in stock_dict:
            stock_dict[key]['toplam_metrekare'] -= ship.get('metrekare', 0)
            stock_dict[key]['toplam_adet'] -= ship['adet']
            if urun_tipi == 'Normal':
                stock_dict[key]['toplam_metre'] -= ship.get('metre', 0)
    
    # Subtract cut products (ana malzeme usage)
    for cut in cut_products:
        if 'ana_kalinlik' in cut and 'ana_en' in cut:
            ana_renk_kategori = cut.get('ana_renk_kategori', 'Renksiz')
            ana_renk = cut.get('ana_renk', 'Doğal')
            key = f"Normal_{cut['ana_kalinlik']}_{cut['ana_en']}_{ana_renk_kategori}_{ana_renk}"
            
            if key in stock_dict:
                # Deduct the used ana malzeme count
                stock_dict[key]['toplam_adet'] -= cut.get('kullanilan_ana_adet', 0)
                # Also deduct metrekare
                used_metrekare = cut.get('ana_metrekare', 0) * cut.get('kullanilan_ana_adet', 0)
                stock_dict[key]['toplam_metrekare'] -= used_metrekare
                stock_dict[key]['toplam_metre'] -= (cut.get('ana_metre', 0) * cut.get('kullanilan_ana_adet', 0))
    
    return list(stock_dict.values())

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()