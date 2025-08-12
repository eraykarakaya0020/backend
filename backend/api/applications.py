from http.server import BaseHTTPRequestHandler
import json
import os

applications_storage = []

def get_applications():
    global applications_storage
    return applications_storage

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        current_applications = get_applications()
        self.wfile.write(json.dumps(current_applications).encode())
