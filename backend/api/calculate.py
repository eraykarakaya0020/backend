from http.server import BaseHTTPRequestHandler
import json
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        amount = float(params.get('amount', [75000])[0])
        months = int(params.get('months', [24])[0])
        
        banks = [
            {"id": 1, "name": "Ziraat Bankası", "logo": "Z", "interest_rate": 2.05, "max_amount": 100000},
            {"id": 2, "name": "Halkbank", "logo": "H", "interest_rate": 2.08, "max_amount": 90000},
            {"id": 3, "name": "Akbank", "logo": "A", "interest_rate": 2.09, "max_amount": 125000},
            {"id": 4, "name": "VakıfBank", "logo": "V", "interest_rate": 2.10, "max_amount": 130000},
            {"id": 5, "name": "İş Bankası", "logo": "İ", "interest_rate": 2.12, "max_amount": 120000},
            {"id": 6, "name": "QNB Finansbank", "logo": "Q", "interest_rate": 2.15, "max_amount": 85000},
            {"id": 7, "name": "Garanti BBVA", "logo": "G", "interest_rate": 2.18, "max_amount": 150000},
            {"id": 8, "name": "Yapı Kredi", "logo": "Y", "interest_rate": 2.20, "max_amount": 110000},
            {"id": 9, "name": "Enpara.com", "logo": "E", "interest_rate": 2.22, "max_amount": 75000},
            {"id": 10, "name": "DenizBank", "logo": "D", "interest_rate": 2.25, "max_amount": 95000},
            {"id": 11, "name": "Kuveyt Türk", "logo": "K", "interest_rate": 2.28, "max_amount": 80000},
            {"id": 12, "name": "TEB", "logo": "T", "interest_rate": 2.30, "max_amount": 105000},
            {"id": 13, "name": "Albaraka Türk", "logo": "A", "interest_rate": 2.32, "max_amount": 70000},
            {"id": 14, "name": "ING Bank", "logo": "I", "interest_rate": 2.35, "max_amount": 115000},
            {"id": 15, "name": "CEPTETEB", "logo": "C", "interest_rate": 2.38, "max_amount": 65000},
            {"id": 16, "name": "HSBC", "logo": "H", "interest_rate": 2.40, "max_amount": 140000},
            {"id": 17, "name": "ON Dijital Bank", "logo": "O", "interest_rate": 2.42, "max_amount": 60000},
            {"id": 18, "name": "Şekerbank", "logo": "Ş", "interest_rate": 2.45, "max_amount": 55000},
            {"id": 19, "name": "Alternatif Bank", "logo": "A", "interest_rate": 2.48, "max_amount": 50000},
            {"id": 20, "name": "ICBC Turkey", "logo": "I", "interest_rate": 2.50, "max_amount": 45000}
        ]
        
        offers = []
        for bank in banks:
            if amount <= bank["max_amount"]:
                monthly_rate = bank["interest_rate"] / 100 / 12
                monthly_payment = amount * (monthly_rate * (1 + monthly_rate)**months) / ((1 + monthly_rate)**months - 1)
                
                offers.append({
                    "bank": bank,
                    "monthly_payment": round(monthly_payment, 2),
                    "total_payment": round(monthly_payment * months, 2),
                    "total_interest": round((monthly_payment * months) - amount, 2)
                })
        
        offers.sort(key=lambda x: x["bank"]["interest_rate"])
        
        self.wfile.write(json.dumps(offers).encode())
