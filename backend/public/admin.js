// ==========================================================================
// NIKE ATELIER — ADMIN DASHBOARD CONTROLLER (BACKEND UI)
// ==========================================================================

let allOrders = [];
let filteredOrders = [];
let currentSearch = '';
let currentFilterStatus = 'all';

async function loadDashboardData() {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Không thể tải đơn hàng');
    allOrders = await res.json();
    applyFilters();
    updateStats();
    loadSystemHealth();
  } catch (err) {
    showToast('Lỗi kết nối máy chủ: ' + err.message);
  }
}

function updateStats() {
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(o => 
    (o.status || '').toLowerCase().includes('chờ') || (o.status || '').toLowerCase().includes('quét')
  ).length;

  document.getElementById('stat-total-revenue').textContent = totalRevenue.toLocaleString('vi-VN') + ' ₫';
  document.getElementById('stat-total-orders').textContent = totalOrders;
  document.getElementById('stat-pending-orders').textContent = pendingOrders;
}

function handleSearchOrders(query) {
  currentSearch = query.trim().toLowerCase();
  applyFilters();
}

function handleFilterStatus(status) {
  currentFilterStatus = status;
  applyFilters();
}

function applyFilters() {
  filteredOrders = allOrders.filter(order => {
    // Filter status
    const st = (order.status || '').toLowerCase();
    let matchesStatus = true;
    if (currentFilterStatus === 'pending') {
      matchesStatus = st.includes('chờ') || st.includes('quét');
    } else if (currentFilterStatus === 'confirmed') {
      matchesStatus = st.includes('xác nhận') || st.includes('đã thanh toán');
    } else if (currentFilterStatus === 'shipping') {
      matchesStatus = st.includes('đang giao') || st.includes('vận chuyển');
    } else if (currentFilterStatus === 'completed') {
      matchesStatus = st.includes('thành công') || st.includes('hoàn thành');
    } else if (currentFilterStatus === 'cancelled') {
      matchesStatus = st.includes('huỷ') || st.includes('hủy');
    }

    // Filter search query
    let matchesSearch = true;
    if (currentSearch) {
      const id = (order.orderId || '').toLowerCase();
      const name = (order.customer ? order.customer.fullname : '').toLowerCase();
      const phone = (order.customer ? order.customer.phone : '').toLowerCase();
      matchesSearch = id.includes(currentSearch) || name.includes(currentSearch) || phone.includes(currentSearch);
    }

    return matchesStatus && matchesSearch;
  });

  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  if (!filteredOrders.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-muted font-medium">
          Không có đơn hàng nào khớp với tìm kiếm.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredOrders.map(order => {
    const cust = order.customer || {};
    const items = order.items || [];
    const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A';
    
    // Status badges
    let statusClass = 'bg-amber-100 text-amber-800';
    const stLower = (order.status || '').toLowerCase();
    if (stLower.includes('thành công') || stLower.includes('đã thanh toán')) {
      statusClass = 'bg-emerald-100 text-emerald-800';
    } else if (stLower.includes('đang giao')) {
      statusClass = 'bg-blue-100 text-blue-800';
    } else if (stLower.includes('hủy') || stLower.includes('huỷ')) {
      statusClass = 'bg-rose-100 text-rose-800';
    }

    // Products summary
    const itemsSummary = items.map(i => `
      <div class="flex items-center gap-2 py-0.5">
        <span class="font-bold text-obsidian">${i.name}</span>
        <span class="text-muted text-[10px]">(Size ${i.size} • x${i.qty})</span>
      </div>
    `).join('');

    return `
      <tr class="hover:bg-canvas/30 transition-colors">
        <!-- Order ID -->
        <td class="py-3 px-4 font-mono font-bold text-obsidian">
          #${order.orderId}
        </td>

        <!-- Date -->
        <td class="py-3 px-4 text-muted whitespace-nowrap text-[11px]">
          ${dateFormatted}
        </td>

        <!-- Customer -->
        <td class="py-3 px-4">
          <p class="font-bold text-obsidian">${cust.fullname || 'Khách vãng lai'}</p>
          <p class="text-muted text-[11px] font-mono">${cust.phone || 'N/A'}</p>
          <p class="text-muted text-[10px] truncate max-w-xs" title="${cust.address || ''}">${cust.address || 'Tại cửa hàng'}</p>
        </td>

        <!-- Products -->
        <td class="py-3 px-4 max-w-xs">
          ${itemsSummary || '<span class="text-muted">Không có sản phẩm</span>'}
        </td>

        <!-- Total Price -->
        <td class="py-3 px-4 text-right font-display font-bold text-obsidian whitespace-nowrap">
          ${(order.totalAmount || 0).toLocaleString('vi-VN')} ₫
        </td>

        <!-- Payment Method -->
        <td class="py-3 px-4 text-center">
          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
            order.paymentMethod === 'vietqr' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
          }">
            ${order.paymentMethod === 'vietqr' ? 'VietQR (Techcombank)' : 'Tiền mặt (COD)'}
          </span>
        </td>

        <!-- Status & Update Dropdown -->
        <td class="py-3 px-4 text-center">
          <select onchange="updateOrderStatus('${order.orderId}', this.value)" class="text-[11px] font-bold px-2 py-1 rounded-lg border border-hairline focus:outline-none cursor-pointer ${statusClass}">
            <option value="Đã quét mã VietQR • Chờ xác nhận giao dịch" ${order.status?.includes('Chờ xác nhận') ? 'selected' : ''}>⏳ Chờ xác nhận VietQR</option>
            <option value="Đã xác nhận thanh toán • Chuẩn bị gửi hàng" ${order.status?.includes('Đã xác nhận') ? 'selected' : ''}>✅ Đã nhận tiền (Xác nhận)</option>
            <option value="Đang giao hàng qua bưu điện" ${order.status?.includes('Đang giao') ? 'selected' : ''}>🚚 Đang giao hàng</option>
            <option value="Đã giao hàng thành công" ${order.status?.includes('thành công') ? 'selected' : ''}>🎉 Hoàn thành</option>
            <option value="Đã hủy đơn hàng" ${order.status?.includes('hủy') ? 'selected' : ''}>❌ Đã hủy</option>
          </select>
        </td>

        <!-- Actions -->
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button type="button" onclick="printOrderInvoice('${order.orderId}')" class="p-1.5 rounded-lg bg-canvas hover:bg-hairline text-obsidian transition-colors" title="In phiếu gửi hàng">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            </button>
            <button type="button" onclick="deleteOrder('${order.orderId}')" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors" title="Xóa đơn hàng">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã cập nhật trạng thái đơn #${orderId}!`);
      loadDashboardData();
    } else {
      showToast('Lỗi: ' + (data.error || 'Không thể cập nhật'));
    }
  } catch (err) {
    showToast('Lỗi mạng: ' + err.message);
  }
}

async function deleteOrder(orderId) {
  if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn đơn hàng #${orderId} khỏi database không?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã xóa đơn hàng #${orderId}!`);
      loadDashboardData();
    } else {
      showToast('Lỗi: ' + data.error);
    }
  } catch (err) {
    showToast('Lỗi mạng: ' + err.message);
  }
}

function printOrderInvoice(orderId) {
  const order = allOrders.find(o => o.orderId === orderId);
  if (!order) return;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    showToast('Vui lòng cho phép popup để in phiếu gửi hàng');
    return;
  }

  const itemsHtml = (order.items || []).map((item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        <small style="color: #666;">Màu: ${item.color || 'Mặc định'} | Size: ${item.size}</small>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${(item.price || 0).toLocaleString('vi-VN')} ₫</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>${((item.price || 0) * item.qty).toLocaleString('vi-VN')} ₫</strong></td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Phiếu Gửi Hàng & Hóa Đơn - #${order.orderId}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #111; line-height: 1.5; font-size: 13px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 20px; font-weight: 800; letter-spacing: 2px; }
        .grid { display: flex; gap: 20px; margin-bottom: 20px; }
        .col { flex: 1; background: #f9f9f9; padding: 15px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #111; color: #fff; padding: 10px; font-size: 11px; text-transform: uppercase; }
        .total-box { text-align: right; margin-top: 15px; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">NIKE ATELIER VIETNAM</div>
          <small>Hotline: 1900 6868 | STK Techcombank: 8678686688</small>
        </div>
        <div style="text-align: right;">
          <div><strong>MÃ ĐƠN: #${order.orderId}</strong></div>
          <small>Ngày: ${new Date(order.createdAt).toLocaleString('vi-VN')}</small>
        </div>
      </div>

      <div class="grid">
        <div class="col">
          <strong>NGƯỜI NHẬN HÀNG:</strong>
          <p style="margin: 4px 0;"><strong>${order.customer?.fullname || 'Khách'}</strong></p>
          <p style="margin: 2px 0;">Điện thoại: ${order.customer?.phone || 'N/A'}</p>
          <p style="margin: 2px 0;">Địa chỉ: ${order.customer?.address || 'N/A'}</p>
        </div>
        <div class="col">
          <strong>VẬN CHUYỂN & THANH TOÁN:</strong>
          <p style="margin: 4px 0;">Hình thức: <strong>${order.paymentMethodLabel || order.paymentMethod}</strong></p>
          <p style="margin: 2px 0;">Trạng thái: ${order.status}</p>
          <p style="margin: 2px 0;">Phí vận chuyển: 0 ₫ (Freeship)</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px;">STT</th>
            <th style="text-align: left;">Sản phẩm</th>
            <th style="width: 50px;">SL</th>
            <th style="width: 120px; text-align: right;">Đơn giá</th>
            <th style="width: 130px; text-align: right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="total-box">
        Tổng tiền thu người nhận: <strong style="color: #b91c1c;">${(order.totalAmount || 0).toLocaleString('vi-VN')} ₫</strong>
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

async function loadSystemHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const upEl = document.getElementById('sys-uptime');
    if (upEl && data.uptimeSeconds !== undefined) {
      const mins = Math.floor(data.uptimeSeconds / 60);
      const secs = data.uptimeSeconds % 60;
      upEl.textContent = `${mins} phút ${secs} giây (Đang hoạt động ổn định)`;
    }
  } catch (e) {}
}

function switchTab(tabName) {
  const tabs = ['orders', 'settings', 'system'];
  tabs.forEach(t => {
    const section = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (t === tabName) {
      section?.classList.remove('hidden');
      btn?.classList.remove('bg-white', 'text-muted');
      btn?.classList.add('bg-obsidian', 'text-white', 'shadow-sm');
    } else {
      section?.classList.add('hidden');
      btn?.classList.add('bg-white', 'text-muted');
      btn?.classList.remove('bg-obsidian', 'text-white', 'shadow-sm');
    }
  });
}

function showToast(message) {
  const toast = document.getElementById('admin-toast');
  const msgEl = document.getElementById('admin-toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 2600);
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  // Poll every 10 seconds for real-time order updates
  setInterval(loadDashboardData, 10000);
});
