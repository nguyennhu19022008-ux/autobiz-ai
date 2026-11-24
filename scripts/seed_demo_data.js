/**
 * scripts/seed_demo_data.js
 * Công cụ Quản trị Dữ liệu Demo Chuẩn 5 Ngành Hàng & 10 CTV FinTech cho AutoBiz AI (CV11)
 * - Dùng được cả qua CLI (`node scripts/seed_demo_data.js --seed` / `--clear`)
 *   lẫn gọi trực tiếp qua API (`POST /api/demo/seed` & `POST /api/demo/clear`) trên Vercel Serverless (/tmp).
 */

const { writeJsonSafe } = require('../utils/runtime');

const DEMO_PRODUCTS = [
  {
    id: "prod_tc01",
    sku: "LAP-X1-GEN9",
    name: "Laptop ThinkPad X1 Carbon Gen 9 i7-1165G7 / RAM 16GB / SSD 512GB",
    category: "tech",
    price_retail: 14500000,
    commission_rate: 5,
    affiliate_base_url: "https://www.facebook.com/1154184381110692",
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"],
    specs: ["CPU Intel Core i7-1165G7", "RAM 16GB LPDDR4x", "SSD 512GB NVMe", "Màn 14 inch FHD+ IPS 100% sRGB"],
    status: "active",
    created_at: "2026-11-15T08:00:00.000Z"
  },
  {
    id: "prod_tc02",
    sku: "LAP-XPS-9310",
    name: "Laptop Dell XPS 13 9310 Core i7 / RAM 16GB / SSD 512GB Viền Siêu Mỏng",
    category: "tech",
    price_retail: 16900000,
    commission_rate: 6,
    affiliate_base_url: "https://www.facebook.com/1154184381110692",
    images: ["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"],
    specs: ["CPU Intel Core i7 Gen 11", "RAM 16GB", "SSD 512GB", "Vỏ nhôm CNC nguyên khối 1.2kg"],
    status: "active",
    created_at: "2026-11-15T08:05:00.000Z"
  },
  {
    id: "prod_pk01",
    sku: "PK-ANC-PRO",
    name: "Tai Nghe Bluetooth Chống Ồn Chủ Động ANC Pro Gen 3",
    category: "accessories",
    price_retail: 390000,
    commission_rate: 15,
    affiliate_base_url: "https://shopee.vn/product/1001/pk-anc-pro",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"],
    specs: ["Chống ồn chủ động ANC 42dB", "Pin 36 giờ", "Bluetooth 5.4 độ trễ thấp"],
    status: "active",
    created_at: "2026-11-15T08:10:00.000Z"
  },
  {
    id: "prod_pk02",
    sku: "PK-GA65W",
    name: "Củ Sạc Nhanh GaN 65W 3 Cổng Type-C Đa Năng Cho Laptop & Điện Thoại",
    category: "accessories",
    price_retail: 285000,
    commission_rate: 14,
    affiliate_base_url: "https://shopee.vn/product/1002/pk-gan-65w",
    images: [],
    specs: ["Công suất 65W PD 3.0", "2 cổng USB-C + 1 USB-A", "Chip GaN Thế hệ 3 mát máy"],
    status: "active",
    created_at: "2026-11-15T08:15:00.000Z"
  },
  {
    id: "prod_fs01",
    sku: "FS-HOODIE-420",
    name: "Áo Hoodie Oversize Nỉ Chân Cua 420GSM Form Boxy Gen Z",
    category: "fashion",
    price_retail: 249000,
    commission_rate: 18,
    affiliate_base_url: "https://shopee.vn/product/2001/fs-hoodie-420gsm",
    images: [],
    specs: ["Nỉ chân cua 100% Cotton 420GSM", "Form Boxy Oversize", "Đủ size M / L / XL"],
    status: "active",
    created_at: "2026-11-15T08:20:00.000Z"
  },
  {
    id: "prod_fs02",
    sku: "FS-BALO-LAP",
    name: "Balo Học Đường Chống Nước Ngăn Chống Sốc Laptop 15.6 Inch",
    category: "fashion",
    price_retail: 320000,
    commission_rate: 16,
    affiliate_base_url: "https://shopee.vn/product/2002/fs-balo-minimal",
    images: [],
    specs: ["Vải Oxford 900D trượt nước", "Ngăn chống sốc dày 15.6 inch", "Trọng lượng siêu nhẹ 620g"],
    status: "active",
    created_at: "2026-11-15T08:25:00.000Z"
  },
  {
    id: "prod_hm01",
    sku: "HM-LAMP-CRI95",
    name: "Đèn Bàn Học Chống Cận LED Quang Phổ Tự Nhiên CRI>95",
    category: "home",
    price_retail: 350000,
    commission_rate: 15,
    affiliate_base_url: "https://shopee.vn/product/3001/hm-led-cri95",
    images: [],
    specs: ["Chỉ số hoàn màu Ra > 95", "3 chế độ nhiệt màu 3000K-5000K", "Hẹn giờ nghỉ mắt 45 phút"],
    status: "active",
    created_at: "2026-11-15T08:30:00.000Z"
  },
  {
    id: "prod_hm02",
    sku: "HM-THERMO-800",
    name: "Bình Giữ Nhiệt Inox 316 Hiển Thị Nhiệt Độ Thông Minh 800ml",
    category: "home",
    price_retail: 195000,
    commission_rate: 20,
    affiliate_base_url: "https://shopee.vn/product/3002/hm-thermo-800ml",
    images: [],
    specs: ["Lõi Inox 316 chuẩn y tế", "Dung tích 800ml", "Giữ nóng/lạnh 24 giờ"],
    status: "active",
    created_at: "2026-11-15T08:35:00.000Z"
  },
  {
    id: "prod_fm01",
    sku: "FM-GRANOLA-500",
    name: "Ngũ Cốc Dinh Dưỡng Granola Siêu Hạt Không Đường 500g",
    category: "fmcg",
    price_retail: 145000,
    commission_rate: 18,
    affiliate_base_url: "https://shopee.vn/product/4002/fm-granola-500g",
    images: [],
    specs: ["Hạt điều, hạnh nhân, óc chó, yến mạch nướng mật ong", "Trọng lượng 500g"],
    status: "active",
    created_at: "2026-11-15T08:40:00.000Z"
  },
  {
    id: "prod_tc03",
    sku: "TC-MECH-K75",
    name: "Bàn Phím Cơ Không Dây Layout 75% Hotswap 3 Mode Pin 4000mAh",
    category: "tech",
    price_retail: 690000,
    commission_rate: 12,
    affiliate_base_url: "https://shopee.vn/product/5001/tc-mech-k75",
    images: [],
    specs: ["Bluetooth / 2.4GHz / Type-C", "Switch Linear Pre-lubed", "Cấu trúc Gasket Mount êm"],
    status: "active",
    created_at: "2026-11-15T08:45:00.000Z"
  }
];

const DEMO_LINKS = [
  {
    shortCode: "FA101A",
    productId: "prod_tc01",
    productName: "Laptop ThinkPad X1 Carbon Gen 9 i7-1165G7 / RAM 16GB / SSD 512GB",
    priceRetail: 14500000,
    commissionRate: 5,
    channel: "facebook",
    campaign: "laptop_vuonggia_2026",
    subId: "ctv01_minh",
    baseUrl: "https://www.facebook.com/1154184381110692",
    targetUrl: "https://www.facebook.com/1154184381110692?utm_source=facebook&utm_medium=autobiz_ai&utm_campaign=laptop_vuonggia_2026&sub_id=ctv01_minh",
    clicks: 68,
    estimatedOrders: 3,
    estimatedCommission: 2175000,
    confirmedOrders: 2,
    confirmedRevenue: 29000000,
    confirmedCommission: 1450000,
    createdAt: "2026-11-16T09:00:00.000Z",
    lastClickedAt: "2026-11-24T06:30:00.000Z",
    lastOrderAt: "2026-11-23T14:20:00.000Z"
  },
  {
    shortCode: "TI202B",
    productId: "prod_tc02",
    productName: "Laptop Dell XPS 13 9310 Core i7 / RAM 16GB / SSD 512GB Viền Siêu Mỏng",
    priceRetail: 16900000,
    commissionRate: 6,
    channel: "tiktok",
    campaign: "laptop_vuonggia_2026",
    subId: "ctv02_khangthinh",
    baseUrl: "https://www.facebook.com/1154184381110692",
    targetUrl: "https://www.facebook.com/1154184381110692?utm_source=tiktok&utm_medium=autobiz_ai&utm_campaign=laptop_vuonggia_2026&sub_id=ctv02_khangthinh",
    clicks: 54,
    estimatedOrders: 2,
    estimatedCommission: 2028000,
    confirmedOrders: 1,
    confirmedRevenue: 16900000,
    confirmedCommission: 1014000,
    createdAt: "2026-11-16T09:15:00.000Z",
    lastClickedAt: "2026-11-24T06:25:00.000Z",
    lastOrderAt: "2026-11-22T18:10:00.000Z"
  },
  {
    shortCode: "SH303C",
    productId: "prod_tc03",
    productName: "Bàn Phím Cơ Không Dây Layout 75% Hotswap 3 Mode Pin 4000mAh",
    priceRetail: 690000,
    commissionRate: 12,
    channel: "shopee",
    campaign: "autobiz_2026",
    subId: "ctv03_hoang",
    baseUrl: "https://shopee.vn/product/5001/tc-mech-k75",
    targetUrl: "https://shopee.vn/product/5001/tc-mech-k75?utm_source=shopee&utm_medium=autobiz_ai&utm_campaign=autobiz_2026&sub_id=ctv03_hoang",
    clicks: 49,
    estimatedOrders: 2,
    estimatedCommission: 165600,
    confirmedOrders: 4,
    confirmedRevenue: 2760000,
    confirmedCommission: 331200,
    createdAt: "2026-11-16T10:00:00.000Z",
    lastClickedAt: "2026-11-24T06:10:00.000Z",
    lastOrderAt: "2026-11-23T20:00:00.000Z"
  },
  {
    shortCode: "ZA404D",
    productId: "prod_pk01",
    productName: "Tai Nghe Bluetooth Chống Ồn Chủ Động ANC Pro Gen 3",
    priceRetail: 390000,
    commissionRate: 15,
    channel: "zalo",
    campaign: "autobiz_2026",
    subId: "ctv04_linh",
    baseUrl: "https://shopee.vn/product/1001/pk-anc-pro",
    targetUrl: "https://shopee.vn/product/1001/pk-anc-pro?utm_source=zalo&utm_medium=autobiz_ai&utm_campaign=autobiz_2026&sub_id=ctv04_linh",
    clicks: 42,
    estimatedOrders: 2,
    estimatedCommission: 117000,
    confirmedOrders: 5,
    confirmedRevenue: 1950000,
    confirmedCommission: 292500,
    createdAt: "2026-11-16T10:30:00.000Z",
    lastClickedAt: "2026-11-24T05:50:00.000Z",
    lastOrderAt: "2026-11-23T11:40:00.000Z"
  },
  {
    shortCode: "TI505E",
    productId: "prod_fs02",
    productName: "Balo Học Đường Chống Nước Ngăn Chống Sốc Laptop 15.6 Inch",
    priceRetail: 320000,
    commissionRate: 16,
    channel: "tiktok",
    campaign: "autobiz_2026",
    subId: "ctv05_nam",
    baseUrl: "https://shopee.vn/product/2002/fs-balo-minimal",
    targetUrl: "https://shopee.vn/product/2002/fs-balo-minimal?utm_source=tiktok&utm_medium=autobiz_ai&utm_campaign=autobiz_2026&sub_id=ctv05_nam",
    clicks: 38,
    estimatedOrders: 1,
    estimatedCommission: 51200,
    confirmedOrders: 4,
    confirmedRevenue: 1280000,
    confirmedCommission: 204800,
    createdAt: "2026-11-16T11:00:00.000Z",
    lastClickedAt: "2026-11-24T05:30:00.000Z",
    lastOrderAt: "2026-11-22T16:15:00.000Z"
  },
  {
    shortCode: "FA606F",
    productId: "prod_hm01",
    productName: "Đèn Bàn Học Chống Cận LED Quang Phổ Tự Nhiên CRI>95",
    priceRetail: 350000,
    commissionRate: 15,
    channel: "facebook",
    campaign: "autobiz_2026",
    subId: "ctv06_trang",
    baseUrl: "https://shopee.vn/product/3001/hm-led-cri95",
    targetUrl: "https://shopee.vn/product/3001/hm-led-cri95?utm_source=facebook&utm_medium=autobiz_ai&utm_campaign=autobiz_2026&sub_id=ctv06_trang",
    clicks: 31,
    estimatedOrders: 1,
    estimatedCommission: 52500,
    confirmedOrders: 3,
    confirmedRevenue: 1050000,
    confirmedCommission: 157500,
    createdAt: "2026-11-16T11:30:00.000Z",
    lastClickedAt: "2026-11-24T05:00:00.000Z",
    lastOrderAt: "2026-11-21T09:30:00.000Z"
  },
  {
    shortCode: "SH707G",
    productId: "prod_pk02",
    productName: "Củ Sạc Nhanh GaN 65W 3 Cổng Type-C Đa Năng Cho Laptop & Điện Thoại",
    priceRetail: 285000,
    commissionRate: 14,
    channel: "shopee",
    campaign: "autobiz_2026",
    subId: "ctv07_huy",
    baseUrl: "https://shopee.vn/product/1002/pk-gan-65w",
    targetUrl: "https://shopee.vn/product/1002/pk-gan-65w?utm_source=shopee&utm_medium=autobiz_ai&utm_campaign=autobiz_2026&sub_id=ctv07_huy",
    clicks: 26,
    estimatedOrders: 1,
    estimatedCommission: 39900,
    confirmedOrders: 3,
    confirmedRevenue: 855000,
    confirmedCommission: 119700,
    createdAt: "2026-11-16T12:00:00.000Z",
    lastClickedAt: "2026-11-24T04:40:00.000Z",
    lastOrderAt: "2026-11-21T15:00:00.000Z"
  },
  {
    shortCode: "ZA808H",
    productId: "prod_fs01",
    productName: "Áo Hoodie Oversize Nỉ Chân Cua 420GSM Form Boxy Gen Z",
    priceRetail: 249000,
    commissionRate: 18,
    channel: "zalo",
    campaign: "autobiz_2026",
    subId: "ctv08_vy",
    baseUrl: "https://shopee.vn/product/2001/fs-hoodie-420gsm",
    targetUrl: "https://shopee.vn/product/2001/fs-hoodie-420gsm?utm_source=zalo&utm_medium=autobiz_ai&utm_campaign=autobiz_2026&sub_id=ctv08_vy",
    clicks: 22,
    estimatedOrders: 1,
    estimatedCommission: 44820,
    confirmedOrders: 2,
    confirmedRevenue: 498000,
    confirmedCommission: 89640,
    createdAt: "2026-11-16T12:30:00.000Z",
    lastClickedAt: "2026-11-24T04:15:00.000Z",
    lastOrderAt: "2026-11-20T19:00:00.000Z"
  }
];

function seedDemoDataset({ includeLinks = true } = {}) {
  writeJsonSafe('products.json', DEMO_PRODUCTS);
  if (includeLinks) {
    writeJsonSafe('affiliate_links.json', DEMO_LINKS);
  }
  return {
    productsCount: DEMO_PRODUCTS.length,
    linksCount: includeLinks ? DEMO_LINKS.length : 0
  };
}

function clearDemoDataset() {
  for (const f of ['products.json', 'affiliate_links.json', 'posts.json', 'circular_queue.json', 'model_templates.json']) {
    writeJsonSafe(f, []);
  }
}

if (require.main === module) {
  const mode = process.argv[2] || '--status';
  if (mode === '--seed') {
    seedDemoDataset({ includeLinks: true });
    console.log(`[Seed Demo Data] Đã nạp ${DEMO_PRODUCTS.length} sản phẩm mẫu thuộc 5 ngành hàng & ${DEMO_LINKS.length} link CTV FinTech.`);
  } else if (mode === '--clear') {
    clearDemoDataset();
    console.log('[Seed Demo Data] Đã xóa sạch toàn bộ dữ liệu local về [] (giữ nguyên settings.json).');
  } else {
    console.log('Cách dùng:');
    console.log('  node scripts/seed_demo_data.js --seed   (Nạp 10 sản phẩm mẫu chuẩn 5 ngành hàng + 8 link CTV)');
    console.log('  node scripts/seed_demo_data.js --clear  (Xóa sạch dữ liệu local về [])');
  }
}

module.exports = { DEMO_PRODUCTS, DEMO_LINKS, seedDemoDataset, clearDemoDataset };
