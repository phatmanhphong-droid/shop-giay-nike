// ==========================================================================
// NIKE ATELIER — AI SNEAKER STYLIST & SHOPPING ASSISTANT CONTROLLER
// ==========================================================================

(function() {
  let isChatOpen = false;
  let chatHistory = [];
  let isThinking = false;
  let hasInteracted = false;

  // Web Audio API: Âm thanh thông báo nhẹ nhàng cao cấp không cần file mp3 ngoài
  function playSubtleChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  function toggleAIChat(forceState) {
    const box = document.getElementById('ai-chat-window');
    const badge = document.getElementById('ai-chat-unread-badge');
    if (!box) return;

    if (forceState !== undefined) {
      isChatOpen = forceState;
    } else {
      isChatOpen = !isChatOpen;
    }

    const iconOpen = document.getElementById('ai-icon-open');
    const iconClose = document.getElementById('ai-icon-close');
    const toggleBtn = document.getElementById('ai-chat-toggle-btn');

    if (isChatOpen) {
      box.classList.remove('hidden', 'scale-90', 'opacity-0', 'pointer-events-none');
      box.classList.add('scale-100', 'opacity-100');
      if (badge) badge.classList.add('hidden');
      if (iconOpen) iconOpen.classList.add('hidden');
      if (iconClose) { iconClose.classList.remove('hidden'); iconClose.classList.add('flex'); }
      if (toggleBtn) toggleBtn.classList.add('rotate-90');
      hasInteracted = true;
      setTimeout(() => {
        const input = document.getElementById('ai-chat-input');
        if (input) input.focus();
      }, 150);
    } else {
      box.classList.remove('scale-100', 'opacity-100');
      box.classList.add('scale-90', 'opacity-0', 'pointer-events-none');
      if (iconClose) { iconClose.classList.add('hidden'); iconClose.classList.remove('flex'); }
      if (iconOpen) iconOpen.classList.remove('hidden');
      if (toggleBtn) toggleBtn.classList.remove('rotate-90');
      setTimeout(() => box.classList.add('hidden'), 200);
    }
  }

  function formatAIMessage(text) {
    if (!text) return '';
    // Format bold **text** or <b>text</b>
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/•/g, '<span class="text-rose-600 font-bold mr-1">•</span>')
      .replace(/\n/g, '<br/>');
    return formatted;
  }

  function appendUserMessage(text) {
    const msgList = document.getElementById('ai-chat-messages');
    if (!msgList) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'flex items-end justify-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200';
    userDiv.innerHTML = `
      <div class="max-w-[82%] bg-obsidian text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-br-sm shadow-sm leading-relaxed">
        ${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
    `;
    msgList.appendChild(userDiv);
    msgList.scrollTop = msgList.scrollHeight;
  }

  function showTypingIndicator() {
    const msgList = document.getElementById('ai-chat-messages');
    if (!msgList) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'ai-typing-indicator';
    typingDiv.className = 'flex items-start gap-2.5 animate-in fade-in duration-200';
    typingDiv.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-obsidian via-zinc-900 to-zinc-800 text-white flex items-center justify-center shrink-0 shadow-xs border border-white/20 mt-0.5">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.8 8.2C14.2 9.6 15.4 10.8 16.8 11.2L23 13L16.8 14.8C15.4 15.2 14.2 16.4 13.8 17.8L12 24L10.2 17.8C9.8 16.4 8.6 15.2 7.2 14.8L1 13L7.2 11.2C8.6 10.8 9.8 9.6 10.2 8.2L12 2Z" fill="#FFFFFF" />
          <path d="M19 2L19.8 4.2C20 4.8 20.5 5.3 21.1 5.5L23.3 6.3L21.1 7.1C20.5 7.3 20 7.8 19.8 8.4L19 10.6L18.2 8.4C18 7.8 17.5 7.3 16.9 7.1L14.7 6.3L16.9 5.5C17.5 5.3 18 4.8 18.2 4.2L19 2Z" fill="#38BDF8" />
        </svg>
      </div>
      <div class="bg-canvas border border-hairline px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs text-muted flex items-center gap-1.5 shadow-2xs">
        <span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]"></span>
      </div>
    `;
    msgList.appendChild(typingDiv);
    msgList.scrollTop = msgList.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator) indicator.remove();
  }

  function appendAIMessage(reply, suggestedProducts = [], suggestedVouchers = [], quickReplies = []) {
    removeTypingIndicator();
    const msgList = document.getElementById('ai-chat-messages');
    if (!msgList) return;

    const botDiv = document.createElement('div');
    botDiv.className = 'flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300';

    let productsHtml = '';
    if (suggestedProducts && suggestedProducts.length > 0) {
      productsHtml = `
        <div class="mt-2.5 space-y-2 w-full">
          <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Gợi ý sản phẩm phù hợp:</p>
          <div class="space-y-1.5">
            ${suggestedProducts.map(p => `
              <div class="p-2.5 rounded-xl bg-white border border-hairline hover:border-obsidian/40 shadow-xs flex items-center justify-between gap-2.5 transition-all">
                <div class="w-11 h-11 rounded-lg bg-canvas p-1 flex items-center justify-center shrink-0 border border-hairline cursor-pointer" onclick="window.openQuickView('${p.id}')">
                  <img src="${p.image}" alt="${p.name}" class="w-full h-full object-contain" onerror="this.src='assets/shoes/airforce1-white.png'">
                </div>
                <div class="min-w-0 flex-1 cursor-pointer" onclick="window.openQuickView('${p.id}')">
                  <div class="flex items-center gap-1">
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-canvas border border-hairline">${p.code || 'NK'}</span>
                    <span class="text-[9px] text-muted uppercase font-semibold truncate">${p.category || 'Nike'}</span>
                  </div>
                  <h5 class="text-xs font-bold text-obsidian line-clamp-1">${p.name}</h5>
                  <p class="text-xs font-black text-rose-600 font-display">${(p.price || 0).toLocaleString('vi-VN')} ₫</p>
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                  <button type="button" onclick="window.openQuickView('${p.id}')" class="px-2.5 py-1 rounded-md bg-canvas hover:bg-hairline text-obsidian font-bold text-[10px] border border-hairline transition-colors">
                    Chi Tiết
                  </button>
                  <button type="button" onclick="window.addToCart('${p.id}')" class="px-2.5 py-1 rounded-md bg-obsidian hover:bg-black text-white font-bold text-[10px] shadow-xs transition-colors flex items-center justify-center gap-0.5">
                    <span>+</span> Giỏ
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let vouchersHtml = '';
    if (suggestedVouchers && suggestedVouchers.length > 0) {
      vouchersHtml = `
        <div class="mt-2.5 space-y-1.5 w-full">
          ${suggestedVouchers.map(v => `
            <div class="p-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <span class="font-mono font-bold text-xs text-purple-900 bg-white px-1.5 py-0.5 rounded border border-purple-200">
                  ${v.code}
                </span>
                <span class="text-[10px] text-purple-700 ml-1">
                  ${v.type === 'percent' ? `Giảm ${v.value}%` : `Giảm ${(v.value).toLocaleString('vi-VN')} ₫`}
                </span>
              </div>
              <button type="button" onclick="window.applyVoucherFromChat('${v.code}');" class="px-2.5 py-1 rounded-md bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] shadow-xs shrink-0">
                Áp Dụng
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    botDiv.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-obsidian via-zinc-900 to-zinc-800 text-white flex items-center justify-center shrink-0 shadow-xs border border-white/20 mt-0.5">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.8 8.2C14.2 9.6 15.4 10.8 16.8 11.2L23 13L16.8 14.8C15.4 15.2 14.2 16.4 13.8 17.8L12 24L10.2 17.8C9.8 16.4 8.6 15.2 7.2 14.8L1 13L7.2 11.2C8.6 10.8 9.8 9.6 10.2 8.2L12 2Z" fill="#FFFFFF" />
          <path d="M19 2L19.8 4.2C20 4.8 20.5 5.3 21.1 5.5L23.3 6.3L21.1 7.1C20.5 7.3 20 7.8 19.8 8.4L19 10.6L18.2 8.4C18 7.8 17.5 7.3 16.9 7.1L14.7 6.3L16.9 5.5C17.5 5.3 18 4.8 18.2 4.2L19 2Z" fill="#38BDF8" />
        </svg>
      </div>
      <div class="max-w-[85%] space-y-1.5">
        <div class="bg-canvas border border-hairline text-obsidian text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-2xs leading-relaxed">
          ${formatAIMessage(reply)}
        </div>
        ${productsHtml}
        ${vouchersHtml}
      </div>
    `;

    msgList.appendChild(botDiv);
    msgList.scrollTop = msgList.scrollHeight;

    // Render quick replies below
    renderQuickReplies(quickReplies);
    playSubtleChime();
  }

  function renderQuickReplies(replies) {
    const qrContainer = document.getElementById('ai-chat-quick-replies');
    if (!qrContainer) return;

    if (!replies || replies.length === 0) {
      qrContainer.innerHTML = '';
      return;
    }

    qrContainer.innerHTML = replies.map(r => `
      <button type="button" onclick="window.sendAIMessage('${r.replace(/'/g, "\\'")}')" class="px-2.5 py-1 rounded-full bg-canvas hover:bg-hairline border border-hairline text-[11px] font-semibold text-obsidian transition-colors whitespace-nowrap shadow-2xs shrink-0">
        ${r}
      </button>
    `).join('');
  }

  async function handleSendChat(customText) {
    const input = document.getElementById('ai-chat-input');
    const text = customText || (input ? input.value.trim() : '');
    if (!text || isThinking) return;

    if (input) input.value = '';

    appendUserMessage(text);
    isThinking = true;
    showTypingIndicator();

    try {
      const apiEndpoint = window.location.protocol.startsWith('http') ? '/api/chat' : 'http://localhost:5000/api/chat';
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory })
      });

      const data = await res.json();
      if (data.success) {
        appendAIMessage(data.reply, data.suggestedProducts, data.suggestedVouchers, data.quickReplies);
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: data.reply });
      } else {
        appendAIMessage('Dạ em đang có chút gián đoạn kết nối, anh/chị thử lại sau giây lát giúp em nhé ạ!');
      }
    } catch (err) {
      appendAIMessage('Dạ em đang gặp chút lỗi mạng, anh/chị có thể nhắn tin trực tiếp qua Zalo Hotline **0908065297** để em hỗ trợ ngay nhé!');
    } finally {
      isThinking = false;
      removeTypingIndicator();
    }
  }

  // Global Exports
  window.toggleAIChat = toggleAIChat;
  window.sendAIMessage = handleSendChat;
  window.applyVoucherFromChat = function(code) {
    if (window.quickSaveVoucher) window.quickSaveVoucher(code);
    else if (window.quickApplyVoucher) window.quickApplyVoucher(code);
    window.toggleAIChat(false);
    if (typeof window.openCartDrawer === 'function') window.openCartDrawer();
  };

  // Initial welcome pop after 3.5 seconds to greet visitor
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const badge = document.getElementById('ai-chat-unread-badge');
      if (badge && !hasInteracted) {
        badge.classList.remove('hidden');
        badge.classList.add('flex');
        playSubtleChime();
      }
    }, 3500);
  });
})();
