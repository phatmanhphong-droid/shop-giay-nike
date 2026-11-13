const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const DIR = path.join(__dirname, 'frontend');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const cleanUrl = req.url.split('?')[0];

  // API: HEALTH CHECK (For Docker / Load Balancers)
  if (cleanUrl === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'Shop Giay Nike API Backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    }));
    return;
  }

  // API: CREATE ORDER (POST)
  if (req.method === 'POST' && cleanUrl === '/api/orders') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const order = JSON.parse(body || '{}');
        order.createdAt = new Date().toISOString();

        let orders = [];
        if (fs.existsSync(ORDERS_FILE)) {
          try {
            orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
          } catch (e) {
            orders = [];
          }
        }
        orders.unshift(order);
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, orderId: order.orderId }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API: GET ORDERS LIST (GET)
  if (req.method === 'GET' && cleanUrl === '/api/orders') {
    let orders = [];
    if (fs.existsSync(ORDERS_FILE)) {
      try {
        orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
      } catch (e) {
        orders = [];
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(orders));
    return;
  }

  // STATIC ASSETS
  let file = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\/+/, '');
  file = decodeURIComponent(file);
  const filePath = path.join(DIR, file);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + file);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Nike Server] Running at http://localhost:${PORT}`);
  console.log(`[Nike Server] Static root: ${DIR}`);
  console.log(`[Nike Server] Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Nike Server] Gracefully shutting down...');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('\n[Nike Server] Terminated. Closing server...');
  server.close(() => process.exit(0));
});
