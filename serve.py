#!/usr/bin/env python3
"""Dev server: no-cache for sw.js so iPhones always get the latest Service Worker."""

import http.server
import socketserver

PORT = 8080

class NoCacheSwHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.startswith('/sw.js') or self.path == '/sw.js':
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

with socketserver.TCPServer(('', PORT), NoCacheSwHandler) as httpd:
    print(f"Server läuft auf http://0.0.0.0:{PORT}")
    httpd.serve_forever()
