// ==========================================================================
// SHOP GIÀY NIKE — 3D TURNTABLE COMPONENT
// Lăn chuột mượt mà 60fps, khoảng cách rộng thoáng, chỉ hiển thị ảnh giày, bấm vào là mở ngay khung thông tin
// ==========================================================================

(function () {
  let heroShoes = [];
  let activeHeroIndex = 0;
  let targetProgress = 0;
  let smoothProgress = 0;
  let wheelTimeout = null;

  // Drag interaction state
  let isDragging = false;
  let startX = 0;
  let startProgress = 0;
  let dragDistance = 0;

  function initTurntable() {
    const data = window.CATALOG_DATA || [];
    const ids = window.HERO_SHOWCASE_IDS || [];
    heroShoes = ids.map(id => data.find(item => item.id === id)).filter(Boolean);

    if (!heroShoes.length) return;

    renderTurntableNodes();
    setupTurntableEvents();
    updateHeroInfo(0, true);

    // Continuous 60fps physics render loop
    function renderLoop() {
      // Butter-smooth Lerp
      const diff = targetProgress - smoothProgress;
      smoothProgress += diff * 0.11;

      // Update positions of all hero shoe nodes
      updateTurntableFrame();

      // Check active index change
      const currentActive = Math.round(smoothProgress);
      const clampedActive = Math.max(0, Math.min(heroShoes.length - 1, currentActive));
      if (clampedActive !== activeHeroIndex && Math.abs(smoothProgress - clampedActive) < 0.28) {
        activeHeroIndex = clampedActive;
        updateHeroInfo(activeHeroIndex, false);
      }

      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
  }

  function renderTurntableNodes() {
    const container = document.getElementById('hero-turntable-container');
    const dotsContainer = document.getElementById('hero-dots-container');
    if (!container) return;

    container.innerHTML = '';
    heroShoes.forEach((shoe, idx) => {
      const node = document.createElement('div');
      node.className = 'hero-shoe-node';
      node.id = `hero-shoe-${idx}`;
      node.setAttribute('data-index', idx);
      node.style.cursor = 'pointer';

      const activeColor = shoe.colors && shoe.colors[0] ? shoe.colors[0].photo : shoe.image;

      node.innerHTML = `
        <div class="hero-shoe-spin-wrap" id="hero-wrap-${idx}">
          <img src="${activeColor}" alt="${shoe.name}" id="hero-img-${idx}" class="hero-shoe-img" draggable="false" />
        </div>
        <div class="hero-floor-shadow"></div>
      `;

      // Direct, robust event listener on the whole shoe node
      node.addEventListener('click', (e) => {
        if (dragDistance > 10) return;
        e.stopPropagation();
        handleHeroShoeClick(idx);
      });

      container.appendChild(node);
    });

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      heroShoes.forEach((shoe, idx) => {
        const dot = document.createElement('button');
        dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
        dot.title = shoe.name;
        dot.setAttribute('aria-label', `Xem ${shoe.name}`);
        dot.onclick = () => goToShoe(idx);
        dotsContainer.appendChild(dot);
      });
    }
  }

  function handleHeroShoeClick(idx) {
    const shoe = heroShoes[idx];
    if (!shoe) return;

    // Center this shoe on the runway
    goToShoe(idx);

    // Direct and instant open of the quick view popup modal
    if (window.openQuickView) {
      window.openQuickView(shoe.id);
    }
  }

  function updateTurntableFrame() {
    const isMobile = window.innerWidth < 768;
    // Spacing: 520px on desktop, 360px on mobile for generous breathing room
    const spacing = isMobile ? 360 : 520;

    heroShoes.forEach((_, idx) => {
      const node = document.getElementById(`hero-shoe-${idx}`);
      if (!node) return;

      const offset = idx - smoothProgress;
      const absOffset = Math.abs(offset);

      // Generous horizontal spacing
      const translateX = offset * spacing;
      // 3D depth step
      const translateZ = -absOffset * 220;
      // Perspective tilt angle
      const rotateY = offset * -15;
      // Scaling
      const scale = Math.max(0.65, 1 - absOffset * 0.22);
      // Opacity
      const opacity = Math.max(0, 1 - absOffset * 0.52);

      node.style.transform = `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
      node.style.opacity = opacity.toFixed(3);
      node.style.zIndex = Math.round(100 - absOffset * 20);

      // All visible shoes can be clicked directly to open their details
      if (opacity > 0.04) {
        node.style.pointerEvents = 'auto';
      } else {
        node.style.pointerEvents = 'none';
      }

      if (absOffset < 0.35) {
        node.classList.add('is-active-shoe');
      } else {
        node.classList.remove('is-active-shoe');
      }
    });
  }

  function setupTurntableEvents() {
    const stage = document.getElementById('hero-stage');
    if (!stage) return;

    // 1. Wheel scroll physics with seamless handoff to page scroll
    stage.addEventListener('wheel', (e) => {
      const delta = e.deltaY;
      const maxIndex = heroShoes.length - 1;

      // When scrolling DOWN and already at the last shoe:
      // Allow smooth scroll down to the collection below!
      if (delta > 0 && targetProgress >= maxIndex - 0.05) {
        return;
      }

      // When scrolling UP and already at the first shoe:
      // Allow natural scroll up!
      if (delta < 0 && targetProgress <= 0.05) {
        return;
      }

      // Otherwise, cycle through the hero shoes with momentum
      e.preventDefault();
      const step = Math.sign(delta) * Math.min(Math.abs(delta) * 0.0024, 0.44);
      targetProgress = Math.max(0, Math.min(maxIndex, targetProgress + step));

      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        targetProgress = Math.round(targetProgress);
      }, 140);
    }, { passive: false });

    // 2. Mouse & Touch drag interaction
    stage.addEventListener('mousedown', (e) => {
      // If clicking nav buttons, don't drag
      if (e.target.closest('button[aria-label]')) {
        return;
      }
      isDragging = true;
      startX = e.clientX;
      dragDistance = 0;
      startProgress = targetProgress;
      stage.classList.add('is-grabbing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const diffX = e.clientX - startX;
      dragDistance = Math.abs(diffX);
      const dragSensitivity = -diffX / 340;
      targetProgress = Math.max(0, Math.min(heroShoes.length - 1, startProgress + dragSensitivity));
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      stage.classList.remove('is-grabbing');
      targetProgress = Math.round(targetProgress);
    });

    // Stage Click Fallback: clicking anywhere on stage around active shoe opens its details
    stage.addEventListener('click', (e) => {
      if (e.target.closest('button[aria-label]')) return;
      if (dragDistance > 8) return;
      // If a shoe node was clicked directly, its own listener already handled it
      if (e.target.closest('.hero-shoe-node')) return;

      const currentShoe = heroShoes[activeHeroIndex];
      if (currentShoe && window.openQuickView) {
        window.openQuickView(currentShoe.id);
      }
    });

    // Touch events for mobile
    stage.addEventListener('touchstart', (e) => {
      if (e.target.closest('.hero-shoe-node') || e.target.closest('button') || e.target.closest('a')) {
        return;
      }
      if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startProgress = targetProgress;
      }
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const diffX = e.touches[0].clientX - startX;
      targetProgress = Math.max(0, Math.min(heroShoes.length - 1, startProgress - diffX / 260));
    }, { passive: true });

    stage.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        targetProgress = Math.round(targetProgress);
      }
    });
  }

  function goToShoe(index) {
    if (index < 0 || index >= heroShoes.length) return;
    targetProgress = index;
    activeHeroIndex = index;
    updateHeroInfo(index, false);
  }

  function prevHeroShoe() {
    targetProgress = Math.max(0, Math.round(targetProgress) - 1);
    activeHeroIndex = targetProgress;
    updateHeroInfo(activeHeroIndex, false);
  }

  function nextHeroShoe() {
    targetProgress = Math.min(heroShoes.length - 1, Math.round(targetProgress) + 1);
    activeHeroIndex = targetProgress;
    updateHeroInfo(activeHeroIndex, false);
  }

  function updateHeroInfo(index, isInit) {
    const shoe = heroShoes[index];
    if (!shoe) return;

    const counterEl = document.getElementById('hero-counter');
    if (counterEl) counterEl.textContent = `0${index + 1} / 0${heroShoes.length}`;

    // Update dots indicator
    const dots = document.querySelectorAll('.hero-dot');
    dots.forEach((dot, dIdx) => {
      if (dIdx === index) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  }

  function handleHeroActiveClick() {
    const shoe = heroShoes[activeHeroIndex];
    if (shoe && window.openQuickView) {
      window.openQuickView(shoe.id);
    }
  }

  function getActiveHeroShoe() {
    return heroShoes[activeHeroIndex];
  }

  // Export to global window
  window.initTurntable = initTurntable;
  window.goToShoe = goToShoe;
  window.prevHeroShoe = prevHeroShoe;
  window.nextHeroShoe = nextHeroShoe;
  window.getActiveHeroShoe = getActiveHeroShoe;
  window.handleHeroShoeClick = handleHeroShoeClick;
  window.handleHeroActiveClick = handleHeroActiveClick;
})();
