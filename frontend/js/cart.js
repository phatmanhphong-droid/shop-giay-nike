// ==========================================================================
// SHOP GIÀY NIKE — SHOPPING CART & VIETQR CHECKOUT COMPONENT
// Quản lý giỏ hàng: thêm, bớt, xoá, lưu trữ localStorage, drawer trượt
// Tích hợp thanh toán quét mã VietQR tự động Napas247 và COD
// ==========================================================================

(function () {
  const STORAGE_KEY = 'shop_nike_cart_v2';
  const ORDERS_STORAGE_KEY = 'shop_nike_orders_v2';

  // Bank Account Configuration for VietQR
  const BANK_CONFIG = {
    bankId: 'TCB',
    bankName: 'Techcombank (Ngân Hàng Kỹ Thương Việt Nam)',
    bankBadge: 'TCB',
    accountNo: '8678686688',
    accountName: 'TRAN DUC MANH'
  };

  let cartItems = [];
  let currentOrderCode = '';
  let currentPaymentMethod = 'vietqr';
  let toastTimer = null;
  let lastPlacedOrder = null;

  function loadCart() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      cartItems = saved ? JSON.parse(saved) : [];
    } catch (e) {
      cartItems = [];
    }

    // Default sample item if cart is empty on first visit
    if (!cartItems.length) {
      cartItems = [
        {
          id: 'nike-01',
          name: 'Air Jordan 1 Retro High OG',
          color: 'Chicago Đỏ Trắng',
          size: 41,
          price: 4990000,
          image: 'assets/shoes/jordan1-chicago.png',
          qty: 1
        }
      ];
      saveCart();
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {}
    renderCart();
  }

  function addToCart(id, colorName, size, price, image, name) {
    const existingIndex = cartItems.findIndex(
      item => item.id === id && item.color === colorName && item.size === size
    );

    if (existingIndex > -1) {
      cartItems[existingIndex].qty += 1;
    } else {
      cartItems.push({
        id,
        name,
        color: colorName,
        size,
        price,
        image,
        qty: 1
      });
    }

    saveCart();
    showToast(`Đã thêm ${name} vào giỏ hàng!`);
    toggleCartDrawer(true);
  }

  function updateCartQty(index, delta) {
    if (index < 0 || index >= cartItems.length) return;
    cartItems[index].qty += delta;
    if (cartItems[index].qty <= 0) {
      cartItems.splice(index, 1);
    }
    saveCart();
  }

  function removeCartItem(index) {
    if (index < 0 || index >= cartItems.length) return;
    cartItems.splice(index, 1);
    saveCart();
  }

  function toggleCartDrawer(isOpen) {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    const panel = document.getElementById('cart-panel');

    if (!drawer || !backdrop || !panel) return;

    if (isOpen) {
      drawer.classList.remove('pointer-events-none');
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      panel.classList.remove('translate-x-full');
      panel.classList.add('translate-x-0');
      document.body.style.overflow = 'hidden';
    } else {
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0');
      panel.classList.remove('translate-x-0');
      panel.classList.add('translate-x-full');
      setTimeout(() => {
        drawer.classList.add('pointer-events-none');
        document.body.style.overflow = '';
      }, 300);
    }
  }

  function renderCart() {
    const badgeEl = document.getElementById('cart-badge');
    const listEl = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');

    const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (badgeEl) badgeEl.textContent = totalQty;
    if (totalEl) totalEl.textContent = totalPrice.toLocaleString('vi-VN') + ' ₫';

    if (listEl) {
      if (!cartItems.length) {
        listEl.innerHTML = `
          <div class="py-16 text-center text-muted">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            <p class="text-sm font-medium">Giỏ hàng của bạn đang trống</p>
            <p class="text-xs mt-1">Hãy khám phá bộ sưu tập và chọn đôi giày yêu thích!</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = cartItems.map((item, idx) => `
        <div class="flex items-center gap-4 py-4 border-b border-hairline">
          <div class="w-20 h-20 rounded-xl bg-canvas flex items-center justify-center p-2 shrink-0">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain" />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold text-obsidian truncate">${item.name}</h4>
            <p class="text-[11px] text-muted mt-0.5">${item.color} • Size ${item.size}</p>
            <p class="text-xs font-semibold text-obsidian mt-1">${item.price.toLocaleString('vi-VN')} ₫</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="window.updateCartQty(${idx}, -1)" class="w-7 h-7 rounded-full border border-hairline hover:border-obsidian flex items-center justify-center text-xs font-bold transition-colors">
              -
            </button>
            <span class="text-xs font-bold w-4 text-center">${item.qty}</span>
            <button type="button" onclick="window.updateCartQty(${idx}, 1)" class="w-7 h-7 rounded-full border border-hairline hover:border-obsidian flex items-center justify-center text-xs font-bold transition-colors">
              +
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // ==========================================================================
  // CHECKOUT MODAL & VIETQR PAYMENT FLOW
  // ==========================================================================

  function handleCheckout() {
    if (!cartItems.length) {
      showToast('Giỏ hàng trống! Vui lòng chọn sản phẩm trước khi thanh toán.');
      return;
    }
    toggleCartDrawer(false);
    setTimeout(() => {
      openCheckoutModal();
    }, 200);
  }

  function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const formContainer = document.getElementById('checkout-form-container');
    const successContainer = document.getElementById('checkout-success-container');

    if (!modal) return;

    // Reset views
    if (formContainer) formContainer.classList.remove('hidden');
    if (successContainer) {
      successContainer.classList.add('hidden');
      successContainer.innerHTML = '';
    }

    // Generate unique Order Code
    currentOrderCode = 'NIKE' + Math.floor(100000 + Math.random() * 900000);
    currentPaymentMethod = 'vietqr';

    // Populate order summary
    renderCheckoutSummary();

    // Setup VietQR image and details
    updateVietQRDetails();

    // Reset payment method buttons UI
    handlePaymentMethodChange('vietqr');

    // Open Modal with smooth transition
    modal.classList.remove('pointer-events-none', 'opacity-0');
    modal.classList.add('opacity-100');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('pointer-events-none');
      document.body.style.overflow = '';
    }, 300);
  }

  function renderCheckoutSummary() {
    const listEl = document.getElementById('checkout-items-list');
    const countEl = document.getElementById('checkout-items-count');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total-price');

    const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (countEl) countEl.textContent = `${totalQty} sản phẩm`;
    if (subtotalEl) subtotalEl.textContent = totalPrice.toLocaleString('vi-VN') + ' ₫';
    if (totalEl) totalEl.textContent = totalPrice.toLocaleString('vi-VN') + ' ₫';

    if (listEl) {
      listEl.innerHTML = cartItems.map(item => `
        <div class="flex items-center gap-3 py-2.5">
          <div class="w-14 h-14 rounded-xl bg-white flex items-center justify-center p-1.5 shrink-0 border border-hairline">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain" />
          </div>
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-bold text-obsidian truncate">${item.name}</h5>
            <p class="text-[10px] text-muted">${item.color} • Size ${item.size} • SL: ${item.qty}</p>
            <p class="text-xs font-semibold text-obsidian mt-0.5">${(item.price * item.qty).toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>
      `).join('');
    }
  }

  function updateVietQRDetails() {
    const qrImg = document.getElementById('vietqr-image');
    const qrSpinner = document.getElementById('vietqr-spinner');
    const bankNameEl = document.getElementById('vietqr-bank-name');
    const accNumEl = document.getElementById('vietqr-acc-num');
    const accNameEl = document.getElementById('vietqr-acc-name');
    const orderCodeEl = document.getElementById('vietqr-order-code');

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (bankNameEl) bankNameEl.textContent = BANK_CONFIG.bankName;
    if (accNumEl) accNumEl.textContent = BANK_CONFIG.accountNo;
    if (accNameEl) accNameEl.textContent = BANK_CONFIG.accountName;
    if (orderCodeEl) orderCodeEl.textContent = currentOrderCode;

    // VietQR Public API URL
    // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<ORDER_CODE>&accountName=<ACCOUNT_NAME>
    const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(currentOrderCode)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

    if (qrImg && qrSpinner) {
      qrSpinner.classList.remove('hidden');
      qrImg.onload = () => {
        qrSpinner.classList.add('hidden');
      };
      qrImg.onerror = () => {
        qrSpinner.classList.add('hidden');
        // Fallback: still show instructions
        qrImg.alt = 'Vui lòng quét theo STK bên cạnh';
      };
      qrImg.src = qrUrl;
    }
  }

  function handlePaymentMethodChange(method) {
    currentPaymentMethod = method;
    const cardVietqr = document.getElementById('pm-card-vietqr');
    const cardCod = document.getElementById('pm-card-cod');
    const vietqrBox = document.getElementById('vietqr-details-box');
    const btnText = document.getElementById('btn-confirm-text');

    if (method === 'vietqr') {
      if (cardVietqr) {
        cardVietqr.classList.remove('border-hairline', 'bg-canvas/50');
        cardVietqr.classList.add('border-2', 'border-obsidian', 'bg-white');
      }
      if (cardCod) {
        cardCod.classList.remove('border-2', 'border-obsidian', 'bg-white');
        cardCod.classList.add('border', 'border-hairline', 'bg-canvas/50');
      }
      if (vietqrBox) vietqrBox.classList.remove('hidden');
      if (btnText) btnText.textContent = 'Tôi Đã Chuyển Khoản • Xác Nhận Đơn';
    } else {
      if (cardCod) {
        cardCod.classList.remove('border-hairline', 'bg-canvas/50');
        cardCod.classList.add('border-2', 'border-obsidian', 'bg-white');
      }
      if (cardVietqr) {
        cardVietqr.classList.remove('border-2', 'border-obsidian', 'bg-white');
        cardVietqr.classList.add('border', 'border-hairline', 'bg-canvas/50');
      }
      if (vietqrBox) vietqrBox.classList.add('hidden');
      if (btnText) btnText.textContent = 'Xác Nhận Đặt Hàng (COD)';
    }
  }

  function copyToClipboard(text, message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(message || 'Đã sao chép vào bộ nhớ tạm!');
      }).catch(() => {
        fallbackCopy(text, message);
      });
    } else {
      fallbackCopy(text, message);
    }
  }

  function fallbackCopy(text, message) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(message || 'Đã sao chép vào bộ nhớ tạm!');
    } catch (err) {
      showToast('Không thể sao chép, vui lòng nhập thủ công');
    }
    document.body.removeChild(textArea);
  }

  function copyOrderCode() {
    copyToClipboard(currentOrderCode, `Đã sao chép mã đơn hàng: ${currentOrderCode}`);
  }

  function copyAccountNumber() {
    copyToClipboard(BANK_CONFIG.accountNo, `Đã sao chép STK Techcombank: ${BANK_CONFIG.accountNo}`);
  }

  function showToast(message) {
    const toast = document.getElementById('toast-notify');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 2600);
  }

  async function submitOrder() {
    const nameInput = document.getElementById('order-fullname');
    const phoneInput = document.getElementById('order-phone');
    const addressInput = document.getElementById('order-address');
    const notesInput = document.getElementById('order-notes');
    const btnConfirm = document.getElementById('btn-confirm-order');

    const fullname = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    // Validation
    if (!fullname) {
      showToast('Vui lòng điền Họ và tên người nhận!');
      nameInput && nameInput.focus();
      return;
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phone || !phoneRegex.test(phone.replace(/\s+/g, ''))) {
      showToast('Vui lòng nhập số điện thoại Việt Nam hợp lệ!');
      phoneInput && phoneInput.focus();
      return;
    }

    if (!address || address.length < 5) {
      showToast('Vui lòng nhập địa chỉ nhận hàng chi tiết!');
      addressInput && addressInput.focus();
      return;
    }

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    const orderData = {
      orderId: currentOrderCode,
      createdAt: new Date().toISOString(),
      customer: {
        fullname,
        phone,
        address,
        notes
      },
      paymentMethod: currentPaymentMethod,
      paymentMethodLabel: currentPaymentMethod === 'vietqr' ? 'Quét Mã VietQR (Napas247)' : 'Thanh toán khi nhận hàng (COD)',
      items: [...cartItems],
      totalAmount: totalPrice,
      status: currentPaymentMethod === 'vietqr' ? 'Đã quét mã VietQR • Chờ xác nhận giao dịch' : 'Đã tiếp nhận đơn hàng COD'
    };

    // Show button loading state
    if (btnConfirm) {
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = `
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Đang khởi tạo đơn hàng...</span>
      `;
    }

    // Try saving to backend API
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    } catch (e) {
      console.warn('Backend order persist fallback to localStorage', e);
    }

    // Save to localStorage history
    try {
      const existingOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
      existingOrders.unshift(orderData);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(existingOrders));
    } catch (e) {}

    lastPlacedOrder = orderData;

    // Clear cart
    cartItems = [];
    saveCart();

    // Show Success View
    renderOrderSuccessView(orderData);
  }

  function renderOrderSuccessView(order) {
    const formContainer = document.getElementById('checkout-form-container');
    const successContainer = document.getElementById('checkout-success-container');
    const btnConfirm = document.getElementById('btn-confirm-order');

    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <span id="btn-confirm-text">Xác Nhận Đặt Hàng</span>
      `;
    }

    if (formContainer) formContainer.classList.add('hidden');
    if (!successContainer) return;

    successContainer.classList.remove('hidden');
    successContainer.innerHTML = `
      <div class="max-w-xl mx-auto space-y-6">
        <!-- Animated Green Checkmark -->
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
        </div>

        <div>
          <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Đặt Hàng Thành Công
          </span>
          <h3 class="font-display font-extrabold text-2xl sm:text-3xl text-obsidian tracking-tight mt-3">
            Cảm Ơn Quý Khách Đã Mua Sắm!
          </h3>
          <p class="text-xs sm:text-sm text-muted mt-2">
            Mã đơn hàng: <span class="font-mono font-bold text-obsidian text-sm sm:text-base">#${order.orderId}</span>
          </p>
        </div>

        <!-- Order Information Summary Card -->
        <div class="p-5 rounded-2xl bg-canvas border border-hairline text-left space-y-3 text-xs">
          <div class="flex items-center justify-between border-b border-hairline pb-2.5">
            <span class="text-muted">Trạng thái</span>
            <span class="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">${order.status}</span>
          </div>

          <div class="flex items-center justify-between border-b border-hairline pb-2.5">
            <span class="text-muted">Phương thức thanh toán</span>
            <span class="font-semibold text-obsidian">${order.paymentMethodLabel}</span>
          </div>

          <div class="flex items-center justify-between border-b border-hairline pb-2.5">
            <span class="text-muted">Người nhận</span>
            <span class="font-semibold text-obsidian">${order.customer.fullname} (${order.customer.phone})</span>
          </div>

          <div class="flex items-start justify-between border-b border-hairline pb-2.5">
            <span class="text-muted shrink-0 mr-2">Địa chỉ giao hàng</span>
            <span class="font-semibold text-obsidian text-right">${order.customer.address}</span>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="font-bold text-obsidian">Tổng giá trị đơn hàng</span>
            <span class="font-display font-extrabold text-lg text-obsidian">${order.totalAmount.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>

        <!-- Shipping & Support Note -->
        <div class="text-[11px] text-muted bg-white p-4 rounded-xl border border-hairline flex items-start gap-3 text-left">
          <svg class="w-5 h-5 text-obsidian shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div>
            <p class="font-semibold text-obsidian">Thời gian giao hàng dự kiến: 1 - 3 ngày làm việc</p>
            <p class="mt-0.5">Bộ phận CSKH Shop Giày Nike sẽ gọi điện thoại hoặc gửi tin nhắn SMS để xác nhận đơn và gửi mã vận đơn qua Zalo. Hotline hỗ trợ 24/7: <strong>1900 6868</strong></p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button type="button" 
            onclick="window.printInvoice()" 
            class="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-hairline hover:border-obsidian text-obsidian text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span>In Hoá Đơn / Xuất Đơn Hàng</span>
          </button>

          <button type="button" 
            onclick="window.closeCheckoutModal()" 
            class="w-full sm:w-auto px-8 py-3 rounded-full bg-obsidian hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md">
            Tiếp Tục Mua Sắm
          </button>
        </div>
      </div>
    `;
  }

  function printInvoice() {
    if (!lastPlacedOrder) {
      showToast('Chưa có thông tin đơn hàng để in!');
      return;
    }
    const order = lastPlacedOrder;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      showToast('Vui lòng cho phép mở cửa sổ popup để in hoá đơn.');
      return;
    }

    const itemsHtml = order.items.map((item, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong><br>
          <small style="color: #666;">Màu: ${item.color} | Size: ${item.size}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString('vi-VN')} ₫</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>${(item.price * item.qty).toLocaleString('vi-VN')} ₫</strong></td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hoá Đơn Bán Hàng - #${order.orderId}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #111; line-height: 1.5; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 25px; }
          .logo { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
          .sub { color: #666; font-size: 12px; margin-top: 4px; }
          .invoice-title { font-size: 22px; font-weight: bold; text-align: center; margin: 20px 0; text-transform: uppercase; }
          .grid { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px; }
          .col { flex: 1; background: #f9f9f9; padding: 15px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
          th { background: #111; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase; }
          .total-box { text-align: right; margin-top: 15px; font-size: 15px; }
          .footer { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 15px; text-align: center; color: #777; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SHOP GIÀY NIKE CHÍNH HÃNG</div>
            <div class="sub">Hệ thống Sneaker Nike Authentic Việt Nam</div>
            <div class="sub">Hotline: 1900 6868 | Website: http://localhost:8080</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Mã đơn hàng:</strong> #${order.orderId}</div>
            <div class="sub">Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}</div>
          </div>
        </div>

        <div class="invoice-title">HOÁ ĐƠN BÁN HÀNG & GIAO HÀNG</div>

        <div class="grid">
          <div class="col">
            <strong>THÔNG TIN KHÁCH HÀNG:</strong>
            <p style="margin: 6px 0 2px 0;"><strong>Họ tên:</strong> ${order.customer.fullname}</p>
            <p style="margin: 2px 0;"><strong>Điện thoại:</strong> ${order.customer.phone}</p>
            <p style="margin: 2px 0;"><strong>Địa chỉ:</strong> ${order.customer.address}</p>
            ${order.customer.notes ? `<p style="margin: 2px 0;"><strong>Ghi chú:</strong> ${order.customer.notes}</p>` : ''}
          </div>
          <div class="col">
            <strong>PHƯƠNG THỨC & THANH TOÁN:</strong>
            <p style="margin: 6px 0 2px 0;"><strong>Hình thức:</strong> ${order.paymentMethodLabel}</p>
            <p style="margin: 2px 0;"><strong>Trạng thái:</strong> ${order.status}</p>
            <p style="margin: 2px 0;"><strong>Phí vận chuyển:</strong> 0 ₫ (Miễn phí toàn quốc)</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th style="text-align: left;">Sản phẩm</th>
              <th style="width: 60px;">SL</th>
              <th style="width: 120px; text-align: right;">Đơn giá</th>
              <th style="width: 130px; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div>Tạm tính: <strong>${order.totalAmount.toLocaleString('vi-VN')} ₫</strong></div>
          <div>Phí ship: <strong>0 ₫</strong></div>
          <div style="font-size: 18px; margin-top: 6px;">Tổng thanh toán: <strong style="color: #b91c1c;">${order.totalAmount.toLocaleString('vi-VN')} ₫</strong></div>
        </div>

        <div class="footer">
          <p>Cảm ơn quý khách đã mua sắm tại Shop Giày Nike! Cam kết chính hãng 100%, bảo hành 12 tháng, đổi trả 7 ngày.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Initial load
  loadCart();

  if (window.location.search.includes('checkout=1')) {
    setTimeout(() => {
      openCheckoutModal();
    }, 400);
  }

  // Export to global window
  window.addToCart = addToCart;
  window.updateCartQty = updateCartQty;
  window.removeCartItem = removeCartItem;
  window.toggleCartDrawer = toggleCartDrawer;
  window.renderCart = renderCart;
  window.handleCheckout = handleCheckout;
  window.openCheckoutModal = openCheckoutModal;
  window.closeCheckoutModal = closeCheckoutModal;
  window.handlePaymentMethodChange = handlePaymentMethodChange;
  window.copyToClipboard = copyToClipboard;
  window.copyOrderCode = copyOrderCode;
  window.copyAccountNumber = copyAccountNumber;
  window.BANK_CONFIG = BANK_CONFIG;
  window.showToast = showToast;
  window.submitOrder = submitOrder;
  window.printInvoice = printInvoice;
})();
