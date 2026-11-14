const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const BANK_FILE = path.join(__dirname, 'bank.json');
const VOUCHERS_FILE = path.join(__dirname, 'vouchers.json');
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');
const TELEGRAM_FILE = path.join(__dirname, 'telegram.json');
const SHOES_ASSETS_DIR = path.join(__dirname, '..', 'frontend', 'assets', 'shoes');
const BACKEND_UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Ensure upload directories exist
try {
  if (!fs.existsSync(BACKEND_UPLOADS_DIR)) fs.mkdirSync(BACKEND_UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(SHOES_ASSETS_DIR)) fs.mkdirSync(SHOES_ASSETS_DIR, { recursive: true });
} catch (e) {}

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

function readJSON(file, defaultVal = []) {
  if (!fs.existsSync(file)) return defaultVal;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return defaultVal;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`[FS Error] Cannot write to ${file}`, e);
  }
}

// Global Process Error Handlers
process.on('uncaughtException', (err) => {
  console.error('[Backend UncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Backend UnhandledRejection]', reason);
});

// Helper: Gửi tin nhắn Telegram qua HTTP POST
function sendTelegramMessage(botToken, chatId, text) {
  return new Promise((resolve) => {
    if (!botToken || !chatId || !text) {
      return resolve({ success: false, error: 'Thiếu Bot Token hoặc Chat ID' });
    }
    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });

    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve({ ok: false, error: data });
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Telegram request timeout' });
    });
    req.write(payload);
    req.end();
  });
}

// Tự động gửi thông báo đơn hàng mới qua Telegram
async function notifyTelegramNewOrder(order) {
  try {
    const tele = readJSON(TELEGRAM_FILE, { enabled: false });
    if (!tele.enabled || !tele.botToken || !tele.chatId) return;

    const cust = order.customer || {};
    const itemsList = (order.items || []).map(it => 
      `• <b>${it.name}</b> (${it.color}, Size ${it.size}) x${it.qty}: ${(it.price * it.qty).toLocaleString('vi-VN')} ₫`
    ).join('\n');

    const voucherText = order.voucher 
      ? `\n🎟️ <b>Mã giảm giá:</b> <code>${order.voucher.code}</code> (-${(order.voucher.discountAmount || 0).toLocaleString('vi-VN')} ₫)` 
      : '';

    const message = `👟 <b>CÓ ĐƠN HÀNG MỚI - NIKE ATELIER</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>Mã đơn:</b> <code>#${order.orderId}</code>\n` +
      `👤 <b>Khách hàng:</b> ${cust.fullname || 'Khách vãng lai'}\n` +
      `📞 <b>Điện thoại:</b> <code>${cust.phone || 'N/A'}</code>\n` +
      `📍 <b>Địa chỉ:</b> ${cust.address || 'Tại cửa hàng'}\n` +
      `💳 <b>Thanh toán:</b> ${order.paymentMethodLabel || order.paymentMethod || 'VietQR'}${voucherText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛍️ <b>Chi tiết món hàng:</b>\n${itemsList}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 <b>TỔNG TIỀN:</b> <b>${(order.totalAmount || 0).toLocaleString('vi-VN')} ₫</b>\n` +
      `⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;

    await sendTelegramMessage(tele.botToken, tele.chatId, message);
    console.log(`[Telegram] Đã gửi thông báo đơn #${order.orderId} tới Telegram!`);
  } catch (err) {
    console.warn('[Telegram Error]', err.message);
  }
}

const server = http.createServer((req, res) => {
  req.on('error', (err) => console.warn('[Backend Req Error]', err.message));
  res.on('error', (err) => console.warn('[Backend Res Error]', err.message));

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

  // API 3: CREATE PRODUCT (POST /api/products)
  if (req.method === 'POST' && cleanUrl === '/api/products') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const product = JSON.parse(body || '{}');
        const products = readJSON(PRODUCTS_FILE, []);

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
          { name: 'Mặc định', hex: '#111111', photo: product.image || 'assets/shoes/airforce1-white.png' }
        ];

        products.push(product);
        writeJSON(PRODUCTS_FILE, products);

        console.log(`[Product API] Đã thêm sản phẩm: ${product.name} (${product.id})`);
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

        if (updateData.price !== undefined) {
          updateData.price = parseInt(updateData.price, 10) || products[idx].price;
        }

        products[idx] = { ...products[idx], ...updateData };
        writeJSON(PRODUCTS_FILE, products);

        console.log(`[Product API] Đã cập nhật sản phẩm: ${products[idx].name} (${productId}) - Giá mới: ${products[idx].price.toLocaleString('vi-VN')} ₫`);
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

        const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const cleanName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');

        try {
          if (!fs.existsSync(SHOES_ASSETS_DIR)) fs.mkdirSync(SHOES_ASSETS_DIR, { recursive: true });
          fs.writeFileSync(path.join(SHOES_ASSETS_DIR, cleanName), buffer);
        } catch (e) {
          console.warn('[Upload Warn] Không thể ghi vào frontend/assets/shoes:', e.message);
        }

        try {
          if (!fs.existsSync(BACKEND_UPLOADS_DIR)) fs.mkdirSync(BACKEND_UPLOADS_DIR, { recursive: true });
          fs.writeFileSync(path.join(BACKEND_UPLOADS_DIR, cleanName), buffer);
        } catch (e) {
          console.warn('[Upload Warn] Không thể ghi vào backend/uploads:', e.message);
        }

        const assetPath = `assets/shoes/${cleanName}`;
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

        console.log(`[Order API] Đơn mới: #${order.orderId} - Khách: ${order.customer ? order.customer.fullname : 'N/A'}`);
        
        // Gửi thông báo Telegram tự động (chạy ngầm không chặn phản hồi)
        notifyTelegramNewOrder(order).catch(e => console.warn('[Tele Error]', e));

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

  // API 9: TRA CỨU ĐƠN HÀNG (GET /api/orders/track?q=...)
  if (req.method === 'GET' && cleanUrl === '/api/orders/track') {
    const query = (new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams.get('q') || '').trim().toLowerCase();
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Vui lòng nhập Số điện thoại hoặc Mã đơn hàng' }));
      return;
    }

    const orders = readJSON(ORDERS_FILE, []);
    const cleanQ = query.replace(/^#/, '');

    const matched = orders.filter(o => {
      const id = (o.orderId || '').toLowerCase();
      const phone = (o.customer && o.customer.phone ? o.customer.phone : '').replace(/\s+/g, '').toLowerCase();
      return id === cleanQ || id.includes(cleanQ) || phone === cleanQ || phone.endsWith(cleanQ);
    });

    // Che mờ 3 số giữa của số điện thoại để bảo mật: ví dụ 0908***597
    const sanitized = matched.map(o => {
      const cust = o.customer ? { ...o.customer } : {};
      if (cust.phone && cust.phone.length >= 7) {
        cust.phone = cust.phone.substring(0, 4) + '***' + cust.phone.substring(cust.phone.length - 3);
      }
      return { ...o, customer: cust };
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, count: sanitized.length, orders: sanitized }));
    return;
  }

  // API 10: UPDATE ORDER STATUS (PUT /api/orders/:id)
  if (req.method === 'PUT' && cleanUrl.startsWith('/api/orders/')) {
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

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, order }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 11: DELETE ORDER (DELETE /api/orders/:id)
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
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, orderId }));
    return;
  }

  // API 12: GET BANK CONFIG (GET /api/config/bank)
  if (req.method === 'GET' && cleanUrl === '/api/config/bank') {
    const bank = readJSON(BANK_FILE, {
      bankName: 'Techcombank (Ngân Hàng Kỹ Thương Việt Nam)',
      bankCode: 'TCB',
      accountNo: '8678686688',
      accountHolder: 'TRAN DUC MANH'
    });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(bank));
    return;
  }

  // API 13: SAVE BANK CONFIG (POST /api/config/bank)
  if (req.method === 'POST' && cleanUrl === '/api/config/bank') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const bankData = JSON.parse(body || '{}');
        writeJSON(BANK_FILE, bankData);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, bank: bankData }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 14: GET VOUCHERS LIST (GET /api/vouchers)
  if (req.method === 'GET' && cleanUrl === '/api/vouchers') {
    const vouchers = readJSON(VOUCHERS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(vouchers));
    return;
  }

  // API 15: APPLY VOUCHER (POST /api/vouchers/apply)
  if (req.method === 'POST' && cleanUrl === '/api/vouchers/apply') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { code, subtotal, orderTotal } = JSON.parse(body || '{}');
        const vouchers = readJSON(VOUCHERS_FILE, []);
        const cleanCode = (code || '').trim().toUpperCase();
        const v = vouchers.find(x => x.code.toUpperCase() === cleanCode && x.active);

        if (!v) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Mã giảm giá không tồn tại hoặc đã hết hạn' }));
          return;
        }

        const rawAmount = subtotal !== undefined ? subtotal : orderTotal;
        const sub = parseInt(rawAmount, 10) || 0;
        if (v.minOrder && sub < v.minOrder) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ 
            success: false, 
            error: `Đơn hàng tối thiểu phải từ ${v.minOrder.toLocaleString('vi-VN')} ₫ để áp dụng mã này` 
          }));
          return;
        }

        let discount = 0;
        if (v.type === 'percent') {
          discount = Math.round((sub * v.value) / 100);
          if (v.maxDiscount && discount > v.maxDiscount) discount = v.maxDiscount;
        } else {
          discount = v.value;
        }
        if (discount > sub) discount = sub;
        const finalTotal = Math.max(0, sub - discount);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          voucher: v,
          discountAmount: discount,
          finalTotal: finalTotal
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 16: ADD VOUCHER (POST /api/vouchers)
  if (req.method === 'POST' && cleanUrl === '/api/vouchers') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newVoucher = JSON.parse(body || '{}');
        if (!newVoucher.code || !newVoucher.value) {
          throw new Error('Vui lòng nhập Mã voucher và Giá trị giảm');
        }
        newVoucher.code = newVoucher.code.trim().toUpperCase();
        newVoucher.value = parseInt(newVoucher.value, 10);
        newVoucher.minOrder = parseInt(newVoucher.minOrder, 10) || 0;
        newVoucher.maxDiscount = parseInt(newVoucher.maxDiscount, 10) || 0;
        newVoucher.active = newVoucher.active !== false;

        let vouchers = readJSON(VOUCHERS_FILE, []);
        vouchers = vouchers.filter(v => v.code !== newVoucher.code);
        vouchers.unshift(newVoucher);
        writeJSON(VOUCHERS_FILE, vouchers);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, voucher: newVoucher }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 17: DELETE VOUCHER (DELETE /api/vouchers/:code)
  if (req.method === 'DELETE' && cleanUrl.startsWith('/api/vouchers/')) {
    const code = cleanUrl.split('/')[3].toUpperCase();
    let vouchers = readJSON(VOUCHERS_FILE, []);
    vouchers = vouchers.filter(v => v.code !== code);
    writeJSON(VOUCHERS_FILE, vouchers);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, code }));
    return;
  }

  // API 18: GET REVIEWS (GET /api/reviews)
  if (req.method === 'GET' && cleanUrl === '/api/reviews') {
    const reviews = readJSON(REVIEWS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(reviews));
    return;
  }

  // API 19: ADD REVIEW (POST /api/reviews)
  if (req.method === 'POST' && cleanUrl === '/api/reviews') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const rev = JSON.parse(body || '{}');
        rev.id = 'rev-' + Date.now();
        rev.date = new Date().toLocaleDateString('vi-VN');
        rev.verified = true;
        rev.rating = parseInt(rev.rating, 10) || 5;

        const reviews = readJSON(REVIEWS_FILE, []);
        reviews.unshift(rev);
        writeJSON(REVIEWS_FILE, reviews);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, review: rev }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 20: GET TELEGRAM CONFIG (GET /api/config/telegram)
  if (req.method === 'GET' && cleanUrl === '/api/config/telegram') {
    const tele = readJSON(TELEGRAM_FILE, { enabled: false, botToken: '', chatId: '' });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(tele));
    return;
  }

  // API 21: SAVE TELEGRAM CONFIG (POST /api/config/telegram)
  if (req.method === 'POST' && cleanUrl === '/api/config/telegram') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const teleData = JSON.parse(body || '{}');
        writeJSON(TELEGRAM_FILE, teleData);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, telegram: teleData }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 22: TEST TELEGRAM (POST /api/telegram/test)
  if (req.method === 'POST' && cleanUrl === '/api/telegram/test') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { botToken, chatId } = JSON.parse(body || '{}');
        const token = botToken || readJSON(TELEGRAM_FILE, {}).botToken;
        const chat = chatId || readJSON(TELEGRAM_FILE, {}).chatId;

        const testMsg = `🎉 <b>CHÚC MỪNG! KẾT NỐI TELEGRAM THÀNH CÔNG!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🤖 <b>Hệ thống:</b> Nike Atelier Notification Bot\n` +
          `✅ <b>Trạng thái:</b> Bot đã sẵn sàng nhận chuông báo khi có đơn hàng mới.\n` +
          `⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;

        const result = await sendTelegramMessage(token, chat, testMsg);
        if (result && result.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: 'Đã gửi tin nhắn thử nghiệm thành công tới Telegram!' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: result.description || 'Không thể gửi tin nhắn Telegram' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // DIRECT ASSET SERVING FOR SHOES IMAGES (Phục vụ ảnh giày trực tiếp từ backend)
  if (cleanUrl.startsWith('/assets/shoes/') || cleanUrl.startsWith('assets/shoes/')) {
    const filename = path.basename(cleanUrl);
    let assetPath = path.join(SHOES_ASSETS_DIR, filename);
    if (!fs.existsSync(assetPath)) {
      assetPath = path.join(BACKEND_UPLOADS_DIR, filename);
    }
    if (fs.existsSync(assetPath)) {
      const ext = path.extname(assetPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'image/png',
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(assetPath).pipe(res);
      return;
    }
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
  console.log(`🔎 [Order Tracking API]       http://localhost:${PORT}/api/orders/track`);
  console.log(`🎟️ [Vouchers REST API]        http://localhost:${PORT}/api/vouchers`);
  console.log(`⭐ [Reviews REST API]         http://localhost:${PORT}/api/reviews`);
  console.log(`🤖 [Telegram Notification]    http://localhost:${PORT}/api/config/telegram`);
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
