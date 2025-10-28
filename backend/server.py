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
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# Initialize admin user
async def init_admin():
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = User(
            username="admin",
            password_hash=hash_password("SAR2025!"),  # Default şifre
            role="admin"
        )
        doc = admin_user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
        logging.info("Admin user created: admin / SAR2025!")

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

# User management (admin only)
@api_router.post("/users", response_model=UserInfo)
async def create_user(user_create: UserCreate, current_user: dict = Depends(get_admin_user)):
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
async def get_users(current_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
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

@api_router.put("/production/{prod_id}", response_model=Production)
async def update_production(prod_id: str, update: ProductionUpdate):
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
async def delete_production(prod_id: str):
    result = await db.productions.delete_one({"id": prod_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Production not found")
    return {"message": "Production deleted"}


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
        if 'urun_tipi' not in ship:
            ship['urun_tipi'] = 'Normal'
        if 'renk_kategori' not in ship:
            ship['renk_kategori'] = 'Renksiz'
            ship['renk'] = 'Doğal'
    
    return shipments

@api_router.put("/shipment/{ship_id}", response_model=Shipment)
async def update_shipment(ship_id: str, update: ShipmentUpdate):
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
async def delete_shipment(ship_id: str):
    result = await db.shipments.delete_one({"id": ship_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return {"message": "Shipment deleted"}


# Cut Product endpoints
@api_router.post("/cut-product", response_model=CutProduct)
async def create_cut_product(input: CutProductCreate):
    cut_dict = input.model_dump()
    cut_obj = CutProduct(**cut_dict)
    
    doc = cut_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.cut_products.insert_one(doc)
    
    return cut_obj

@api_router.get("/cut-product", response_model=List[CutProduct])
async def get_cut_products():
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
async def delete_cut_product(cut_id: str):
    result = await db.cut_products.delete_one({"id": cut_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cut product not found")
    return {"message": "Cut product deleted"}


# Stock endpoint
@api_router.get("/stock", response_model=List[Stock])
async def get_stock():
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
                    'toplam_adet': 0
                }
            stock_dict[key]['toplam_metre'] += prod.get('metre', 0)
            stock_dict[key]['toplam_metrekare'] += prod.get('metrekare', 0)
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
            
            # Calculate metrekare for cut product
            m2 = (cut['kesim_en'] / 100) * (cut['kesim_boy'] / 100) * cut['kesim_adet']
            stock_dict[key]['toplam_metrekare'] += m2
            stock_dict[key]['toplam_adet'] += cut['kesim_adet']
    
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
    
    # Subtract cut products from ana malzeme (normal stock)
    for cut in cut_products:
        if 'ana_kalinlik' in cut and 'ana_en' in cut:
            ana_renk_kategori = cut.get('ana_renk_kategori', 'Renksiz')
            ana_renk = cut.get('ana_renk', 'Doğal')
            key = f"Normal_{cut['ana_kalinlik']}_{cut['ana_en']}_{ana_renk_kategori}_{ana_renk}"
            
            if key in stock_dict:
                stock_dict[key]['toplam_adet'] -= cut.get('kullanilan_ana_adet', 0)
                used_metrekare = cut.get('ana_metrekare', 0) * cut.get('kullanilan_ana_adet', 0)
                stock_dict[key]['toplam_metrekare'] -= used_metrekare
                stock_dict[key]['toplam_metre'] -= (cut.get('ana_metre', 0) * cut.get('kullanilan_ana_adet', 0))
    
    return list(stock_dict.values())


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