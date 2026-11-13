const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT, 10) || 5000;
const DIR = __dirname;
const BACKEND_UPLOADS = path.join(__dirname, '..', 'backend', 'public', 'uploads');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

process.on('uncaughtException', (err) => {
  console.error('[Frontend UncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Frontend UnhandledRejection]', reason);
});

const server = http.createServer((req, res) => {
  req.on('error', (err) => console.warn('[Frontend Req Error]', err.message));
  res.on('error', (err) => console.warn('[Frontend Res Error]', err.message));

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let cleanUrl = req.url.split('?')[0];

  // 1. REVERSE PROXY /api/* -> Backend port 5000
  if (cleanUrl.startsWith('/api/')) {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${BACKEND_PORT}`
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        error: 'Không thể kết nối Backend API trên port 5000: ' + err.message
      }));
    });

    req.pipe(proxyReq);
    return;
  }

  // 2. STATIC FILES
  let file = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\/+/, '');
  file = decodeURIComponent(file);
  let filePath = path.join(DIR, file);

  // Fallback for uploaded shoes images if not in frontend/assets/shoes
  if (!fs.existsSync(filePath) && (file.startsWith('assets/shoes/') || file.startsWith('assets/'))) {
    const baseName = path.basename(file);
    const backendPath = path.join(BACKEND_UPLOADS, baseName);
    if (fs.existsSync(backendPath)) {
      filePath = backendPath;
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + file);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 [Frontend UI] Đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔗 [Reverse Proxy] Tự động chuyển tiếp /api/* -> Backend http://localhost:${BACKEND_PORT}`);
});
