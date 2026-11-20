// ==========================================================================
// NIKE ATELIER — INTELLIGENT AI SNEAKER STYLIST & SHOPPING ASSISTANT ENGINE
// ==========================================================================

const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const VOUCHERS_FILE = path.join(__dirname, 'vouchers.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const NOTIFICATIONS_FILE = path.join(__dirname, 'notifications.json');

function readJSON(file, defaultVal = []) {
  if (!fs.existsSync(file)) return defaultVal;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return defaultVal;
  }
}

// Bảng đo size chuẩn Nike EU/US/CM
const SIZE_CHART = [
  { eu: 38.5, us: 6, cm: 24.0 },
  { eu: 39, us: 6.5, cm: 24.5 },
  { eu: 40, us: 7, cm: 25.0 },
  { eu: 40.5, us: 7.5, cm: 25.5 },
  { eu: 41, us: 8, cm: 26.0 },
  { eu: 42, us: 8.5, cm: 26.5 },
  { eu: 42.5, us: 9, cm: 27.0 },
  { eu: 43, us: 9.5, cm: 27.5 },
  { eu: 44, us: 10, cm: 28.0 },
  { eu: 44.5, us: 10.5, cm: 28.5 },
  { eu: 45, us: 11, cm: 29.0 }
];

function findSizeRecommendation(text) {
  // Tìm số đo cm trong tin nhắn (ví dụ: "chân 26cm", "26.5 cm")
  const cmMatch = text.match(/(\d{2}(?:\.\d)?)\s*(?:cm|centimet)/i);
  if (cmMatch) {
    const cm = parseFloat(cmMatch[1]);
    const matched = SIZE_CHART.find(s => Math.abs(s.cm - cm) <= 0.25) || SIZE_CHART.find(s => s.cm >= cm);
    if (matched) {
      return {
        cm: cm,
        recommendedEU: matched.eu,
        recommendedUS: matched.us,
        advice: `Với chiều dài chân ${cm} cm, size chuẩn Nike của anh/chị là **Size EU ${matched.eu} (US ${matched.us})**.\n\n💡 *Lời khuyên từ chuyên gia:* Nếu chân bè ngang hoặc anh/chị chọn dòng ôm như Air Jordan 1 / Dunk Low, mình nên tăng thêm 0.5 size (lên ${matched.eu + 0.5}) để mang êm và thoải mái nhất nhé ạ!`
      };
    }
  }

  // Khách hỏi chung về size
  if (text.includes('size') || text.includes('kích cỡ') || text.includes('chọn size') || text.includes('đo size') || text.includes('bảng size') || text.includes('vừa chân')) {
    return {
      advice: `👟 **Bảng Quy Chuẩn Size Giày Nike Chuẩn:**\n` +
        `• Chân 25.0 cm: Size **40** (US 7)\n` +
        `• Chân 25.5 cm: Size **40.5** (US 7.5)\n` +
        `• Chân 26.0 cm: Size **41** (US 8)\n` +
        `• Chân 26.5 cm: Size **42** (US 8.5)\n` +
        `• Chân 27.0 cm: Size **42.5** (US 9)\n` +
        `• Chân 27.5 cm: Size **43** (US 9.5)\n` +
        `• Chân 28.0 cm: Size **44** (US 10)\n\n` +
        `Anh/chị đang có chiều dài bàn chân bao nhiêu cm hoặc đang đi giày gì để em tư vấn size chuẩn xác nhất ạ?`
    };
  }
  return null;
}

function processAIChat(userMessage, conversationHistory = []) {
  const products = readJSON(PRODUCTS_FILE, []);
  const vouchers = readJSON(VOUCHERS_FILE, []);
  const orders = readJSON(ORDERS_FILE, []);
  const notif = readJSON(NOTIFICATIONS_FILE, { shopPhone: '0908065297' });
  const hotline = notif.shopPhone || '0908065297';

  const raw = (userMessage || '').trim();
  const lower = raw.toLowerCase();

  let replyText = '';
  let suggestedProducts = [];
  let suggestedVouchers = [];
  let quickReplies = [];

  // 1. KIỂM TRA TRA CỨU ĐƠN HÀNG (Nếu khách nhập SĐT hoặc mã đơn #NIKE...)
  const phoneMatch = raw.match(/(?:0|\+84)[3|5|7|8|9][0-9]{8}/);
  const orderIdMatch = raw.match(/NIKE\d{6}/i);

  if (orderIdMatch || phoneMatch || lower.includes('đơn hàng của tôi') || lower.includes('tra cứu đơn')) {
    const query = orderIdMatch ? orderIdMatch[0].toUpperCase() : (phoneMatch ? phoneMatch[0] : '');
    if (query) {
      const cleanQ = query.replace(/^#/, '');
      const matched = orders.filter(o => {
        const id = (o.orderId || '').toUpperCase();
        const ph = (o.customer && o.customer.phone ? o.customer.phone : '').replace(/\s+/g, '');
        return id === cleanQ || ph.includes(cleanQ);
      });

      if (matched.length > 0) {
        const o = matched[0];
        const items = (o.items || []).map(i => `• ${i.name} (Size ${i.size}) x${i.qty}`).join('\n');
        replyText = `📦 **THÔNG TIN ĐƠN HÀNG #${o.orderId}:**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 **Khách hàng:** ${o.customer?.fullname || 'Quý khách'}\n` +
          `📍 **Địa chỉ:** ${o.customer?.address || 'Tại shop'}\n` +
          `🛍️ **Sản phẩm:**\n${items}\n` +
          `💰 **Tổng tiền:** ${(o.totalAmount || 0).toLocaleString('vi-VN')} ₫\n` +
          `🚚 **Trạng thái:** **${o.status || 'Đang xử lý'}**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Dạ đơn hàng của mình đang được bưu điện vận chuyển an toàn. Nếu cần giao hỏa tốc anh/chị có thể liên hệ Hotline **${hotline}** nhé ạ!`;
        return {
          success: true,
          reply: replyText,
          suggestedProducts: [],
          quickReplies: ['Tư vấn mẫu giày mới', 'Có voucher nào không?', 'Bảng đo size chân']
        };
      } else {
        replyText = `Dạ em chưa tìm thấy đơn hàng nào với thông tin "${query}". Anh/chị kiểm tra lại số điện thoại hoặc mã đơn (dạng #NIKE123456) giúp em nhé ạ!`;
        return {
          success: true,
          reply: replyText,
          suggestedProducts: [],
          quickReplies: ['Kiểm tra lại SĐT', 'Chat Zalo với Shop']
        };
      }
    }
  }

  // 2. TƯ VẤN CHỌN SIZE
  const sizeRec = findSizeRecommendation(lower);
  if (sizeRec && (lower.includes('size') || lower.includes('cm') || lower.includes('chân') || lower.includes('vừa'))) {
    replyText = sizeRec.advice;
    quickReplies = ['Tư vấn giày chạy bộ', 'Xem mẫu Air Jordan', 'Các voucher hôm nay'];
    return {
      success: true,
      reply: replyText,
      suggestedProducts: [],
      quickReplies
    };
  }

  // 3. HỎI VỀ MÃ GIẢM GIÁ / VOUCHER / KHUYẾN MÃI
  if (lower.includes('voucher') || lower.includes('mã giảm') || lower.includes('khuyến mãi') || lower.includes('sale') || lower.includes('giảm giá')) {
    const activeVouchers = vouchers.filter(v => v.active !== false);
    if (activeVouchers.length > 0) {
      const vList = activeVouchers.map(v => {
        const valText = v.type === 'percent' ? `Giảm ${v.value}%` : `Giảm ${(v.value).toLocaleString('vi-VN')} ₫`;
        return `🎟️ Mã <b>${v.code}</b>: ${valText} (${v.description || ''})`;
      }).join('\n');

      replyText = `🎉 **SHOP ĐANG CÓ CÁC MÃ GIẢM GIÁ HOT HÔM NAY:**\n\n` +
        vList + `\n\n` +
        `💡 Anh/chị chỉ cần nhập mã tại Giỏ hàng hoặc bấm vào mã để nhận ưu đãi ngay nhé ạ!`;
      suggestedVouchers = activeVouchers;
    } else {
      replyText = `Dạ hiện tại shop đang áp dụng chính sách **Miễn phí vận chuyển toàn quốc** và ưu đãi giá trực tiếp trên từng đôi giày ạ! Anh/chị thích mẫu nào để em gửi giá ưu đãi nhất nhé?`;
    }
    quickReplies = ['Giày Jordan giảm giá', 'Giày chạy bộ êm nhất', 'Bảng đo size chân'];
    return {
      success: true,
      reply: replyText,
      suggestedVouchers,
      quickReplies
    };
  }

  // 4. TƯ VẤN THEO MỤC ĐÍCH & PHÂN KHÚC GIÀY

  // A. Giày chạy bộ (Running)
  if (lower.includes('chạy') || lower.includes('running') || lower.includes('marathon') || lower.includes('thể dục') || lower.includes('tập gym') || lower.includes('đi bộ')) {
    suggestedProducts = products.filter(p => (p.category || '').toLowerCase() === 'running').slice(0, 3);
    replyText = `🏃‍♂️ **GỢI Ý GIÀY CHẠY BỘ NIKE TỐT NHẤT CHO ANH/CHỊ:**\n\n` +
      `1. **Nike Pegasus 40 (NK-06)**: Mẫu giày chạy bộ "quốc dân" siêu bền bỉ, êm ái cho cự ly 5km - 21km hàng ngày.\n` +
      `2. **ZoomX Vaporfly NEXT% 3 (NK-08)**: "Siêu xe đua" marathon có đĩa đệm Carbon trợ lực tốc độ đỉnh cao.\n` +
      `3. **Nike Invincible 3 (NK-09)**: Bộ đệm bọt ZoomX dày dặn, chống sốc và bảo vệ khớp gối tối đa.\n\n` +
      `Anh/chị đang tập luyện cự ly bao nhiêu km để em tư vấn mẫu phù hợp nhất nhé ạ!`;
    quickReplies = ['Xem chi tiết Pegasus 40', 'Xem Vaporfly Carbon', 'Tư vấn đo size chân'];
    return {
      success: true,
      reply: replyText,
      suggestedProducts,
      quickReplies
    };
  }

  // B. Giày bóng rổ & Air Jordan
  if (lower.includes('jordan') || lower.includes('bóng rổ') || lower.includes('basketball') || lower.includes('cổ cao') || lower.includes('lebron') || lower.includes('kd')) {
    suggestedProducts = products.filter(p => (p.category || '').toLowerCase() === 'jordan' || (p.category || '').toLowerCase() === 'basketball').slice(0, 3);
    replyText = `🏀 **BỘ SƯU TẬP AIR JORDAN & BÓNG RỔ HUYỀN THOẠI:**\n\n` +
      `• **Air Jordan 1 Retro High OG (NK-01)**: Biểu tượng thời trang đường phố từ năm 1985 của Michael Jordan, phối màu Chicago cực chất.\n` +
      `• **Air Jordan 4 Retro White Cement (NK-02)**: Thiết kế hầm hố với chi tiết đốm xi măng kinh điển.\n` +
      `• **Air Jordan 3 Retro Reimagined (NK-24)**: Da bò thượng hạng với họa tiết vân voi Elephant Print.\n\n` +
      `Tất cả đều cam kết **100% Authentic chính hãng**. Anh/chị thích cổ cao (High) hay cổ thấp (Low) ạ?`;
    quickReplies = ['Xem Air Jordan 1 Chicago', 'Xem Air Jordan 4', 'Có được kiểm tra hàng không?'];
    return {
      success: true,
      reply: replyText,
      suggestedProducts,
      quickReplies
    };
  }

  // C. Giày đi chơi, đi học, dạo phố (Lifestyle / Casual / Dunk / AF1)
  if (lower.includes('đi học') || lower.includes('đi chơi') || lower.includes('đi làm') || lower.includes('dạo phố') || lower.includes('lifestyle') || lower.includes('panda') || lower.includes('air force') || lower.includes('af1') || lower.includes('dunk')) {
    suggestedProducts = products.filter(p => ['nk-03', 'nk-04', 'nk-05'].includes((p.code || '').toLowerCase())).slice(0, 3);
    if (suggestedProducts.length === 0) {
      suggestedProducts = products.filter(p => (p.category || '').toLowerCase() === 'lifestyle').slice(0, 3);
    }
    replyText = `👟 **TOP 3 MẪU SNEAKER DỄ PHỐI ĐỒ NHẤT MỌI THỜI ĐẠI:**\n\n` +
      `1. **Nike Air Force 1 '07 All White (NK-03)**: Đôi giày trắng "huyền thoại" phối được với mọi loại quần áo, từ quần jeans đến short, âu phục.\n` +
      `2. **Nike Dunk Low Retro Panda (NK-04)**: Phối màu Trắng Đen thời thượng, đang là xu hướng hot nhất giới trẻ.\n` +
      `3. **Nike Air Max 90 Infrared (NK-05)**: Thiết kế retro cá tính với túi đệm khí Air êm ái.\n\n` +
      `Anh/chị thường thích phong cách tối giản màu trắng hay phối màu tương phản cá tính ạ?`;
    quickReplies = ['Xem Air Force 1 All White', 'Xem Dunk Low Panda', 'Tư vấn chọn size'];
    return {
      success: true,
      reply: replyText,
      suggestedProducts,
      quickReplies
    };
  }

  // D. Chính sách bảo hành, đổi trả, ship hàng
  if (lower.includes('đổi trả') || lower.includes('bảo hành') || lower.includes('ship') || lower.includes('giao hàng') || lower.includes('kiểm tra')) {
    replyText = `🛡️ **CHÍNH SÁCH BÁN HÀNG TẠI NIKE ATELIER:**\n\n` +
      `✅ **Đồng kiểm khi nhận hàng**: Quý khách được mở hộp kiểm tra giày, đi thử êm chân đúng mẫu đúng size mới thanh toán.\n` +
      `✅ **Đổi size miễn phí trong 7 ngày**: Nếu mang không vừa hoặc muốn đổi màu, shop hỗ trợ đổi tận nhà nhanh chóng.\n` +
      `✅ **100% Chính Hãng (Authentic)**: Đầy đủ hộp (Box), tem tag và phụ kiện theo giày.\n` +
      `✅ **Miễn phí giao hàng toàn quốc** cho các đơn thanh toán VietQR.\n\n` +
      `Anh/chị cần hỗ trợ thêm thông tin gì cứ nhắn em nhé ạ!`;
    quickReplies = ['Tư vấn mẫu bán chạy nhất', 'Voucher hôm nay', 'Liên hệ Zalo Shop'];
    return {
      success: true,
      reply: replyText,
      suggestedProducts: [],
      quickReplies
    };
  }

  // E. Liên hệ chủ shop / Zalo
  if (lower.includes('zalo') || lower.includes('hotline') || lower.includes('số điện thoại') || lower.includes('liên hệ') || lower.includes('chủ shop') || lower.includes('gọi điện')) {
    replyText = `📲 **KẾT NỐI TRỰC TIẾP VỚI CHỦ SHOP NIKE ATELIER:**\n\n` +
      `• **Chủ shop / CSKH:** Anh Trần Đức Mạnh\n` +
      `• **Hotline / Zalo:** **${hotline}**\n` +
      `• **Địa chỉ cửa hàng:** TP. Hồ Chí Minh & Hà Nội\n\n` +
      `Anh/chị có thể bấm vào đường link này để mở Zalo nhắn tin ngay: **https://zalo.me/${hotline}** ạ!`;
    quickReplies = ['Xem tất cả mẫu giày', 'Các voucher giảm giá', 'Bảng đo size chân'];
    return {
      success: true,
      reply: replyText,
      suggestedProducts: [],
      quickReplies
    };
  }

  // F. Tìm theo tên sản phẩm cụ thể
  const matchedProd = products.find(p => lower.includes((p.name || '').toLowerCase()) || (p.code && lower.includes(p.code.toLowerCase())));
  if (matchedProd) {
    suggestedProducts = [matchedProd];
    replyText = `👟 Dạ mẫu **${matchedProd.name} (${matchedProd.code})** đang có sẵn hàng tại shop ạ!\n\n` +
      `• **Giá niêm yết:** ${(matchedProd.price || 0).toLocaleString('vi-VN')} ₫\n` +
      `• **Tình trạng:** Còn ${matchedProd.stock || 20} đôi trong kho (Đầy đủ size 38.5 đến 45)\n` +
      `• **Đặc điểm:** ${matchedProd.description || 'Chất liệu cao cấp, đệm êm ái.'}\n\n` +
      `Anh/chị muốn xem ảnh các phối màu hay chọn size nào để em tư vấn ạ?`;
    quickReplies = ['Tư vấn đo size chân', 'Xem thêm mẫu tương tự', 'Áp mã giảm giá'];
    return {
      success: true,
      reply: replyText,
      suggestedProducts,
      quickReplies
    };
  }

  // G. Tin nhắn mặc định thông minh (Default Greetings & Guidance)
  suggestedProducts = products.slice(0, 3);
  replyText = `Dạ em chào anh/chị! Em là **Trợ Lý AI Thông Minh** của Shop Giày Nike Atelier 👟\n\n` +
    `Em có thể hỗ trợ anh/chị ngay lập tức:\n` +
    `1. **Tư vấn mẫu giày** theo phong cách (Đi chơi, Đi học, Đi làm, Chạy bộ, Bóng rổ...)\n` +
    `2. **Đo size chân chuẩn xác** (Bảo đảm vừa vặn, không lo chật/rộng)\n` +
    `3. **Lấy mã giảm giá Voucher** hot nhất hôm nay\n` +
    `4. **Tra cứu tiến độ đơn hàng** bằng Số điện thoại\n\n` +
    `Anh/chị đang quan tâm đến dòng giày nào hoặc cần em hỗ trợ gì trước ạ?`;

  quickReplies = ['👟 Giày chạy bộ êm nhất', '🏀 Air Jordan cổ cao', '🎟️ Mã giảm giá hôm nay', '📏 Tư vấn chọn size'];

  return {
    success: true,
    reply: replyText,
    suggestedProducts,
    quickReplies
  };
}

module.exports = {
  processAIChat,
  SIZE_CHART
};
