# Kredi Başvuru Uygulaması

Bu uygulama, Türkiye'deki bankaların kredi tekliflerini karşılaştırmak ve kredi başvurusu yapmak için geliştirilmiştir.

## Özellikler

- 10 büyük Türk bankasının gerçek logoları ve kampanyaları
- %0 faiz oranı ile kredi hesaplama
- T.C. Kimlik, şifre ve telefon numarası validasyonu
- Telegram entegrasyonu ile anlık bildirimler
- Admin paneli ile başvuru takibi
- Responsive tasarım

## Teknolojiler

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- shadcn/ui bileşenleri
- Vite build tool

### Backend
- FastAPI (Python)
- Uvicorn ASGI server
- Pydantic veri validasyonu

## Kurulum

### Railway Deployment

1. Bu repository'yi GitHub'a push edin
2. Railway hesabınızda yeni bir proje oluşturun
3. GitHub repository'sini bağlayın
4. Backend için:
   - Root directory: `/backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Frontend için:
   - Root directory: `/frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run preview`
6. Environment variables:
   - `TELEGRAM_BOT_TOKEN`: Telegram bot token
   - `TELEGRAM_CHAT_ID`: Telegram chat ID

### Local Development

1. Backend'i çalıştırın:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

2. Frontend'i çalıştırın:
```bash
cd frontend
npm install
npm run dev
```

## Admin Panel

- Erişim: `Ctrl+Shift+A`
- Şifre: `admin123`
- Telegram ayarları güncelleme
- Başvuru listesi görüntüleme

## API Endpoints

- `GET /api/banks` - Banka listesi
- `POST /api/calculate` - Kredi hesaplama
- `POST /api/submit` - Başvuru gönderme
- `GET /api/applications` - Başvuru listesi
- `GET/POST /api/telegram-settings` - Telegram ayarları

## Banka Renkleri

- Akbank: Kırmızı
- QNB: Mor
- TEB: Yeşil
- DenizBank: Turkuaz
- Garanti BBVA: Yeşil
- İş Bankası: Mavi
- Albaraka: Gri
- Enpara: Pembe
- ON: Yeşil
- Getirfinans: Mor
