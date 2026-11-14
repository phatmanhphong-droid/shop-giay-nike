// ==========================================================================
// SHOP GIÀY NIKE — ORDER TRACKING COMPONENT (TRA CỨU TIẾN ĐỘ ĐƠN HÀNG)
// Khách hàng có thể tra cứu theo Số điện thoại hoặc Mã đơn hàng (NIKE...)
// ==========================================================================

(function () {
  function getApiBase() {
    return window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
  }

  function openTrackingModal(optOrderCode) {
    const modal = document.getElementById('tracking-modal');
    const input = document.getElementById('tracking-input');
    const resultBox = document.getElementById('tracking-result-box');
    const emptyBox = document.getElementById('tracking-empty-box');

    if (!modal) return;

    if (resultBox) resultBox.innerHTML = '';
    if (emptyBox) emptyBox.classList.add('hidden');

    if (optOrderCode && input) {
      input.value = optOrderCode;
      handleTrackOrder();
    } else if (input) {
      // Tự động điền đơn hàng gần nhất nếu có lưu trong trình duyệt
      try {
        const lastOrder = JSON.parse(localStorage.getItem('shop_nike_orders_v2') || '[]')[0];
        if (lastOrder && lastOrder.orderId) {
          input.value = lastOrder.orderId;
        }
      } catch (e) {}
    }

    modal.classList.remove('pointer-events-none', 'opacity-0');
    modal.classList.add('opacity-100');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (input) input.focus();
    }, 150);
  }

  function closeTrackingModal() {
    const modal = document.getElementById('tracking-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('pointer-events-none');
      document.body.style.overflow = '';
    }, 250);
  }

  async function handleTrackOrder() {
    const input = document.getElementById('tracking-input');
    const btn = document.getElementById('btn-track-submit');
    const resultBox = document.getElementById('tracking-result-box');
    const emptyBox = document.getElementById('tracking-empty-box');

    if (!input || !resultBox) return;
    const query = input.value.trim();

    if (!query) {
      if (window.showToast) window.showToast('Vui lòng nhập Số điện thoại hoặc Mã đơn hàng!');
      input.focus();
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Đang tra cứu...</span>`;
    }

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/orders/track?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
      const data = await res.json();

      if (data.success && data.orders && data.orders.length > 0) {
        if (emptyBox) emptyBox.classList.add('hidden');
        renderTrackingResults(data.orders);
      } else {
        resultBox.innerHTML = '';
        if (emptyBox) {
          emptyBox.classList.remove('hidden');
          const notFoundText = document.getElementById('tracking-notfound-text');
          if (notFoundText) notFoundText.textContent = `Không tìm thấy đơn hàng nào khớp với "${query}". Vui lòng kiểm tra lại số điện thoại hoặc mã đơn.`;
        }
      }
    } catch (err) {
      if (window.showToast) window.showToast('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><span>Tra Cứu</span>`;
      }
    }
  }

  function getTimelineStep(status) {
    const st = (status || '').toLowerCase();
    if (st.includes('thành công') || st.includes('hoàn thành')) return 4;
    if (st.includes('giao') || st.includes('vận chuyển') || st.includes('bàn giao')) return 3;
    if (st.includes('đã thanh toán') || st.includes('xác nhận') || st.includes('chuẩn bị')) return 2;
    return 1; // Mới tiếp nhận / Chờ quét QR
  }

  function renderTrackingResults(orders) {
    const resultBox = document.getElementById('tracking-result-box');
    if (!resultBox) return;

    resultBox.innerHTML = orders.map((order, idx) => {
      const currentStep = getTimelineStep(order.status);
      const cust = order.customer || {};
      const items = order.items || [];
      const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Mới đây';

      const steps = [
        { num: 1, title: 'Đã Tiếp Nhận', desc: 'Đơn hàng đã vào hệ thống' },
        { num: 2, title: 'Đã Xác Nhận', desc: 'Đã thanh toán / Chuẩn bị hàng' },
        { num: 3, title: 'Đang Giao Hàng', desc: 'Đã gửi cho bưu tá' },
        { num: 4, title: 'Giao Thành Công', desc: 'Đã nhận hàng an toàn' }
      ];

      return `
        <div class="bg-white border-2 border-hairline rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
          
          <!-- Order Header Badge -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-sm sm:text-base text-obsidian uppercase tracking-wide">#${order.orderId}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  currentStep >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }">
                  ${order.status || 'Đang xử lý'}
                </span>
              </div>
              <p class="text-[11px] text-muted mt-1">Đặt lúc: ${dateFormatted} • Thanh toán: ${order.paymentMethodLabel || order.paymentMethod}</p>
            </div>

            <div class="text-left sm:text-right">
              <span class="text-[10px] text-muted uppercase font-bold">Tổng thanh toán</span>
              <p class="font-display font-bold text-base sm:text-lg text-obsidian">${(order.totalAmount || 0).toLocaleString('vi-VN')} ₫</p>
            </div>
          </div>

          <!-- 4-Stage Visual Progress Timeline -->
          <div>
            <div class="grid grid-cols-4 gap-2 relative">
              ${steps.map((st) => {
                const isPassed = st.num <= currentStep;
                const isCurrent = st.num === currentStep;

                return `
                  <div class="flex flex-col items-center text-center">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed 
                        ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100' 
                        : 'bg-canvas text-muted border border-hairline'
                    } ${isCurrent ? 'animate-bounce' : ''}">
                      ${isPassed ? '✓' : st.num}
                    </div>
                    <span class="font-bold text-[11px] mt-2 text-obsidian line-clamp-1">${st.title}</span>
                    <span class="hidden sm:block text-[9px] text-muted mt-0.5 line-clamp-1">${st.desc}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Delivery Info & Ordered Items Summary -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-hairline text-xs">
            <div class="p-3.5 rounded-2xl bg-canvas border border-hairline space-y-1.5">
              <span class="font-bold text-obsidian uppercase text-[10px] tracking-wider block mb-1">Thông tin giao hàng:</span>
              <p><span class="text-muted">Người nhận:</span> <b class="text-obsidian">${cust.fullname || 'Khách hàng'}</b></p>
              <p><span class="text-muted">Số điện thoại:</span> <b class="font-mono text-obsidian">${cust.phone || 'N/A'}</b></p>
              <p><span class="text-muted">Địa chỉ nhận:</span> <span class="text-obsidian">${cust.address || 'Tại cửa hàng'}</span></p>
              ${cust.notes ? `<p><span class="text-muted">Ghi chú:</span> <i>${cust.notes}</i></p>` : ''}
            </div>

            <div class="space-y-2">
              <span class="font-bold text-obsidian uppercase text-[10px] tracking-wider block">Sản phẩm trong đơn:</span>
              <div class="space-y-2 max-h-44 overflow-y-auto pr-1">
                ${items.map(it => `
                  <div class="flex items-center gap-3 p-2 rounded-xl bg-canvas/60 border border-hairline">
                    <div class="w-12 h-12 rounded-lg bg-white p-1 border border-hairline flex items-center justify-center shrink-0">
                      <img src="${it.image || 'assets/shoes/default-shoe.png'}" alt="${it.name}" class="w-full h-full object-contain" onerror="this.src='assets/shoes/airforce1-white.png'" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-obsidian text-xs truncate">${it.name}</p>
                      <p class="text-[10px] text-muted">${it.color || 'Mặc định'} • Size: ${it.size} • SL: ${it.qty}</p>
                    </div>
                    <span class="font-display font-bold text-xs text-obsidian whitespace-nowrap">${(it.price * it.qty).toLocaleString('vi-VN')} ₫</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>
      `;
    }).join('');
  }

  // Export to global window
  window.openTrackingModal = openTrackingModal;
  window.closeTrackingModal = closeTrackingModal;
  window.handleTrackOrder = handleTrackOrder;
})();
