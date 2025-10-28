from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'sar-ambalaj-secret-key-2025')
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Auth Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    role: str  # "admin" or "viewer"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class UserInfo(BaseModel):
    id: str
    username: str
    role: str
    created_at: datetime

class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# Password hashing
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"username": username, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_viewer_or_admin(current_user: dict = Depends(get_current_user)):
    # Both admin and viewer can view data
    return current_user


# Initialize admin user
async def init_admin():
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = User(
            username="admin",
            password_hash=hash_password("SAR2025!"),
            role="admin"
        )
        doc = admin_user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
        logging.info("Admin user created with secure password")

@app.on_event("startup")
async def startup_event():
    await init_admin()


# Auth endpoints
@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"username": user_login.username})
    if not user or not verify_password(user_login.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"]
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    # Get user from database
    user = await db.users.find_one({"username": current_user["username"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Update password
    new_password_hash = hash_password(password_data.new_password)
    await db.users.update_one(
        {"username": current_user["username"]},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    return {"message": "Password changed successfully"}

# User management (admin only)
@api_router.post("/users", response_model=UserInfo)
async def create_user(user_create: UserCreate, admin_user: dict = Depends(get_admin_user)):
    # Check if username exists
    existing = await db.users.find_one({"username": user_create.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=user_create.username,
        password_hash=hash_password(user_create.password),
        role=user_create.role
    )
    
    doc = new_user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return UserInfo(**new_user.model_dump())

@api_router.get("/users", response_model=List[UserInfo])
async def get_users(admin_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin_user: dict = Depends(get_admin_user)):
    # Don't allow deleting admin user
    user = await db.users.find_one({"id": user_id})
    if user and user["username"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}


# Production Models
class Production(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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
    urun_tipi: str = "Normal"
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

class ProductionUpdate(BaseModel):
    tarih: Optional[str] = None
    makine: Optional[str] = None
    kalinlik: Optional[float] = None
    en: Optional[float] = None
    metre: Optional[float] = None
    metrekare: Optional[float] = None
    adet: Optional[int] = None
    masura_tipi: Optional[str] = None
    renk_kategori: Optional[str] = None
    renk: Optional[str] = None


# Shipment Models
class Shipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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

class ShipmentUpdate(BaseModel):
    tarih: Optional[str] = None
    alici_firma: Optional[str] = None
    urun_tipi: Optional[str] = None
    kalinlik: Optional[float] = None
    en: Optional[float] = None
    metre: Optional[float] = None
    metrekare: Optional[float] = None
    adet: Optional[int] = None
    renk_kategori: Optional[str] = None
    renk: Optional[str] = None
    irsaliye_no: Optional[str] = None
    arac_plaka: Optional[str] = None
    sofor: Optional[str] = None
    cikis_saati: Optional[str] = None


# Cut Product Models  
class CutProduct(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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


# Stock Model
class Stock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    urun_tipi: str
    kalinlik: float
    en: float
    boy: Optional[float] = None
    renk_kategori: str
    renk: str
    toplam_metre: Optional[float] = 0
    toplam_metrekare: float
    toplam_adet: int


# Currency Rate Models
class CurrencyRate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    usd_rate: float  # 1 USD = X TL
    eur_rate: float  # 1 EUR = X TL
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: str

class CurrencyRateUpdate(BaseModel):
    usd_rate: float
    eur_rate: float


# Raw Material Models
class RawMaterial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    giris_tarihi: str
    malzeme_adi: str
    birim: str  # "Kilogram", "Adet", "Litre"
    miktar: float
    para_birimi: str  # "TL", "USD", "EUR"
    birim_fiyat: float
    toplam_tutar: float
    kur: Optional[float] = 1.0  # Girişte kullanılan kur
    tl_tutar: float  # TL karşılığı
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RawMaterialCreate(BaseModel):
    giris_tarihi: str
    malzeme_adi: str
    birim: str
    miktar: float
    para_birimi: str
    birim_fiyat: float

class RawMaterialUpdate(BaseModel):
    giris_tarihi: Optional[str] = None
    malzeme_adi: Optional[str] = None
    birim: Optional[str] = None
    miktar: Optional[float] = None
    para_birimi: Optional[str] = None
    birim_fiyat: Optional[float] = None


# Daily Consumption Models
class DailyConsumption(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: str
    makine: str  # "Makine 1", "Makine 2"
    petkim_kg: float  # Manuel giriş
    fire_kg: float  # Manuel giriş
    # Otomatik hesaplanan değerler (petkim + fire birlikte)
    toplam_petkim_tuketim: float  # petkim_kg + fire_kg
    toplam_estol_tuketim: float  # (petkim_kg + fire_kg) * 0.03
    toplam_talk_tuketim: float  # (petkim_kg + fire_kg) * 0.015
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DailyConsumptionCreate(BaseModel):
    tarih: str
    makine: str
    petkim_kg: float
    fire_kg: float

class DailyConsumptionUpdate(BaseModel):
    tarih: Optional[str] = None
    makine: Optional[str] = None
    petkim_kg: Optional[float] = None
    fire_kg: Optional[float] = None


# Production endpoints
@api_router.post("/production", response_model=Production)
async def create_production(input: ProductionCreate, admin_user: dict = Depends(get_admin_user)):
    prod_dict = input.model_dump()
    prod_obj = Production(**prod_dict)
    
    doc = prod_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.productions.insert_one(doc)
    return prod_obj

@api_router.get("/production", response_model=List[Production])
async def get_productions(current_user: dict = Depends(get_viewer_or_admin)):
    productions = await db.productions.find({}, {"_id": 0}).to_list(1000)
    
    for prod in productions:
        if isinstance(prod['timestamp'], str):
            prod['timestamp'] = datetime.fromisoformat(prod['timestamp'])
        if 'urun_tipi' not in prod:
            prod['urun_tipi'] = 'Normal'
        if 'renk_kategori' not in prod:
            prod['renk_kategori'] = 'Renksiz'
        if 'renk' not in prod:
            prod['renk'] = 'Doğal'
    
    return productions

@api_router.put("/production/{prod_id}", response_model=Production)
async def update_production(prod_id: str, update: ProductionUpdate, admin_user: dict = Depends(get_admin_user)):
    prod = await db.productions.find_one({"id": prod_id})
    if not prod:
        raise HTTPException(status_code=404, detail="Production not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.productions.update_one({"id": prod_id}, {"$set": update_data})
    
    updated_prod = await db.productions.find_one({"id": prod_id}, {"_id": 0})
    if isinstance(updated_prod['timestamp'], str):
        updated_prod['timestamp'] = datetime.fromisoformat(updated_prod['timestamp'])
    
    return Production(**updated_prod)

@api_router.delete("/production/{prod_id}")
async def delete_production(prod_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.productions.delete_one({"id": prod_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Production not found")
    return {"message": "Production deleted"}


# Shipment endpoints
@api_router.post("/shipment", response_model=Shipment)
async def create_shipment(input: ShipmentCreate, admin_user: dict = Depends(get_admin_user)):
    ship_dict = input.model_dump()
    ship_obj = Shipment(**ship_dict)
    
    doc = ship_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.shipments.insert_one(doc)
    return ship_obj

@api_router.get("/shipment", response_model=List[Shipment])
async def get_shipments(current_user: dict = Depends(get_viewer_or_admin)):
    shipments = await db.shipments.find({}, {"_id": 0}).to_list(1000)
    
    for ship in shipments:
        if isinstance(ship['timestamp'], str):
            ship['timestamp'] = datetime.fromisoformat(ship['timestamp'])
        if 'urun_tipi' not in ship:
            ship['urun_tipi'] = 'Normal'
        if 'renk_kategori' not in ship:
            ship['renk_kategori'] = 'Renksiz'
            ship['renk'] = 'Doğal'
    
    return shipments

@api_router.put("/shipment/{ship_id}", response_model=Shipment)
async def update_shipment(ship_id: str, update: ShipmentUpdate, admin_user: dict = Depends(get_admin_user)):
    ship = await db.shipments.find_one({"id": ship_id})
    if not ship:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.shipments.update_one({"id": ship_id}, {"$set": update_data})
    
    updated_ship = await db.shipments.find_one({"id": ship_id}, {"_id": 0})
    if isinstance(updated_ship['timestamp'], str):
        updated_ship['timestamp'] = datetime.fromisoformat(updated_ship['timestamp'])
    
    return Shipment(**updated_ship)

@api_router.delete("/shipment/{ship_id}")
async def delete_shipment(ship_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.shipments.delete_one({"id": ship_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return {"message": "Shipment deleted"}


# Cut Product endpoints
@api_router.post("/cut-product", response_model=CutProduct)
async def create_cut_product(input: CutProductCreate, admin_user: dict = Depends(get_admin_user)):
    cut_dict = input.model_dump()
    cut_obj = CutProduct(**cut_dict)
    
    doc = cut_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.cut_products.insert_one(doc)
    
    return cut_obj

@api_router.get("/cut-product", response_model=List[CutProduct])
async def get_cut_products(current_user: dict = Depends(get_viewer_or_admin)):
    cut_products = await db.cut_products.find({}, {"_id": 0}).to_list(1000)
    
    # Filter only new format cut products
    valid_cuts = []
    for cut in cut_products:
        if isinstance(cut['timestamp'], str):
            cut['timestamp'] = datetime.fromisoformat(cut['timestamp'])
        
        # Check if it has new format fields
        if 'ana_kalinlik' in cut and 'kesim_kalinlik' in cut:
            if 'ana_renk_kategori' not in cut:
                cut['ana_renk_kategori'] = 'Renksiz'
                cut['ana_renk'] = 'Doğal'
            if 'kesim_renk_kategori' not in cut:
                cut['kesim_renk_kategori'] = 'Renksiz'
                cut['kesim_renk'] = 'Doğal'
            valid_cuts.append(cut)
    
    return valid_cuts

@api_router.delete("/cut-product/{cut_id}")
async def delete_cut_product(cut_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.cut_products.delete_one({"id": cut_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cut product not found")
    return {"message": "Cut product deleted"}


# Stock endpoint
@api_router.get("/stock", response_model=List[Stock])
async def get_stock(current_user: dict = Depends(get_viewer_or_admin)):
    productions = await db.productions.find({}, {"_id": 0}).to_list(10000)
    shipments = await db.shipments.find({}, {"_id": 0}).to_list(10000)
    cut_products = await db.cut_products.find({}, {"_id": 0}).to_list(10000)
    
    stock_dict = {}
    
    # Add productions (only normal)
    for prod in productions:
        urun_tipi = prod.get('urun_tipi', 'Normal')
        renk_kategori = prod.get('renk_kategori', 'Renksiz')
        renk = prod.get('renk', 'Doğal')
        
        # Only add Normal productions
        if urun_tipi == 'Normal':
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
                    'toplam_adet': 0,
                    'birim_metre': prod.get('metre', 0),  # Her rulodan metre
                    'birim_metrekare': prod.get('metrekare', 0)  # Her rulodan m2
                }
            stock_dict[key]['toplam_adet'] += prod['adet']
    
    # Add cut products as Kesilmiş stock
    for cut in cut_products:
        if 'kesim_kalinlik' in cut and 'kesim_en' in cut and 'kesim_boy' in cut:
            boy = cut['kesim_boy']
            renk_kategori = cut.get('kesim_renk_kategori', 'Renksiz')
            renk = cut.get('kesim_renk', 'Doğal')
            key = f"Kesilmiş_{cut['kesim_kalinlik']}_{cut['kesim_en']}_{boy}_{renk_kategori}_{renk}"
            
            if key not in stock_dict:
                stock_dict[key] = {
                    'urun_tipi': 'Kesilmiş',
                    'kalinlik': cut['kesim_kalinlik'],
                    'en': cut['kesim_en'],
                    'boy': boy,
                    'renk_kategori': renk_kategori,
                    'renk': renk,
                    'toplam_metre': 0,
                    'toplam_metrekare': 0,
                    'toplam_adet': 0
                }
            
            stock_dict[key]['toplam_adet'] += cut['kesim_adet']
    
    # Subtract shipments from stock counts
    for ship in shipments:
        urun_tipi = ship.get('urun_tipi', 'Normal')
        renk_kategori = ship.get('renk_kategori', 'Renksiz')
        renk = ship.get('renk', 'Doğal')
        
        if urun_tipi == 'Kesilmiş':
            # For kesilmiş ürün, metre field contains boy in meters
            # Keep it in meters to match with cut product boy (which is also in meters)
            boy = ship.get('metre', 0)  # Don't convert, keep in meters
            key = f"Kesilmiş_{ship['kalinlik']}_{ship['en']}_{boy}_{renk_kategori}_{renk}"
        else:
            key = f"Normal_{ship['kalinlik']}_{ship['en']}_{renk_kategori}_{renk}"
        
        if key in stock_dict:
            stock_dict[key]['toplam_adet'] -= ship['adet']
        else:
            # If exact match not found, try to find similar cut products
            if urun_tipi == 'Kesilmiş':
                # Check for similar keys with boy values close to this one
                boy_meters = ship.get('metre', 0)
                kalinlik = ship['kalinlik']
                en = ship['en']
                
                # Try to match within 0.01 meter (1cm) tolerance
                for stock_key in list(stock_dict.keys()):
                    if stock_key.startswith(f"Kesilmiş_{kalinlik}_{en}_"):
                        parts = stock_key.split('_')
                        if len(parts) >= 4:
                            try:
                                stock_boy = float(parts[3])
                                # If within 1cm tolerance (0.01 meters), use this stock
                                if abs(stock_boy - boy_meters) <= 0.01:
                                    stock_dict[stock_key]['toplam_adet'] -= ship['adet']
                                    break
                            except ValueError:
                                continue
    
    # Subtract cut products from ana malzeme (normal stock)
    for cut in cut_products:
        if 'ana_kalinlik' in cut and 'ana_en' in cut:
            ana_renk_kategori = cut.get('ana_renk_kategori', 'Renksiz')
            ana_renk = cut.get('ana_renk', 'Doğal')
            key = f"Normal_{cut['ana_kalinlik']}_{cut['ana_en']}_{ana_renk_kategori}_{ana_renk}"
            
            if key in stock_dict:
                stock_dict[key]['toplam_adet'] -= cut.get('kullanilan_ana_adet', 0)
    
    # Final calculation: compute totals based on remaining adet
    for key, stock in stock_dict.items():
        if stock['urun_tipi'] == 'Normal' and 'birim_metre' in stock:
            # BİRİM değerleri kullan (toplam hesaplama!)
            stock['toplam_metre'] = stock['birim_metre']
            stock['toplam_metrekare'] = stock['birim_metrekare']
            # Birim değerleri çıkar
            del stock['birim_metre']
            del stock['birim_metrekare']
        elif stock['urun_tipi'] == 'Kesilmiş':
            # Kesilmiş ürün için BİRİM metrekare hesapla
            stock['toplam_metrekare'] = (stock['en'] / 100) * (stock['boy'] / 100)
    
    return list(stock_dict.values())


# Currency Rate endpoints
@api_router.get("/currency-rates")
async def get_currency_rates(current_user: dict = Depends(get_viewer_or_admin)):
    rates = await db.currency_rates.find({}, {"_id": 0}).sort("updated_at", -1).limit(1).to_list(1)
    
    if not rates:
        # Return default rates if none exist
        return {
            "usd_rate": 1.0,
            "eur_rate": 1.0,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": "system"
        }
    
    rate = rates[0]
    if isinstance(rate['updated_at'], str):
        rate['updated_at'] = datetime.fromisoformat(rate['updated_at'])
    
    return rate

@api_router.post("/currency-rates")
async def update_currency_rates(rates: CurrencyRateUpdate, admin_user: dict = Depends(get_admin_user)):
    rate_obj = CurrencyRate(
        usd_rate=rates.usd_rate,
        eur_rate=rates.eur_rate,
        updated_by=admin_user["username"]
    )
    
    doc = rate_obj.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.currency_rates.insert_one(doc)
    return rate_obj


# Raw Material endpoints
@api_router.post("/raw-materials")
async def create_raw_material(input: RawMaterialCreate, admin_user: dict = Depends(get_admin_user)):
    # Get current currency rates
    rates = await db.currency_rates.find({}, {"_id": 0}).sort("updated_at", -1).limit(1).to_list(1)
    
    usd_rate = 1.0
    eur_rate = 1.0
    if rates:
        usd_rate = rates[0].get('usd_rate', 1.0)
        eur_rate = rates[0].get('eur_rate', 1.0)
    
    # Calculate totals
    toplam_tutar = input.miktar * input.birim_fiyat
    
    # Calculate TL amount based on currency
    if input.para_birimi == "USD":
        kur = usd_rate
        tl_tutar = toplam_tutar * usd_rate
    elif input.para_birimi == "EUR":
        kur = eur_rate
        tl_tutar = toplam_tutar * eur_rate
    else:  # TL
        kur = 1.0
        tl_tutar = toplam_tutar
    
    raw_dict = input.model_dump()
    raw_obj = RawMaterial(
        **raw_dict,
        toplam_tutar=toplam_tutar,
        kur=kur,
        tl_tutar=tl_tutar
    )
    
    doc = raw_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.raw_materials.insert_one(doc)
    return raw_obj

@api_router.get("/raw-materials")
async def get_raw_materials(current_user: dict = Depends(get_viewer_or_admin)):
    materials = await db.raw_materials.find({}, {"_id": 0}).to_list(1000)
    
    for mat in materials:
        if isinstance(mat['timestamp'], str):
            mat['timestamp'] = datetime.fromisoformat(mat['timestamp'])
    
    return materials

@api_router.put("/raw-materials/{material_id}")
async def update_raw_material(material_id: str, update: RawMaterialUpdate, admin_user: dict = Depends(get_admin_user)):
    material = await db.raw_materials.find_one({"id": material_id})
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")
    
    # Get current currency rates
    rates = await db.currency_rates.find({}, {"_id": 0}).sort("updated_at", -1).limit(1).to_list(1)
    usd_rate = 1.0
    eur_rate = 1.0
    if rates:
        usd_rate = rates[0].get('usd_rate', 1.0)
        eur_rate = rates[0].get('eur_rate', 1.0)
    
    # Update fields
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if update_data:
        # Recalculate if relevant fields changed
        miktar = update_data.get('miktar', material['miktar'])
        birim_fiyat = update_data.get('birim_fiyat', material['birim_fiyat'])
        para_birimi = update_data.get('para_birimi', material['para_birimi'])
        
        toplam_tutar = miktar * birim_fiyat
        
        if para_birimi == "USD":
            kur = usd_rate
            tl_tutar = toplam_tutar * usd_rate
        elif para_birimi == "EUR":
            kur = eur_rate
            tl_tutar = toplam_tutar * eur_rate
        else:
            kur = 1.0
            tl_tutar = toplam_tutar
        
        update_data['toplam_tutar'] = toplam_tutar
        update_data['kur'] = kur
        update_data['tl_tutar'] = tl_tutar
        
        await db.raw_materials.update_one({"id": material_id}, {"$set": update_data})
    
    updated_material = await db.raw_materials.find_one({"id": material_id}, {"_id": 0})
    if isinstance(updated_material['timestamp'], str):
        updated_material['timestamp'] = datetime.fromisoformat(updated_material['timestamp'])
    
    return RawMaterial(**updated_material)

@api_router.delete("/raw-materials/{material_id}")
async def delete_raw_material(material_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.raw_materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Raw material not found")
    return {"message": "Raw material deleted"}


# Daily Consumption endpoints
@api_router.post("/daily-consumption")
async def create_daily_consumption(input: DailyConsumptionCreate, admin_user: dict = Depends(get_admin_user)):
    # Calculate total consumption including fire
    # Fire also contains petkim, estol, and talk
    toplam_petkim = input.petkim_kg + input.fire_kg
    toplam_estol = toplam_petkim * 0.03  # 3%
    toplam_talk = toplam_petkim * 0.015  # 1.5%
    
    consumption_dict = input.model_dump()
    consumption_obj = DailyConsumption(
        **consumption_dict,
        toplam_petkim_tuketim=toplam_petkim,
        toplam_estol_tuketim=toplam_estol,
        toplam_talk_tuketim=toplam_talk
    )
    
    doc = consumption_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.daily_consumptions.insert_one(doc)
    return consumption_obj

@api_router.get("/daily-consumption")
async def get_daily_consumptions(current_user: dict = Depends(get_viewer_or_admin)):
    consumptions = await db.daily_consumptions.find({}, {"_id": 0}).to_list(1000)
    
    for cons in consumptions:
        if isinstance(cons['timestamp'], str):
            cons['timestamp'] = datetime.fromisoformat(cons['timestamp'])
    
    return consumptions

@api_router.put("/daily-consumption/{consumption_id}")
async def update_daily_consumption(consumption_id: str, update: DailyConsumptionUpdate, admin_user: dict = Depends(get_admin_user)):
    consumption = await db.daily_consumptions.find_one({"id": consumption_id})
    if not consumption:
        raise HTTPException(status_code=404, detail="Daily consumption not found")
    
    # Update fields
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if update_data:
        # Recalculate totals if petkim or fire changed
        petkim_kg = update_data.get('petkim_kg', consumption['petkim_kg'])
        fire_kg = update_data.get('fire_kg', consumption['fire_kg'])
        
        toplam_petkim = petkim_kg + fire_kg
        update_data['toplam_petkim_tuketim'] = toplam_petkim
        update_data['toplam_estol_tuketim'] = toplam_petkim * 0.03
        update_data['toplam_talk_tuketim'] = toplam_petkim * 0.015
        
        await db.daily_consumptions.update_one({"id": consumption_id}, {"$set": update_data})
    
    updated_consumption = await db.daily_consumptions.find_one({"id": consumption_id}, {"_id": 0})
    if isinstance(updated_consumption['timestamp'], str):
        updated_consumption['timestamp'] = datetime.fromisoformat(updated_consumption['timestamp'])
    
    return DailyConsumption(**updated_consumption)

@api_router.delete("/daily-consumption/{consumption_id}")
async def delete_daily_consumption(consumption_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.daily_consumptions.delete_one({"id": consumption_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Daily consumption not found")
    return {"message": "Daily consumption deleted"}


# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()