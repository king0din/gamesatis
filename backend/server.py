from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import shutil
import jwt
from passlib.context import CryptContext


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    phone: Optional[str] = ""
    password_hash: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    phone: Optional[str] = ""
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""

# Account Model - Resim alanı eklenmiş
class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    name: str
    price: float
    description: Optional[str] = ""
    details: Optional[str] = ""
    video_url: Optional[str] = ""
    video_file: Optional[str] = ""
    image_file: Optional[str] = ""  # YENİ: Resim dosyası
    status: str = "available"
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    sold_at: Optional[datetime] = None

class AccountCreate(BaseModel):
    category_id: str
    name: str
    price: float
    description: Optional[str] = ""
    details: Optional[str] = ""
    video_url: Optional[str] = ""
    image_file: Optional[str] = ""  # YENİ

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    details: Optional[str] = None
    video_url: Optional[str] = None
    image_file: Optional[str] = None  # YENİ
    status: Optional[str] = None

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = "site_settings"
    whatsapp_number: Optional[str] = ""
    site_name: Optional[str] = "Hesap Vitrini"
    site_title: Optional[str] = "Hesap Vitrini"
    site_logo: Optional[str] = ""
    site_favicon: Optional[str] = ""
    
    # Banka Bilgileri
    iban: Optional[str] = ""
    iban_name: Optional[str] = ""  # Hesap Sahibi Adı
    iban_surname: Optional[str] = ""  # Hesap Sahibi Soyadı
    bank_name: Optional[str] = ""  # Banka Adı
    
    # Shopier
    shopier_api_key: Optional[str] = ""
    shopier_api_secret: Optional[str] = ""
    
    # Ödeme Metodu Açık/Kapalı
    enable_iban_payment: bool = True  # IBAN ödemesi aktif mi?
    enable_card_payment: bool = True  # Kart ödemesi aktif mi?
    
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsUpdate(BaseModel):
    whatsapp_number: Optional[str] = None
    site_name: Optional[str] = None
    site_title: Optional[str] = None
    site_logo: Optional[str] = None
    site_favicon: Optional[str] = None
    iban: Optional[str] = None
    iban_name: Optional[str] = None
    iban_surname: Optional[str] = None
    bank_name: Optional[str] = None
    shopier_api_key: Optional[str] = None
    shopier_api_secret: Optional[str] = None
    enable_iban_payment: Optional[bool] = None
    enable_card_payment: Optional[bool] = None

class VisitLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Initialize default admin
async def init_default_admin():
    admin_email = "admin@gmail.com"
    admin = await db.users.find_one({"email": admin_email}, {"_id": 0})
    
    if not admin:
        admin_user = User(
            email=admin_email,
            phone="",
            password_hash=get_password_hash("admin123"),
            is_admin=True
        )
        doc = admin_user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
        print("Default admin created: admin@gmail.com / admin123")


# Routes
@api_router.get("/")
async def root():
    return {"message": "Account Showcase API"}

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        is_admin=False
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "is_admin": user.is_admin
        }
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "phone": user.get("phone", ""),
            "is_admin": user.get("is_admin", False)
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "phone": current_user.get("phone", ""),
        "is_admin": current_user.get("is_admin", False)
    }

# Category Routes (Admin only)
@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate, current_user: dict = Depends(get_current_admin)):
    category_dict = input.model_dump()
    category_obj = Category(**category_dict)
    
    doc = category_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.categories.insert_one(doc)
    return category_obj

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    
    for cat in categories:
        if isinstance(cat['created_at'], str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    
    return categories

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.accounts.delete_many({"category_id": category_id})
    
    return {"message": "Category deleted successfully"}

# Account Routes
@api_router.post("/accounts", response_model=Account)
async def create_account(input: AccountCreate, current_user: dict = Depends(get_current_admin)):
    account_dict = input.model_dump()
    account_obj = Account(**account_dict)
    
    doc = account_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.accounts.insert_one(doc)
    return account_obj

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(category_id: Optional[str] = None, search: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}}
        ]
    
    accounts = await db.accounts.find(query, {"_id": 0}).to_list(1000)
    
    for acc in accounts:
        if isinstance(acc['created_at'], str):
            acc['created_at'] = datetime.fromisoformat(acc['created_at'])
        if acc.get('updated_at') and isinstance(acc['updated_at'], str):
            acc['updated_at'] = datetime.fromisoformat(acc['updated_at'])
        if acc.get('sold_at') and isinstance(acc['sold_at'], str):
            acc['sold_at'] = datetime.fromisoformat(acc['sold_at'])
    
    return accounts

@api_router.get("/accounts/{account_id}", response_model=Account)
async def get_account(account_id: str):
    account = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Increment view count
    await db.accounts.update_one(
        {"id": account_id},
        {"$inc": {"views": 1}}
    )
    
    # Log visit
    visit_log = VisitLog(account_id=account_id)
    visit_doc = visit_log.model_dump()
    visit_doc['timestamp'] = visit_doc['timestamp'].isoformat()
    await db.visit_logs.insert_one(visit_doc)
    
    if isinstance(account['created_at'], str):
        account['created_at'] = datetime.fromisoformat(account['created_at'])
    if account.get('updated_at') and isinstance(account['updated_at'], str):
        account['updated_at'] = datetime.fromisoformat(account['updated_at'])
    if account.get('sold_at') and isinstance(account['sold_at'], str):
        account['sold_at'] = datetime.fromisoformat(account['sold_at'])
    
    return account

@api_router.put("/accounts/{account_id}", response_model=Account)
async def update_account(account_id: str, input: AccountUpdate, current_user: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # If status changed to sold, set sold_at
    if update_data.get('status') == 'sold':
        update_data['sold_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.accounts.update_one(
        {"id": account_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if isinstance(account['created_at'], str):
        account['created_at'] = datetime.fromisoformat(account['created_at'])
    if account.get('updated_at') and isinstance(account['updated_at'], str):
        account['updated_at'] = datetime.fromisoformat(account['updated_at'])
    if account.get('sold_at') and isinstance(account['sold_at'], str):
        account['sold_at'] = datetime.fromisoformat(account['sold_at'])
    
    return account

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, current_user: dict = Depends(get_current_admin)):
    result = await db.accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {"message": "Account deleted successfully"}

# File Upload Routes
@api_router.post("/upload/video")
async def upload_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_admin)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": unique_filename, "url": f"/uploads/{unique_filename}"}

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_admin)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": unique_filename, "url": f"/uploads/{unique_filename}"}

# Settings Routes
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "site_settings"}, {"_id": 0})
    
    if not settings:
        default_settings = Settings()
        doc = default_settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.settings.insert_one(doc)
        return default_settings
    
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return settings

@api_router.put("/settings", response_model=Settings)
async def update_settings(input: SettingsUpdate, current_user: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.settings.update_one(
        {"id": "site_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "site_settings"}, {"_id": 0})
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return settings

# Analytics Routes
@api_router.get("/analytics/stats")
async def get_analytics(current_user: dict = Depends(get_current_admin)):
    # Total accounts
    total_accounts = await db.accounts.count_documents({})
    available_accounts = await db.accounts.count_documents({"status": "available"})
    sold_accounts = await db.accounts.count_documents({"status": "sold"})
    pending_accounts = await db.accounts.count_documents({"status": "pending"})
    
    # Total categories
    total_categories = await db.categories.count_documents({})
    
    # Total users
    total_users = await db.users.count_documents({"is_admin": False})
    
    # Visits in last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    visits_last_30_days = await db.visit_logs.count_documents({
        "timestamp": {"$gte": thirty_days_ago.isoformat()}
    })
    
    # Most viewed accounts
    most_viewed = await db.accounts.find({}, {"_id": 0}).sort("views", -1).limit(5).to_list(5)
    
    for acc in most_viewed:
        if isinstance(acc['created_at'], str):
            acc['created_at'] = datetime.fromisoformat(acc['created_at'])
    
    return {
        "total_accounts": total_accounts,
        "available_accounts": available_accounts,
        "sold_accounts": sold_accounts,
        "pending_accounts": pending_accounts,
        "total_categories": total_categories,
        "total_users": total_users,
        "visits_last_30_days": visits_last_30_days,
        "most_viewed_accounts": most_viewed
    }

# Track page visit
@api_router.post("/track/visit")
async def track_visit():
    visit_log = VisitLog()
    visit_doc = visit_log.model_dump()
    visit_doc['timestamp'] = visit_doc['timestamp'].isoformat()
    await db.visit_logs.insert_one(visit_doc)
    return {"message": "Visit tracked"}

# Shopier Payment Route - Düzeltilmiş
@api_router.post("/payment/shopier")
async def create_shopier_payment(account_id: str, current_user: dict = Depends(get_current_user)):
    import hashlib
    import requests
    
    # Get account and settings
    account = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    settings = await db.settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings or not settings.get("shopier_api_key") or not settings.get("shopier_api_secret"):
        raise HTTPException(status_code=400, detail="Shopier not configured")
    
    # Prepare Shopier payment data
    api_key = settings["shopier_api_key"]
    api_secret = settings["shopier_api_secret"]
    website_index = settings.get("shopier_website_index", "1")
    
    # Create unique order ID
    order_id = str(uuid.uuid4())
    
    # Amount in currency subunit (TRY kuruş)
    amount = str(int(float(account["price"]) * 100))
    
    # Calculate signature for Shopier
    # Format: api_key + order_id + amount + api_secret
    signature_string = f"{api_key}{order_id}{amount}{api_secret}"
    signature = hashlib.sha256(signature_string.encode('utf-8')).hexdigest()
    
    # Callback URL - burası önemli!
    callback_url = settings.get("shopier_callback_url", f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment/callback")
    
    payment_data = {
        "API_key": api_key,
        "website_index": website_index,
        "platform_order_id": order_id,
        "product_name": account["name"],
        "product_type": "0",  # 0 = Dijital ürün
        "buyer_name": current_user.get("email", "Müşteri"),
        "buyer_phone": current_user.get("phone", ""),
        "buyer_account_age": "0",
        "buyer_id_nr": current_user["id"],
        "buyer_address": "Online",
        "total_order_value": amount,
        "currency": "TRY",
        "platform": "API",
        "is_in_frame": "0",
        "current_language": "tr",
        "modul_version": "API-1.0",
        "random_nr": signature,
        "callback_url": callback_url
    }
    
    # Store order in database
    order_doc = {
        "id": order_id,
        "account_id": account_id,
        "user_id": current_user["id"],
        "amount": float(account["price"]),
        "status": "pending",
        "payment_method": "shopier",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    try:
        response = requests.post(
            "https://www.shopier.com/ShowProduct/api_pay4.php",
            data=payment_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Shopier farklı response formatları kullanabilir
            payment_url = result.get("payment_url") or result.get("url") or result.get("redirect_url")
            
            if payment_url:
                return {
                    "success": True,
                    "payment_url": payment_url,
                    "order_id": order_id
                }
            else:
                raise HTTPException(status_code=400, detail=f"Payment URL not received: {result}")
        else:
            raise HTTPException(status_code=400, detail=f"Shopier API error: {response.status_code}")
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Payment request error: {str(e)}")

# Shopier Callback/Webhook endpoint
@api_router.post("/payment/shopier/callback")
async def shopier_callback(
    platform_order_id: str = None,
    status: str = None,
    payment_status: str = None
):
    """
    Shopier'dan gelen ödeme bildirimi
    """
    try:
        # Order'ı bul
        order = await db.orders.find_one({"id": platform_order_id}, {"_id": 0})
        if not order:
            return {"status": "error", "message": "Order not found"}
        
        # Ödeme durumunu güncelle
        payment_successful = (
            status == "success" or 
            payment_status == "success" or 
            status == "1" or 
            payment_status == "1"
        )
        
        if payment_successful:
            # Order'ı başarılı olarak işaretle
            await db.orders.update_one(
                {"id": platform_order_id},
                {"$set": {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Hesabı "pending" durumuna al (admin onayı için)
            await db.accounts.update_one(
                {"id": order["account_id"]},
                {"$set": {"status": "pending"}}
            )
        else:
            # Ödeme başarısız
            await db.orders.update_one(
                {"id": platform_order_id},
                {"$set": {"status": "failed"}}
            )
        
        return {"status": "ok"}
    
    except Exception as e:
        print(f"Shopier callback error: {e}")
        return {"status": "error", "message": str(e)}

# Order Management Routes
@api_router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_admin)):
    """Admin için tüm siparişleri listele"""
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Her sipariş için hesap ve kullanıcı bilgilerini ekle
    for order in orders:
        account = await db.accounts.find_one({"id": order["account_id"]}, {"_id": 0, "name": 1})
        user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0, "email": 1, "phone": 1})
        
        order["account_name"] = account.get("name") if account else "Bilinmiyor"
        order["user_email"] = user.get("email") if user else "Bilinmiyor"
        order["user_phone"] = user.get("phone", "") if user else ""
    
    return orders

@api_router.get("/orders/my")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    """Kullanıcının kendi siparişlerini listele"""
    orders = await db.orders.find(
        {"user_id": current_user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Her sipariş için hesap bilgisini ekle
    for order in orders:
        account = await db.accounts.find_one(
            {"id": order["account_id"]}, 
            {"_id": 0, "name": 1, "price": 1}
        )
        order["account_name"] = account.get("name") if account else "Bilinmiyor"
    
    return orders

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)



FRONTEND_PATH = Path(__file__).parent / "../frontend/build"

# React build statik dosyalarını mount et
app.mount("/static", StaticFiles(directory=str(FRONTEND_PATH / "static")), name="static")

# Tüm GET isteklerinde React index.html'i döndür
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_file = FRONTEND_PATH / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Frontend not built. Please run npm run build in the frontend directory."}








# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_default_admin()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()