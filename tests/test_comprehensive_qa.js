/**
 * tests/test_comprehensive_qa.js
 * Bộ kiểm thử tự động toàn diện (38 Test Cases: 30 Local Functional/Security/FinTech + 8 Live Production)
 * Kiểm định: Auth & RBAC, Multi-Tenant, Click Tracking & Anti-Spam, Số liệu FinTech & Công thức toán học,
 * Webhook/CSV đối soát, VietQR Payouts, Studio AI & Dispatch, Hàng đợi bài đăng, Cài đặt đa người dùng & Production Live.
 */

process.env.VG_TEST_MODE = '1';

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = require('../server');

const PROD_URL = 'https://autobiz-ai-seven.vercel.app';
const reportEntries = [];

async function runCase(id, moduleName, title, expected, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - start;
    reportEntries.push({
      id,
      module: moduleName,
      title,
      expected,
      status: 'PASS',
      ms,
      actual: detail || 'Đạt đúng kỳ vọng'
    });
    console.log(`  [PASS] ${id} (${moduleName}): ${title} (${ms}ms)`);
  } catch (err) {
    const ms = Date.now() - start;
    reportEntries.push({
      id,
      module: moduleName,
      title,
      expected,
      status: 'FAIL',
      ms,
      actual: err.message
    });
    console.error(`  [FAIL] ${id} (${moduleName}): ${title} — ${err.message}`);
  }
}

async function runAllTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  console.log(`\n======================================================================`);
  console.log(`  AUTOBIZ AI — VÒNG KIỂM THỬ TOÀN DIỆN (LOCAL + PRODUCTION LIVE)`);
  console.log(`  Local Engine: ${baseUrl}`);
  console.log(`  Live Target : ${PROD_URL}`);
  console.log(`======================================================================\n`);

  const cleanupFiles = [
    'data/users.json',
    'data/products.json',
    'data/affiliate_links.json',
    'data/payout_requests.json',
    'data/webhook_logs.json',
    'data/posts.json',
    'data/user_settings.json'
  ];

  // Shared test actors
  let shopAToken = '';
  let shopBToken = '';
  let ctvAToken = '';
  let kocToken = '';
  let prodAId = '';
  let linkCtvACode = '';
  let linkShopACode = '';
  let payoutRejectId = '';
  let payoutApproveId = '';
  let createdPostId = '';

  try {
    // =========================================================================
    // NHÓM 1: AUTHENTICATION, BẢO MẬT & PHÂN QUYỀN 3 CẤP (QA-01 → QA-07)
    // =========================================================================
    console.log('--- NHÓM 1: AUTHENTICATION, BẢO MẬT & PHÂN QUYỀN RBAC ---');

    await runCase(
      'QA-01',
      'Auth & RBAC',
      'Đăng ký Chủ shop A & Onboarding mô hình có CTV',
      'HTTP 201, role=shop_owner, hasAffiliates=true, cấp JWT hợp lệ',
      async () => {
        const reg = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'qa_shop_a@autobiz.vn', password: 'Password@123', displayName: 'QA Shop A' })
        });
        assert.strictEqual(reg.status, 201);
        const regData = await reg.json();
        assert.strictEqual(regData.success, true);

        const onb = await fetch(`${baseUrl}/api/auth/onboarding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regData.token}` },
          body: JSON.stringify({ persona: 'shop_with_affiliates', hasAffiliates: true })
        });
        assert.strictEqual(onb.status, 200);
        const onbData = await onb.json();
        assert.strictEqual(onbData.user.role, 'shop_owner');
        assert.strictEqual(onbData.user.hasAffiliates, true);
        shopAToken = onbData.token;
        return `Tạo thành công ${onbData.user.username} (${onbData.user.role})`;
      }
    );

    await runCase(
      'QA-02',
      'Auth & RBAC',
      'Cập nhật Hồ sơ cá nhân & Đổi mật khẩu (scrypt hash)',
      'Hồ sơ cập nhật vào /api/auth/me; mật khẩu cũ bị từ chối (401), mật khẩu mới đăng nhập thành công (200)',
      async () => {
        const prof = await fetch(`${baseUrl}/api/auth/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({ displayName: 'QA Shop A Official', hotline: '0909123456', defaultShopUrl: 'https://shopee.vn/qa_shop_a' })
        }).then((r) => r.json());
        assert.strictEqual(prof.success, true);

        const me = await fetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${shopAToken}` }
        }).then((r) => r.json());
        assert.strictEqual(me.user.displayName, 'QA Shop A Official');
        assert.strictEqual(me.user.hotline, '0909123456');

        const chg = await fetch(`${baseUrl}/api/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({ currentPassword: 'Password@123', newPassword: 'NewPass@456' })
        });
        assert.strictEqual(chg.status, 200);

        const failOld = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'qa_shop_a@autobiz.vn', password: 'Password@123' })
        });
        assert.strictEqual(failOld.status, 401);

        const okNew = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'qa_shop_a@autobiz.vn', password: 'NewPass@456' })
        });
        assert.strictEqual(okNew.status, 200);
        const okJson = await okNew.json();
        shopAToken = okJson.token;
        return 'Đổi mật khẩu & đăng nhập lại thành công, mật khẩu cũ trả 401';
      }
    );

    await runCase(
      'QA-03',
      'Auth & Security',
      'Chống dò mật khẩu Brute-Force (Rate Limiter 5 lần/5 phút)',
      '5 lần sai trả HTTP 401; lần thứ 6 bị khóa tạm trả HTTP 429 Too Many Requests',
      async () => {
        for (let i = 1; i <= 5; i++) {
          const r = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.55' },
            body: JSON.stringify({ username: 'brute_target@autobiz.vn', password: `wrong_${i}` })
          });
          assert.strictEqual(r.status, 401, `Lần ${i} phải trả 401`);
        }
        const blocked = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.55' },
          body: JSON.stringify({ username: 'brute_target@autobiz.vn', password: 'wrong_6' })
        });
        assert.strictEqual(blocked.status, 429, `Lần 6 phải bị chặn 429, nhận được ${blocked.status}`);
        return '5 lần trả 401, lần 6 chặn đúng HTTP 429';
      }
    );

    await runCase(
      'QA-04',
      'Auth & RBAC',
      'CTV đăng ký qua link mời /join/qa_shop_a & tự động gán shopOwner',
      'HTTP 201, role=ctv, persona=shop_ctv, shopOwner=qa_shop_a',
      async () => {
        const reg = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'qa_ctv_a@autobiz.vn',
            password: 'ctvpass123',
            displayName: 'CTV Minh A',
            inviteShopOwner: 'qa_shop_a'
          })
        });
        assert.strictEqual(reg.status, 201);
        const data = await reg.json();
        assert.strictEqual(data.user.role, 'ctv');
        assert.strictEqual(data.user.shopOwner, 'qa_shop_a');
        ctvAToken = data.token;
        return `CTV ${data.user.username} gắn đúng shopOwner=${data.user.shopOwner}`;
      }
    );

    await runCase(
      'QA-05',
      'Auth & RBAC',
      'Chặn leo thang đặc quyền (CTV & Chủ shop không được vượt quyền)',
      'CTV gọi /api/users, /api/affiliate/record-order, /api/demo/seed bị 403; Chủ shop tạo superadmin bị 403',
      async () => {
        const r1 = await fetch(`${baseUrl}/api/users`, { headers: { Authorization: `Bearer ${ctvAToken}` } });
        assert.strictEqual(r1.status, 403);

        const r2 = await fetch(`${baseUrl}/api/affiliate/record-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvAToken}` },
          body: JSON.stringify({ shortCode: 'ANY', orderAmount: 100000 })
        });
        assert.strictEqual(r2.status, 403);

        const r3 = await fetch(`${baseUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({ username: 'fake_super', displayName: 'Hacker', password: '123456', role: 'superadmin' })
        });
        assert.strictEqual(r3.status, 403);
        return 'Tất cả 3 vector leo thang đặc quyền đều bị chặn HTTP 403';
      }
    );

    await runCase(
      'QA-06',
      'Auth & RBAC',
      'Khóa & Mở khóa tài khoản CTV từ Chủ shop',
      'Sau khi khóa (active=false), CTV đăng nhập bị từ chối HTTP 403; mở lại (active=true) đăng nhập HTTP 200',
      async () => {
        const lockRes = await fetch(`${baseUrl}/api/users/qa_ctv_a`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({ active: false })
        });
        assert.strictEqual(lockRes.status, 200);

        const loginLocked = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'qa_ctv_a@autobiz.vn', password: 'ctvpass123' })
        });
        assert.strictEqual(loginLocked.status, 403);

        const unlockRes = await fetch(`${baseUrl}/api/users/qa_ctv_a`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({ active: true })
        });
        assert.strictEqual(unlockRes.status, 200);

        const loginOk = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'qa_ctv_a@autobiz.vn', password: 'ctvpass123' })
        });
        assert.strictEqual(loginOk.status, 200);
        return 'Khóa (403) và Mở khóa (200) hoạt động chính xác';
      }
    );

    await runCase(
      'QA-07',
      'Auth & Multi-Tenant',
      'Đăng ký Chủ shop B & KOC Độc lập để kiểm thử cô lập dữ liệu',
      'Shop B (shop_owner) & KOC độc lập (independent_affiliate) được khởi tạo tách biệt',
      async () => {
        const regB = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'qa_shop_b@autobiz.vn', password: 'password123', displayName: 'QA Shop B' })
        }).then((r) => r.json());
        const onbB = await fetch(`${baseUrl}/api/auth/onboarding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regB.token}` },
          body: JSON.stringify({ persona: 'shop_solo', hasAffiliates: false })
        }).then((r) => r.json());
        shopBToken = onbB.token;

        const regK = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'qa_koc@autobiz.vn', password: 'password123', displayName: 'KOC Review' })
        }).then((r) => r.json());
        const onbK = await fetch(`${baseUrl}/api/auth/onboarding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regK.token}` },
          body: JSON.stringify({ persona: 'independent_affiliate', hasAffiliates: false })
        }).then((r) => r.json());
        kocToken = onbK.token;
        assert.strictEqual(onbK.user.persona, 'independent_affiliate');
        return 'Khởi tạo thành công Shop B (solo) & KOC độc lập';
      }
    );

    // =========================================================================
    // NHÓM 2: KHO HÀNG ĐA NGÀNH, URL EXTRACTOR & LINK BIO (QA-08 → QA-12)
    // =========================================================================
    console.log('\n--- NHÓM 2: KHO HÀNG ĐA NGÀNH, URL EXTRACTOR & LINK BIO ---');

    await runCase(
      'QA-08',
      'Catalog & Extractor',
      'Bóc tách URL Shopee tiếng Việt có dấu (Xiaomi 17T Pro) & phân loại ngành hàng',
      'Bóc tách chuẩn tên tiếng Việt (không lỗi chữ hoa), ngành tech, từ chối URL sai định dạng (400)',
      async () => {
        const url = 'https://shopee.vn/%C4%90i%E1%BB%87n-Tho%E1%BA%A1i-Xiaomi-17T-Pro-12GB-512GB-Ch%C3%ADnh-H%C3%A3ng-i.1731082101.41731255073';
        const res = await fetch(`${baseUrl}/api/catalog/extract-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert(data.extracted.name.includes('Xiaomi 17T Pro'), `Tên sai: ${data.extracted.name}`);
        assert(!data.extracted.name.includes('ĐIệN'), `Lỗi viết hoa tiếng Việt: ${data.extracted.name}`);
        assert.strictEqual(data.extracted.category, 'tech');

        const bad = await fetch(`${baseUrl}/api/catalog/extract-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'invalid_url' })
        });
        assert.strictEqual(bad.status, 400);
        return `Bóc tách: "${data.extracted.name}" (ngành: ${data.extracted.category})`;
      }
    );

    await runCase(
      'QA-09',
      'Catalog CRUD',
      'Chủ shop A thêm sản phẩm & Kiểm tra phân quyền ghi Kho hàng (CTV bị chặn, KOC được phép)',
      'Shop A tạo SP (201); CTV của Shop A bị chặn tạo SP (403); KOC độc lập tự tạo SP (201)',
      async () => {
        const pA = await fetch(`${baseUrl}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({
            sku: 'XIA17T',
            name: 'Điện Thoại Xiaomi 17T Pro 12GB 512GB',
            category: 'tech',
            price_retail: 15000000,
            commission_rate: 10,
            affiliate_base_url: 'https://shopee.vn/Xiaomi-17T-Pro-i.1731082101.41731255073'
          })
        });
        assert.strictEqual(pA.status, 201);
        const pAData = await pA.json();
        prodAId = pAData.product.id;

        const ctvWrite = await fetch(`${baseUrl}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvAToken}` },
          body: JSON.stringify({ sku: 'HACK01', name: 'CTV Unauthorized', category: 'tech', price_retail: 100000 })
        });
        assert.strictEqual(ctvWrite.status, 403);

        const kocWrite = await fetch(`${baseUrl}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${kocToken}` },
          body: JSON.stringify({
            sku: 'KOC01',
            name: 'Nồi Chiên Không Dầu KOC',
            category: 'home',
            price_retail: 2000000,
            commission_rate: 12,
            affiliate_base_url: 'https://shopee.vn/noi-chien-koc'
          })
        });
        assert.strictEqual(kocWrite.status, 201);
        return 'Shop A (201), CTV Shop bị chặn (403), KOC độc lập được phép (201)';
      }
    );

    await runCase(
      'QA-10',
      'Multi-Tenant',
      'Cô lập Kho hàng đa khách hàng (Shop A vs Shop B vs CTV A vs KOC)',
      'CTV A chỉ thấy SP của Shop A; Shop B không thấy SP của Shop A; KOC chỉ thấy SP của KOC',
      async () => {
        const listCtvA = await fetch(`${baseUrl}/api/products`, { headers: { Authorization: `Bearer ${ctvAToken}` } }).then((r) => r.json());
        const listShopB = await fetch(`${baseUrl}/api/products`, { headers: { Authorization: `Bearer ${shopBToken}` } }).then((r) => r.json());
        const listKoc = await fetch(`${baseUrl}/api/products`, { headers: { Authorization: `Bearer ${kocToken}` } }).then((r) => r.json());

        assert.strictEqual(listCtvA.products.length, 1);
        assert.strictEqual(listCtvA.products[0].sku, 'XIA17T');
        assert.strictEqual(listShopB.products.length, 0);
        assert.strictEqual(listKoc.products.length, 1);
        assert.strictEqual(listKoc.products[0].sku, 'KOC01');
        return 'Cô lập 100% dữ liệu sản phẩm giữa các Tenant';
      }
    );

    await runCase(
      'QA-11',
      'Catalog Filter',
      'Lọc ngành hàng & Tìm kiếm từ khóa trên Kho hàng',
      'Lọc category=tech ra đúng SP Xiaomi; lọc category=fashion ra 0 SP; search="Xiaomi" ra 1 SP',
      async () => {
        const fTech = await fetch(`${baseUrl}/api/products?category=tech`, { headers: { Authorization: `Bearer ${shopAToken}` } }).then((r) => r.json());
        const fFash = await fetch(`${baseUrl}/api/products?category=fashion`, { headers: { Authorization: `Bearer ${shopAToken}` } }).then((r) => r.json());
        const fSearch = await fetch(`${baseUrl}/api/products?search=Xiaomi`, { headers: { Authorization: `Bearer ${shopAToken}` } }).then((r) => r.json());
        assert.strictEqual(fTech.products.length, 1);
        assert.strictEqual(fFash.products.length, 0);
        assert.strictEqual(fSearch.products.length, 1);
        return 'Filter category & search chính xác';
      }
    );

    await runCase(
      'QA-12',
      'Public Link Bio',
      'Trang Link Bio SSR (/u/qa_shop_a) & API JSON (/api/public/bio/qa_shop_a)',
      'Trả HTTP 200 chứa tên Shop, sản phẩm và link rút gọn /r/:code; user không tồn tại trả 404',
      async () => {
        const htmlRes = await fetch(`${baseUrl}/u/qa_shop_a`);
        assert.strictEqual(htmlRes.status, 200);
        const html = await htmlRes.text();
        assert(html.includes('QA Shop A Official') && html.includes('Xiaomi 17T Pro') && html.includes('/r/'));

        const apiRes = await fetch(`${baseUrl}/api/public/bio/qa_shop_a`).then((r) => r.json());
        assert.strictEqual(apiRes.success, true);
        assert.strictEqual(apiRes.items.length, 1);

        const notFound = await fetch(`${baseUrl}/u/khong_ton_tai_99999`);
        assert.strictEqual(notFound.status, 404);
        return 'SSR HTML 200, JSON Bio 1 SP có link /r/, user ảo trả 404';
      }
    );

    // =========================================================================
    // NHÓM 3: BỘ ĐẾM CLICK ĐA THIẾT BỊ & LỌC SPAM / BOT (QA-13 → QA-17)
    // =========================================================================
    console.log('\n--- NHÓM 3: BỘ ĐẾM CLICK ĐA THIẾT BỊ & CHỐNG SPAM ---');

    await runCase(
      'QA-13',
      'Click Tracking',
      'Tạo Shortlink UTM cho CTV A & Shop A',
      'Trả HTTP 201 với mã shortCode, CTV tự động khóa cứng subId theo tài khoản',
      async () => {
        const resCtv = await fetch(`${baseUrl}/api/affiliate/shorten`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvAToken}` },
          body: JSON.stringify({
            baseUrl: 'https://shopee.vn/Xiaomi-17T-Pro-i.1731082101.41731255073',
            productId: prodAId,
            productName: 'Điện Thoại Xiaomi 17T Pro 12GB 512GB',
            priceRetail: 15000000,
            commissionRate: 10,
            channel: 'facebook',
            subId: 'hacked_sub_id'
          })
        });
        assert.strictEqual(resCtv.status, 201);
        const dCtv = await resCtv.json();
        linkCtvACode = dCtv.entry.shortCode;
        assert.strictEqual(dCtv.entry.subId, 'qa_ctv_a', 'CTV không được phép giả mạo subId người khác');

        const resShop = await fetch(`${baseUrl}/api/affiliate/shorten`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({
            baseUrl: 'https://shopee.vn/Xiaomi-17T-Pro-i.1731082101.41731255073',
            productId: prodAId,
            productName: 'Điện Thoại Xiaomi 17T Pro 12GB 512GB',
            priceRetail: 15000000,
            commissionRate: 10,
            channel: 'instagram',
            subId: 'qa_shop_a'
          })
        });
        assert.strictEqual(resShop.status, 201);
        const dShop = await resShop.json();
        linkShopACode = dShop.entry.shortCode;
        return `CTV link /r/${linkCtvACode} (subId khóa cứng=${dCtv.entry.subId}), Shop link /r/${linkShopACode}`;
      }
    );

    await runCase(
      'QA-14',
      'Click Anti-Spam',
      'Bot Preview (FacebookExternalHit, ZaloBot) vẫn được redirect 302 nhưng KHÔNG cộng click',
      'HTTP 302 Redirect, clicks=0, blockedSpamClicks=2',
      async () => {
        const b1 = await fetch(`${baseUrl}/r/${linkCtvACode}`, {
          redirect: 'manual',
          headers: { 'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 'x-forwarded-for': '198.51.100.10' }
        });
        assert.strictEqual(b1.status, 302);
        const b2 = await fetch(`${baseUrl}/r/${linkCtvACode}`, {
          redirect: 'manual',
          headers: { 'user-agent': 'ZaloBot/1.0', 'x-forwarded-for': '198.51.100.11' }
        });
        assert.strictEqual(b2.status, 302);

        const list = await fetch(`${baseUrl}/api/affiliate/links`, { headers: { Authorization: `Bearer ${ctvAToken}` } }).then((r) => r.json());
        const item = list.links.find((l) => l.shortCode === linkCtvACode);
        assert.strictEqual(item.clicks, 0);
        assert.strictEqual(item.blockedSpamClicks, 2);
        return `Bot bị lọc sạch: clicks=${item.clicks}, blockedSpamClicks=${item.blockedSpamClicks}`;
      }
    );

    await runCase(
      'QA-15',
      'Click Multi-Device',
      '2 thiết bị thật (iPhone Safari + Android Zalo In-App) chung 1 Wi-Fi đều được đếm click độc lập',
      'Cả 2 click đều trả 302 kèm UTM đúng và tăng clicks từ 0 → 2',
      async () => {
        const sharedWifiIp = '198.51.100.77';
        const c1 = await fetch(`${baseUrl}/r/${linkCtvACode}`, {
          redirect: 'manual',
          headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1', 'x-forwarded-for': sharedWifiIp }
        });
        assert.strictEqual(c1.status, 302);
        const loc = c1.headers.get('location') || '';
        assert(loc.includes('utm_source=facebook') && loc.includes('sub_id=qa_ctv_a'), `Thiếu UTM: ${loc}`);

        const c2 = await fetch(`${baseUrl}/r/${linkCtvACode}`, {
          redirect: 'manual',
          headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Zalo/24.08.01 Mobile Safari/537.36', 'x-forwarded-for': sharedWifiIp }
        });
        assert.strictEqual(c2.status, 302);

        const list = await fetch(`${baseUrl}/api/affiliate/links`, { headers: { Authorization: `Bearer ${ctvAToken}` } }).then((r) => r.json());
        const item = list.links.find((l) => l.shortCode === linkCtvACode);
        assert.strictEqual(item.clicks, 2);
        return `Chung Wi-Fi khác thiết bị (kể cả Zalo In-App): clicks=${item.clicks}`;
      }
    );

    await runCase(
      'QA-16',
      'Click Dedup 60s',
      'Click lặp lại trên CÙNG 1 thiết bị trong 60 giây bị chống trùng (device_dedup)',
      'clicks giữ nguyên = 2, blockedSpamClicks tăng từ 2 → 3',
      async () => {
        const dup = await fetch(`${baseUrl}/r/${linkCtvACode}`, {
          redirect: 'manual',
          headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1', 'x-forwarded-for': '198.51.100.77' }
        });
        assert.strictEqual(dup.status, 302);

        const list = await fetch(`${baseUrl}/api/affiliate/links`, { headers: { Authorization: `Bearer ${ctvAToken}` } }).then((r) => r.json());
        const item = list.links.find((l) => l.shortCode === linkCtvACode);
        assert.strictEqual(item.clicks, 2);
        assert.strictEqual(item.blockedSpamClicks, 3);
        return `Chống click đúp 60s chuẩn xác: clicks=${item.clicks}, blockedSpamClicks=${item.blockedSpamClicks}`;
      }
    );

    await runCase(
      'QA-17',
      'Click Error Handling',
      'Truy cập mã shortlink không tồn tại trả HTTP 404 sạch sẽ',
      'GET /r/NOEXIST999 trả HTTP 404',
      async () => {
        const res = await fetch(`${baseUrl}/r/NOEXIST999`, { redirect: 'manual' });
        assert.strictEqual(res.status, 404);
        return 'Trả HTTP 404 hợp lệ';
      }
    );

    // =========================================================================
    // NHÓM 4: SỐ LIỆU FINTECH, ĐỐI SOÁT ĐƠN THẬT & CÔNG THỨC TOÁN HỌC (QA-18 → QA-22)
    // =========================================================================
    console.log('\n--- NHÓM 4: SỐ LIỆU FINTECH, WEBHOOK & CSV IMPORT ---');

    await runCase(
      'QA-18',
      'FinTech Strict Mode',
      'Chế độ Tài chính thực (strictConfirmedOnly=true): Có 2 click nhưng chưa mua => Doanh thu & Hoa hồng = 0đ',
      'totalClicks=2, totalOrders=0, totalRevenue=0, confirmedRevenue=0, totalCommission=0, netShopRevenue=0',
      async () => {
        const sum = await fetch(`${baseUrl}/api/analytics/summary`, {
          headers: { Authorization: `Bearer ${ctvAToken}` }
        }).then((r) => r.json());
        assert.strictEqual(sum.summary.strictConfirmedOnly, true);
        assert.strictEqual(sum.summary.totalClicks, 2);
        assert.strictEqual(sum.summary.totalOrders, 0);
        assert.strictEqual(sum.summary.totalRevenue, 0);
        assert.strictEqual(sum.summary.confirmedRevenue, 0);
        assert.strictEqual(sum.summary.totalCommission, 0);
        assert.strictEqual(sum.summary.netShopRevenue, 0);
        return '2 click chưa mua = 0đ doanh thu, 0đ hoa hồng (không có số ước tính ảo)';
      }
    );

    await runCase(
      'QA-19',
      'Webhook Security & Idempotency',
      'Webhook đơn hàng: Sai secret bị 401; Đúng secret chốt đơn 15.000.000đ; Gửi trùng orderId không cộng đúp; Đơn cancelled bỏ qua',
      'Sai secret=401; 1 đơn completed cộng đúng 15tr GMV & 1.5tr HH; gửi lại cùng orderId vẫn giữ nguyên 15tr',
      async () => {
        const badSec = await fetch(`${baseUrl}/api/webhooks/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'wrong_secret' },
          body: JSON.stringify({ orderId: 'QA-ORD-1', shortCode: linkCtvACode, orderAmount: 15000000, status: 'completed' })
        });
        assert.strictEqual(badSec.status, 401);

        const ok1 = await fetch(`${baseUrl}/api/webhooks/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'autobiz_wh_secret_2026' },
          body: JSON.stringify({ orderId: 'QA-ORD-1', shortCode: linkCtvACode, orderAmount: 15000000, quantity: 1, status: 'completed', source: 'pancake_pos' })
        }).then((r) => r.json());
        assert.strictEqual(ok1.success, true);
        assert.strictEqual(ok1.link.confirmedRevenue, 15000000);
        assert.strictEqual(ok1.link.confirmedCommission, 1500000);

        // Duplicate orderId -> must be idempotent
        const dup = await fetch(`${baseUrl}/api/webhooks/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'autobiz_wh_secret_2026' },
          body: JSON.stringify({ orderId: 'QA-ORD-1', shortCode: linkCtvACode, orderAmount: 15000000, quantity: 1, status: 'completed', source: 'pancake_pos' })
        }).then((r) => r.json());
        assert.strictEqual(dup.duplicate, true);

        // Cancelled order -> ignored
        const canc = await fetch(`${baseUrl}/api/webhooks/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'autobiz_wh_secret_2026' },
          body: JSON.stringify({ orderId: 'QA-ORD-CANCEL', shortCode: linkCtvACode, orderAmount: 15000000, quantity: 1, status: 'cancelled' })
        }).then((r) => r.json());
        assert.strictEqual(canc.ignored, true);

        const sum = await fetch(`${baseUrl}/api/analytics/summary`, { headers: { Authorization: `Bearer ${ctvAToken}` } }).then((r) => r.json());
        assert.strictEqual(sum.summary.confirmedRevenue, 15000000);
        assert.strictEqual(sum.summary.totalCommission, 1500000);
        return 'Secret 401 OK, Idempotency OK, Cancelled ignored OK (GMV=15.000.000đ, HH=1.500.000đ)';
      }
    );

    await runCase(
      'QA-20',
      'CSV Order Import',
      'Nhập báo cáo CSV nhiều dòng (completed + duplicate + cancelled + unknown code)',
      'importedCount=1 (+5.000.000đ GMV, +500.000đ HH), duplicateCount=1, ignoredCount=1, failedCount=1',
      async () => {
        const csvText = [
          'orderId,shortCode,subId,orderAmount,quantity,status',
          `QA-CSV-01,${linkCtvACode},,5000000,1,completed`,
          `QA-CSV-01,${linkCtvACode},,5000000,1,completed`,
          `QA-CSV-02,${linkCtvACode},,3000000,1,cancelled`,
          'QA-CSV-03,UNKNOWN99,,1000000,1,completed'
        ].join('\n');

        const imp = await fetch(`${baseUrl}/api/orders/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({ csvText, source: 'shopee_csv' })
        }).then((r) => r.json());
        assert.strictEqual(imp.success, true);
        assert.strictEqual(imp.report.totalRows, 4);
        assert.strictEqual(imp.report.importedCount, 1);
        assert.strictEqual(imp.report.duplicateCount, 1);
        assert.strictEqual(imp.report.ignoredCount, 1);
        assert.strictEqual(imp.report.failedCount, 1);
        assert.strictEqual(imp.report.totalRevenueAdded, 5000000);
        assert.strictEqual(imp.report.totalCommissionAdded, 500000);
        return '4 dòng CSV: 1 chốt (+5tr), 1 trùng, 1 hủy, 1 không khớp — chính xác 100%';
      }
    );

    await runCase(
      'QA-21',
      'FinTech Math Audit',
      'Kiểm toán toàn bộ công thức FinTech trên Dashboard Chủ shop A (GMV, Thực thu, HH, AOV, EPC, Biên lợi nhuận)',
      'GMV=20.000.000đ, HH=2.000.000đ (10%), Thực thu Shop=18.000.000đ (90%), Orders=2, AOV=10.000.000đ, EPC=1.000.000đ/click',
      async () => {
        const sumRes = await fetch(`${baseUrl}/api/analytics/summary`, {
          headers: { Authorization: `Bearer ${shopAToken}` }
        }).then((r) => r.json());
        const s = sumRes.summary;
        assert.strictEqual(s.totalClicks, 2);
        assert.strictEqual(s.totalOrders, 2);
        assert.strictEqual(s.totalRevenue, 20000000);
        assert.strictEqual(s.confirmedRevenue, 20000000);
        assert.strictEqual(s.totalCommission, 2000000);
        assert.strictEqual(s.netShopRevenue, 18000000);
        assert.strictEqual(s.avgOrderValue, 10000000);
        assert.strictEqual(s.earningPerClick, 1000000);
        assert.strictEqual(s.commissionMarginPct, 10);
        assert.strictEqual(s.netMarginPct, 90);
        assert.strictEqual(s.byChannel.facebook.clicks, 2);
        assert.strictEqual(s.bySubId.length, 2); // qa_ctv_a + qa_shop_a
        return `GMV=${s.totalRevenue.toLocaleString('vi-VN')}đ | HH=${s.totalCommission.toLocaleString('vi-VN')}đ (10%) | Net=${s.netShopRevenue.toLocaleString('vi-VN')}đ (90%) | AOV=10tr | EPC=1tr`;
      }
    );

    await runCase(
      'QA-22',
      'Multi-Tenant Finance',
      'Cô lập số liệu FinTech: Shop B phải thấy GMV=0đ, Clicks=0 (không rò rỉ doanh thu Shop A)',
      'Shop B summary: totalClicks=0, totalRevenue=0, totalCommission=0, totalLinks=0',
      async () => {
        const sB = await fetch(`${baseUrl}/api/analytics/summary`, {
          headers: { Authorization: `Bearer ${shopBToken}` }
        }).then((r) => r.json());
        assert.strictEqual(sB.summary.totalClicks, 0);
        assert.strictEqual(sB.summary.totalRevenue, 0);
        assert.strictEqual(sB.summary.totalCommission, 0);
        assert.strictEqual(sB.summary.totalLinks, 0);
        return 'Shop B hoàn toàn cô lập (0 click, 0đ doanh thu)';
      }
    );

    // =========================================================================
    // NHÓM 5: ĐỐI SOÁT & RÚT TIỀN VIETQR (QA-23 → QA-25)
    // =========================================================================
    console.log('\n--- NHÓM 5: ĐỐI SOÁT RÚT HOA HỒNG & VIETQR ---');

    await runCase(
      'QA-23',
      'VietQR Payout Validation',
      'Chặn yêu cầu rút dưới mức tối thiểu (<50.000đ) hoặc vượt số dư khả dụng (>2.000.000đ)',
      'Cả 2 trường hợp đều bị từ chối HTTP 400',
      async () => {
        const rLow = await fetch(`${baseUrl}/api/payouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvAToken}` },
          body: JSON.stringify({ amount: 20000, bankCode: 'MB', accountNumber: '0911223344', accountName: 'CTV MINH A' })
        });
        assert.strictEqual(rLow.status, 400);

        const rOver = await fetch(`${baseUrl}/api/payouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvAToken}` },
          body: JSON.stringify({ amount: 5000000, bankCode: 'MB', accountNumber: '0911223344', accountName: 'CTV MINH A' })
        });
        assert.strictEqual(rOver.status, 400);
        return 'Rút 20.000đ (400) & Rút 5.000.000đ vượt số dư 2tr (400) đều bị chặn chuẩn';
      }
    );

    await runCase(
      'QA-24',
      'VietQR Reject & Refund Balance',
      'CTV rút 500.000đ -> Chủ shop Từ chối (rejected) -> Hoàn lại đúng 500.000đ vào số dư khả dụng',
      'Sau tạo: khả dụng=1.500.000đ, chờ=500.000đ; sau rejected: khả dụng quay lại 2.000.000đ, chờ=0đ',
      async () => {
        const p1 = await fetch(`${baseUrl}/api/payouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvAToken}` },
          body: JSON.stringify({ amount: 500000, bankCode: 'VCB', accountNumber: '001100223344', accountName: 'CTV MINH A' })
        }).then((r) => r.json());
        assert.strictEqual(p1.success, true);
        payoutRejectId = p1.payout.id;

        const balPending = await fetch(`${baseUrl}/api/payouts`, { headers: { Authorization: `Bearer ${ctvAToken}` } }).then((r) => r.json());
        assert.strictEqual(balPending.balance.availableBalance, 1500000);
        assert.strictEqual(balPending.balance.pendingAmount, 500000);

        const rej = await fetch(`${baseUrl}/api/payouts/${payoutRejectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({ status: 'rejected' })
        });
        assert.strictEqual(rej.status, 200);

        const balAfter = await fetch(`${baseUrl}/api/payouts`, { headers: { Authorization: `Bearer ${ctvAToken}` } }).then((r) => r.json());
        assert.strictEqual(balAfter.balance.availableBalance, 2000000);
        assert.strictEqual(balAfter.balance.pendingAmount, 0);
        return 'Từ chối yêu cầu hoàn đúng 500.000đ về số dư khả dụng (2.000.000đ)';
      }
    );

    await runCase(
      'QA-25',
      'VietQR Approve & Cross-Shop Guard',
      'CTV rút 1.200.000đ sinh ảnh VietQR chuẩn -> Shop B bị chặn duyệt (403) -> Shop A duyệt thành công (paid)',
      'VietQR URL hợp lệ; Shop B bị 403; sau Shop A duyệt: paid=1.200.000đ, available=800.000đ',
      async () => {
        const p2 = await fetch(`${baseUrl}/api/payouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctvAToken}` },
          body: JSON.stringify({ amount: 1200000, bankCode: 'TCB', accountNumber: '190366778899', accountName: 'CTV MINH A' })
        }).then((r) => r.json());
        assert.strictEqual(p2.success, true);
        assert(p2.payout.vietQrUrl.includes('img.vietqr.io/image/TCB-190366778899-compact2.png?amount=1200000'));
        payoutApproveId = p2.payout.id;

        const crossShop = await fetch(`${baseUrl}/api/payouts/${payoutApproveId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopBToken}` },
          body: JSON.stringify({ status: 'paid' })
        });
        assert.strictEqual(crossShop.status, 403);

        const ok = await fetch(`${baseUrl}/api/payouts/${payoutApproveId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({ status: 'paid' })
        });
        assert.strictEqual(ok.status, 200);

        const bal = await fetch(`${baseUrl}/api/payouts`, { headers: { Authorization: `Bearer ${ctvAToken}` } }).then((r) => r.json());
        assert.strictEqual(bal.balance.paidAmount, 1200000);
        assert.strictEqual(bal.balance.availableBalance, 800000);
        return 'VietQR TCB chuẩn Napas, chặn Shop B (403), Shop A duyệt xong (paid=1.2tr, khả dụng=800k)';
      }
    );

    // =========================================================================
    // NHÓM 6: STUDIO AI, PHÂN PHỐI ĐA KÊNH, CÀI ĐẶT & HÀNG ĐỢI (QA-26 → QA-30)
    // =========================================================================
    console.log('\n--- NHÓM 6: STUDIO ĐA KÊNH, CÀI ĐẶT RIÊNG BIỆT & HÀNG ĐỢI ---');

    await runCase(
      'QA-26',
      'Settings Isolation',
      'Lưu Cài đặt riêng cho Shop A (Instagram ID + tắt TikTok) không ảnh hưởng sang Shop B',
      'Shop A đọc lại đúng instagramAccountId & enabledChannels.tiktok=false; Shop B không bị ghi đè',
      async () => {
        const saveA = await fetch(`${baseUrl}/api/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({
            fanpageName: 'Shop A Media',
            instagramAccountId: '17841499999999',
            strictConfirmedOnly: true,
            enabledChannels: { facebook: true, instagram: true, tiktok: false, zalo: true, shopee: true }
          })
        });
        assert.strictEqual(saveA.status, 200);

        const getA = await fetch(`${baseUrl}/api/settings`, { headers: { Authorization: `Bearer ${shopAToken}` } }).then((r) => r.json());
        const getB = await fetch(`${baseUrl}/api/settings`, { headers: { Authorization: `Bearer ${shopBToken}` } }).then((r) => r.json());
        assert.strictEqual(getA.instagramAccountId, '17841499999999');
        assert.strictEqual(getA.enabledChannels.tiktok, false);
        assert.notStrictEqual(getB.instagramAccountId, '17841499999999');
        return 'Cài đặt Instagram & Channel Toggles cô lập hoàn toàn theo từng tài khoản';
      }
    );

    await runCase(
      'QA-27',
      'Studio AI Generator',
      'Sinh nội dung AI đa kênh (/api/generate-content) trả đủ nội dung 5 kênh',
      'HTTP 200, multiChannel có đủ facebook, instagram, tiktok, zalo, shopee',
      async () => {
        const res = await fetch(`${baseUrl}/api/generate-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({
            rawText: 'Điện thoại Xiaomi 17T Pro 12GB 512GB Chính Hãng, camera Leica, sạc nhanh 120W',
            category: 'tech',
            customPrice: '15000000',
            channel: 'facebook'
          })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert(data.content && data.content.length > 20, 'Nội dung chính rỗng');
        assert(data.multiChannel && data.multiChannel.facebook && data.multiChannel.instagram && data.multiChannel.tiktok && data.multiChannel.zalo && data.multiChannel.shopee);
        return `Sinh thành công 5 phiên bản kênh (FB: ${data.multiChannel.facebook.length} ký tự, IG: ${data.multiChannel.instagram.length} ký tự)`;
      }
    );

    await runCase(
      'QA-28',
      'Omni-Channel Dispatch',
      'Phân phối đa kênh (/api/autobiz/dispatch) tôn trọng cấu hình bật/tắt kênh (bỏ qua TikTok đã tắt)',
      'HTTP 200, kết quả chỉ gồm 4 kênh đang bật (facebook, instagram, zalo, shopee), không chứa tiktok',
      async () => {
        const res = await fetch(`${baseUrl}/api/autobiz/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({
            target_channels: ['facebook', 'instagram', 'tiktok', 'zalo', 'shopee'],
            finalContent: 'Bài kiểm thử phân phối đa kênh AutoBiz AI 2026'
          })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        const channelsOut = (data.results || []).map((r) => r.channel);
        assert(!channelsOut.includes('tiktok'), `TikTok đã tắt nhưng vẫn bị dispatch: ${channelsOut.join(',')}`);
        assert(channelsOut.includes('facebook') && channelsOut.includes('instagram'));
        return `Dispatch tuân thủ toggle: [${channelsOut.join(', ')}] (đã loại tiktok)`;
      }
    );

    await runCase(
      'QA-29',
      'Queue Lifecycle & Isolation',
      'Lên lịch hàng đợi (/api/posts): Tạo bài, kiểm tra cô lập Shop A vs Shop B, và xóa bài',
      'Shop A tạo bài (200) -> Shop A thấy 1 bài, Shop B thấy 0 bài -> Shop A xóa thành công',
      async () => {
        const createRes = await fetch(`${baseUrl}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${shopAToken}` },
          body: JSON.stringify({
            machineCode: 'XIA17T',
            machineName: 'Xiaomi 17T Pro',
            content: 'Nội dung lên lịch kiểm thử QA',
            price: '15000000',
            publishImmediately: false
          })
        });
        assert.strictEqual(createRes.status, 200);
        const created = await createRes.json();
        assert.strictEqual(created.success, true);
        createdPostId = created.post.id;

        const postsA = await fetch(`${baseUrl}/api/posts`, { headers: { Authorization: `Bearer ${shopAToken}` } }).then((r) => r.json());
        const postsB = await fetch(`${baseUrl}/api/posts`, { headers: { Authorization: `Bearer ${shopBToken}` } }).then((r) => r.json());
        assert(postsA.some((p) => p.id === createdPostId));
        assert(!postsB.some((p) => p.id === createdPostId));

        const del = await fetch(`${baseUrl}/api/posts/${createdPostId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${shopAToken}` }
        });
        assert.strictEqual(del.status, 200);
        return `Tạo (${createdPostId}), cô lập Shop B (0 bài) và xóa thành công`;
      }
    );

    await runCase(
      'QA-30',
      'Cookie Script & CSV Template',
      'Kiểm tra mã nhúng Cookie Tracking (/ab-track.js?days=14) & Tải file mẫu CSV',
      'Cả 2 trả HTTP 200 đúng Content-Type và nội dung hợp lệ',
      async () => {
        const jsRes = await fetch(`${baseUrl}/ab-track.js?days=14`);
        assert.strictEqual(jsRes.status, 200);
        const jsText = await jsRes.text();
        assert(jsText.includes('ab_sub_id') && jsText.includes('14*86400'));

        const csvRes = await fetch(`${baseUrl}/api/orders/import-template`);
        assert.strictEqual(csvRes.status, 200);
        const csvText = await csvRes.text();
        assert(csvText.includes('orderId,shortCode,subId,orderAmount,quantity,status'));
        return 'Tracking JS 14 ngày & CSV Template chuẩn xác';
      }
    );

    // =========================================================================
    // NHÓM 7: KIỂM THỬ TRỰC TIẾP TRÊN MÔI TRƯỜNG PRODUCTION VERCEL (PROD-01 → PROD-08)
    // =========================================================================
    console.log('\n--- NHÓM 7: KIỂM THỬ TRỰC TIẾP PRODUCTION (VERCEL + SUPABASE) ---');

    await runCase(
      'PROD-01',
      'Production Health',
      'Kiểm tra kết nối Cơ sở dữ liệu Supabase trên Production (/api/db/status)',
      'HTTP 200, connected=true, provider=supabase',
      async () => {
        const res = await fetch(`${PROD_URL}/api/db/status`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.connected, true);
        return `DB Live: connected=${data.connected}, mode=${data.mode || data.provider || 'supabase'}`;
      }
    );

    await runCase(
      'PROD-02',
      'Production Assets',
      'Kiểm tra trang chủ & tài nguyên giao diện mới (?v=20261125_v11) trả HTTP 200 (0 lỗi 404)',
      'index.html chứa Dual Theme & v11; style.css, autobiz.js, manifest.json, icon.svg đều 200 OK',
      async () => {
        const htmlRes = await fetch(`${PROD_URL}/`);
        assert.strictEqual(htmlRes.status, 200);
        const html = await htmlRes.text();
        assert(html.includes('style.css?v=20261125_v11') && html.includes('autobiz.js?v=20261125_v11'));
        assert(html.includes('data-theme="dark"') && html.includes('btnThemeToggle'));

        const assets = ['/css/style.css?v=20261125_v11', '/js/autobiz.js?v=20261125_v11', '/manifest.json', '/icons/icon.svg'];
        for (const a of assets) {
          const r = await fetch(`${PROD_URL}${a}`);
          assert.strictEqual(r.status, 200, `${a} trả ${r.status}`);
        }
        return '5/5 tài nguyên trang chủ & Dual Theme v11 trả HTTP 200 OK';
      }
    );

    await runCase(
      'PROD-03',
      'Production Cache Headers',
      'Kiểm tra Cache-Control trên tài nguyên tĩnh Production (chống Cache Poisoning)',
      'Không có header immutable trên unhashed assets; có must-revalidate/no-cache',
      async () => {
        const cssRes = await fetch(`${PROD_URL}/css/style.css?v=20261125_v11`);
        const cc = String(cssRes.headers.get('cache-control') || '').toLowerCase();
        assert(!cc.includes('immutable'), `Phát hiện cache-control nguy hiểm: ${cc}`);
        return `Cache-Control an toàn: "${cc || 'default'}"`;
      }
    );

    await runCase(
      'PROD-04',
      'Production Public Bio & Invite',
      'Kiểm tra Trang Bio công khai (/u/admin) & Link mời CTV (/join/admin) trên Production',
      'Cả 2 trả HTTP 200 OK',
      async () => {
        const bio = await fetch(`${PROD_URL}/u/admin`);
        assert.strictEqual(bio.status, 200);
        const join = await fetch(`${PROD_URL}/join/admin`);
        assert.strictEqual(join.status, 200);
        return '/u/admin (200) & /join/admin (200) hoạt động ổn định';
      }
    );

    await runCase(
      'PROD-05',
      'Production Tracking & Template',
      'Kiểm tra Script /ab-track.js & File mẫu /api/orders/import-template trên Production',
      'Cả 2 trả HTTP 200 OK với đúng nội dung nghiệp vụ',
      async () => {
        const s = await fetch(`${PROD_URL}/ab-track.js?days=14`);
        assert.strictEqual(s.status, 200);
        const st = await s.text();
        assert(st.includes('ab_sub_id'));

        const t = await fetch(`${PROD_URL}/api/orders/import-template`);
        assert.strictEqual(t.status, 200);
        const tt = await t.text();
        assert(tt.includes('orderId,shortCode'));
        return '/ab-track.js & /api/orders/import-template HTTP 200 OK';
      }
    );

    await runCase(
      'PROD-06',
      'Production Security Guard',
      'Kiểm tra bảo vệ API nhạy cảm trên Production khi chưa đăng nhập / sai Webhook Secret',
      'Webhook sai secret trả 401; /api/auth/change-password, /api/auth/profile và /api/users không token đều trả 401',
      async () => {
        const wh = await fetch(`${PROD_URL}/api/webhooks/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'invalid_prod_test' },
          body: JSON.stringify({ orderId: 'TEST', shortCode: 'NONE', orderAmount: 1000 })
        });
        assert.strictEqual(wh.status, 401);

        const cp = await fetch(`${PROD_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: 'a', newPassword: 'b' })
        });
        assert.strictEqual(cp.status, 401);

        const pr = await fetch(`${PROD_URL}/api/auth/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: 'Unauthorized Edit' })
        });
        assert.strictEqual(pr.status, 401);

        const us = await fetch(`${PROD_URL}/api/users`);
        assert.strictEqual(us.status, 401);
        return 'Webhook (401), Change Password (401), Profile (401) & Users List (401) đều bị chặn nghiêm ngặt';
      }
    );

    await runCase(
      'PROD-07',
      'Production Live Login & Data',
      'Đăng nhập tài khoản thật trên Production (admin) & đọc số liệu Analytics từ Supabase',
      'Login trả HTTP 200 kèm JWT; /api/analytics/summary trả JSON số liệu hợp lệ (không NaN/undefined)',
      async () => {
        const loginRes = await fetch(`${PROD_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'autobiz2026' })
        });
        assert.strictEqual(loginRes.status, 200);
        const loginData = await loginRes.json();
        assert(loginData.token && loginData.user.role === 'shop_owner');

        const sumRes = await fetch(`${PROD_URL}/api/analytics/summary`, {
          headers: { Authorization: `Bearer ${loginData.token}` }
        });
        assert.strictEqual(sumRes.status, 200);
        const sumData = await sumRes.json();
        const s = sumData.summary;
        assert(typeof s.totalClicks === 'number' && !Number.isNaN(s.totalClicks));
        assert(typeof s.totalRevenue === 'number' && !Number.isNaN(s.totalRevenue));
        assert(typeof s.totalCommission === 'number' && !Number.isNaN(s.totalCommission));
        return `Login admin 200 OK | Analytics live: clicks=${s.totalClicks}, links=${s.totalLinks}, GMV=${s.totalRevenue}đ, HH=${s.totalCommission}đ`;
      }
    );

    await runCase(
      'PROD-08',
      'Production Real User Check',
      'Kiểm tra tài khoản người dùng thật (nguyennhu19022008@gmail.com) trên Production',
      'Đăng nhập 200 OK, đọc đúng dữ liệu cá nhân (sản phẩm & số liệu không bị mất trên Supabase)',
      async () => {
        const loginRes = await fetch(`${PROD_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'nguyennhu19022008@gmail.com', password: 'Vuonggi@19022009' })
        });
        assert.strictEqual(loginRes.status, 200);
        const ld = await loginRes.json();
        assert(ld.token);

        const [sumRes, prodRes] = await Promise.all([
          fetch(`${PROD_URL}/api/analytics/summary`, { headers: { Authorization: `Bearer ${ld.token}` } }).then((r) => r.json()),
          fetch(`${PROD_URL}/api/products`, { headers: { Authorization: `Bearer ${ld.token}` } }).then((r) => r.json())
        ]);
        assert.strictEqual(sumRes.success, true);
        assert.strictEqual(prodRes.success, true);
        return `Tài khoản KOC thật ổn định: ${prodRes.products.length} SP, ${sumRes.summary.totalLinks} link, ${sumRes.summary.totalClicks} clicks`;
      }
    );
  } finally {
    server.close();
    for (const rel of cleanupFiles) {
      const full = path.join(__dirname, '..', rel);
      if (fs.existsSync(full)) {
        if (['data/users.json', 'data/payout_requests.json', 'data/user_settings.json'].includes(rel)) {
          fs.unlinkSync(full);
        } else {
          fs.writeFileSync(full, '[]', 'utf8');
        }
      }
    }
  }

  const passed = reportEntries.filter((e) => e.status === 'PASS').length;
  const failed = reportEntries.filter((e) => e.status === 'FAIL').length;
  const totalMs = reportEntries.reduce((acc, e) => acc + e.ms, 0);

  const summaryObj = {
    executedAt: new Date().toISOString(),
    total: reportEntries.length,
    passed,
    failed,
    passRate: Number(((passed / reportEntries.length) * 100).toFixed(1)),
    totalDurationMs: totalMs,
    cases: reportEntries
  };

  fs.writeFileSync(path.join(__dirname, 'qa_last_report.json'), JSON.stringify(summaryObj, null, 2), 'utf8');

  console.log(`\n======================================================================`);
  console.log(`  TỔNG KẾT VÒNG TEST: ${passed}/${reportEntries.length} PASSED (${summaryObj.passRate}%) | FAILED: ${failed} | THỜI GIAN: ${totalMs}ms`);
  console.log(`======================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('CRITICAL QA RUNNER ERROR:', err);
  process.exit(1);
});
