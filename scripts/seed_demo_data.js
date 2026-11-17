/**
 * scripts/seed_demo_data.js
 * Công cụ Quản trị Dữ liệu Demo Chuẩn 5 Ngành Hàng cho AutoBiz AI (CV11 - Giai đoạn 4)
 * - Chạy `node scripts/seed_demo_data.js --seed`  : Nạp nhanh 10 sản phẩm mẫu chuẩn 5 ngành hàng khi chuẩn bị trình diễn trước BGK.
 * - Chạy `node scripts/seed_demo_data.js --clear` : Xóa sạch toàn bộ dữ liệu local về mảng rỗng [] (UTF-8 không BOM).
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const DEMO_PRODUCTS = [
  {
    id: "prod_pk01",
    sku: "PK-ANC-PRO",
    name: "Tai Nghe Bluetooth Chống Ồn Chủ Động ANC Pro Gen 3",
    category: "accessories",
    price_retail: 390000,
    commission_rate: 15,
    affiliate_base_url: "https://shopee.vn/product/1001/pk-anc-pro",
    specs: { "Chống ồn": "ANC 42dB", "Pin": "36 giờ", "Kết nối": "Bluetooth 5.4" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:00:00.000Z"
  },
  {
    id: "prod_pk02",
    sku: "PK-GA65W",
    name: "Củ Sạc Nhanh GaN 65W 3 Cổng Type-C Đa Năng",
    category: "accessories",
    price_retail: 285000,
    commission_rate: 14,
    affiliate_base_url: "https://shopee.vn/product/1002/pk-gan-65w",
    specs: { "Công suất": "65W PD 3.0", "Số cổng": "2 USB-C + 1 USB-A", "Công nghệ": "GaN Thế hệ 3" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:05:00.000Z"
  },
  {
    id: "prod_fs01",
    sku: "FS-HOODIE-420",
    name: "Áo Hoodie Oversize Nỉ Chân Cua 420GSM Form Boxy Gen Z",
    category: "fashion",
    price_retail: 249000,
    commission_rate: 18,
    affiliate_base_url: "https://shopee.vn/product/2001/fs-hoodie-420gsm",
    specs: { "Chất liệu": "Nỉ chân cua 100% Cotton 420GSM", "Form dáng": "Boxy Oversize", "Size": "M / L / XL" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:10:00.000Z"
  },
  {
    id: "prod_fs02",
    sku: "FS-BALO-LAP",
    name: "Balo Học Đường Chống Nước Ngăn Laptop 15.6 Inch Tối Giản",
    category: "fashion",
    price_retail: 320000,
    commission_rate: 16,
    affiliate_base_url: "https://shopee.vn/product/2002/fs-balo-minimal",
    specs: { "Chất vải": "Oxford 900D trượt nước", "Ngăn chống sốc": "Laptop 15.6 inch", "Trọng lượng": "620g" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:15:00.000Z"
  },
  {
    id: "prod_hm01",
    sku: "HM-LAMP-CRI95",
    name: "Đèn Bàn Học Chống Cận LED Quang Phổ Tự Nhiên CRI>95",
    category: "home",
    price_retail: 350000,
    commission_rate: 15,
    affiliate_base_url: "https://shopee.vn/product/3001/hm-led-cri95",
    specs: { "Chỉ số hoàn màu": "Ra > 95", "Chế độ sáng": "3 nhiệt độ màu (3000K-5000K)", "Hẹn giờ": "Tự tắt sau 45 phút" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:20:00.000Z"
  },
  {
    id: "prod_hm02",
    sku: "HM-THERMO-800",
    name: "Bình Giữ Nhiệt Inox 316 Hiển Thị Nhiệt Độ Thông Minh 800ml",
    category: "home",
    price_retail: 195000,
    commission_rate: 20,
    affiliate_base_url: "https://shopee.vn/product/3002/hm-thermo-800ml",
    specs: { "Lõi": "Inox 316 chuẩn y tế", "Dung tích": "800ml", "Giữ nhiệt": "Nóng/Lạnh 24 giờ" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:25:00.000Z"
  },
  {
    id: "prod_fm01",
    sku: "FM-SUN-SPF50",
    name: "Kem Chống Nắng Kiềm Dầu Cho Da Học Đường SPF50+ PA++++",
    category: "fmcg",
    price_retail: 189000,
    commission_rate: 22,
    affiliate_base_url: "https://shopee.vn/product/4001/fm-sunscreen-spf50",
    specs: { "Chỉ số": "SPF50+ PA++++", "Dung tích": "50ml", "Đặc tính": "Kiềm dầu 8h, nâng tông nhẹ" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:30:00.000Z"
  },
  {
    id: "prod_fm02",
    sku: "FM-GRANOLA-500",
    name: "Ngũ Cốc Dinh Dưỡng Granola Siêu Hạt Không Đường 500g",
    category: "fmcg",
    price_retail: 145000,
    commission_rate: 18,
    affiliate_base_url: "https://shopee.vn/product/4002/fm-granola-500g",
    specs: { "Thành phần": "Hạt điều, hạnh nhân, óc chó, yến mạch nướng mật ong", "Trọng lượng": "500g" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:35:00.000Z"
  },
  {
    id: "prod_tc01",
    sku: "TC-MECH-K75",
    name: "Bàn Phím Cơ Không Dây Layout 75% Hotswap 3 Mode Pin 4000mAh",
    category: "tech",
    price_retail: 690000,
    commission_rate: 12,
    affiliate_base_url: "https://shopee.vn/product/5001/tc-mech-k75",
    specs: { "Kết nối": "Bluetooth / 2.4GHz / Type-C", "Switch": "Linear Pre-lubed", "Cấu trúc": "Gasket Mount" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:40:00.000Z"
  },
  {
    id: "prod_tc02",
    sku: "TC-SSD-1TB",
    name: "Ổ Cứng Di Động SSD NVMe Tốc Độ 1050MB/s Chuẩn USB 3.2 Gen 2 (1TB)",
    category: "tech",
    price_retail: 1590000,
    commission_rate: 8,
    affiliate_base_url: "https://shopee.vn/product/5002/tc-ssd-1tb",
    specs: { "Dung lượng": "1TB", "Tốc độ đọc": "1050MB/s", "Vỏ": "Hợp kim nhôm chống sốc" },
    media_urls: [],
    status: "active",
    created_at: "2026-11-15T08:45:00.000Z"
  }
];

function writeJsonNoBom(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
}

function run() {
  const mode = process.argv[2] || '--status';

  if (mode === '--seed') {
    writeJsonNoBom(path.join(DATA_DIR, 'products.json'), DEMO_PRODUCTS);
    console.log(`[Seed Demo Data] Đã nạp ${DEMO_PRODUCTS.length} sản phẩm mẫu thuộc 5 ngành hàng vào data/products.json.`);
  } else if (mode === '--clear') {
    for (const f of ['products.json', 'affiliate_links.json', 'posts.json', 'circular_queue.json', 'model_templates.json']) {
      writeJsonNoBom(path.join(DATA_DIR, f), []);
    }
    console.log('[Seed Demo Data] Đã xóa sạch toàn bộ dữ liệu local về [] (giữ nguyên settings.json).');
  } else {
    console.log('Cách dùng:');
    console.log('  node scripts/seed_demo_data.js --seed   (Nạp 10 sản phẩm mẫu chuẩn 5 ngành hàng)');
    console.log('  node scripts/seed_demo_data.js --clear  (Xóa sạch dữ liệu local về [])');
  }
}

run();
