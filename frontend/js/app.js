// ==========================================================================
// SHOP GIÀY NIKE — MAIN APPLICATION CONTROLLER
// Kết nối bộ lọc danh mục, tìm kiếm, hiển thị sản phẩm thời gian thực từ Backend
// ==========================================================================

(function () {
  let activeCategory = 'Tất cả';
  let searchQuery = '';
  let isFetching = false;
  let liveVouchers = [];

  // Resolve API Base (hỗ trợ cả chạy qua Frontend reverse proxy lẫn gọi trực tiếp Backend)
  function getApiBase() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    if (window.location.protocol.startsWith('http')) {
      // Khi truy cập qua web (port 8080 hoặc bất kỳ port nào), ưu tiên reverse proxy tương đối '/api'
      return '';
    }
    return 'http://localhost:5000';
  }

  // Tải danh sách sản phẩm thời gian thực từ Backend API
  async function loadProductsFromBackend(silent = false) {
    if (isFetching) return;
    isFetching = true;

    try {
      const apiBase = getApiBase();
      let res;
      try {
        res = await fetch(`${apiBase}/api/products`, { cache: 'no-store' });
      } catch (proxyErr) {
        // Fallback gọi trực tiếp port 5000 nếu proxy chưa sẵn sàng
        res = await fetch('http://localhost:5000/api/products', { cache: 'no-store' });
      }

      if (res && res.ok) {
        const liveProducts = await res.json();
        if (Array.isArray(liveProducts) && liveProducts.length > 0) {
          const oldLen = (window.CATALOG_DATA || []).length;
          window.CATALOG_DATA = liveProducts;

          // Re-render nếu số lượng thay đổi hoặc lần đầu tải
          if (oldLen !== liveProducts.length || !silent) {
            renderCategoryFilters();
            renderCatalogGrid();
            updateAllCounters();
          }
        }
      }
    } catch (err) {
      if (!silent) {
        console.warn('[Sync] Không thể kết nối Backend API, sử dụng dữ liệu tĩnh:', err.message);
      }
    } finally {
      isFetching = false;
    }
  }

  // Cập nhật tất cả các bộ đếm số lượng trên giao diện
  function updateAllCounters() {
    const total = (window.CATALOG_DATA || []).length;
    
    // Header navigation count
    const navCountEl = document.getElementById('nav-product-count');
    if (navCountEl) navCountEl.textContent = total;

    // Collection title count
    const headerCountEl = document.getElementById('catalog-header-count');
    if (headerCountEl) headerCountEl.textContent = total;
  }

  // Khởi chạy ứng dụng
  
  // Tải danh sách Voucher thời gian thực từ Backend
  async function loadVouchersFromBackend() {
    try {
      const apiBase = getApiBase();
      let res;
      try {
        res = await fetch(`${apiBase}/api/vouchers`, { cache: 'no-store' });
      } catch (proxyErr) {
        res = await fetch('http://localhost:5000/api/vouchers', { cache: 'no-store' });
      }

      if (res && res.ok) {
        liveVouchers = await res.json();
        window.ALL_VOUCHERS = liveVouchers;
        renderVouchersBar();
        renderCatalogGrid();
      }
    } catch (e) {
      console.warn('[Vouchers] Không thể kết nối Backend vouchers:', e.message);
    }
  }

  // Tìm mã Voucher tối ưu nhất cho từng đôi giày
  function getBestVoucherForProduct(shoe) {
    if (!shoe) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const activeVouchers = (liveVouchers || []).filter(v => {
      if (v.active === false) return false;
      if (v.startDate && todayStr < v.startDate) return false;
      if (v.endDate && todayStr > v.endDate) return false;
      return true;
    });

    if (!activeVouchers.length) return null;

    const shoeCode = (shoe.code || ('NK-' + (shoe.id||'').replace('nike-', ''))).toUpperCase();
    const shoeId = (shoe.id || '').toUpperCase();

    // 1. Ưu tiên mã áp dụng riêng cho sản phẩm này
    const specific = activeVouchers.find(v => 
      v.applyScope === 'specific' && 
      Array.isArray(v.applicableProductCodes) && 
      v.applicableProductCodes.some(c => {
        const cU = c.trim().toUpperCase();
        return cU === shoeCode || cU === shoeId;
      })
    );
    if (specific) return specific;

    // 2. Tiếp theo là mã giảm giá chung cho tất cả sản phẩm (trừ FREESHIP)
    const globalDiscounts = activeVouchers.filter(v => v.applyScope === 'all' && v.code !== 'FREESHIP');
    if (globalDiscounts.length > 0) return globalDiscounts[0];

    const freeShip = activeVouchers.find(v => v.code === 'FREESHIP');
    return freeShip || null;
  }
  window.getBestVoucherForProduct = getBestVoucherForProduct;

  // Render Dải Banner Voucher trên đầu Bộ Sưu Tập
  function renderVouchersBar() {
    const bar = document.getElementById('catalog-vouchers-bar');
    const list = document.getElementById('catalog-vouchers-list');
    if (!bar || !list) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const active = (liveVouchers || []).filter(v => {
      if (v.active === false) return false;
      if (v.startDate && todayStr < v.startDate) return false;
      if (v.endDate && todayStr > v.endDate) return false;
      return true;
    });

    if (!active.length) {
      bar.classList.add('hidden');
      return;
    }

    bar.classList.remove('hidden');
    list.innerHTML = active.map(v => {
      const isSpecific = v.applyScope === 'specific';
      const discountTag = v.type === 'percent' ? `Giảm ${v.value}%` : `Giảm ${(v.value).toLocaleString('vi-VN')} ₫`;
      return `
        <div onclick="window.quickSaveVoucher('${v.code}')" class="shrink-0 bg-white hover:bg-purple-50/80 border border-purple-200 hover:border-purple-400 p-2.5 rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-2.5 group">
          <div class="w-8 h-8 rounded-lg ${isSpecific ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center font-bold text-sm shrink-0">
            ${isSpecific ? '🎯' : '🌍'}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-mono font-extrabold text-xs text-obsidian uppercase group-hover:text-purple-700">#${v.code}</span>
              <span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">${discountTag}</span>
            </div>
            <p class="text-[10px] text-muted truncate max-w-[200px] mt-0.5">
              ${isSpecific ? `Riêng mã: ${(v.applicableProductCodes||[]).join(', ')}` : (v.description || 'Toàn bộ sản phẩm')}
            </p>
          </div>
          <button type="button" class="text-[10px] font-bold text-purple-700 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white px-2 py-1 rounded-md transition-colors shrink-0">
            Lưu
          </button>
        </div>
      `;
    }).join('');
  }

  // Lưu mã nhanh cho khách
  window.quickSaveVoucher = function (code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    if (window.showToast) {
      window.showToast(`🎉 Đã lưu mã #${code}! Mã sẽ tự động áp dụng khi thanh toán.`);
    }
    const input = document.getElementById('drawer-voucher-input');
    if (input) {
      input.value = code;
      if (window.applyVoucherCode) window.applyVoucherCode(code, 'drawer');
    }
  };

  async function initApp() {
    // 1. Tải dữ liệu mới nhất từ Backend trước
    await loadProductsFromBackend(true);
    await loadVouchersFromBackend();

    // 2. Render giao diện
    renderCategoryFilters();
    renderCatalogGrid();
    updateAllCounters();

    // 3. Khởi tạo 3D Runway Turntable
    if (window.initTurntable) {
      window.initTurntable();
    }

    // 4. Khởi tạo Giỏ hàng
    if (window.renderCart) {
      window.renderCart();
    }

    // 5. Tự động đồng bộ thời gian thực mỗi 4 giây và khi người dùng quay lại tab
    setInterval(() => { loadProductsFromBackend(true); loadVouchersFromBackend(); }, 4000);
    window.addEventListener('focus', () => loadProductsFromBackend(false));
  }

  // Lấy danh sách danh mục động từ toàn bộ sản phẩm hiện có
  function getDynamicCategories() {
    const data = window.CATALOG_DATA || [];
    const baseCats = ['Tất cả', 'Jordan', 'Lifestyle', 'Running', 'Basketball', 'Air Max', 'Skateboarding'];
    const extraCats = [];

    data.forEach(p => {
      if (p.category && !baseCats.includes(p.category) && !extraCats.includes(p.category)) {
        extraCats.push(p.category);
      }
    });

    return [...baseCats, ...extraCats];
  }

  function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    const data = window.CATALOG_DATA || [];
    const categories = getDynamicCategories();
    const saleItems = data.filter(p => {
      const v = getBestVoucherForProduct(p);
      return v && v.code !== 'FREESHIP';
    });

    const saleBtnHtml = saleItems.length > 0 ? `
      <button type="button" 
        onclick="window.setCategory('🔥 Đang Giảm Giá')" 
        class="cat-filter-btn px-4 py-2 rounded-full text-xs font-black tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
          activeCategory === '🔥 Đang Giảm Giá' 
            ? 'bg-rose-600 text-white shadow-md' 
            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
        }">
        <span>🔥 Đang Giảm Giá</span>
        <span class="px-1.5 py-0.2 rounded-full ${activeCategory === '🔥 Đang Giảm Giá' ? 'bg-white text-rose-600' : 'bg-rose-200 text-rose-900'} text-[10px] font-black">${saleItems.length}</span>
      </button>
    ` : '';

    container.innerHTML = saleBtnHtml + categories.map(cat => {
      const count = cat === 'Tất cả' 
        ? data.length 
        : data.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase()).length;

      // Ẩn các danh mục không có sản phẩm nào (trừ các danh mục chính)
      if (count === 0 && !['Tất cả', 'Jordan', 'Lifestyle', 'Running'].includes(cat)) {
        return '';
      }

      const isActive = cat.toLowerCase() === activeCategory.toLowerCase();
      return `
        <button type="button" 
          onclick="window.setCategory('${cat}')" 
          class="cat-filter-btn px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
            isActive 
              ? 'bg-obsidian text-white shadow-sm' 
              : 'bg-white text-muted hover:text-obsidian border border-hairline hover:border-obsidian'
          }">
          ${cat} (${count})
        </button>
      `;
    }).filter(Boolean).join('');
  }

  function setCategory(category) {
    activeCategory = category;
    renderCategoryFilters();
    renderCatalogGrid();
  }

  function handleSearch(query) {
    searchQuery = query.trim().toLowerCase();
    renderCatalogGrid();
  }

  function renderCatalogGrid() {
    const grid = document.getElementById('catalog-grid');
    const resultCountEl = document.getElementById('catalog-result-count');
    if (!grid) return;

    let items = window.CATALOG_DATA || [];

    // Filter by Category
    if (activeCategory === '🔥 Đang Giảm Giá') {
      items = items.filter(p => {
        const v = getBestVoucherForProduct(p);
        return v && v.code !== 'FREESHIP';
      });
    } else if (activeCategory !== 'Tất cả') {
      items = items.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase());
    }

    // Filter by Search Query
    if (searchQuery) {
      items = items.filter(p => 
        (p.name || '').toLowerCase().includes(searchQuery) ||
        (p.category || '').toLowerCase().includes(searchQuery) ||
        (p.description || '').toLowerCase().includes(searchQuery) ||
        (p.series || '').toLowerCase().includes(searchQuery)
      );
    }

    if (resultCountEl) {
      resultCountEl.textContent = `Hiển thị ${items.length} / ${(window.CATALOG_DATA || []).length} mẫu giày`;
    }

    if (!items.length) {
      grid.innerHTML = `
        <div class="col-span-full py-20 text-center text-muted">
          <p class="text-base font-semibold text-obsidian">Không tìm thấy mẫu giày phù hợp</p>
          <p class="text-xs mt-1">Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(shoe => {
      const defaultPhoto = shoe.colors && shoe.colors[0] && shoe.colors[0].photo 
        ? shoe.colors[0].photo 
        : (shoe.image || 'assets/shoes/default-shoe.png');

      const v = getBestVoucherForProduct(shoe);
      const hasSale = v && v.code !== 'FREESHIP';
      let discount = 0;
      let tagText = '';
      let discountedPrice = shoe.price;

      if (hasSale) {
        if (v.type === 'percent') {
          discount = Math.round((shoe.price * v.value) / 100);
          if (v.maxDiscount && discount > v.maxDiscount) discount = v.maxDiscount;
          tagText = `-${v.value}%`;
        } else {
          discount = v.value;
          tagText = `-${Math.round(v.value / 1000)}k`;
        }
        if (discount > shoe.price) discount = shoe.price;
        discountedPrice = Math.max(0, shoe.price - discount);
      }

      const voucherBadgeHtml = hasSale ? `
        <div class="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border border-rose-200 text-rose-950 flex items-center justify-between gap-1 shadow-2xs">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
            <span class="text-[11px] font-bold text-rose-950 truncate">Mã <strong class="font-mono text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-300 font-black">${v.code}</strong></span>
            <span class="text-[10px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded shrink-0">${tagText}</span>
          </div>
          <button type="button" onclick="event.stopPropagation(); window.quickSaveVoucher('${v.code}')" class="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer shadow-xs">
            Lưu Mã
          </button>
        </div>
      ` : '';

      const priceHtml = hasSale ? `
        <div>
          <div class="flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase">
            <span>Giá có voucher</span>
            <span class="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-black">Tiết kiệm ${(discount).toLocaleString('vi-VN')} ₫</span>
          </div>
          <div class="flex items-baseline gap-2 mt-0.5">
            <span class="font-display font-black text-base sm:text-lg text-rose-600">${discountedPrice.toLocaleString('vi-VN')} ₫</span>
            <del class="text-xs text-muted font-medium">${shoe.price.toLocaleString('vi-VN')} ₫</del>
          </div>
        </div>
      ` : `
        <div>
          <p class="text-[10px] text-muted uppercase font-medium">Giá niêm yết</p>
          <p class="font-display font-bold text-sm sm:text-base text-obsidian">${shoe.price.toLocaleString('vi-VN')} ₫</p>
        </div>
      `;

      // Color swatches HTML
      const colorsHtml = shoe.colors && shoe.colors.length > 1 ? `
        <div class="flex items-center gap-1.5 mt-3">
          ${shoe.colors.map((c, cIdx) => `
            <button type="button" 
              onclick="window.changeCardColor('${shoe.id}', '${c.photo}', this)" 
              class="card-swatch-btn ${cIdx === 0 ? 'active' : ''}" 
              style="background-color: ${c.hex || '#111111'};" 
              title="${c.name || 'Màu sắc'}"
              aria-label="${c.name || 'Màu sắc'}">
            </button>
          `).join('')}
        </div>
      ` : `<div class="h-6 mt-3"></div>`;

      return `
        <div class="group relative bg-white ${hasSale ? 'border-rose-200 ring-1 ring-rose-100 hover:border-rose-500' : 'border-hairline hover:border-obsidian/40'} rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between" id="card-${shoe.id}">
          <!-- Top Badge & Category -->
          <div>
            <div class="flex items-center justify-between text-[11px] mb-3">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md bg-obsidian text-white font-mono font-bold text-[10px] tracking-wider shadow-xs" title="Mã số riêng của sản phẩm">${shoe.code || ('NK-' + (shoe.id||'').replace('nike-', ''))}</span>
                <span class="font-semibold text-muted tracking-wider uppercase">${shoe.category || 'Sneaker'}</span>
              </div>
              ${hasSale ? `
                <span class="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] tracking-wider uppercase shadow-xs flex items-center gap-1 animate-pulse">
                  🔥 GIẢM ${tagText.replace('-', '')}
                </span>
              ` : `
                <span class="px-2.5 py-0.5 rounded-full bg-canvas text-obsidian font-bold text-[10px]">${shoe.badge || 'Chính hãng'}</span>
              `}
            </div>

            <!-- Shoe Image Container -->
            <div class="relative w-full h-48 sm:h-52 flex items-center justify-center p-3 overflow-hidden cursor-pointer" onclick="window.openQuickView('${shoe.id}')">
              ${hasSale ? `
                <div class="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] uppercase shadow-md flex items-center gap-1">
                  <span>${tagText}</span>
                </div>
              ` : ''}
              <img src="${defaultPhoto}" 
                alt="${shoe.name}" 
                id="card-img-${shoe.id}" 
                class="w-full h-full object-contain filter drop-shadow-md group-hover:scale-108 group-hover:-rotate-3 transition-transform duration-500 will-change-transform" 
                loading="lazy"
                onerror="if(!this.dataset.fallback){this.dataset.fallback=1; this.src='http://localhost:5000/'+this.getAttribute('src');}" />
            </div>

            <!-- Color Swatches -->
            ${colorsHtml}

            <!-- Active Voucher Highlight Tag on Card -->
            ${voucherBadgeHtml}

            <!-- Shoe Title & Price -->
            <h3 class="font-display font-bold text-sm text-obsidian mt-2 group-hover:text-black transition-colors line-clamp-1 cursor-pointer" onclick="window.openQuickView('${shoe.id}')">
              ${shoe.name}
            </h3>
            <p class="text-xs text-muted mt-1 line-clamp-2">${shoe.description || 'Mẫu giày Nike cao cấp chính hãng.'}</p>
          </div>

          <!-- Bottom Price & Buttons -->
          <div class="mt-4 pt-3 border-t border-hairline flex items-center justify-between gap-2">
            <div>
              <p class="text-[10px] text-muted uppercase font-medium">Giá niêm yết</p>
              <p class="font-display font-bold text-sm sm:text-base text-obsidian">${(shoe.price || 0).toLocaleString('vi-VN')} ₫</p>
            </div>

            <div class="flex items-center gap-1.5">
              <button type="button" 
                onclick="window.openQuickView('${shoe.id}')" 
                class="px-3 py-1.5 rounded-full border border-hairline hover:border-obsidian text-xs font-semibold transition-colors" 
                title="Xem chi tiết">
                Chi tiết
              </button>
              <button type="button" 
                onclick="window.addToCart('${shoe.id}')" 
                class="w-8 h-8 rounded-full bg-obsidian hover:bg-black text-white flex items-center justify-center transition-transform hover:scale-110" 
                title="Thêm vào giỏ">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function changeCardColor(productId, photoUrl, buttonEl) {
    const imgEl = document.getElementById(`card-img-${productId}`);
    if (imgEl) {
      imgEl.style.opacity = '0.3';
      imgEl.style.transform = 'scale(0.95)';
      setTimeout(() => {
        imgEl.src = photoUrl;
        imgEl.style.opacity = '1';
        imgEl.style.transform = 'scale(1)';
      }, 120);
    }

    // Update active swatch state in this card
    const cardEl = document.getElementById(`card-${productId}`);
    if (cardEl) {
      const swatches = cardEl.querySelectorAll('.card-swatch-btn');
      swatches.forEach(s => s.classList.remove('active'));
      if (buttonEl) buttonEl.classList.add('active');
    }
  }

  function openActiveHeroQuickView() {
    if (window.getActiveHeroShoe && window.openQuickView) {
      const shoe = window.getActiveHeroShoe();
      if (shoe) window.openQuickView(shoe.id);
    }
  }

  function addActiveHeroToCart() {
    if (window.getActiveHeroShoe && window.addToCart) {
      const shoe = window.getActiveHeroShoe();
      if (shoe) {
        const color = shoe.colors && shoe.colors[0] ? shoe.colors[0] : { name: 'Mặc định', photo: shoe.image };
        window.addToCart(shoe.id, color.name, 41, shoe.price, color.photo, shoe.name);
      }
    }
  }

  // Export to global window so products.js, admin, or external triggers can call
  window.renderCategoryFilters = renderCategoryFilters;
  window.renderCatalogGrid = renderCatalogGrid;
  window.syncProducts = loadProductsFromBackend;
  window.setCategory = setCategory;
  window.handleSearch = handleSearch;
  window.changeCardColor = changeCardColor;
  window.openActiveHeroQuickView = openActiveHeroQuickView;
  window.addActiveHeroToCart = addActiveHeroToCart;

  // Run on page load
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
