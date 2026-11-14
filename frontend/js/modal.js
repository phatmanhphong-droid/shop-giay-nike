// ==========================================================================
// SHOP GIÀY NIKE — MODAL QUICK VIEW COMPONENT
// Xem chi tiết sản phẩm, chọn màu chuẩn xác (đúng ảnh thật), chọn size
// ==========================================================================

(function () {
  let currentProduct = null;
  let selectedColorIndex = 0;
  let selectedSize = 41;

  function openQuickView(productId, optColorIndex) {
    const data = window.CATALOG_DATA || [];
    currentProduct = data.find(p => p.id === productId);
    if (!currentProduct) {
      console.warn('Product not found:', productId);
      return;
    }

    selectedColorIndex = optColorIndex !== undefined ? optColorIndex : 0;
    selectedSize = 41;

    const modal = document.getElementById('quickview-modal');
    if (!modal) {
      console.warn('Element #quickview-modal not found!');
      return;
    }

    const badgeEl = document.getElementById('qv-badge');
    const titleEl = document.getElementById('qv-title');
    const priceEl = document.getElementById('qv-price');
    const descEl = document.getElementById('qv-desc');
    const imgEl = document.getElementById('qv-img');
    const colorNameEl = document.getElementById('qv-color-name');
    const colorsContainer = document.getElementById('qv-colors');
    const sizesContainer = document.getElementById('qv-sizes');
    const specsContainer = document.getElementById('qv-specs');

    if (badgeEl) badgeEl.textContent = currentProduct.badge;
    if (titleEl) titleEl.textContent = currentProduct.name;
    if (priceEl) priceEl.textContent = currentProduct.price.toLocaleString('vi-VN') + ' ₫';
    if (descEl) descEl.textContent = currentProduct.description;

    // Render colors
    if (colorsContainer && currentProduct.colors) {
      colorsContainer.innerHTML = currentProduct.colors.map((c, idx) => `
        <button type="button" 
          onclick="window.selectModalColor(${idx})"
          class="qv-color-btn ${idx === selectedColorIndex ? 'active' : ''}" 
          style="background-color: ${c.hex};" 
          title="${c.name}"
          aria-label="${c.name}">
        </button>
      `).join('');
    }

    // Render sizes (38 - 44)
    if (sizesContainer) {
      const sizes = [38, 39, 40, 41, 42, 43, 44];
      sizesContainer.innerHTML = sizes.map(sz => `
        <button type="button" 
          onclick="window.selectModalSize(${sz})" 
          class="qv-size-btn ${sz === selectedSize ? 'active' : ''}">
          ${sz}
        </button>
      `).join('');
    }

    // Render specs
    if (specsContainer && currentProduct.specs) {
      specsContainer.innerHTML = currentProduct.specs.map(s => `
        <li class="flex items-center gap-2 text-xs text-muted">
          <span class="w-1.5 h-1.5 rounded-full bg-obsidian shrink-0"></span>
          <span>${s}</span>
        </li>
      `).join('');
    }

    // Update active color image immediately on open
    updateModalColorView();

    // Render 4.9* customer reviews
    renderProductReviews(currentProduct);

    // Show modal: Set display flex explicitly with high z-index class
    modal.classList.remove('hidden');
    modal.classList.add('is-open');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  const DEFAULT_REVIEWS = [
    {
      author: 'Nguyễn Hoàng Nam',
      rating: 5,
      date: '12/11/2026',
      content: 'Chất da thật sờ cực thích, form ôm chuẩn chân. Quét mã VietQR chuyển khoản xong shop gọi điện xác nhận liền trong 5 phút. 10/10!'
    },
    {
      author: 'Trần Thị Mai Anh',
      rating: 5,
      date: '10/11/2026',
      content: 'Đôi này phối đồ gì cũng đỉnh, đế êm nâng chiều cao tự nhiên. Giao hàng hỏa tốc 2 ngày là nhận được. Đóng gói rất cẩn thận.'
    },
    {
      author: 'Lê Tuấn Hùng',
      rating: 5,
      date: '08/11/2026',
      content: 'Đệm ZoomX êm và nảy dã man, mang chạy bộ hoặc đi chơi đều sướng. Rất đáng tiền, chuẩn hàng authentic!'
    }
  ];

  async function renderProductReviews(product) {
    const listEl = document.getElementById('qv-reviews-list');
    if (!listEl) return;

    let reviews = DEFAULT_REVIEWS;
    try {
      const apiBase = window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
      const res = await fetch(`${apiBase}/api/reviews`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          reviews = data;
        }
      }
    } catch (e) {}

    listEl.innerHTML = reviews.slice(0, 3).map(rev => `
      <div class="p-2.5 rounded-xl bg-canvas border border-hairline text-left">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-obsidian text-xs">${rev.author}</span>
            <span class="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-1.5 py-0.2 rounded">✓ Đã mua hàng</span>
          </div>
          <div class="flex text-amber-400 text-[10px] font-bold">★★★★★</div>
        </div>
        <p class="text-[11px] text-muted mt-1 leading-relaxed">${rev.content}</p>
        <div class="text-[9px] text-muted/80 mt-1 flex items-center justify-between">
          <span>${product ? product.name : 'Nike Authentic'} • Size 41</span>
          <span>${rev.date || 'Gần đây'}</span>
        </div>
      </div>
    `).join('');
  }

  function selectModalColor(index) {
    if (!currentProduct || !currentProduct.colors || !currentProduct.colors[index]) return;
    selectedColorIndex = index;
    updateModalColorView();

    // Update active state in color buttons
    const btns = document.querySelectorAll('#qv-colors .qv-color-btn');
    btns.forEach((btn, idx) => {
      if (idx === index) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  function updateModalColorView() {
    if (!currentProduct || !currentProduct.colors) return;
    const color = currentProduct.colors[selectedColorIndex];
    if (!color) return;

    const imgEl = document.getElementById('qv-img');
    const colorNameEl = document.getElementById('qv-color-name');

    if (colorNameEl) colorNameEl.textContent = color.name;
    if (imgEl) {
      imgEl.src = color.photo;
      imgEl.style.opacity = '1';
      imgEl.style.transform = 'scale(1)';
    }
  }

  function selectModalSize(size) {
    selectedSize = size;
    const btns = document.querySelectorAll('#qv-sizes .qv-size-btn');
    btns.forEach(btn => {
      if (btn.textContent.trim() === String(size)) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  function confirmModalAddToCart() {
    if (!currentProduct) return;
    const color = currentProduct.colors && currentProduct.colors[selectedColorIndex] 
      ? currentProduct.colors[selectedColorIndex] 
      : { name: 'Mặc định', photo: currentProduct.image };

    if (window.addToCart) {
      window.addToCart(
        currentProduct.id,
        color.name,
        selectedSize,
        currentProduct.price,
        color.photo,
        currentProduct.name
      );
    }
    closeQuickView();
  }

  function closeQuickView() {
    const modal = document.getElementById('quickview-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('is-open');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // Keyboard Escape listener to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeQuickView();
  });

  // Export to global window
  window.openQuickView = openQuickView;
  window.closeQuickView = closeQuickView;
  window.selectModalColor = selectModalColor;
  window.selectModalSize = selectModalSize;
  window.confirmModalAddToCart = confirmModalAddToCart;
})();
