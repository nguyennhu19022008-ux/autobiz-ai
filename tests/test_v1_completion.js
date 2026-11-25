/**
 * Automated Test Suite — AutoBiz AI v1.0 Completion (12 End-to-End Test Cases)
 * Covers:
 *  TC01 - TC03: Piece 1 (Auto URL Product Extraction & Validation)
 *  TC04 - TC06: Piece 2 (Public Link Bio /u/:username, /api/public/bio/:username & Click Tracking)
 *  TC07 - TC09: Piece 3A (CTV Invite /join/:shopCode, shopOwner Isolation & Affiliate Linking)
 *  TC10 - TC12: Piece 3B (VietQR Payout Request, Validation, Shop Approval & Balance Deduction)
 */
process.env.VG_TEST_MODE = '1';

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = require('../server');

const results = [];
function record(id, name, fn) {
  return async () => {
    const start = Date.now();
    try {
      await fn();
      const ms = Date.now() - start;
      results.push({ id, name, status: 'PASS', ms });
      console.log(`  [PASS] ${id}: ${name} (${ms}ms)`);
    } catch (err) {
      const ms = Date.now() - start;
      results.push({ id, name, status: 'FAIL', ms, error: err.message });
      console.error(`  [FAIL] ${id}: ${name} — ${err.message}`);
      throw err;
    }
  };
}

async function runSuite() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  console.log(`\n=== AUTOBIZ AI v1.0 — AUTOMATED TEST SUITE (${baseUrl}) ===\n`);

  let shopToken = '';
  let ctvToken = '';
  let otherShopToken = '';
  let createdProductId = '';
  let ctvShortCode = '';
  let payoutId = '';

  const cleanupFiles = [
    'data/users.json',
    'data/products.json',
    'data/affiliate_links.json',
    'data/payout_requests.json',
    'data/webhook_logs.json'
  ];

  try {
    // --- PIECE 1: URL EXTRACTOR ---
    await record('TC01', 'Bóc tách sản phẩm từ URL Shopee slug (POST /api/catalog/extract-url)', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/extract-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://shopee.vn/Tai-Nghe-Bluetooth-ANC-Pro-Chinh-Hang-i.12345.67890' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert(data.extracted.name.toLowerCase().includes('tai nghe'), `Tên bóc tách không đúng: ${data.extracted.name}`);
      assert.strictEqual(data.extracted.category, 'accessories');
      assert(data.extracted.sku && data.extracted.sku.length >= 4);
      assert.strictEqual(data.extracted.affiliate_base_url, 'https://shopee.vn/Tai-Nghe-Bluetooth-ANC-Pro-Chinh-Hang-i.12345.67890');
    })();

    await record('TC02', 'Bóc tách phân loại đúng ngành hàng (Gia dụng / Thời trang)', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/extract-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.invalid/noi-chien-khong-dau-philips-6l' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.extracted.category, 'home');
    })();

    await record('TC03', 'Từ chối URL sai định dạng (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/extract-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'not-a-valid-url' })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    })();

    // --- PIECE 2 & 3A SETUP: REGISTER SHOP OWNER + ADD PRODUCT ---
    await record('TC04', 'Chủ shop mới đăng ký, thêm sản phẩm & trang Bio /u/:username hoạt động', async () => {
      const reg = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'shop_alpha@autobiz.vn', password: 'password123', displayName: 'Shop Alpha Official' })
      }).then((r) => r.json());
      assert.strictEqual(reg.success, true);
      const onb = await fetch(`${baseUrl}/api/auth/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reg.token}` },
        body: JSON.stringify({ persona: 'shop_with_affiliates', hasAffiliates: true })
      }).then((r) => r.json());
      assert.strictEqual(onb.success, true);
      shopToken = onb.token;

      const prod = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopToken}` },
        body: JSON.stringify({
          sku: 'ALP01',
          name: 'Bàn Phím Cơ Không Dây Alpha K8',
          category: 'tech',
          price_retail: 1500000,
          commission_rate: 10,
          affiliate_base_url: 'https://shopee.vn/Ban-Phim-Co-Alpha-K8-i.111.222'
        })
      }).then((r) => r.json());
      assert.strictEqual(prod.success, true);
      createdProductId = prod.product.id;

      // Check Public Bio JSON API
      const bioApi = await fetch(`${baseUrl}/api/public/bio/shop_alpha`).then((r) => r.json());
      assert.strictEqual(bioApi.success, true);
      assert.strictEqual(bioApi.profile.displayName, 'Shop Alpha Official');
      assert.strictEqual(bioApi.items.length, 1);
      assert(bioApi.items[0].buyUrl.includes('/r/'), 'Bio item must carry tracked /r/:code URL');
    })();

    await record('TC05', 'Trang SSR Link Bio HTML GET /u/shop_alpha trả HTTP 200 & có sản phẩm', async () => {
      const res = await fetch(`${baseUrl}/u/shop_alpha`);
      assert.strictEqual(res.status, 200);
      const html = await res.text();
      assert(html.includes('Shop Alpha Official'));
      assert(html.includes('Bàn Phím Cơ Không Dây Alpha K8'));
      assert(html.includes('/r/'));
    })();

    await record('TC06', 'Trang Bio của username không tồn tại trả HTTP 404 sạch sẽ', async () => {
      const res = await fetch(`${baseUrl}/u/non_existent_user_999`);
      assert.strictEqual(res.status, 404);
    })();

    // --- PIECE 3A: CTV INVITE /join/:shopCode & ISOLATION ---
    await record('TC07', 'CTV đăng ký qua Link Mời /join/shop_alpha tự động gắn shopOwner=shop_alpha', async () => {
      const joinPage = await fetch(`${baseUrl}/join/shop_alpha`);
      assert.strictEqual(joinPage.status, 200);

      const regCtv = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ctv_beta@autobiz.vn',
          password: 'password123',
          displayName: 'CTV Beta',
          inviteShopOwner: 'shop_alpha'
        })
      }).then((r) => r.json());
      assert.strictEqual(regCtv.success, true);
      assert.strictEqual(regCtv.user.role, 'ctv');
      assert.strictEqual(regCtv.user.shopOwner, 'shop_alpha');
      assert.strictEqual(regCtv.user.persona, 'shop_ctv');
      ctvToken = regCtv.token;
    })();

    await record('TC08', 'CTV thấy đúng kho hàng của Shop đã mời & Chủ shop thấy CTV trong danh sách', async () => {
      const ctvCatalog = await fetch(`${baseUrl}/api/products`, {
        headers: { Authorization: `Bearer ${ctvToken}` }
      }).then((r) => r.json());
      assert.strictEqual(ctvCatalog.products.length, 1);
      assert.strictEqual(ctvCatalog.products[0].id, createdProductId);

      const shopUsers = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${shopToken}` }
      }).then((r) => r.json());
      assert(shopUsers.users.some((u) => u.username === 'ctv_beta'), 'Shop Alpha must see ctv_beta in its CTV list');
    })();

    await record('TC09', 'CTV tạo shortlink & chốt đơn Webhook -> Cộng đúng hoa hồng 150.000đ', async () => {
      const sl = await fetch(`${baseUrl}/api/affiliate/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvToken}` },
        body: JSON.stringify({
          baseUrl: 'https://shopee.vn/Ban-Phim-Co-Alpha-K8-i.111.222',
          productId: createdProductId,
          productName: 'Bàn Phím Cơ Không Dây Alpha K8',
          priceRetail: 1500000,
          commissionRate: 10,
          channel: 'instagram'
        })
      }).then((r) => r.json());
      assert.strictEqual(sl.success, true);
      ctvShortCode = sl.entry.shortCode;
      assert.strictEqual(sl.entry.shopOwner, 'shop_alpha');

      // Fire order webhook (completed, 1.500.000đ -> 10% = 150.000đ commission)
      const wh = await fetch(`${baseUrl}/api/webhooks/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'autobiz_wh_secret_2026' },
        body: JSON.stringify({
          orderId: 'ORD-V1-TEST-001',
          shortCode: ctvShortCode,
          orderAmount: 1500000,
          quantity: 1,
          status: 'completed',
          source: 'shopee'
        })
      }).then((r) => r.json());
      assert.strictEqual(wh.success, true);
      assert.strictEqual(wh.link.confirmedCommission, 150000);
    })();

    // --- PIECE 3B: VIETQR PAYOUT WORKFLOW ---
    await record('TC10', 'CTV gửi yêu cầu rút vượt số dư bị từ chối (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvToken}` },
        body: JSON.stringify({
          amount: 500000,
          bankCode: 'MB',
          accountNumber: '0987654321',
          accountName: 'NGUYEN VAN BETA'
        })
      });
      assert.strictEqual(res.status, 400);
    })();

    await record('TC11', 'CTV gửi yêu cầu rút 100.000đ thành công & tự sinh link ảnh VietQR chuẩn Napas', async () => {
      const res = await fetch(`${baseUrl}/api/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvToken}` },
        body: JSON.stringify({
          amount: 100000,
          bankCode: 'MB',
          accountNumber: '0987654321',
          accountName: 'NGUYEN VAN BETA'
        })
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.payout.status, 'pending');
      assert(data.payout.vietQrUrl.startsWith('https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=100000'));
      payoutId = data.payout.id;

      // Balance should now be 150.000 - 100.000 = 50.000đ available
      const bal = await fetch(`${baseUrl}/api/payouts`, {
        headers: { Authorization: `Bearer ${ctvToken}` }
      }).then((r) => r.json());
      assert.strictEqual(bal.balance.availableBalance, 50000);
      assert.strictEqual(bal.balance.pendingAmount, 100000);
    })();

    await record('TC12', 'Chủ shop khác bị chặn duyệt (403); Chủ shop Alpha duyệt thành công (200) -> Cập nhật Đã thanh toán', async () => {
      // Register another shop owner
      const regOther = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'shop_gamma@autobiz.vn', password: 'password123' })
      }).then((r) => r.json());
      otherShopToken = regOther.token;

      // Shop Gamma cannot approve Shop Alpha's CTV payout
      const forbidden = await fetch(`${baseUrl}/api/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherShopToken}` },
        body: JSON.stringify({ status: 'paid' })
      });
      assert.strictEqual(forbidden.status, 403);

      // Shop Alpha approves payout
      const ok = await fetch(`${baseUrl}/api/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopToken}` },
        body: JSON.stringify({ status: 'paid' })
      });
      assert.strictEqual(ok.status, 200);
      const okJson = await ok.json();
      assert.strictEqual(okJson.payout.status, 'paid');

      // Verify CTV balance reflects paidAmount = 100.000, pending = 0, available = 50.000
      const finalBal = await fetch(`${baseUrl}/api/payouts`, {
        headers: { Authorization: `Bearer ${ctvToken}` }
      }).then((r) => r.json());
      assert.strictEqual(finalBal.balance.paidAmount, 100000);
      assert.strictEqual(finalBal.balance.pendingAmount, 0);
      assert.strictEqual(finalBal.balance.availableBalance, 50000);
    })();

    console.log(`\n=== KẾT QUẢ: ${results.filter((r) => r.status === 'PASS').length}/${results.length} TEST CASES PASSED (100%) ===\n`);
  } finally {
    server.close();
    for (const rel of cleanupFiles) {
      const full = path.join(__dirname, '..', rel);
      if (fs.existsSync(full)) {
        if (rel === 'data/users.json' || rel === 'data/payout_requests.json') {
          fs.unlinkSync(full);
        } else {
          fs.writeFileSync(full, '[]', 'utf8');
        }
      }
    }
  }
}

runSuite().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
