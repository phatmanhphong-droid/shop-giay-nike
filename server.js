// ==========================================================================
// SHOP GIÀY NIKE — ROOT CONCURRENT SERVER RUNNER
// Khởi chạy đồng thời cả Backend (Port 5000) và Frontend (Port 8080)
// ==========================================================================

const { spawn } = require('child_process');
const path = require('path');

console.log('=============================================================');
console.log('🚀 [Shop Giày Nike] Đang khởi động toàn bộ hệ thống Fullstack...');
console.log('=============================================================');

const backend = spawn('node', [path.join(__dirname, 'backend', 'server.js')], { stdio: 'inherit' });
const frontend = spawn('node', [path.join(__dirname, 'frontend', 'server.js')], { stdio: 'inherit' });

backend.on('error', err => console.error('❌ Lỗi tiến trình Backend:', err.message));
frontend.on('error', err => console.error('❌ Lỗi tiến trình Frontend:', err.message));

process.on('SIGINT', () => {
  console.log('\n🛑 Đang dừng toàn bộ dịch vụ...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

