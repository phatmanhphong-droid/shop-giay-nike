// ==========================================================================
// SHOP GIÀY NIKE — MAIN APPLICATION CONTROLLER
// Kết nối bộ lọc danh mục, tìm kiếm, hiển thị lưới 23 sản phẩm, khởi chạy
// ==========================================================================

(function () {
  let activeCategory = 'Tất cả';
  let searchQuery = '';

  const CATEGORIES = [
    'Tất cả',
    'Jordan',
    'Lifestyle',
    'Running',
    'Basketball',
    'Skateboarding',
    'Air Max'
  ];

  function initApp() {
    renderCategoryFilters();
    renderCatalogGrid();

    // Initialize Hero Turntable
    if (window.initTurntable) {
      window.initTurntable();
    }

    // Initialize Cart
    if (window.renderCart) {
      window.renderCart();
    }
  }

  function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    const data = window.CATALOG_DATA || [];

    container.innerHTML = CATEGORIES.map(cat => {
      const count = cat === 'Tất cả' 
        ? data.length 
        : data.filter(p => p.category === cat).length;

      const isActive = cat === activeCategory;
      return `
        <button type="button" 
          onclick="window.setCategory('${cat}')" 
          class="cat-filter-btn px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
            isActive 
              ? 'bg-obsidian text-white shadow-sm' 
              : 'bg-white text-muted hover:text-obsidian border border-hairline hover:border-obsidian'
          }">
          ${cat} (${count})
        </button>
      `;
    }).join('');
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
    if (activeCategory !== 'Tất cả') {
      items = items.filter(p => p.category === activeCategory);
    }

    // Filter by Search Query
    if (searchQuery) {
      items = items.filter(p => 
        p.name.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery) ||
        p.series.toLowerCase().includes(searchQuery)
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
      const defaultPhoto = shoe.colors && shoe.colors[0] ? shoe.colors[0].photo : shoe.image;

      // Color swatches HTML
      const colorsHtml = shoe.colors && shoe.colors.length > 1 ? `
        <div class="flex items-center gap-1.5 mt-3">
          ${shoe.colors.map((c, cIdx) => `
            <button type="button" 
              onclick="window.changeCardColor('${shoe.id}', '${c.photo}', this)" 
              class="card-swatch-btn ${cIdx === 0 ? 'active' : ''}" 
              style="background-color: ${c.hex};" 
              title="${c.name}"
              aria-label="${c.name}">
            </button>
          `).join('')}
        </div>
      ` : `<div class="h-6 mt-3"></div>`;

      return `
        <div class="group relative bg-white border border-hairline rounded-2xl p-5 hover:border-obsidian/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between" id="card-${shoe.id}">
          <!-- Top Badge & Category -->
          <div>
            <div class="flex items-center justify-between text-[11px] mb-3">
              <span class="font-semibold text-muted tracking-wider uppercase">${shoe.category}</span>
              <span class="px-2.5 py-0.5 rounded-full bg-canvas text-obsidian font-bold text-[10px]">${shoe.badge}</span>
            </div>

            <!-- Shoe Image Container -->
            <div class="relative w-full h-48 sm:h-52 flex items-center justify-center p-3 overflow-hidden cursor-pointer" onclick="window.openQuickView('${shoe.id}')">
              <img src="${defaultPhoto}" 
                alt="${shoe.name}" 
                id="card-img-${shoe.id}" 
                class="w-full h-full object-contain filter drop-shadow-md group-hover:scale-108 group-hover:-rotate-3 transition-transform duration-500 will-change-transform" 
                loading="lazy" />
            </div>

            <!-- Color Swatches -->
            ${colorsHtml}

            <!-- Shoe Title & Price -->
            <h3 class="font-display font-bold text-sm text-obsidian mt-2 group-hover:text-black transition-colors line-clamp-1 cursor-pointer" onclick="window.openQuickView('${shoe.id}')">
              ${shoe.name}
            </h3>
            <p class="text-xs text-muted mt-1 line-clamp-2">${shoe.description}</p>
          </div>

          <!-- Bottom Price & Buttons -->
          <div class="mt-4 pt-3 border-t border-hairline flex items-center justify-between gap-2">
            <div>
              <p class="text-[10px] text-muted uppercase font-medium">Giá niêm yết</p>
              <p class="font-display font-bold text-sm sm:text-base text-obsidian">${shoe.price.toLocaleString('vi-VN')} ₫</p>
            </div>

            <div class="flex items-center gap-1.5">
              <button type="button" 
                onclick="window.openQuickView('${shoe.id}')" 
                class="px-3 py-1.5 rounded-full border border-hairline hover:border-obsidian text-xs font-semibold transition-colors" 
                title="Xem chi tiết">
                Chi tiết
              </button>
              <button type="button" 
                onclick="window.addToCart('${shoe.id}', '${shoe.colors && shoe.colors[0] ? shoe.colors[0].name : 'Mặc định'}', 41, ${shoe.price}, '${defaultPhoto}', '${shoe.name}')" 
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

  // Export to global window
  window.setCategory = setCategory;
  window.handleSearch = handleSearch;
  window.changeCardColor = changeCardColor;
  window.openActiveHeroQuickView = openActiveHeroQuickView;
  window.addActiveHeroToCart = addActiveHeroToCart;

  // Run on page load
  window.addEventListener('DOMContentLoaded', initApp);
})();
