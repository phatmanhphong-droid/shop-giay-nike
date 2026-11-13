const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const SHOES_ASSETS_DIR = path.join(__dirname, '..', 'frontend', 'assets', 'shoes');
const BACKEND_UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Ensure upload directories exist
try {
  if (!fs.existsSync(BACKEND_UPLOADS_DIR)) fs.mkdirSync(BACKEND_UPLOADS_DIR, { recursive: true });
} catch (e) {}

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

function readJSON(file, defaultVal = []) {
  if (!fs.existsSync(file)) return defaultVal;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return defaultVal;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const cleanUrl = req.url.split('?')[0];

  // API 1: HEALTH CHECK
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

  // API 2: GET PRODUCTS LIST (GET /api/products)
  if (req.method === 'GET' && cleanUrl === '/api/products') {
    const products = readJSON(PRODUCTS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(products));
    return;
  }

  // API 3: CREATE PRODUCT (POST /api/products) - Thêm sản phẩm mới từ Admin
  if (req.method === 'POST' && cleanUrl === '/api/products') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const product = JSON.parse(body || '{}');
        const products = readJSON(PRODUCTS_FILE, []);

        // Tự động tạo ID tiếp theo (nike-24, nike-25...)
        if (!product.id) {
          const maxNum = products.reduce((max, p) => {
            const m = p.id && p.id.match(/^nike-(\d+)$/);
            return m ? Math.max(max, parseInt(m[1], 10)) : max;
          }, 0);
          const nextNum = String(maxNum + 1).padStart(2, '0');
          product.id = `nike-${nextNum}`;
        }

        product.price = parseInt(product.price, 10) || 2990000;
        product.colors = product.colors && product.colors.length ? product.colors : [
          { name: 'Mặc định', hex: '#111111', photo: product.image }
        ];

        products.push(product);
        writeJSON(PRODUCTS_FILE, products);

        console.log(`[Product API] Đã thêm sản phẩm mới: ${product.name} (ID: ${product.id}) - Giá: ${product.price} d`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, product }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 4: UPDATE PRODUCT (PUT /api/products/:id)
  if (req.method === 'PUT' && cleanUrl.startsWith('/api/products/')) {
    const productId = cleanUrl.split('/')[3];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const updateData = JSON.parse(body || '{}');
        let products = readJSON(PRODUCTS_FILE, []);
        const idx = products.findIndex(p => p.id === productId);

        if (idx === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Không tìm thấy sản phẩm' }));
          return;
        }

        products[idx] = { ...products[idx], ...updateData };
        writeJSON(PRODUCTS_FILE, products);

        console.log(`[Product API] Đã cập nhật sản phẩm: ${products[idx].name} (${productId})`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, product: products[idx] }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 5: DELETE PRODUCT (DELETE /api/products/:id)
  if (req.method === 'DELETE' && cleanUrl.startsWith('/api/products/')) {
    const productId = cleanUrl.split('/')[3];
    let products = readJSON(PRODUCTS_FILE, []);
    const initialLen = products.length;
    products = products.filter(p => p.id !== productId);

    if (products.length === initialLen) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Không tìm thấy sản phẩm để xóa' }));
      return;
    }

    writeJSON(PRODUCTS_FILE, products);
    console.log(`[Product API] Đã xóa sản phẩm ID: ${productId}`);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, productId }));
    return;
  }

  // API 6: UPLOAD IMAGE (POST /api/upload)
  if (req.method === 'POST' && cleanUrl === '/api/upload') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filename, data } = JSON.parse(body || '{}');
        if (!filename || !data) {
          throw new Error('Thiếu tên file hoặc dữ liệu ảnh Base64');
        }

        // Tách header base64 (ví dụ: data:image/png;base64,....)
        const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const cleanName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');

        // Lưu vào thư mục frontend/assets/shoes nếu tồn tại
        if (fs.existsSync(SHOES_ASSETS_DIR)) {
          fs.writeFileSync(path.join(SHOES_ASSETS_DIR, cleanName), buffer);
        }
        // Lưu dự phòng vào backend uploads
        fs.writeFileSync(path.join(BACKEND_UPLOADS_DIR, cleanName), buffer);

        const assetPath = `assets/shoes/${cleanName}`;
        console.log(`[Upload API] Đã lưu ảnh thành công: ${assetPath}`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, url: assetPath }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 7: CREATE ORDER (POST /api/orders)
  if (req.method === 'POST' && cleanUrl === '/api/orders') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const order = JSON.parse(body || '{}');
        order.createdAt = new Date().toISOString();

        let orders = readJSON(ORDERS_FILE, []);
        orders.unshift(order);
        writeJSON(ORDERS_FILE, orders);

        console.log(`[Order API] Đơn hàng mới: #${order.orderId} - Khách: ${order.customer ? order.customer.fullname : 'N/A'} - Tiền: ${order.totalAmount} d`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, orderId: order.orderId }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 8: GET ORDERS LIST (GET /api/orders)
  if (req.method === 'GET' && cleanUrl === '/api/orders') {
    const orders = readJSON(ORDERS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(orders));
    return;
  }

  // API 9: UPDATE ORDER STATUS (PUT /api/orders/:id/status)
  if (req.method === 'PUT' && cleanUrl.startsWith('/api/orders/') && cleanUrl.endsWith('/status')) {
    const orderId = cleanUrl.split('/')[3];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        let orders = readJSON(ORDERS_FILE, []);
        const order = orders.find(o => o.orderId === orderId);

        if (!order) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Không tìm thấy đơn hàng' }));
          return;
        }

        order.status = data.status || order.status;
        order.updatedAt = new Date().toISOString();
        writeJSON(ORDERS_FILE, orders);

        console.log(`[Order API] Cập nhật đơn #${orderId} -> ${order.status}`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, order }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 10: DELETE ORDER (DELETE /api/orders/:id)
  if (req.method === 'DELETE' && cleanUrl.startsWith('/api/orders/')) {
    const orderId = cleanUrl.split('/')[3];
    let orders = readJSON(ORDERS_FILE, []);
    const initialLength = orders.length;
    orders = orders.filter(o => o.orderId !== orderId);

    if (orders.length === initialLength) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Không tìm thấy đơn hàng để xóa' }));
      return;
    }

    writeJSON(ORDERS_FILE, orders);
    console.log(`[Order API] Đã xóa đơn hàng #${orderId}`);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, orderId }));
    return;
  }

  // SERVE STATIC ADMIN DASHBOARD UI
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
  console.log(`🚀 [Nike Backend Admin Portal] Đang chạy tại: http://localhost:${PORT}`);
  console.log(`📋 [Admin Dashboard UI]       http://localhost:${PORT}/admin`);
  console.log(`👟 [Products REST API]        http://localhost:${PORT}/api/products`);
  console.log(`📦 [Orders REST API]          http://localhost:${PORT}/api/orders`);
  console.log(`🩺 [Health Check API]         http://localhost:${PORT}/api/health`);
  console.log(`=============================================================`);
});

process.on('SIGINT', () => {
  console.log('\n[Nike Backend] Đang tắt an toàn...');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('\n[Nike Backend] Terminated. Đóng server...');
  server.close(() => process.exit(0));
});
