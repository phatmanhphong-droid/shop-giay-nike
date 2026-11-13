const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Global CORS Headers (Cho phép Frontend gọi API từ port 8080 hoặc bất kỳ đâu)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const cleanUrl = req.url.split('?')[0];

  // API 1: HEALTH CHECK (Kiểm tra trạng thái máy chủ & Docker)
  if (cleanUrl === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'Shop Giay Nike REST API Backend',
      port: PORT,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    }));
    return;
  }

  // API 2: CREATE ORDER (POST /api/orders) - Nhận đơn hàng từ Frontend
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

        console.log(`[Order API] Don hang moi: #${order.orderId} - Khach: ${order.customer ? order.customer.fullname : 'N/A'} - Tien: ${order.totalAmount} d`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, orderId: order.orderId }));
      } catch (err) {
        console.error('[Order API Error]', err);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 3: GET ORDERS LIST (GET /api/orders) - Danh sách đơn hàng
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

  // API 4: UPDATE ORDER STATUS (PUT /api/orders/:id/status)
  if (req.method === 'PUT' && cleanUrl.startsWith('/api/orders/') && cleanUrl.endsWith('/status')) {
    const parts = cleanUrl.split('/');
    const orderId = parts[3]; // /api/orders/<orderId>/status

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        let orders = [];
        if (fs.existsSync(ORDERS_FILE)) {
          try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch(e) {}
        }

        const order = orders.find(o => o.orderId === orderId);
        if (!order) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Khong tim thay don hang' }));
          return;
        }

        order.status = data.status || order.status;
        order.updatedAt = new Date().toISOString();
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');

        console.log(`[Order API] Cap nhat don #${orderId} -> ${order.status}`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, order }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 5: DELETE ORDER (DELETE /api/orders/:id)
  if (req.method === 'DELETE' && cleanUrl.startsWith('/api/orders/')) {
    const parts = cleanUrl.split('/');
    const orderId = parts[3];

    let orders = [];
    if (fs.existsSync(ORDERS_FILE)) {
      try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch(e) {}
    }

    const initialLength = orders.length;
    orders = orders.filter(o => o.orderId !== orderId);
    if (orders.length === initialLength) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Khong tim thay don hang de xoa' }));
      return;
    }

    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    console.log(`[Order API] Da xoa don hang #${orderId}`);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, orderId }));
    return;
  }

  // SERVE ADMIN DASHBOARD UI (STATIC ASSETS IN backend/public)
  let file = (cleanUrl === '/' || cleanUrl === '/admin') ? 'index.html' : cleanUrl.replace(/^\/+/, '');
  file = decodeURIComponent(file);
  const filePath = path.join(PUBLIC_DIR, file);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Endpoint or file not found: ' + req.url }));
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
  console.log(`=============================================================`);
  console.log(`🚀 [Nike Backend Admin Portal] Dang chay tai: http://localhost:${PORT}`);
  console.log(`📋 [Admin Dashboard UI]       http://localhost:${PORT}/admin`);
  console.log(`🩺 [Health Check API]         http://localhost:${PORT}/api/health`);
  console.log(`📦 [Orders REST API]          http://localhost:${PORT}/api/orders`);
  console.log(`=============================================================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Nike Backend] Dang tat an toan...');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('\n[Nike Backend] Terminated. Dong server...');
  server.close(() => process.exit(0));
});
