from http.server import BaseHTTPRequestHandler
import json
import os

telegram_settings = {
    "bot_token": os.environ.get('TELEGRAM_BOT_TOKEN', '6719470714:AAEiTm7V6s3zTB_etIrOpaykcHzDWp3i7YA'),
    "chat_id": os.environ.get('TELEGRAM_CHAT_ID', '-4915858013')
}

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        self.wfile.write(json.dumps(telegram_settings).encode())

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            telegram_settings["bot_token"] = data["bot_token"]
            telegram_settings["chat_id"] = data["chat_id"]
            
            os.environ['TELEGRAM_BOT_TOKEN'] = data["bot_token"]
            os.environ['TELEGRAM_CHAT_ID'] = data["chat_id"]
            
            response = {"success": True, "message": "Telegram ayarları güncellendi"}
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"success": False, "message": str(e)}
            self.wfile.write(json.dumps(response).encode())
