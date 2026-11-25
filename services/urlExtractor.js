const axios = require('axios');
const { PRODUCT_CATEGORIES } = require('./gemini');

const CATEGORY_KEYWORDS = {
  tech: ['laptop', 'macbook', 'iphone', 'ipad', 'điện thoại', 'máy tính', 'camera', 'màn hình', 'ssd', 'ram', 'bàn phím', 'chuột', 'loa', 'router', 'wifi'],
  accessories: ['tai nghe', 'airpods', 'cáp sạc', 'sạc dự phòng', 'ốp lưng', 'kính cường lực', 'đồng hồ', 'smartwatch', 'balo', 'túi chống sốc', 'giá đỡ', 'anc'],
  home: ['nồi chiên', 'máy hút bụi', 'quạt', 'đèn bàn', 'ấm siêu tốc', 'bếp từ', 'máy lọc không khí', 'bình giữ nhiệt', 'chảo', 'gia dụng', 'máy xay'],
  fashion: ['áo', 'quần', 'váy', 'đầm', 'giày', 'dép', 'sneaker', 'túi xách', 'ví da', 'kính mát', 'mũ', 'thời trang', 'hoodie', 'jacket'],
  fmcg: ['son', 'kem chống nắng', 'sữa rửa mặt', 'serum', 'nước hoa', 'dầu gội', 'sữa tắm', 'mỹ phẩm', 'thực phẩm', 'cà phê', 'trà', 'vitamin', 'collagen']
};

function stripDiacritics(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function detectCategory(text = '') {
  const normalized = stripDiacritics(text);
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => normalized.includes(stripDiacritics(w)))) return cat;
  }
  return 'accessories';
}

function decodeHtmlEntities(str = '') {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMetaTag(html, attrName, attrVal) {
  const regex1 = new RegExp(`<meta[^>]*${attrName}=["']${attrVal}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
  const m1 = html.match(regex1);
  if (m1 && m1[1]) return decodeHtmlEntities(m1[1]);
  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*${attrName}=["']${attrVal}["'][^>]*>`, 'i');
  const m2 = html.match(regex2);
  if (m2 && m2[1]) return decodeHtmlEntities(m2[1]);
  return '';
}

function extractTitleFromSlug(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return '';
    // Shopee slug pattern: /Ten-San-Pham-i.12345.67890
    let candidate = segments[0];
    if (segments.length > 1 && (candidate === 'product' || candidate === 'item' || candidate === 'p')) {
      candidate = segments[segments.length - 1];
    }
    candidate = decodeURIComponent(candidate)
      .replace(/-i\.\d+\.\d+$/i, '')
      .replace(/\.html?$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (candidate.length >= 4 && !/^\d+$/.test(candidate)) {
      return candidate.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch (_) {}
  return '';
}

function parsePriceValue(raw) {
  if (!raw) return 0;
  const digits = String(raw).replace(/[^\d]/g, '');
  const val = Number(digits);
  return Number.isFinite(val) && val >= 1000 && val <= 500000000 ? val : 0;
}

function extractJsonLdProduct(html) {
  const matches = [...String(html).matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of matches) {
    try {
      const json = JSON.parse(m[1].trim());
      const items = Array.isArray(json) ? json : (json['@graph'] || [json]);
      for (const item of items) {
        if (item && (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product')))) {
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          const img = Array.isArray(item.image) ? item.image : (item.image ? [item.image] : []);
          return {
            name: item.name ? decodeHtmlEntities(item.name) : '',
            description: item.description ? decodeHtmlEntities(item.description) : '',
            price: parsePriceValue(offers?.price || offers?.lowPrice || 0),
            images: img.map((i) => (typeof i === 'string' ? i : i?.url)).filter((u) => /^https?:\/\//i.test(u))
          };
        }
      }
    } catch (_) {}
  }
  return null;
}

async function extractProductFromUrl(inputUrl) {
  const rawUrl = String(inputUrl || '').trim();
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    throw new Error('Vui lòng nhập đường dẫn URL hợp lệ bắt đầu bằng http:// hoặc https://');
  }

  let finalUrl = rawUrl;
  let html = '';
  let fetchMode = 'live_meta';

  try {
    const res = await axios.get(rawUrl, {
      maxRedirects: 5,
      timeout: 7000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8'
      },
      validateStatus: (status) => status >= 200 && status < 400
    });
    if (res.request?.res?.responseUrl) {
      finalUrl = res.request.res.responseUrl;
    }
    if (typeof res.data === 'string') {
      html = res.data.slice(0, 250000);
    }
  } catch (_) {
    fetchMode = 'slug_fallback';
  }

  const ld = html ? extractJsonLdProduct(html) : null;
  const ogTitle = html ? (extractMetaTag(html, 'property', 'og:title') || extractMetaTag(html, 'name', 'twitter:title')) : '';
  const ogDesc = html ? (extractMetaTag(html, 'property', 'og:description') || extractMetaTag(html, 'name', 'description')) : '';
  const ogImage = html ? (extractMetaTag(html, 'property', 'og:image') || extractMetaTag(html, 'name', 'twitter:image')) : '';
  const ogPrice = html ? (extractMetaTag(html, 'property', 'product:price:amount') || extractMetaTag(html, 'property', 'og:price:amount')) : '';
  const titleMatch = html ? html.match(/<title[^>]*>([^<]+)<\/title>/i) : null;
  const pageTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';

  const slugTitle = extractTitleFromSlug(finalUrl) || extractTitleFromSlug(rawUrl);

  // Clean boilerplate titles like "Shopee Việt Nam | Mua và Bán..."
  const isGenericTitle = (t) => !t || /shopee việt nam|đăng nhập|login|tiktok - make your day|just a moment|access denied/i.test(t);
  let resolvedName = '';
  if (ld?.name && !isGenericTitle(ld.name)) resolvedName = ld.name;
  else if (!isGenericTitle(ogTitle)) resolvedName = ogTitle;
  else if (slugTitle) resolvedName = slugTitle;
  else if (!isGenericTitle(pageTitle)) resolvedName = pageTitle;
  else resolvedName = 'Sản Phẩm Affiliate Mới';

  resolvedName = resolvedName.replace(/\s*\|\s*Shopee.*$/i, '').replace(/\s*-\s*Mua ngay.*$/i, '').trim().slice(0, 140);

  let priceRetail = ld?.price || parsePriceValue(ogPrice) || 0;
  if (!priceRetail && (ogDesc || resolvedName)) {
    const priceMatch = `${resolvedName} ${ogDesc}`.match(/(\d{1,3}(?:[.,]\d{3})+)\s*(?:đ|vnd|vnđ|k)?/i);
    if (priceMatch) priceRetail = parsePriceValue(priceMatch[1]);
  }

  const images = [];
  if (ld?.images?.length) images.push(...ld.images);
  if (ogImage && /^https?:\/\//i.test(ogImage) && !images.includes(ogImage)) images.push(ogImage);

  const category = detectCategory(`${resolvedName} ${ogDesc} ${finalUrl}`);
  const skuPrefix = (PRODUCT_CATEGORIES[category]?.label ? category.slice(0, 2) : 'SP').toUpperCase();
  const sku = `${skuPrefix}-${Date.now().toString().slice(-4)}`;

  const specs = [];
  if (ogDesc && ogDesc.length > 10 && !isGenericTitle(ogDesc)) {
    specs.push(ogDesc.slice(0, 160));
  } else {
    specs.push(`Sản phẩm chính hãng thuộc ngành ${PRODUCT_CATEGORIES[category]?.label || 'Đa ngành'}`);
  }
  if (/shopee\.vn|shp\.ee/i.test(finalUrl)) specs.push('Nguồn sản phẩm: Shopee Mall / Affiliate');
  else if (/tiktok\.com/i.test(finalUrl)) specs.push('Nguồn sản phẩm: TikTok Shop Affiliate');

  return {
    name: resolvedName,
    sku,
    category,
    price_retail: priceRetail || 299000,
    commission_rate: 10,
    affiliate_base_url: rawUrl,
    resolved_url: finalUrl,
    images: images.slice(0, 5),
    specs,
    fetchMode
  };
}

module.exports = {
  extractProductFromUrl,
  extractTitleFromSlug,
  detectCategory
};
