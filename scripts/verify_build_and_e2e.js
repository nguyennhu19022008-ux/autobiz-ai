/**
 * scripts/verify_build_and_e2e.js
 * Kịch bản Kiểm định Đóng gói Production, HTTP 200, Luồng End-to-End & Responsive (Giai đoạn 5: CV12 – CV15)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

function checkStaticPackaging() {
  console.log('--- [CV12] KIỂM TRA ĐÓNG GÓI PRODUCTION & CACHE-CONTROL ---');

  const requiredFiles = [
    'server.js',
    'api/index.js',
    'vercel.json',
    'public/index.html',
    'public/css/style.css',
    'public/js/autobiz.js',
    'public/manifest.json',
    'public/icons/icon.svg',
    'services/gemini.js',
    'services/catalog.js',
    'services/affiliate.js',
    'services/scheduler.js',
    'extension/manifest.json',
    'extension/popup.html',
    'extension/popup.js',
    'public/pitch-deck.html',
    'public/charts/chart1_b2b_scale_channels.png',
    'public/charts/chart6_adoption_comparison.png'
  ];

  for (const rel of requiredFiles) {
    const full = path.join(ROOT, rel);
    assert(fs.existsSync(full), `Thiếu tệp bắt buộc: ${rel}`);
    const stat = fs.statSync(full);
    assert(stat.size > 0, `Tệp rỗng (0 byte): ${rel}`);
  }
  console.log('- [OK] 15/15 tệp tĩnh và module cốt lõi tồn tại đầy đủ.');

  // Kiểm tra vercel.json
  const vercelCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const headersStr = JSON.stringify(vercelCfg.headers || []);
  assert(!headersStr.includes('immutable'), 'LỖI: Không được dùng Cache-Control immutable cho tài nguyên không hash!');
  assert(headersStr.includes('must-revalidate'), 'Thiếu cấu hình Cache-Control: must-revalidate trong vercel.json');

  const rewritesStr = JSON.stringify(vercelCfg.rewrites || []);
  assert(rewritesStr.includes('/r/(.*)'), 'Thiếu rewrite /r/(.*) trong vercel.json');
  console.log('- [OK] Cấu hình vercel.json hợp lệ (Cache-Control an toàn & định tuyến /r/:code đầy đủ).');

  // Kiểm tra query string cache-busting trong index.html
  const indexHtml = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
  assert(indexHtml.includes('/css/style.css?v=20261124_v5'), 'Thiếu cache-busting trên style.css trong index.html');
  assert(indexHtml.includes('/js/autobiz.js?v=20261124_v5'), 'Thiếu cache-busting trên autobiz.js trong index.html');
  assert(!indexHtml.includes('id="modalOnboarding"'), 'Vẫn còn sót modal onboarding cũ #modalOnboarding trong index.html');
  assert(indexHtml.includes('id="btnLogout"'), 'Thiếu nút Đăng xuất #btnLogout trong index.html');
  console.log('- [OK] Đã gắn query string cache-busting (?v=20261124_v5), có nút Đăng xuất và đã gỡ bỏ modal onboarding cũ.');

  // Kiểm tra Responsive & Calm Mobile Performance trong style.css
  const styleCss = fs.readFileSync(path.join(ROOT, 'public/css/style.css'), 'utf8');
  assert(styleCss.includes('@media (max-width: 1440px)'), 'Thiếu breakpoint 1440px');
  assert(styleCss.includes('@media (max-width: 1024px)'), 'Thiếu breakpoint 1024px');
  assert(styleCss.includes('@media (max-width: 768px)'), 'Thiếu breakpoint 768px');
  assert(styleCss.includes('@media (max-width: 420px)'), 'Thiếu breakpoint mobile 375px/420px');
  assert(styleCss.includes('animation: none !important'), 'Thiếu quy tắc Calm Mobile Performance (animation: none !important)');
  console.log('- [OK] Đạt chuẩn Responsive 4 khung hình (375px, 768px, 1024px, 1440px) & Calm Mobile Performance.');
}

async function runEndToEndVerify() {
  console.log('\n--- [CV13 - CV14] KIỂM THỬ MÁY CHỦ HTTP 200 & LUỒNG END-TO-END ---');

  const app = require('../server.js');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`- Đã khởi chạy máy chủ kiểm thử tại ${baseUrl}`);

  try {
    // 1. Kiểm tra HTTP 200 trên toàn bộ các trang và tài nguyên tĩnh
    const staticEndpoints = [
      '/',
      '/admin',
      '/app',
      '/dashboard',
      '/cockpit',
      '/css/style.css?v=20261124_v5',
      '/js/autobiz.js?v=20261124_v5',
      '/manifest.json',
      '/icons/icon.svg',
      '/api/settings',
      '/api/products',
      '/api/affiliate/links',
      '/api/analytics/summary',
      '/slides',
      '/pitch-deck',
      '/charts/chart1_b2b_scale_channels.png',
      '/charts/chart6_adoption_comparison.png'
    ];

    for (const ep of staticEndpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      assert.strictEqual(res.status, 200, `Endpoint ${ep} trả về HTTP ${res.status} thay vì 200 OK`);
    }
    console.log(`- [OK] Tất cả ${staticEndpoints.length}/${staticEndpoints.length} đường dẫn Giao diện, Asset & API trả về HTTP 200 OK (0 lỗi 404).`);

    // 2. Test bước 1: Thêm sản phẩm mới vào Kho hàng đa ngành (POST /api/products)
    const prodRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: 'E2E-PK01',
        name: 'Tai Nghe Bluetooth Chống Ồn ANC Pro',
        category: 'accessories',
        price_retail: 400000,
        commission_rate: 15,
        affiliate_base_url: 'https://shopee.vn/product/1001/pk-anc-pro',
        specs: { 'Pin': '36 giờ', 'Chống ồn': '42dB' }
      })
    });
    assert.strictEqual(prodRes.status, 201, 'POST /api/products phải trả về HTTP 201');
    const prodJson = await prodRes.json();
    assert(prodJson.success && prodJson.product.id, 'Sản phẩm tạo mới thiếu ID');
    console.log(`- [OK] Bước 1 (Kho hàng): Tạo sản phẩm đa ngành thành công (${prodJson.product.sku}).`);

    // 3. Test bước 2: Tạo Shortlink Affiliate (/api/affiliate/shorten)
    const linkRes = await fetch(`${baseUrl}/api/affiliate/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: prodJson.product.id,
        productName: prodJson.product.name,
        priceRetail: 400000,
        commissionRate: 15,
        channel: 'tiktok',
        campaign: 'e2e_verify_2026',
        subId: 'vuonggia',
        baseUrl: 'https://shopee.vn/product/1001/pk-anc-pro'
      })
    });
    assert.strictEqual(linkRes.status, 201, 'POST /api/affiliate/shorten phải trả về HTTP 201');
    const linkJson = await linkRes.json();
    const shortCode = linkJson.link.shortCode;
    assert(shortCode, 'Shortlink không trả về shortCode');
    console.log(`- [OK] Bước 2 (Shortlink): Đã tạo link rút gọn /r/${shortCode}.`);

    // 4. Test bước 3: Giả lập người mua bấm vào link /r/:shortCode
    const clickRes = await fetch(`${baseUrl}/r/${shortCode}`, { redirect: 'manual' });
    assert.strictEqual(clickRes.status, 302, 'GET /r/:code phải trả về HTTP 302 Redirect');
    const loc = clickRes.headers.get('location') || '';
    assert(loc.includes('utm_source=tiktok') && loc.includes('sub_id=vuonggia'), `URL đích thiếu tham số UTM: ${loc}`);
    console.log(`- [OK] Bước 3 (Click Tracking): GET /r/${shortCode} chuyển hướng 302 chuẩn xác tới: ${loc}`);

    // 5. Test bước 4: Kiểm tra Dashboard Analytics nhảy số click & hoa hồng dự kiến
    const sumRes = await fetch(`${baseUrl}/api/analytics/summary`);
    const sumJson = await sumRes.json();
    assert.strictEqual(sumJson.summary.totalProducts, 1, 'Tổng sản phẩm phải bằng 1');
    assert.strictEqual(sumJson.summary.totalClicks, 1, 'Tổng lượt click phải tăng lên 1');
    assert(sumJson.summary.totalEstimatedCommission > 0, 'Hoa hồng dự kiến phải > 0 VNĐ');
    console.log(`- [OK] Bước 4 (FinTech Analytics): Lượt click = ${sumJson.summary.totalClicks}, Hoa hồng ước tính = ${sumJson.summary.totalEstimatedCommission.toLocaleString('vi-VN')} VNĐ.`);

  } finally {
    // Khôi phục lại dữ liệu local sạch [] như người dùng yêu cầu
    const dataDir = path.join(ROOT, 'data');
    for (const f of ['products.json', 'affiliate_links.json', 'posts.json', 'circular_queue.json', 'model_templates.json']) {
      fs.writeFileSync(path.join(dataDir, f), '[]', 'utf8');
    }
    console.log('- [OK] Đã làm sạch lại dữ liệu test (data/*.json = []) sau khi hoàn tất kiểm thử.');
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  checkStaticPackaging();
  await runEndToEndVerify();
  console.log('\n=== TẤT CẢ CÁC BÀI KIỂM ĐỊNH GIAI ĐOẠN 5 (CV12 - CV15) ĐẠT 100% ===');
}

main().catch((err) => {
  console.error('KIỂM ĐỊNH THẤT BẠI:', err);
  process.exit(1);
});
