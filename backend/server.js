const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const server = http.createServer((req, res) => {
  // Global CORS Headers (Cho phép Frontend gọi API từ bất kỳ port/domain nào)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const cleanUrl = req.url.split('?')[0];

  // API 1: HEALTH CHECK (Kiểm tra trạng thái server & Docker)
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

  // API 2: CREATE ORDER (POST /api/orders)
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

  // API 3: GET ORDERS LIST (GET /api/orders)
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

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Endpoint not found: ' + req.url }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 [Nike Backend API] Dang chay tai http://localhost:${PORT}`);
  console.log(`🩺 [Health Check] http://localhost:${PORT}/api/health`);
  console.log(`📦 [Orders API]   http://localhost:${PORT}/api/orders`);
  console.log(`====================================================`);
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

