const axios = require('axios');
require('dotenv').config();

// Danh sách model chính thức hiện hành (theo tài liệu Gemini API).
// Free Tier tính hạn mức theo TỪNG model, nên nhiều model fallback = nhiều hạn mức hơn.
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

// Model đã hết hạn mức ngày (429) được tạm gác lại để không tốn thời gian gọi lại liên tục
const exhaustedUntil = new Map();
const EXHAUSTED_COOLDOWN_MS = 60 * 60 * 1000; // 1 giờ

// Danh mục ngành hàng chuẩn của Hệ sinh thái AutoBiz AI
const PRODUCT_CATEGORIES = {
  tech: { id: 'tech', label: 'Đồ Công Nghệ & Thiết Bị Số', hashtag: '#CongNgheChinhHang' },
  accessories: { id: 'accessories', label: 'Phụ Kiện Số & Đồ Chơi Công Nghệ', hashtag: '#PhuKienSo' },
  home: { id: 'home', label: 'Gia Dụng Thông Minh & Tiện Ích', hashtag: '#GiaDungThongMinh' },
  fashion: { id: 'fashion', label: 'Thời Trang & Phụ Kiện Gen Z', hashtag: '#ThoiTrangGenZ' },
  fmcg: { id: 'fmcg', label: 'Mỹ Phẩm & Tiêu Dùng Nhanh', hashtag: '#ChamSocCaNhan' }
};

/**
 * Reusable Gemini API caller with automatic fallback across reliable models
 */
async function callGeminiWithFallback(contents, apiKey, timeout = 12000) {
  if (require('../utils/runtime').IS_TEST_MODE) {
    // Bộ test không được tiêu tốn hạn mức Gemini thật -> ép dùng fallback nội bộ
    throw new Error('VG_TEST_MODE: bỏ qua Gemini API, dùng bộ viết bài dự phòng.');
  }

  let lastError = null;
  const now = Date.now();
  const available = GEMINI_MODELS.filter((m) => (exhaustedUntil.get(m) || 0) <= now);
  const candidates = available.length > 0 ? available : GEMINI_MODELS;

  for (const model of candidates) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { contents },
        { headers: { 'Content-Type': 'application/json' }, timeout }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { text: text.trim(), model };
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      if (status === 429) {
        exhaustedUntil.set(model, Date.now() + EXHAUSTED_COOLDOWN_MS);
        console.warn(`[Gemini API] ${model} hết hạn mức (429). Tạm gác 1 giờ, chuyển model dự phòng...`);
      } else if (status === 503 || err.code === 'ECONNABORTED') {
        exhaustedUntil.set(model, Date.now() + 5 * 60 * 1000);
        console.warn(`[Gemini API] ${model} quá tải/timeout (${status || err.code}). Tạm gác 5 phút, chuyển model dự phòng...`);
      } else {
        console.warn(`[Gemini API] Thử model ${model} không thành công (Status: ${status}): ${String(msg).slice(0, 200)}. Chuyển sang model dự phòng tiếp theo...`);
      }
    }
  }

  throw new Error(`Tất cả các model Gemini đều không phản hồi: ${lastError?.message || 'Không rõ nguyên nhân'}`);
}

/**
 * Clean and filter sensitive wholesale terms from text
 */
function sanitizeRawText(text) {
  if (!text) return '';
  return text
    .replace(/(?:lương|luong|hoa hồng|hoa hong|chiết khấu|chiet khau)\s*[:=]?\s*\d+[kKmMtrTrVNĐvnđ]*/gi, '')
    .replace(/giá\s+(?:nhập|sỉ|ctv|buôn)\s*[:=]?\s*[\d.,]*[kKmMtrTrVNĐvnđ]*/gi, '')
    .replace(/(?:giá\s+sỉ|sỉ|giá)\s*(?:ae|anh em)?\s*(?:ib|inbox)(?:\s*riêng)?/gi, '')
    .replace(/win\s+(?:ae|anh em)?\s*tự\s+cài[^\n.]*/gi, '')
    .replace(/\b(?:ib|inbox)\s+(?:lấy\s+)?giá\b/gi, '')
    .replace(/chỉ\s+(?:trưởng\/phó|admin)\s+cộng\s+đồng[^\n]*/gi, '')
    .replace(/hướng\s+dẫn\s+dán\s+phím\s+cho\s+ctv[^\n]*/gi, '')
    .replace(/thông\s+tin\s+chính\s+sách\s+nhóm[^\n]*/gi, '')
    .replace(/khách\s+sỉ\s*\([^)]*\)[^\n]*/gi, '')
    .replace(/trợ\s+giá\s+sỉ[^\n]*/gi, '')
    .replace(/đối\s+với\s+cộng\s+tác\s+viên[^\n]*/gi, '')
    .replace(/^(?:chốt|chot)(?:\s+máy|\s+đơn)?$/gim, '')
    .replace(/(?:sđt|sdt|hotline|zalo|lh|liên hệ)?\s*[:=]?\s*(?:0\d{1,3}[.\s-]?\d{3}[.\s-]?\d{3,4})/gi, '')
    .trim();
}

/**
 * Extract exact product/machine code from raw text
 */
function extractExplicitMachineCode(text) {
  if (!text) return 'VIP';
  const maMatch = text.match(/(?:mã|ma|ms|code|sku|#)\s*[:=.-]?\s*([A-Za-z0-9]+(?:\s*[A-Za-z](?=\s|$|[:.,-]))?)/i);
  if (maMatch) {
    return maMatch[1].replace(/\s+/g, '').toUpperCase();
  }
  const loMatch = text.match(/(?:lô|lo)\s*[:=.-]?\s*([A-Za-z0-9]+)/i);
  if (loMatch) {
    return loMatch[1].toUpperCase();
  }
  const startMatch = text.match(/^(?:#)?([A-Za-z0-9]{2,8})\b[:.-]/);
  if (startMatch) {
    return startMatch[1].toUpperCase();
  }
  return 'VIP';
}

/**
 * Detect product category automatically from raw text
 */
function detectProductCategory(rawText = '', requestedCategory = 'auto') {
  if (requestedCategory && requestedCategory !== 'auto' && PRODUCT_CATEGORIES[requestedCategory]) {
    return requestedCategory;
  }
  const t = String(rawText).toLowerCase();
  if (/(tai nghe|airpods|cáp sạc|củ sạc|sạc dự phòng|pin dự phòng|chuột|bàn phím|ốp lưng|loa bluetooth|hub|usb|webcam|giá đỡ)/i.test(t)) {
    return 'accessories';
  }
  if (/(nồi chiên|máy hút bụi|đèn học|quạt mini|bình giữ nhiệt|kệ sách|máy lọc|gia dụng|bàn học|ổ cắm)/i.test(t)) {
    return 'home';
  }
  if (/(áo|quần|váy|giày|sneaker|balo|túi xách|mũ|nón|kính mát|hoodie|jacket|thời trang)/i.test(t)) {
    return 'fashion';
  }
  if (/(son|kem chống nắng|sữa rửa mặt|nước hoa|serum|dầu gội|mỹ phẩm|skincare|snack|trà sữa|cà phê)/i.test(t)) {
    return 'fmcg';
  }
  return 'tech';
}

/**
 * Build Smart Affiliate & UTM Tracking URL
 */
function buildAffiliateUrl(baseUrl, channel = 'facebook', campaign = 'autobiz_2026', subId = 'vuonggia') {
  const cleanBase = String(baseUrl || '').trim();
  if (!cleanBase) return '';
  try {
    const urlObj = new URL(cleanBase.startsWith('http') ? cleanBase : `https://${cleanBase}`);
    urlObj.searchParams.set('utm_source', channel);
    urlObj.searchParams.set('utm_medium', 'autobiz_ai');
    urlObj.searchParams.set('utm_campaign', campaign || 'autobiz_2026');
    if (subId) urlObj.searchParams.set('sub_id', subId);
    return urlObj.toString();
  } catch {
    const sep = cleanBase.includes('?') ? '&' : '?';
    return `${cleanBase}${sep}utm_source=${encodeURIComponent(channel)}&utm_medium=autobiz_ai&utm_campaign=${encodeURIComponent(campaign || 'autobiz_2026')}&sub_id=${encodeURIComponent(subId || 'vuonggia')}`;
  }
}

/**
 * Universal Product Parser (Works across ALL categories: Tech, Accessories, Home, Fashion, FMCG)
 */
function parseUniversalProduct(rawText = '', requestedCategory = 'auto', customPrice = '') {
  const sanitized = sanitizeRawText(rawText);
  const code = extractExplicitMachineCode(rawText);
  const category = detectProductCategory(sanitized, requestedCategory);
  const catInfo = PRODUCT_CATEGORIES[category] || PRODUCT_CATEGORIES.tech;

  // Price extraction
  let retailPrice = customPrice ? String(customPrice).trim() : '';
  if (!retailPrice) {
    const priceMatch = rawText.match(/(?:giá|gia|chỉ)\s*[:=]?\s*([\d.,]+)\s*(tr|triệu|k|K|đ|vnđ)/i);
    if (priceMatch) {
      retailPrice = `${priceMatch[1]} ${priceMatch[2]}`;
    } else if (/giá\s*[\d.,xX]+\s*(?:tr|triệu|k)/i.test(rawText)) {
      const matchX = rawText.match(/giá\s*([\d.,xX]+\s*(?:tr|triệu|k))/i);
      retailPrice = matchX ? `${matchX[1]} (Ưu đãi học sinh - sinh viên)` : 'Inbox nhận giá ưu đãi';
    } else {
      retailPrice = 'Inbox / Bấm link nhận giá ưu đãi hôm nay';
    }
  }

  // Product Name extraction
  let firstLine = sanitized.split('\n')[0].replace(/^(?:mã|ma|lô|lo|sku)\s*[A-Za-z0-9_.-]+\s*[:–-]?\s*/i, '').trim();
  firstLine = firstLine.replace(/^\d+\s*(?:máy|em|chiếc|cái|bộ)\s+/i, '').trim();
  if (firstLine.includes('–')) {
    firstLine = firstLine.split('–')[0].trim();
  } else if (firstLine.includes('-') && !/^\w+-\w+$/.test(firstLine)) {
    firstLine = firstLine.split('-')[0].trim();
  }

  const defaultNames = {
    tech: 'THIẾT BỊ CÔNG NGHỆ CHÍNH HÃNG',
    accessories: 'PHỤ KIỆN CÔNG NGHỆ THÔNG MINH',
    home: 'ĐỒ GIA DỤNG TIỆN ÍCH ĐỜI SỐNG',
    fashion: 'SẢN PHẨM THỜI TRANG TREND GEN Z',
    fmcg: 'SẢN PHẨM CHĂM SÓC & TIÊU DÙNG CHÍNH HÃNG'
  };
  const productName = (firstLine.length >= 3 && firstLine.length <= 70) ? firstLine : (defaultNames[category] || defaultNames.tech);

  // Extract structured specs depending on category
  const specs = [];
  if (category === 'tech') {
    const cpuMatch = sanitized.match(/(?:Intel\s+Core\s+i[3579][\w-]*|Core\s+Ultra\s+\d+\s*\w*|Ultra\s+\d+|Ryzen\s+[3579][\w-]*|i[3579][\s-]+\d{1,5}(?:[A-Za-z0-9]+|ThGen)?|i[3579]\s+\d+th)/i);
    const ramMatch = sanitized.match(/(?:RAM|Ram)\s*[:=]?\s*(\d{1,2}\s*GB)/i) || sanitized.match(/(\d{1,2}\s*GB)\s*RAM/i);
    const ssdMatch = sanitized.match(/(?:SSD|Ssd|Ổ\s*cứng)\s*[:=]?\s*(\d{3,4}\s*GB|\d\s*TB)/i) || sanitized.match(/(\d{3,4}\s*GB|\d\s*TB)\s*(?:SSD|NVMe)/i);
    const screenMatch = sanitized.match(/(?:màn\s*hình|màn)\s*[:=]?\s*([0-9.,]+\s*inch[^\n,•]*|[^,\n•]+)/i);
    if (cpuMatch) specs.push(`Vi xử lý: ${cpuMatch[0]}`);
    if (ramMatch || ssdMatch) specs.push(`Bộ nhớ: RAM ${ramMatch ? ramMatch[1].toUpperCase() : '8GB'} | ${ssdMatch ? ssdMatch[1].toUpperCase() : '256GB SSD'}`);
    if (screenMatch) specs.push(`Hiển thị: ${screenMatch[1].trim()}`);
  }

  // Generic line-based specs fallback for all categories (or remaining lines)
  if (specs.length === 0) {
    const lines = sanitized.split('\n').map(l => l.replace(/^[•\-+*]\s*/, '').trim()).filter(l => l.length > 4 && l !== firstLine);
    for (const line of lines.slice(0, 4)) {
      specs.push(line.slice(0, 110));
    }
  }
  if (specs.length === 0) {
    const defaultSpecs = {
      tech: ['Hiệu năng ổn định, xử lý đa nhiệm mượt mà', 'Thiết kế bền bỉ, tối ưu học tập và làm việc'],
      accessories: ['Kết nối ổn định, tương thích đa thiết bị', 'Thiết kế nhỏ gọn, hoàn thiện cao cấp, bền bỉ'],
      home: ['Tiết kiệm thời gian, vận hành êm ái và an toàn', 'Thiết kế tối giản hiện đại, phù hợp mọi không gian'],
      fashion: ['Chất liệu thoáng mát, form dáng chuẩn xu hướng Gen Z', 'Đường may tỉ mỉ, dễ phối đồ đi học và đi chơi'],
      fmcg: ['Thành phần an toàn, lành tính, nguồn gốc rõ ràng', 'Hiệu quả nhanh chóng, tiện lợi mang theo hàng ngày']
    };
    specs.push(...(defaultSpecs[category] || defaultSpecs.accessories));
  }

  return {
    code,
    name: productName,
    category,
    categoryLabel: catInfo.label,
    hashtagCategory: catInfo.hashtag,
    price: retailPrice,
    specs
  };
}

/**
 * Algorithmic Multi-Channel Fallback Generator (Facebook, TikTok, Zalo, Shopee)
 */
function fallbackGenerateMultiChannel(rawText, userSettings = {}, customPrice = '', options = {}) {
  const parsed = parseUniversalProduct(rawText, options.category || 'auto', customPrice);
  const hotline = userSettings.hotline || '0876637806';
  const shopName = userSettings.fanpageName || 'AutoBiz AI Store';
  const cleanTag = parsed.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'SanPhamHot';
  const campaign = options.campaign || 'autobiz_2026';

  const affiliateLinks = {
    facebook: buildAffiliateUrl(options.affiliateUrl, 'facebook', campaign, parsed.code),
    tiktok: buildAffiliateUrl(options.affiliateUrl, 'tiktok', campaign, parsed.code),
    zalo: buildAffiliateUrl(options.affiliateUrl, 'zalo', campaign, parsed.code),
    shopee: buildAffiliateUrl(options.affiliateUrl, 'shopee', campaign, parsed.code)
  };

  const specsBullets = parsed.specs.map(s => `• ${s}`).join('\n');
  const warrantyLine = parsed.category === 'tech' || parsed.category === 'accessories' || parsed.category === 'home'
    ? '🛡️ Bảo hành: Bao test 7 ngày 1 đổi 1, hỗ trợ kỹ thuật chu đáo'
    : '🛡️ Cam kết: Hàng chuẩn hình 100%, hỗ trợ đổi size/lỗi trong 7 ngày';

  // 1. FACEBOOK
  const fbLinkBlock = affiliateLinks.facebook ? `\n🔗 Đặt hàng / Nhận ưu đãi tại đây: ${affiliateLinks.facebook}` : '';
  const facebook = `🔥 [GIÁ TỐT] - MÃ #${parsed.code}: ${parsed.name.toUpperCase()}
💰 Giá công khai: ${parsed.price}

⚡ Điểm nổi bật chi tiết:
${specsBullets}

${warrantyLine}
🚚 Giao hàng toàn quốc - Đồng kiểm trước khi thanh toán!${fbLinkBlock}
📞 Hotline / Zalo: ${hotline} (${shopName})
#AutoBizAI ${parsed.hashtagCategory} #${cleanTag} #${parsed.code}`;

  // 2. TIKTOK VIDEO SCRIPT
  const tkLinkBlock = affiliateLinks.tiktok ? `Link giỏ hàng/Bio: ${affiliateLinks.tiktok}` : `Bấm ngay vào Giỏ hàng góc trái màn hình hoặc Link ở Bio nhé!`;
  const tiktok = `🎬 [KỊCH BẢN TIKTOK 30S] — ${parsed.name.toUpperCase()}

⏱️ [0s - 3s | HOOK GÂY CHÚ Ý]:
"Khoan lướt qua! Chỉ với ${parsed.price} mà sở hữu ngay ${parsed.name} cực xịn này thì có đáng không?"

⏱️ [3s - 20s | QUAY CẬN CẢNH & USP]:
• Quay góc cận sản phẩm, nhấn mạnh: ${parsed.specs[0] || 'Thiết kế cực kỳ nổi bật'}
• Test thực tế tính năng: ${parsed.specs[1] || 'Dùng cực mượt và tiện lợi cho học sinh - sinh viên'}

⏱️ [20s - 30s | CALL TO ACTION]:
"Số lượng deal hời mã #${parsed.code} có hạn thôi nha! ${tkLinkBlock}"
#TikTokShop #ReviewCoTam ${parsed.hashtagCategory} #${cleanTag}`;

  // 3. ZALO OA / NHÓM SỈ-LẺ
  const zlLinkBlock = affiliateLinks.zalo ? `\n👉 Xem chi tiết & đặt nhanh: ${affiliateLinks.zalo}` : '';
  const zalo = `⚡ [DEAL MỚI VỀ KHO] #${parsed.code} - ${parsed.name}
💵 Giá ưu đãi: ${parsed.price}
✅ Tóm tắt nhanh: ${parsed.specs.slice(0, 2).join(' | ')}
🚚 Ship COD toàn quốc, kiểm tra hàng trước khi nhận.${zlLinkBlock}
💬 Nhắn tin trực tiếp hoặc gọi ${hotline} để giữ suất ưu đãi ngay nhé!`;

  // 4. SHOPEE SEO DESCRIPTION
  const spLinkBlock = affiliateLinks.shopee ? `\n🔗 Link Affiliate Tracking: ${affiliateLinks.shopee}` : '';
  const shopee = `[CHÍNH HÃNG] ${parsed.name} (Mã ${parsed.code}) - Giá Tốt Nhất Phân Khúc

📌 THÔNG TIN CHI TIẾT SẢN PHẨM:
- Ngành hàng: ${parsed.categoryLabel}
- Mức giá niêm yết: ${parsed.price}
${parsed.specs.map(s => `- ${s}`).join('\n')}

📌 CHÍNH SÁCH BÁN HÀNG TẠI ${shopName.toUpperCase()}:
- Cam kết sản phẩm đúng mô tả, đóng gói chống sốc cẩn thận.
- Hỗ trợ đổi trả miễn phí trong 7 ngày nếu có lỗi từ nhà sản xuất.
- Giao hàng hỏa tốc và COD toàn quốc.${spLinkBlock}
Từ khóa: ${parsed.name}, ${parsed.categoryLabel}, #${cleanTag}`;

  return {
    parsed,
    affiliateLinks,
    posts: { facebook, tiktok, zalo, shopee }
  };
}

/**
 * Backward-compatible single-channel fallback
 */
function fallbackGeneratePost(rawText, userSettings, customPrice, options = {}) {
  const multi = fallbackGenerateMultiChannel(rawText, userSettings, customPrice, options);
  const channel = (options.channel || 'facebook').toLowerCase();
  return multi.posts[channel] || multi.posts.facebook;
}

/**
 * Generate Omni-Channel & Multi-Category retail/affiliate posts using Gemini API
 */
async function generatePostWithGemini(rawText, userSettings = {}, customPrice = '', imageBase64 = null, options = {}) {
  const apiKey = userSettings.geminiApiKey || process.env.GEMINI_API_KEY;
  const requestedCategory = options.category || 'auto';
  const primaryChannel = (options.channel || 'facebook').toLowerCase();
  const affiliateUrl = options.affiliateUrl || '';
  const campaign = options.campaign || 'autobiz_2026';

  const fallbackResult = fallbackGenerateMultiChannel(rawText, userSettings, customPrice, {
    category: requestedCategory,
    affiliateUrl,
    campaign
  });

  if (!apiKey || apiKey.trim() === '') {
    return {
      content: fallbackResult.posts[primaryChannel] || fallbackResult.posts.facebook,
      machineCode: fallbackResult.parsed.code,
      category: fallbackResult.parsed.category,
      categoryLabel: fallbackResult.parsed.categoryLabel,
      parsedProduct: fallbackResult.parsed,
      multiChannel: fallbackResult.posts,
      affiliateLinks: fallbackResult.affiliateLinks,
      isAIGenerated: false,
      message: 'Đã tạo bộ bài viết 4 kênh bằng Bộ lọc Đa ngành thông minh (Chưa cấu hình Gemini API Key).'
    };
  }

  const detectedCode = fallbackResult.parsed.code;
  const categoryHint = requestedCategory === 'auto'
    ? 'Tự động nhận diện chính xác 1 trong 5 ngành: tech, accessories, home, fashion, fmcg'
    : `Ngành hàng người dùng chỉ định: ${requestedCategory} (${PRODUCT_CATEGORIES[requestedCategory]?.label || requestedCategory})`;

  const prompt = `
Bạn là Lõi AI Đa Ngành & Tiếp Thị Đa Kênh của Hệ sinh thái AutoBiz AI.
Nhiệm vụ: Bóc tách thông tin sản phẩm từ dữ liệu thô (chữ hoặc hình ảnh) và sinh đồng thời 4 phiên bản nội dung tiếp thị chuẩn mực cho 4 nền tảng (Facebook, TikTok, Zalo, Shopee).

DỮ LIỆU ĐẦU VÀO THÔ:
"""
${rawText || 'Hãy phân tích thông tin sản phẩm từ hình ảnh đính kèm.'}
"""

THÔNG TIN CỬA HÀNG & CHIẾN DỊCH:
- Tên Shop/Hệ thống: ${userSettings.fanpageName || 'AutoBiz AI Store'}
- Hotline/Zalo duy nhất: ${userSettings.hotline || '0876637806'}
- Phân loại ngành hàng: ${categoryHint}
- Giá bán mong muốn: ${customPrice || 'Tự trích xuất và định dạng hấp dẫn từ dữ liệu gốc'}
- Link tiếp thị liên kết (Affiliate): ${affiliateUrl ? 'CÓ - Hãy lồng ghép khéo léo các link UTM tương ứng từng kênh bên dưới' : 'KHÔNG CÓ'}
  + Link Facebook: ${fallbackResult.affiliateLinks.facebook || 'Không'}
  + Link TikTok: ${fallbackResult.affiliateLinks.tiktok || 'Không'}
  + Link Zalo: ${fallbackResult.affiliateLinks.zalo || 'Không'}
  + Link Shopee: ${fallbackResult.affiliateLinks.shopee || 'Không'}

QUY TẮC BẮT BUỘC:
1. TUYỆT ĐỐI XÓA SẠCH từ ngữ nhạy cảm bên sỉ ("giá sỉ", "hoa hồng", "lương CTV", "sỉ ib", SĐT lạ). Chỉ giữ Hotline ${userSettings.hotline || '0876637806'}.
2. KHÔNG dùng đường kẻ ngang dài ngoằng (────). Trình bày tinh gọn, sắc nét, đúng văn phong từng nền tảng:
   - facebook: Bài bán hàng 400-550 ký tự, có mã #${detectedCode}, giá, 3-4 gạch đầu dòng thông số thực tế đúng ngành hàng (KHÔNG bịa thông số laptop nếu đây là tai nghe/quần áo/gia dụng!), bảo hành/cam kết, hotline, link UTM Facebook (nếu có), hashtags.
   - tiktok: Kịch bản video ngắn 30 giây gồm 3 phần: [0-3s HOOK], [3-20s REVIEW/USP], [20-30s CTA gắn link TikTok/Bio].
   - zalo: Tin nhắn ngắn 4-5 dòng thân thiện để gửi khách/nhóm Zalo OA kèm link UTM Zalo (nếu có).
   - shopee: Mô tả chuẩn SEO giàu từ khóa tìm kiếm, liệt kê thông số và chính sách đổi trả.

ĐẦU RA BẮT BUỘC: Trả về DUY NHẤT 1 JSON Object hợp lệ (không bọc markdown code block), đúng schema sau:
{
  "category": "tech|accessories|home|fashion|fmcg",
  "product_name": "Tên sản phẩm viết hoa ngắn gọn",
  "price_display": "Giá hiển thị",
  "specs": ["Thông số/điểm nổi bật 1", "Thông số 2", "Thông số 3"],
  "posts": {
    "facebook": "...",
    "tiktok": "...",
    "zalo": "...",
    "shopee": "..."
  }
}
`;

  try {
    const contents = [];
    const parts = [{ text: prompt }];

    if (imageBase64) {
      const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({ inline_data: { mime_type: mimeType, data: cleanBase64 } });
    }

    contents.push({ role: 'user', parts });
    const result = await callGeminiWithFallback(contents, apiKey);

    let jsonText = result.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }
    const parsedJson = JSON.parse(jsonText);
    const finalCat = PRODUCT_CATEGORIES[parsedJson.category] ? parsedJson.category : fallbackResult.parsed.category;

    const multiPosts = {
      facebook: parsedJson.posts?.facebook || fallbackResult.posts.facebook,
      tiktok: parsedJson.posts?.tiktok || fallbackResult.posts.tiktok,
      zalo: parsedJson.posts?.zalo || fallbackResult.posts.zalo,
      shopee: parsedJson.posts?.shopee || fallbackResult.posts.shopee
    };

    return {
      content: multiPosts[primaryChannel] || multiPosts.facebook,
      machineCode: detectedCode,
      category: finalCat,
      categoryLabel: PRODUCT_CATEGORIES[finalCat].label,
      parsedProduct: {
        code: detectedCode,
        name: parsedJson.product_name || fallbackResult.parsed.name,
        category: finalCat,
        categoryLabel: PRODUCT_CATEGORIES[finalCat].label,
        price: parsedJson.price_display || fallbackResult.parsed.price,
        specs: Array.isArray(parsedJson.specs) ? parsedJson.specs : fallbackResult.parsed.specs
      },
      multiChannel: multiPosts,
      affiliateLinks: fallbackResult.affiliateLinks,
      isAIGenerated: true,
      modelUsed: result.model,
      message: `Đã bóc tách đa ngành & sinh 4 kênh thành công bằng ${result.model}!`
    };
  } catch (error) {
    console.warn('[Gemini API] Fallback to Algorithmic Multi-Channel Engine:', error.message);
    return {
      content: fallbackResult.posts[primaryChannel] || fallbackResult.posts.facebook,
      machineCode: fallbackResult.parsed.code,
      category: fallbackResult.parsed.category,
      categoryLabel: fallbackResult.parsed.categoryLabel,
      parsedProduct: fallbackResult.parsed,
      multiChannel: fallbackResult.posts,
      affiliateLinks: fallbackResult.affiliateLinks,
      isAIGenerated: false,
      message: `Đã sử dụng Bộ bóc tách Đa ngành Thuật toán (${error.message}).`
    };
  }
}

/**
 * Algorithmic fallback rewrite for circular posts (4 rotating themes)
 */
function fallbackCircularRewrite(template, style = 'featured_review') {
  if (!template) return '';
  const model = template.model_name || 'Sản Phẩm Tuyển Chọn';
  const cpu = template.cpu || 'Intel Core mạnh mẽ';
  const ram = template.ram || '8GB';
  const ssd = template.ssd || '256GB SSD';
  const screen = template.screen || 'Màn hình sắc nét chuẩn HD/FHD';
  const config = template.standard_config || `${cpu} / RAM ${ram} / SSD ${ssd} / Màn ${screen}`;
  const price = template.price_display || (template.price_min ? `${(template.price_min / 1e6).toFixed(1)} triệu` : 'Liên hệ báo giá tốt nhất');
  const modelTag = (template.model_name || 'AutoBiz').replace(/[^a-zA-Z0-9]/g, '');

  const normStyle = String(style || 'featured_review').toLowerCase();

  if (normStyle.includes('flash') || normStyle.includes('sale') || normStyle.includes('budget') || normStyle === 'deal') {
    return `🔥 [TIÊU ĐIỂM GIÁ TỐT] — ${model.toUpperCase()}
💰 Giá ưu đãi: ${price}

⚡ Thông số nổi bật:
• CPU: ${cpu} | RAM: ${ram}
• Ổ cứng: ${ssd} siêu tốc
• Màn hình: ${screen} chống lóa dịu mắt

🎁 Quà tặng & Hỗ trợ: Đầy đủ phụ kiện chính hãng
🛡️ Bao test 7 ngày lỗi 1 đổi 1, bảo hành chu đáo
🚚 Đồng kiểm tận tay - Đúng chuẩn mới thanh toán!
📞 Hotline / Zalo đặt hàng: 0876637806
#AutoBizAI #DealHot #${modelTag}`;
  }

  if (normStyle.includes('curated') || normStyle.includes('durability') || normStyle.includes('pick') || normStyle.includes('military')) {
    return `🌟 [HÀNG TUYỂN CHỌN LOẠI A] — ${model.toUpperCase()}
💰 Giá đầu tư: ${price} (Zin nguyên bản 100%)

✨ Điểm mạnh nổi bật:
• Độ bền cao, hoàn thiện sắc sảo
• Vi xử lý: ${cpu} | Bộ nhớ: RAM ${ram}
• Lưu trữ: ${ssd} | Hiển thị: ${screen}

🛡️ Cam kết vàng: Bao test 7 ngày 1 đổi 1, bảo hành trách nhiệm
📞 Hotline tư vấn trực tiếp: 0876637806
#HangTuyenChon #AutoBizAI #${modelTag}`;
  }

  if (normStyle.includes('value') || normStyle.includes('champion') || normStyle.includes('mobility')) {
    return `🏆 [LỰA CHỌN THỰC CHIẾN] — ${model.toUpperCase()}
💰 Tầm giá hợp lý: ${price}

💻 Thông số thực chiến:
• Cấu hình: ${config}
• Thiết kế tinh gọn, tiện lợi mang theo học tập và làm việc

🛡️ 1 đổi 1 trong 7 ngày nếu lỗi phần cứng, bảo hành chu đáo
🚚 Giao hàng toàn quốc - Kiểm tra ưng ý mới thanh toán!
📞 Hotline / Zalo: 0876637806
#AutoBizAI #LuaChonThucChien #${modelTag}`;
  }

  return `✨ [REVIEW SẢN PHẨM] — ${model.toUpperCase()}
💰 Khoảng giá ưu đãi: ${price}

⚡ Đánh giá chi tiết:
• CPU: ${cpu} | RAM: ${ram} chuyển đổi mượt mà
• SSD: ${ssd} mở ứng dụng trong vài giây
• Màn hình: ${screen} hiển thị sắc nét

🛡️ Bao test 7 ngày lỗi 1 đổi 1, bảo hành phần cứng chu đáo
🚚 Đồng kiểm toàn quốc
📞 Hotline / Zalo: 0876637806
#ReviewSanPham #AutoBizAI #${modelTag}`;
}

/**
 * Generate circular post rewrite with Gemini API (4 rotating themes)
 */
async function generateCircularPostRewrite(template, style = 'featured_review') {
  if (!template) {
    throw new Error('Vui lòng cung cấp dữ liệu Model Template.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    const fallbackContent = fallbackCircularRewrite(template, style);
    const resultObj = {
      content: fallbackContent,
      isAIGenerated: false,
      modelUsed: 'algorithmic_fallback',
      message: 'Đã tạo bài viết tuần hoàn bằng bộ mẫu thuật toán (Chưa cấu hình GEMINI_API_KEY).'
    };
    resultObj.toString = function() { return this.content; };
    return resultObj;
  }

  const model = template.model_name || 'Sản Phẩm Tuyển Chọn';
  const brand = template.brand || 'Chính Hãng';
  const cpu = template.cpu || 'Intel Core mạnh mẽ';
  const ram = template.ram || '8GB';
  const ssd = template.ssd || '256GB SSD';
  const screen = template.screen || 'Màn hình sắc nét';
  const price = template.price_display || (template.price_min ? `${(template.price_min / 1e6).toFixed(1)} triệu` : 'Liên hệ báo giá tốt nhất');
  const modelTag = (template.model_name || 'AutoBiz').replace(/[^a-zA-Z0-9]/g, '');

  const normStyle = String(style || 'featured_review').toLowerCase();
  let themeName = 'Hiệu Năng & Văn Phòng Thực Chiến';
  let themeGuide = 'Nhấn mạnh hiệu năng xử lý, làm việc đa nhiệm mượt mà.';
  let requiredTitle = `✨ [REVIEW CHI TIẾT] — ${model.toUpperCase()}`;
  let specEmphasis = 'Đưa thông số cốt lõi lên đầu';
  let themeEmojis = '✨, 💼, ⚡, 🔹, 💰, 🎁, 🛡️, 📲';
  let hashtags = `#AutoBizAI #ReviewSanPham #${modelTag}`;

  if (normStyle.includes('flash') || normStyle.includes('sale') || normStyle.includes('budget') || normStyle === 'deal') {
    themeName = 'Tối Ưu Ngân Sách & Giá Trị Vượt Giá Tiền';
    themeGuide = 'Nhấn mạnh mức giá ưu đãi và giá trị vượt trội trong tầm giá.';
    requiredTitle = `🔥 [TIÊU ĐIỂM GIÁ TỐT] — ${model.toUpperCase()}`;
    specEmphasis = 'Đưa mức giá ưu đãi lên đầu';
    themeEmojis = '🔥, ⚡, 🚀, 🔹, 💰, 🎁, 🛡️, 📲';
    hashtags = `#DealHot #GiaUuDai #AutoBizAI #${modelTag}`;
  } else if (normStyle.includes('curated') || normStyle.includes('durability') || normStyle.includes('pick') || normStyle.includes('military')) {
    themeName = 'Độ Bền & Tuyển Chọn Chất Lượng';
    themeGuide = 'Nhấn mạnh độ bền và chất lượng nguyên bản.';
    requiredTitle = `🌟 [HÀNG TUYỂN CHỌN LOẠI A] — ${model.toUpperCase()}`;
    specEmphasis = 'Đưa tiêu chuẩn độ bền và thiết kế lên đầu';
    themeEmojis = '🌟, 💎, 🛡️, 🔹, 💰, 🎁, ✅, ☎️';
    hashtags = `#HangTuyenChon #AutoBizAI #${modelTag}`;
  } else if (normStyle.includes('value') || normStyle.includes('champion') || normStyle.includes('mobility')) {
    themeName = 'Gọn Nhẹ & Linh Hoạt';
    themeGuide = 'Nhấn mạnh tính di động, tiện lợi cho học tập và công việc.';
    requiredTitle = `🏆 [LỰA CHỌN THỰC CHIẾN SỐ 1] — ${model.toUpperCase()}`;
    specEmphasis = 'Đưa thiết kế gọn nhẹ lên đầu';
    themeEmojis = '🏆, 💻, 🎯, 🔹, 💰, 🎁, 🛡️, 📲';
    hashtags = `#AutoBizAI #SanPhamGiaTot #${modelTag}`;
  }

  const prompt = `
Bạn là chuyên gia sáng tạo nội dung bán lẻ của hệ sinh thái "AutoBiz AI".
Viết lại bài đăng bán hàng mới cho sản phẩm dưới đây:
- Tên sản phẩm: ${model} (${brand})
- Thông số: CPU ${cpu}, RAM ${ram}, SSD ${ssd}, Màn hình ${screen}
- Giá tham khảo: ${price}
CHỦ ĐỀ: "${themeName}" — ${themeGuide}
DÒNG TIÊU ĐỀ ĐẦU TIÊN BẮT BUỘC: ${requiredTitle}
QUY TẮC:
1. Tinh gọn 450-550 ký tự, không dùng đường kẻ ngang dài.
2. Đảo thứ tự: ${specEmphasis}. Emoji: [${themeEmojis}].
3. Bảo hành: Bao test 7 ngày 1 đổi 1. Hotline/Zalo: 0876637806.
4. Hashtags cuối bài: ${hashtags}
Trả về DUY NHẤT nội dung bài viết, không code block.
`;

  try {
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const result = await callGeminiWithFallback(contents, apiKey);

    let cleanText = result.text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }
    if (!cleanText.startsWith(requiredTitle.split(' — ')[0])) {
      cleanText = `${requiredTitle}\n\n${cleanText}`;
    }

    const resultObj = {
      content: cleanText,
      isAIGenerated: true,
      modelUsed: result.model,
      style: normStyle,
      message: `Đã sinh bài viết tuần hoàn thành công bằng ${result.model}!`
    };
    resultObj.toString = function() { return this.content; };
    return resultObj;
  } catch (error) {
    console.warn(`[Gemini API] Lỗi sinh bài viết tuần hoàn (${error.message}). Kích hoạt fallback...`);
    const fallbackContent = fallbackCircularRewrite(template, style);
    const resultObj = {
      content: fallbackContent,
      isAIGenerated: false,
      modelUsed: 'algorithmic_fallback',
      style: normStyle,
      message: `Gemini API lỗi (${error.message}). Đã sử dụng bộ tạo bài tuần hoàn thuật toán thay thế.`
    };
    resultObj.toString = function() { return this.content; };
    return resultObj;
  }
}

module.exports = {
  PRODUCT_CATEGORIES,
  sanitizeRawText,
  extractExplicitMachineCode,
  detectProductCategory,
  buildAffiliateUrl,
  parseUniversalProduct,
  fallbackGeneratePost,
  fallbackGenerateMultiChannel,
  generatePostWithGemini,
  callGeminiWithFallback,
  generateCircularPostRewrite,
  fallbackCircularRewrite
};
