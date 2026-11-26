process.env.TZ = 'Asia/Ho_Chi_Minh';
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const {
  PRODUCT_CATEGORIES,
  generatePostWithGemini,
  sanitizeRawText,
  extractExplicitMachineCode,
  buildAffiliateUrl
} = require('./services/gemini');
const catalogService = require('./services/catalog');
const affiliateService = require('./services/affiliate');
const authService = require('./services/auth');
const urlExtractor = require('./services/urlExtractor');
const payoutsService = require('./services/payouts');
const orderImporter = require('./services/orderImporter');
const { dispatchToChannels } = require('./services/adapters');
const { verifyInstagramConnection } = require('./services/adapters/instagram');
const { verifyPageToken } = require('./services/facebook');
const { sendTestEmail } = require('./services/mailer');
const {
  handleTelegramUpdate,
  setTelegramWebhook,
  sendTelegramMessage
} = require('./services/telegram');
const { parseStockTableFromImage } = require('./services/tableParser');
const {
  isSupabaseEnabled,
  uploadToSupabaseStorage,
  deleteFromSupabaseStorage,
  upsertPostToDb,
  deletePostFromDb
} = require('./services/supabase');
const runtime = require('./utils/runtime');
const { normalizeMachineCode, isValidMachineCode, deduplicateItemsByCode } = require('./utils/dedup');
const { inspectMedia } = require('./services/mediaFilter');
const {
  startScheduler,
  executePost,
  checkAndPublishDuePosts,
  getNextAvailableScheduleTime,
  getConsecutiveScheduleSlots,
  getPosts,
  savePosts,
  getSettings,
  saveSettings
} = require('./services/scheduler');
const dataPostService = require('./services/dataPost');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Hydrate Supabase Postgres store on cold start & flush pending writes before serverless response ends
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/r/') || req.path.startsWith('/u/')) {
    await runtime.ensureHydrated();
    const origJson = res.json.bind(res);
    res.json = (body) => {
      runtime.flushRemoteWrites().then(() => origJson(body)).catch(() => origJson(body));
      return res;
    };
    const origRedirect = res.redirect.bind(res);
    res.redirect = (...args) => {
      runtime.flushRemoteWrites().then(() => origRedirect(...args)).catch(() => origRedirect(...args));
      return res;
    };
  }
  next();
});
app.use(authService.attachAuthUser);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Dedicated routes for Web App Dashboard Cockpit, Admin Portal & CTV Invite -> Serve index.html
app.get(['/app', '/dashboard', '/cockpit', '/admin', '/join/:shopCode'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Lightweight First-Party Cookie Attribution Script for Shop Websites (/ab-track.js?days=14)
app.get('/ab-track.js', (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 14));
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(`(function(){try{var p=new URLSearchParams(window.location.search);var sub=p.get('sub_id')||p.get('utm_term');var code=p.get('ab_code');var maxAge=${days}*86400;if(sub){document.cookie='ab_sub_id='+encodeURIComponent(sub)+';path=/;max-age='+maxAge+';SameSite=Lax';localStorage.setItem('ab_sub_id',sub);}if(code){document.cookie='ab_short_code='+encodeURIComponent(code)+';path=/;max-age='+maxAge+';SameSite=Lax';localStorage.setItem('ab_short_code',code);}}catch(e){}})();`);
});

// Public Link Bio Page (/u/:username) — Minimalist Editorial Storefront with Auto /r/:code Tracking
function escapeHtmlStr(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildBioPayload(username, req) {
  const user = authService.getUserByUsername(username);
  if (!user) return null;
  const products = catalogService.listProducts({
    owner: user.username,
    role: user.role,
    persona: user.persona,
    shopOwner: user.shopOwner || null
  });
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const items = products.map((p) => {
    let buyUrl = p.affiliate_base_url || '#';
    let shortCode = null;
    if (p.affiliate_base_url && /^https?:\/\//i.test(p.affiliate_base_url)) {
      const entry = affiliateService.createShortLink({
        baseUrl: p.affiliate_base_url,
        productId: p.id,
        productName: p.name,
        priceRetail: p.price_retail,
        commissionRate: p.commission_rate,
        channel: 'facebook',
        campaign: 'bio_link',
        subId: user.subId || user.username,
        owner: user.username,
        shopOwner: user.shopOwner || null
      });
      shortCode = entry.shortCode;
      buyUrl = `${protocol}://${host}/r/${entry.shortCode}`;
    }
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      price_retail: Number(p.price_retail) || 0,
      image: Array.isArray(p.images) && p.images[0] ? p.images[0] : '',
      specs: Array.isArray(p.specs) ? p.specs.slice(0, 2) : [],
      shortCode,
      buyUrl
    };
  });
  return {
    profile: {
      username: user.username,
      displayName: user.displayName || user.username,
      hotline: user.hotline || '',
      defaultShopUrl: user.defaultShopUrl || '',
      role: user.role,
      persona: user.persona
    },
    total: items.length,
    items
  };
}

app.get('/api/public/bio/:username', (req, res) => {
  const payload = buildBioPayload(req.params.username, req);
  if (!payload) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy trang Bio người dùng này.' });
  }
  res.json({ success: true, ...payload });
});

app.get('/u/:username', async (req, res) => {
  const payload = buildBioPayload(req.params.username, req);
  await runtime.flushRemoteWrites();
  if (!payload) {
    return res.status(404).send(`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Không tìm thấy Bio</title></head><body style="font-family:system-ui,sans-serif;background:#FAFAFA;color:#0F172A;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;"><div><h1 style="font-size:24px;margin-bottom:8px;">Không tìm thấy trang Bio</h1><p style="color:#64748B;">Đường dẫn @${escapeHtmlStr(req.params.username)} chưa tồn tại trên AutoBiz AI.</p><a href="/" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Về trang chủ</a></div></body></html>`);
  }
  const { profile, items } = payload;
  const initials = (profile.displayName || profile.username).slice(0, 2).toUpperCase();
  const isSingle = items.length === 1;
  const cardsHtml = items.length === 0
    ? `<div class="bio-empty">Chưa có sản phẩm nào được đăng lên trang Bio này.</div>`
    : items.map((it) => `
      <article class="bio-item" data-name="${escapeHtmlStr(it.name.toLowerCase())}" data-cat="${escapeHtmlStr(it.category)}">
        ${it.image ? `<div class="bio-thumb"><img src="${escapeHtmlStr(it.image)}" alt="${escapeHtmlStr(it.name)}" loading="lazy"/></div>` : ''}
        <div class="bio-body">
          <div class="bio-meta-row">
            <span class="bio-sku">${escapeHtmlStr(it.sku)}</span>
            <strong class="bio-price">${it.price_retail > 0 ? it.price_retail.toLocaleString('vi-VN') + ' đ' : 'Liên hệ'}</strong>
          </div>
          <h2 class="bio-title">${escapeHtmlStr(it.name)}</h2>
          ${it.specs.length ? `<p class="bio-specs">${escapeHtmlStr(it.specs.join(' • '))}</p>` : ''}
          <div class="bio-cta-wrap">
            <a href="${escapeHtmlStr(it.buyUrl)}" target="_blank" rel="noopener noreferrer" class="bio-buy-btn">Mua Ngay / Nhận Ưu Đãi →</a>
          </div>
        </div>
      </article>`).join('');

  res.send(`<!DOCTYPE html>
<html lang="vi" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtmlStr(profile.displayName)} — Link Bio | AutoBiz AI</title>
  <script>(function(){try{var t=localStorage.getItem('autobiz_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(_){}})();</script>
  <style>
    :root,[data-theme="dark"]{--bg:#09090B;--surface:#141417;--subtle:#1B1B20;--border:#27272A;--border-h:#3F3F46;--text:#FAFAFA;--muted:#A1A1AA;--btn-bg:#FAFAFA;--btn-text:#09090B}
    [data-theme="light"]{--bg:#F9FAFB;--surface:#FFFFFF;--subtle:#F4F4F5;--border:#E4E4E7;--border-h:#D4D4D8;--text:#09090B;--muted:#71717A;--btn-bg:#09090B;--btn-text:#FFFFFF}
    *{box-sizing:border-box}
    body{margin:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;transition:background-color 200ms ease,color 200ms ease}
    .wrap{max-width:960px;margin:0 auto;padding:28px 18px 56px}
    .bio-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;padding-bottom:20px;border-bottom:1px solid var(--border);margin-bottom:20px}
    .bio-avatar{width:50px;height:50px;border-radius:10px;background:var(--btn-bg);color:var(--btn-text);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;letter-spacing:-0.02em;flex-shrink:0}
    .bio-h1{margin:0;font-size:21px;font-weight:800;color:var(--text)}
    .bio-sub{font-size:13px;color:var(--muted);margin-top:2px}
    .bio-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .bio-btn-outline{padding:8px 12px;border:1px solid var(--border);border-radius:7px;color:var(--text);text-decoration:none;font-size:13px;font-weight:600;background:var(--surface);cursor:pointer}
    .bio-btn-outline:hover{border-color:var(--border-h);background:var(--subtle)}
    .bio-btn-solid{padding:8px 14px;background:var(--btn-bg);color:var(--btn-text);border-radius:7px;text-decoration:none;font-size:13px;font-weight:600}
    .search{width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--surface);color:var(--text);outline:none}
    .search:focus{border-color:var(--text)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
    .grid.is-single{max-width:440px;margin:0 auto}
    .bio-empty{text-align:center;padding:48px 16px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--muted)}
    .bio-item{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:border-color 200ms ease}
    .bio-item:hover{border-color:var(--border-h)}
    .bio-thumb{aspect-ratio:16/10;background:var(--subtle);overflow:hidden;border-bottom:1px solid var(--border)}
    .bio-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .bio-body{padding:16px;display:flex;flex-direction:column;gap:8px;flex:1}
    .bio-meta-row{display:flex;justify-content:space-between;align-items:center;gap:8px}
    .bio-sku{font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);letter-spacing:0.04em}
    .bio-price{font-size:16px;color:var(--text);font-variant-numeric:tabular-nums}
    .bio-title{font-size:15px;font-weight:700;line-height:1.4;margin:0;color:var(--text)}
    .bio-specs{font-size:13px;color:var(--muted);margin:0;line-height:1.45}
    .bio-cta-wrap{margin-top:auto;padding-top:10px}
    .bio-buy-btn{display:block;text-align:center;padding:10px 14px;background:var(--btn-bg);color:var(--btn-text);text-decoration:none;border-radius:7px;font-size:13px;font-weight:600}
    .bio-footer{margin-top:36px;padding-top:16px;border-top:1px solid var(--border);text-align:center;font-size:12px;color:var(--muted)}
  </style>
</head>
<body>
  <main class="wrap">
    <header class="bio-header">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="bio-avatar">${escapeHtmlStr(initials)}</div>
        <div>
          <h1 class="bio-h1">${escapeHtmlStr(profile.displayName)}</h1>
          <div class="bio-sub">@${escapeHtmlStr(profile.username)} • ${items.length} sản phẩm đề xuất</div>
        </div>
      </div>
      <div class="bio-actions">
        <button type="button" id="bioThemeBtn" class="bio-btn-outline" title="Đổi giao diện Sáng / Tối">Sáng / Tối</button>
        ${profile.hotline ? `<a href="tel:${escapeHtmlStr(profile.hotline.replace(/[^0-9+]/g, ''))}" class="bio-btn-outline">Hotline: ${escapeHtmlStr(profile.hotline)}</a>` : ''}
        ${profile.defaultShopUrl ? `<a href="${escapeHtmlStr(profile.defaultShopUrl)}" target="_blank" rel="noopener noreferrer" class="bio-btn-solid">Gian hàng chính</a>` : ''}
      </div>
    </header>
    <div style="margin-bottom:18px;">
      <input id="bioSearch" class="search" type="search" placeholder="Tìm sản phẩm trên trang của ${escapeHtmlStr(profile.displayName)}..." />
    </div>
    <section id="bioGrid" class="grid ${isSingle ? 'is-single' : ''}">${cardsHtml}</section>
    <footer class="bio-footer">
      Powered by <a href="/" style="color:var(--text);font-weight:600;text-decoration:none;">AutoBiz AI</a>
    </footer>
  </main>
  <script>
    const inp = document.getElementById('bioSearch');
    if (inp) inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase();
      document.querySelectorAll('.bio-item').forEach((el) => {
        el.style.display = !q || (el.dataset.name || '').includes(q) ? 'flex' : 'none';
      });
    });
    const tBtn = document.getElementById('bioThemeBtn');
    if (tBtn) tBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const nxt = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nxt);
      try { localStorage.setItem('autobiz_theme', nxt); } catch(_) {}
    });
  </script>
</body>
</html>`);
});

// Dedicated routes for 16:9 Pitch Deck Presentation (CV17 - Phase 6)
app.get(['/slides', '/pitch-deck'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pitch-deck.html'));
});
app.use('/charts', express.static(path.join(__dirname, 'charts')));

// Storage configuration for media uploads: Memory storage for universal serverless/Vercel support
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB max per video/image
});

// ======================== API ROUTES ========================

// 0. Authentication & Role-Based Access Control (Admin / CTV Portal)
app.get('/api/db/status', (req, res) => {
  res.json({
    success: true,
    provider: isSupabaseEnabled() ? 'supabase_postgres' : 'local_json_fallback',
    connected: isSupabaseEnabled()
  });
});

app.get('/api/auth/me', (req, res) => {
  const baseUser = req.authUser || null;
  if (baseUser && baseUser.username) {
    const fresh = authService.getUserByUsername(baseUser.username);
    if (fresh) {
      return res.json({
        success: true,
        user: {
          ...baseUser,
          displayName: fresh.displayName || baseUser.displayName,
          hotline: fresh.hotline || '',
          defaultShopUrl: fresh.defaultShopUrl || '',
          email: fresh.email || baseUser.email || null
        }
      });
    }
  }
  res.json({ success: true, user: baseUser });
});

// Brute-force Login Rate Limiter (5 failed attempts / 5 minutes per IP + account)
const loginFailTracker = new Map();
const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function getLoginRateKey(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
  const ident = String(req.body?.username || '').trim().toLowerCase() || '_anon';
  return `${ip}::${ident}`;
}

app.post('/api/auth/login', (req, res) => {
  const rateKey = getLoginRateKey(req);
  const now = Date.now();
  const record = loginFailTracker.get(rateKey);
  if (record && record.count >= LOGIN_RATE_LIMIT_MAX && (now - record.firstFailAt) < LOGIN_RATE_LIMIT_WINDOW_MS) {
    const waitMin = Math.ceil((LOGIN_RATE_LIMIT_WINDOW_MS - (now - record.firstFailAt)) / 60000);
    return res.status(429).json({
      success: false,
      error: `Bạn đã nhập sai mật khẩu quá ${LOGIN_RATE_LIMIT_MAX} lần. Vui lòng thử lại sau ${waitMin} phút.`
    });
  }

  const user = authService.authenticateUser(req.body || {});
  if (!user) {
    if (!record || (now - record.firstFailAt) >= LOGIN_RATE_LIMIT_WINDOW_MS) {
      loginFailTracker.set(rateKey, { count: 1, firstFailAt: now });
    } else {
      record.count += 1;
      loginFailTracker.set(rateKey, record);
    }
    return res.status(401).json({ success: false, error: 'Sai tên đăng nhập/email hoặc mật khẩu.' });
  }
  if (user.locked) {
    return res.status(403).json({ success: false, error: 'Tài khoản này đã bị Admin tạm khóa.' });
  }

  loginFailTracker.delete(rateKey);
  const token = authService.signToken(user);
  res.cookie(authService.SESSION_COOKIE_NAME, token, {
    maxAge: authService.TOKEN_TTL_MS,
    httpOnly: true,
    sameSite: 'Lax',
    path: '/'
  });
  res.json({ success: true, token, user });
});

app.post('/api/auth/profile', (req, res) => {
  try {
    const username = req.authUser?.username;
    if (!username || req.authUser?.isDefaultWorkspace) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để cập nhật hồ sơ.' });
    }
    const updated = authService.updateUserProfile(username, req.body || {});
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
    }
    const userPayload = {
      ...req.authUser,
      displayName: updated.displayName,
      hotline: updated.hotline || '',
      defaultShopUrl: updated.defaultShopUrl || '',
      exp: Date.now() + authService.TOKEN_TTL_MS
    };
    const token = authService.signToken(userPayload);
    res.cookie(authService.SESSION_COOKIE_NAME, token, {
      maxAge: authService.TOKEN_TTL_MS,
      httpOnly: true,
      sameSite: 'Lax',
      path: '/'
    });
    res.json({ success: true, user: userPayload, message: 'Đã cập nhật hồ sơ cá nhân thành công!' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/change-password', (req, res) => {
  try {
    const username = req.authUser?.username;
    if (!username || req.authUser?.isDefaultWorkspace) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để đổi mật khẩu.' });
    }
    const { currentPassword, newPassword } = req.body || {};
    authService.changeUserPassword(username, { currentPassword, newPassword });
    res.json({ success: true, message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được mã hóa an toàn.' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Self-Serve Registration with Email & Password (supports /join/:shopCode CTV invite)
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, displayName, inviteShopOwner } = req.body || {};
    const created = authService.registerWithEmail({ email, password, displayName, inviteShopOwner });
    const userPayload = {
      username: created.username,
      email: created.email,
      role: created.role,
      subId: created.subId,
      shopOwner: created.shopOwner || null,
      displayName: created.displayName,
      persona: created.persona,
      hasAffiliates: created.hasAffiliates !== false,
      exp: Date.now() + authService.TOKEN_TTL_MS
    };
    const token = authService.signToken(userPayload);
    res.cookie(authService.SESSION_COOKIE_NAME, token, {
      maxAge: authService.TOKEN_TTL_MS,
      httpOnly: true,
      sameSite: 'Lax',
      path: '/'
    });
    res.status(201).json({
      success: true,
      token,
      user: userPayload,
      message: `Đăng ký thành công! Chào mừng ${created.displayName} đến với AutoBiz AI.`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Onboarding Survey: Configure Workspace Stream (Chủ shop có CTV vs CTV Độc lập)
app.post('/api/auth/onboarding', (req, res) => {
  try {
    const username = req.authUser?.username;
    if (!username) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập trước khi thiết lập hồ sơ.' });
    }
    const { persona, hasAffiliates } = req.body || {};
    const updated = authService.setOnboardingPersona(username, { persona, hasAffiliates });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin tài khoản.' });
    }
    const userPayload = {
      username: updated.username,
      email: updated.email || null,
      role: updated.role,
      subId: updated.subId,
      displayName: updated.displayName,
      persona: updated.persona,
      hasAffiliates: updated.hasAffiliates,
      exp: Date.now() + authService.TOKEN_TTL_MS
    };
    const token = authService.signToken(userPayload);
    res.cookie(authService.SESSION_COOKIE_NAME, token, {
      maxAge: authService.TOKEN_TTL_MS,
      httpOnly: true,
      sameSite: 'Lax',
      path: '/'
    });
    res.json({
      success: true,
      token,
      user: userPayload,
      message: updated.persona === 'independent_affiliate'
        ? 'Đã chuyển sang Không gian làm việc: Affiliate Creator / KOC Độc Lập!'
        : 'Đã chuyển sang Không gian làm việc: Chủ Shop & Quản Lý Mạng Lưới CTV!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(authService.SESSION_COOKIE_NAME, { path: '/' });
  res.json({ success: true });
});

// 0.1. 3-Tier Account & Role Management APIs (Admin Tổng -> Chủ shop -> CTV)
app.get('/api/users', authService.requireAdmin, (req, res) => {
  if (req.authUser?.isDefaultWorkspace) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập tài khoản Quản trị / Chủ shop.' });
  }
  const users = authService.listUsers(req.authUser.role, req.authUser.username);
  res.json({ success: true, total: users.length, users, actorRole: req.authUser.role });
});

app.post('/api/users', authService.requireAdmin, (req, res) => {
  if (req.authUser?.isDefaultWorkspace) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập tài khoản Quản trị / Chủ shop.' });
  }
  try {
    const requestedRole = String(req.body?.role || 'ctv').trim();
    if (req.authUser.role !== 'superadmin' && requestedRole !== 'ctv') {
      return res.status(403).json({
        success: false,
        error: 'Chủ shop chỉ có quyền tạo tài khoản CTV. Chỉ Admin Tổng mới có quyền cấp quyền Chủ shop hoặc Admin Tổng.'
      });
    }
    const created = authService.createUser({
      ...req.body,
      role: requestedRole,
      shopOwner: requestedRole === 'ctv' ? (req.body?.shopOwner || req.authUser.username) : null
    });
    res.status(201).json({ success: true, user: created, message: `Đã tạo tài khoản ${created.username} (${created.role}).` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.patch('/api/users/:username', authService.requireAdmin, (req, res) => {
  if (req.authUser?.isDefaultWorkspace) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập tài khoản Quản trị / Chủ shop.' });
  }
  const targetName = String(req.params.username || '').trim().toLowerCase();
  const existingList = authService.listUsers('superadmin');
  const targetUser = existingList.find((u) => u.username.toLowerCase() === targetName);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
  }

  if (req.authUser.role !== 'superadmin') {
    if (targetUser.role !== 'ctv' || (req.body?.role && req.body.role !== 'ctv')) {
      return res.status(403).json({
        success: false,
        error: 'Chỉ Admin Tổng mới có quyền điều chỉnh vai trò Chủ shop / Admin hoặc nâng quyền.'
      });
    }
  }

  const updated = authService.updateUser(targetName, req.body || {});
  res.json({ success: true, user: updated, message: `Đã cập nhật phân quyền cho ${updated.username}.` });
});

app.delete('/api/users/:username', authService.requireAdmin, (req, res) => {
  if (req.authUser?.isDefaultWorkspace) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập tài khoản Quản trị / Chủ shop.' });
  }
  const targetName = String(req.params.username || '').trim().toLowerCase();
  if (req.authUser && targetName === String(req.authUser.username || '').toLowerCase()) {
    return res.status(400).json({ success: false, error: 'Không thể tự xóa tài khoản đang đăng nhập.' });
  }
  const existingList = authService.listUsers('superadmin');
  const targetUser = existingList.find((u) => u.username.toLowerCase() === targetName);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
  }
  if (req.authUser.role !== 'superadmin' && targetUser.role !== 'ctv') {
    return res.status(403).json({
      success: false,
      error: 'Chỉ Admin Tổng mới có quyền xóa tài khoản Chủ shop hoặc Admin.'
    });
  }
  const result = authService.deleteUser(targetName);
  if (!result.deleted) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({ success: true, message: `Đã xóa tài khoản ${targetName}.` });
});

// Helper: Per-user settings stored cleanly in Supabase Postgres (via runtime user_settings.json)
const USER_SETTINGS_FILE = 'user_settings.json';
async function getEffectiveSettingsForUser(authUser) {
  const globalSettings = await getSettings();
  const username = authUser?.username;
  if (!username || username === 'superadmin' || username === 'admin') {
    return {
      ...globalSettings,
      strictConfirmedOnly: globalSettings.strictConfirmedOnly !== false,
      orderAttributionSource: globalSettings.orderAttributionSource || 'pos_webhook',
      cookieWindowDays: Number(globalSettings.cookieWindowDays) || 14,
      webhookSecret: globalSettings.webhookSecret || 'autobiz_wh_secret_2026',
      enabledChannels: Object.assign(
        { facebook: true, instagram: true, tiktok: true, zalo: true, shopee: true },
        globalSettings.enabledChannels || {}
      )
    };
  }
  const allUserSettings = runtime.readJsonSafe(USER_SETTINGS_FILE, {});
  const mine = (allUserSettings && allUserSettings[username]) || {};
  return {
    fanpageName: mine.fanpageName || authUser.displayName || '',
    hotline: mine.hotline || authUser.hotline || '',
    email: mine.email || authUser.email || '',
    geminiApiKey: mine.geminiApiKey || '',
    aiTone: mine.aiTone || 'balanced',
    autoSignature: mine.autoSignature || '',
    autoShortenLinks: mine.autoShortenLinks !== false,
    strictConfirmedOnly: mine.strictConfirmedOnly !== false,
    orderAttributionSource: mine.orderAttributionSource || 'marketplace_import',
    cookieWindowDays: Number(mine.cookieWindowDays) || 14,
    scheduleGapMinutes: Number(mine.scheduleGapMinutes) || 45,
    fanpageId: mine.fanpageId || '',
    facebookPageToken: mine.facebookPageToken || '',
    instagramAccountId: mine.instagramAccountId || '',
    instagramAccessToken: mine.instagramAccessToken || '',
    tiktokOpenId: mine.tiktokOpenId || '',
    tiktokToken: mine.tiktokToken || '',
    zaloOaId: mine.zaloOaId || '',
    zaloToken: mine.zaloToken || '',
    shopeePartnerId: mine.shopeePartnerId || '',
    shopeePartnerKey: mine.shopeePartnerKey || '',
    telegramBotToken: mine.telegramBotToken || '',
    telegramChatId: mine.telegramChatId || '',
    webhookSecret: mine.webhookSecret || 'autobiz_wh_secret_2026',
    enabledChannels: Object.assign(
      { facebook: true, instagram: true, tiktok: true, zalo: true, shopee: true },
      mine.enabledChannels || {}
    )
  };
}

// 1. Get current settings (Per-user for all logged-in accounts)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getEffectiveSettingsForUser(req.authUser);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.1. Autonomous Cockpit Status Overview
app.get('/api/cockpit/status', async (req, res) => {
  try {
    const posts = await getPosts();
    const queuedPosts = posts.filter(p => p.status === 'queued' || p.status === 'processing' || p.status === 'pending_media' || p.status === 'skipped_no_media');
    const historyPosts = posts.filter(p => p.status === 'posted');
    const templates = await dataPostService.getModelTemplates();

    const sortedQueued = [...queuedPosts].sort((a, b) => {
      const tA = new Date(a.scheduled_time || a.scheduledTime || 0).getTime();
      const tB = new Date(b.scheduled_time || b.scheduledTime || 0).getTime();
      return tA - tB;
    });

    const nextPost = sortedQueued[0] || null;
    const lastPost = sortedQueued[sortedQueued.length - 1] || null;

    res.json({
      success: true,
      queueCount: queuedPosts.length,
      historyCount: historyPosts.length,
      templateCount: templates.length,
      nextPost,
      scheduledUntil: lastPost ? (lastPost.scheduled_time || lastPost.scheduledTime) : null,
      recentUpcoming: sortedQueued.slice(0, 6)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Update settings (Per-user persistence on Supabase Postgres)
app.post('/api/settings', async (req, res) => {
  try {
    const username = req.authUser?.username;
    const isGlobalOwner = !username || username === 'superadmin' || username === 'admin';
    if (isGlobalOwner) {
      const currentSettings = await getSettings();
      const newSettings = { ...currentSettings, ...(req.body || {}) };
      await saveSettings(newSettings);
      return res.json({ success: true, settings: newSettings, message: 'Đã lưu cấu hình thành công!' });
    }
    const allUserSettings = runtime.readJsonSafe(USER_SETTINGS_FILE, {});
    const currentMine = (allUserSettings && allUserSettings[username]) || {};
    const updatedMine = { ...currentMine, ...(req.body || {}), updatedAt: new Date().toISOString() };
    allUserSettings[username] = updatedMine;
    runtime.writeJsonSafe(USER_SETTINGS_FILE, allUserSettings);
    return res.json({ success: true, settings: updatedMine, message: 'Đã lưu cấu hình cá nhân thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Test Facebook Page Connection
app.post('/api/test-fb', async (req, res) => {
  try {
    const settings = await getEffectiveSettingsForUser(req.authUser);
    const pageId = req.body.fanpageId || settings.fanpageId;
    const token = req.body.facebookPageToken || settings.facebookPageToken;

    const result = await verifyPageToken(pageId, token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3.0. Test Instagram Business Connection
app.post('/api/test-instagram', async (req, res) => {
  try {
    const settings = await getEffectiveSettingsForUser(req.authUser);
    const igAccountId = req.body.instagramAccountId || settings.instagramAccountId;
    const igAccessToken = req.body.instagramAccessToken || settings.instagramAccessToken;
    const result = await verifyInstagramConnection(igAccountId, igAccessToken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3.1. Test Email Connection
app.post('/api/test-email', async (req, res) => {
  try {
    const currentSettings = await getSettings();
    const testConfig = { ...currentSettings, ...req.body };
    const result = await sendTestEmail(testConfig);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 3.2. Telegram Webhook (Processes updates from Telegram)
app.post('/api/telegram-webhook', async (req, res) => {
  // Respond 200 immediately to Telegram so webhook never times out
  res.status(200).json({ ok: true });

  try {
    const settings = await getSettings();
    await handleTelegramUpdate(req.body, settings, {
      getPosts,
      savePosts,
      upsertPostToDb,
      publishPost: executePost
    });
  } catch (err) {
    console.error('[Server] Telegram Webhook Error:', err);
  }
});

// 3.3. Setup Telegram Webhook
app.post('/api/telegram/setup-webhook', async (req, res) => {
  try {
    const settings = await getSettings();
    const token = req.body.telegramBotToken || settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Chưa có Telegram Bot Token. Vui lòng nhập token trước.' });
    }

    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${protocol}://${host}`);
    const webhookUrl = `${baseUrl}/api/telegram-webhook`;

    const result = await setTelegramWebhook(token, webhookUrl);
    res.json({
      success: true,
      webhookUrl,
      result,
      message: `Đã kích hoạt Webhook thành công tới: ${webhookUrl}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3.4. Test Telegram Message
app.post('/api/telegram/test-message', async (req, res) => {
  try {
    const settings = await getSettings();
    const token = req.body.telegramBotToken || settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = req.body.telegramChatId || settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp cả Bot Token và Chat ID để gửi tin nhắn thử.' });
    }

    const testText = `
🔔 <b>XIN CHÀO ANH VƯƠNG GIA!</b>
────────────────────────
Đây là tin nhắn thử nghiệm từ hệ thống <b>Laptop Vương Gia Autopost</b>.
Kết nối giữa Telegram Bot và Fanpage đã sẵn sàng 100%!

Từ bây giờ anh có thể:
1️⃣ Chọn 1 video + nhiều ảnh, dán bài Zalo vào Chú thích và gửi vào đây.
2️⃣ Bấm <b>[⚡ Đăng ngay]</b> khi muốn xuất bản tức thì.
────────────────────────
    `.trim();

    await sendTelegramMessage(token, chatId, testText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 Mở Dashboard Web', url: 'https://auto-post-fanpage-coral.vercel.app' }]
        ]
      }
    });

    res.json({ success: true, message: 'Đã gửi tin nhắn thử nghiệm thành công tới Telegram!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. AI Generate Post Content (Omni-Channel & Multi-Category AutoBiz AI Engine)
app.post('/api/generate-content', async (req, res) => {
  try {
    const { rawText, customPrice, imageBase64, category, channel, affiliateUrl, campaign } = req.body;
    const settings = await getSettings();

    const result = await generatePostWithGemini(rawText, settings, customPrice, imageBase64, {
      category: category || 'auto',
      channel: channel || 'facebook',
      affiliateUrl: affiliateUrl || '',
      campaign: campaign || 'autobiz_2026'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4a. Omni-Channel 4-in-1 Generator (Used by Chrome Extension v2.0 & Studio)
app.post('/api/ai/omni-generate', async (req, res) => {
  try {
    const { rawText, customPrice, category, affiliateUrl, campaign, channels: requestedChannels } = req.body;
    if (!rawText) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp nội dung hoặc tên sản phẩm.' });
    }
    const settings = await getSettings();
    const enabledMap = settings.enabledChannels || {};
    const baseChannels = Array.isArray(requestedChannels) && requestedChannels.length
      ? requestedChannels
      : ['facebook', 'tiktok', 'zalo', 'shopee'];
    const targetChannels = baseChannels.filter((ch) => enabledMap[ch] !== false);
    if (targetChannels.length === 0) {
      return res.status(400).json({ success: false, error: 'Tất cả kênh đang bị tắt trong Cài đặt. Vui lòng bật ít nhất 1 kênh.' });
    }
    const results = await Promise.all(
      targetChannels.map((ch) =>
        generatePostWithGemini(rawText, settings, customPrice, null, {
          category: category || 'auto',
          channel: ch,
          affiliateUrl: affiliateUrl || '',
          campaign: campaign || 'ext_collector_2026'
        }).then((r) => [ch, r.content || ''])
      )
    );
    const channels = Object.fromEntries(results);
    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4b. AutoBiz AI: Get Supported Multi-Categories & Generate Smart Affiliate UTM Link
app.get('/api/autobiz/categories', (req, res) => {
  res.json({ success: true, categories: Object.values(PRODUCT_CATEGORIES) });
});

app.post('/api/autobiz/affiliate-link', (req, res) => {
  try {
    const { baseUrl, channel, campaign, subId } = req.body;
    if (!baseUrl) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đường link sản phẩm gốc.' });
    }
    const links = {
      facebook: buildAffiliateUrl(baseUrl, 'facebook', campaign || 'autobiz_2026', subId || 'vuonggia'),
      tiktok: buildAffiliateUrl(baseUrl, 'tiktok', campaign || 'autobiz_2026', subId || 'vuonggia'),
      zalo: buildAffiliateUrl(baseUrl, 'zalo', campaign || 'autobiz_2026', subId || 'vuonggia'),
      shopee: buildAffiliateUrl(baseUrl, 'shopee', campaign || 'autobiz_2026', subId || 'vuonggia')
    };
    res.json({
      success: true,
      primary: channel ? links[channel] || links.facebook : links.facebook,
      links
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======================== PHASE 1: MULTI-CATEGORY CATALOG & FINTECH AFFILIATE ENGINE ========================

const CLICK_DEDUP_WINDOW_MS = 60 * 1000; // 60 giây chống click đúp trên cùng 1 thiết bị (không chặn người khác chung Wi-Fi)
const recentClickCache = new Map();
// Chỉ chặn bot preview tự động; KHÔNG chặn người thật mở link bằng trình duyệt trong app Zalo / Facebook Mobile
const BOT_USER_AGENT_REGEX = /facebookexternalhit|facebot|zalobot|zalo[-_ ]?preview|whatsapp|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|googlebot|bingbot|crawler|spider|headlesschrome|bot\b/i;

function isSpamOrBotClick(req, shortCode) {
  const ua = String(req.get('user-agent') || '');
  if (BOT_USER_AGENT_REGEX.test(ua)) {
    return { blocked: true, reason: 'bot_preview' };
  }

  const codeKey = String(shortCode || '').toUpperCase();
  const cookieHeader = String(req.headers.cookie || '');
  const cookieName = `ab_clk_${codeKey}=1`;
  if (cookieHeader.includes(cookieName)) {
    return { blocked: true, reason: 'cookie_dedup' };
  }

  const rawIp = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  // Gắn kèm chữ ký thiết bị (User-Agent) để 2 thiết bị khác nhau chung 1 mạng Wi-Fi vẫn được đếm độc lập
  const deviceSig = ua.slice(0, 80);
  const cacheKey = `${rawIp}::${deviceSig}::${codeKey}`;
  const now = Date.now();
  const prevTs = recentClickCache.get(cacheKey);
  if (prevTs && now - prevTs < CLICK_DEDUP_WINDOW_MS) {
    return { blocked: true, reason: 'device_dedup' };
  }

  if (recentClickCache.size > 2000) {
    for (const [k, ts] of recentClickCache.entries()) {
      if (now - ts >= CLICK_DEDUP_WINDOW_MS) recentClickCache.delete(k);
    }
  }
  recentClickCache.set(cacheKey, now);
  return { blocked: false, codeKey };
}

// Shortlink Redirect & Real-Time Click Tracker with Anti-Spam Filter (GET /r/:code)
app.get('/r/:code', (req, res) => {
  const spamCheck = isSpamOrBotClick(req, req.params.code);
  const resolved = affiliateService.recordClickAndResolve(req.params.code, {
    countClick: !spamCheck.blocked
  });
  if (!resolved || !resolved.targetUrl) {
    return res.status(404).send('<h3>AutoBiz AI: Link tiếp thị liên kết không tồn tại hoặc đã hết hạn.</h3>');
  }
  if (!spamCheck.blocked && spamCheck.codeKey) {
    res.cookie(`ab_clk_${spamCheck.codeKey}`, '1', {
      maxAge: CLICK_DEDUP_WINDOW_MS,
      httpOnly: true,
      sameSite: 'Lax'
    });
  }
  return res.redirect(302, resolved.targetUrl);
});

// Auto-Extract Product Info from Shopee / TikTok / Web URL
app.post('/api/catalog/extract-url', async (req, res) => {
  try {
    const { url } = req.body || {};
    const extracted = await urlExtractor.extractProductFromUrl(url);
    res.json({ success: true, extracted });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Multi-Category Product Catalog CRUD (Multi-tenant & KOC Independent Affiliate supported)
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  const user = req.authUser || {};
  const products = catalogService.listProducts({
    category,
    search,
    owner: user.username || null,
    role: user.role || 'superadmin',
    persona: user.persona || null,
    shopOwner: user.shopOwner || null
  });
  res.json({ success: true, total: products.length, products });
});

app.post('/api/products', authService.requireCatalogWrite, (req, res) => {
  try {
    const owner = req.authUser?.username || 'superadmin';
    const created = catalogService.createProduct({ ...(req.body || {}), owner });
    res.status(201).json({ success: true, product: created });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/products/:id', authService.requireCatalogWrite, (req, res) => {
  const existing = catalogService.getProductById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm.' });
  const user = req.authUser || {};
  const isOwner = existing.owner === user.username || (!existing.owner && user.username === 'admin');
  if (user.role !== 'superadmin' && !isOwner) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ có thể chỉnh sửa sản phẩm của chính mình.' });
  }
  const updated = catalogService.updateProduct(req.params.id, req.body || {});
  res.json({ success: true, product: updated });
});

app.delete('/api/products/:id', authService.requireCatalogWrite, (req, res) => {
  const existing = catalogService.getProductById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm.' });
  const user = req.authUser || {};
  const isOwner = existing.owner === user.username || (!existing.owner && user.username === 'admin');
  if (user.role !== 'superadmin' && !isOwner) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ có thể xóa sản phẩm của chính mình.' });
  }
  catalogService.deleteProduct(req.params.id);
  res.json({ success: true });
});

// Affiliate Shortlink Management & FinTech Analytics (Multi-tenant scoped by role & owner)
app.get('/api/affiliate/links', (req, res) => {
  const user = req.authUser || {};
  const subIdScope = user.role === 'ctv' ? user.subId : null;
  const links = affiliateService.listAffiliateLinks({
    subId: subIdScope,
    owner: user.username || null,
    role: user.role || 'superadmin'
  });
  res.json({ success: true, total: links.length, links, role: user.role || 'superadmin', subIdScope });
});

app.post('/api/affiliate/shorten', (req, res) => {
  try {
    const { baseUrl, productId, productName, priceRetail, commissionRate, channel, campaign, subId } = req.body || {};
    if (!baseUrl) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp baseUrl.' });
    }
    const user = req.authUser || {};
    const effectiveSubId = user.role === 'ctv'
      ? (user.subId || user.username)
      : (subId || user.username || 'vuonggia');
    const entry = affiliateService.createShortLink({
      baseUrl,
      productId,
      productName,
      priceRetail,
      commissionRate,
      channel,
      campaign,
      subId: effectiveSubId,
      owner: user.username || 'superadmin',
      shopOwner: user.shopOwner || null
    });
    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol || 'http';
    res.status(201).json({
      success: true,
      shortUrl: `${protocol}://${host}/r/${entry.shortCode}`,
      entry,
      link: entry
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/affiliate/links/:shortCode', authService.requireAdmin, (req, res) => {
  if (req.authUser?.isDefaultWorkspace) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập tài khoản Quản trị / Chủ shop.' });
  }
  const updated = affiliateService.updateShortLinkTarget(req.params.shortCode, req.body || {});
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy mã shortlink.' });
  }
  res.json({ success: true, link: updated });
});

app.get('/api/analytics/summary', async (req, res) => {
  const user = req.authUser || {};
  const settings = await getEffectiveSettingsForUser(user);
  const strictConfirmedOnly = settings.strictConfirmedOnly !== false;
  const subIdScope = user.role === 'ctv' ? user.subId : null;
  const baseSummary = affiliateService.getAnalyticsSummary({
    subId: subIdScope,
    owner: user.username || null,
    role: user.role || 'superadmin',
    strictConfirmedOnly
  });
  const totalProducts = catalogService.listProducts({
    owner: user.username || null,
    role: user.role || 'superadmin',
    persona: user.persona || null,
    shopOwner: user.shopOwner || null
  }).length;
  const summary = {
    ...baseSummary,
    totalProducts,
    totalEstimatedCommission: baseSummary.totalEstimatedCommission,
    roleScope: user.role || 'superadmin',
    subIdScope
  };
  res.json({ success: true, summary });
});

// Download Sample Order Reconciliation CSV Template
app.get('/api/orders/import-template', (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="autobiz_orders_template.csv"');
  res.send(orderImporter.getSampleCsvTemplate());
});

// Import Real Orders from Shopee / TikTok / POS (.CSV or .XLSX)
app.post('/api/orders/import', upload.single('file'), async (req, res) => {
  try {
    let fileBuffer = req.file?.buffer || null;
    let filename = req.file?.originalname || 'orders.csv';
    if (!fileBuffer && typeof req.body?.csvText === 'string' && req.body.csvText.trim()) {
      fileBuffer = Buffer.from(req.body.csvText, 'utf8');
      filename = 'inline_orders.csv';
    }
    if (!fileBuffer) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn tệp báo cáo .CSV hoặc .XLSX.' });
    }
    const source = String(req.body?.source || 'csv_import').trim();
    const report = await orderImporter.importOrdersFromBuffer(fileBuffer, filename, { source });
    res.json({
      success: true,
      report,
      message: `Đối soát xong ${report.totalRows} dòng: +${report.importedCount} đơn mới (${report.totalRevenueAdded.toLocaleString('vi-VN')} đ), ${report.duplicateCount} trùng mã, ${report.failedCount} không khớp.`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/affiliate/record-order', authService.requireAdmin, (req, res) => {
  try {
    const { shortCode, orderAmount, quantity } = req.body || {};
    if (!shortCode) {
      return res.status(400).json({ success: false, error: 'Thiếu mã shortCode để ghi nhận đơn hàng.' });
    }
    const updated = affiliateService.recordOrderForLink(shortCode, { orderAmount, quantity });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy mã shortlink.' });
    }
    res.json({ success: true, link: updated, summary: affiliateService.getAnalyticsSummary() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Automated Order Webhook (Pancake / Sapo / Haravan / Shopee Sync)
app.post('/api/webhooks/order', async (req, res) => {
  try {
    const settings = await getSettings();
    const expectedSecret = process.env.WEBHOOK_SECRET || settings.webhookSecret || 'autobiz_wh_secret_2026';
    const providedSecret = String(req.headers['x-webhook-secret'] || req.body?.secret || '').trim();
    if (!providedSecret || providedSecret !== expectedSecret) {
      return res.status(401).json({
        success: false,
        error: 'Webhook Secret không hợp lệ (kiểm tra header x-webhook-secret).'
      });
    }
    const result = affiliateService.processOrderWebhook(req.body || {});
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/webhooks/logs', authService.requireAdmin, (req, res) => {
  const logs = affiliateService.listWebhookLogs();
  res.json({ success: true, total: logs.length, logs });
});

// Payouts & VietQR Commission Reconciliation APIs
app.get('/api/payouts', (req, res) => {
  try {
    const data = payoutsService.listPayoutsForUser(req.authUser);
    res.json({ success: true, banks: payoutsService.SUPPORTED_BANKS, minAmount: payoutsService.MIN_PAYOUT_AMOUNT, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/payouts', (req, res) => {
  try {
    const created = payoutsService.createPayoutRequest(req.authUser, req.body || {});
    res.status(201).json({
      success: true,
      payout: created,
      message: `Đã gửi yêu cầu rút ${created.amount.toLocaleString('vi-VN')} đ thành công! Chờ Chủ shop đối soát.`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.patch('/api/payouts/:id', authService.requireAdmin, (req, res) => {
  try {
    const updated = payoutsService.updatePayoutStatus(req.params.id, req.body || {}, req.authUser);
    if (!updated) return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu rút tiền.' });
    res.json({
      success: true,
      payout: updated,
      message: updated.status === 'paid' ? 'Đã xác nhận thanh toán hoa hồng thành công!' : 'Đã cập nhật trạng thái yêu cầu rút tiền.'
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
});

// 1-Click Demo Seed & Clear for Jury / Video Recording (Admin only)
app.post('/api/demo/seed', authService.requireAdmin, (req, res) => {
  try {
    const { seedDemoDataset } = require('./scripts/seed_demo_data');
    const result = seedDemoDataset({ includeLinks: true });
    const baseSummary = affiliateService.getAnalyticsSummary();
    const totalProducts = catalogService.listProducts().length;
    res.json({
      success: true,
      message: `Đã nạp ${result.productsCount} sản phẩm mẫu (5 ngành) & ${result.linksCount} chiến dịch CTV FinTech!`,
      summary: { ...baseSummary, totalProducts, totalEstimatedCommission: baseSummary.totalCommission }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/demo/clear', authService.requireAdmin, (req, res) => {
  try {
    const { clearDemoDataset } = require('./scripts/seed_demo_data');
    clearDemoDataset();
    const baseSummary = affiliateService.getAnalyticsSummary();
    res.json({
      success: true,
      message: 'Đã làm sạch toàn bộ dữ liệu demo về trạng thái trống.',
      summary: { ...baseSummary, totalProducts: 0, totalEstimatedCommission: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Phase 2: Omni-Channel Dispatch Hub (Facebook + TikTok + Zalo + Shopee)
app.post('/api/autobiz/dispatch', async (req, res) => {
  try {
    const settings = await getEffectiveSettingsForUser(req.authUser);
    const enabledMap = settings.enabledChannels || {};
    const { target_channels, channel_contents, finalContent, mediaFiles, videoUrl, zaloUserId } = req.body || {};
    const filteredChannels = Array.isArray(target_channels)
      ? target_channels.filter((ch) => enabledMap[ch] !== false)
      : target_channels;
    const results = await dispatchToChannels(
      { target_channels: filteredChannels, channel_contents, finalContent, mediaFiles, videoUrl, zaloUserId },
      settings
    );
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Upload Media Files (Images / Videos - Up to 35 files)
app.post('/api/upload-media', upload.array('files', 35), async (req, res) => {
  try {
    const files = [];
    for (const f of (req.files || [])) {
      if (f.mimetype && !f.mimetype.startsWith('video/')) {
        const banCheck = inspectMedia({ buffer: f.buffer, url: f.originalname });
        if (banCheck.isBanned) {
          console.log(`[MediaFilter] 🚫 Bỏ qua tệp tải lên cấm: ${banCheck.reason} (${f.originalname})`);
          continue;
        }
      }
      let fileObj = null;
      try {
        const supaRes = await uploadToSupabaseStorage(f.buffer, f.originalname, f.mimetype);
        if (supaRes && supaRes.url) {
          fileObj = supaRes;
        }
      } catch (err) {
        console.warn('[Storage] Supabase upload failed, using local/tmp fallback:', err.message);
      }

      if (!fileObj) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const isVideo = (f.mimetype && f.mimetype.startsWith('video/')) || /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(f.originalname || '');
        const ext = path.extname(f.originalname) || (isVideo ? '.mp4' : '.jpg');
        const filename = `${uniqueSuffix}${ext}`;
        let localPath = null;
        try {
          const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          localPath = path.join(uploadDir, filename);
          fs.writeFileSync(localPath, f.buffer);
        } catch (e) {
          console.warn('[Storage] Local write notice:', e.message);
        }

        fileObj = {
          originalname: f.originalname,
          filename: filename,
          path: localPath,
          url: `/uploads/${filename}`,
          mimetype: f.mimetype || (isVideo ? 'video/mp4' : 'image/jpeg'),
          size: f.size
        };
      }

      files.push(fileObj);
    }
    res.json({ success: true, files });
  } catch (error) {
    console.error('[UploadMedia Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Route: Quick Upload Page for mobile 1-click photo upload from email
app.get('/quick-upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quick-upload.html'));
});

// Parse Excel Stock Table Image into structured items (with auto-deduplication)
app.post('/api/parse-table', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const settings = await getSettings();
    const rawItems = await parseStockTableFromImage(imageBase64, settings);

    // Auto-deduplicate parsed items: if duplicate machine codes exist in table/images, keep newest!
    const { dedupedItems, replacedCount, replacedCodes } = deduplicateItemsByCode(rawItems);

    res.json({
      success: true,
      count: dedupedItems.length,
      replacedCount,
      replacedCodes,
      items: dedupedItems
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch schedule multiple items from stock table (with auto-deduplication & old queue replacement)
app.post('/api/batch-schedule', async (req, res) => {
  try {
    const { items = [] } = req.body;
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'Danh sách máy trống.' });
    }

    // 1. Deduplicate inside the incoming items: if user selected duplicate codes, keep the newest one!
    const { dedupedItems } = deduplicateItemsByCode(items);

    let posts = await getPosts();
    const replacedCodes = [];

    // 2. Check against existing queue: If any item code is already in queue (queued or pending_media),
    // delete the old post so the new post replaces it cleanly!
    for (const item of dedupedItems) {
      const norm = normalizeMachineCode(item.machineCode);
      if (isValidMachineCode(norm)) {
        const oldIndex = posts.findIndex(p => 
          (p.status === 'queued' || p.status === 'pending_media' || p.status === 'skipped_no_media') &&
          normalizeMachineCode(p.machineCode) === norm
        );
        if (oldIndex !== -1) {
          const oldPost = posts[oldIndex];
          console.log(`[Deduplicate] 🗑️ Tự động xóa bài cũ #${norm} (ID: ${oldPost.id}) trong hàng đợi để thay bằng bài mới.`);
          posts.splice(oldIndex, 1);
          await deletePostFromDb(oldPost.id);
          if (!replacedCodes.includes(norm)) replacedCodes.push(norm);
        }
      }
    }

    const slots = await getConsecutiveScheduleSlots(dedupedItems.length);
    const newPosts = [];

    for (let index = 0; index < dedupedItems.length; index++) {
      const item = dedupedItems[index];
      const scheduledTime = slots[index] || (await getNextAvailableScheduleTime());
      const newPost = {
        id: 'post_' + (Date.now() + index),
        machineCode: (item.machineCode || 'MÁY').toUpperCase(),
        machineName: item.machineName || 'Laptop Nhật Bãi',
        content: item.postContent || '',
        price: item.price || '',
        mediaFiles: [], // Starts empty, waiting for photos
        scheduledTime,
        status: 'pending_media', // Waiting for media from email reminder
        mediaReminderSent: false,
        createdAt: new Date().toISOString()
      };
      posts.unshift(newPost);
      newPosts.push(newPost);
    }

    await savePosts(posts);
    for (const np of newPosts) {
      await upsertPostToDb(np);
    }

    let message = `Đã lên lịch hàng loạt thành công cho ${newPosts.length} máy!`;
    if (replacedCodes.length > 0) {
      message += ` (Đã tự động xóa ${replacedCodes.length} mã cũ bị trùng: #${replacedCodes.join(', #')}, thay bằng mã mới)`;
    }

    res.json({
      success: true,
      count: newPosts.length,
      replacedCount: replacedCodes.length,
      replacedCodes,
      message,
      posts: newPosts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single post details
app.get('/api/posts/:id', async (req, res) => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Attach media to a post from Mobile Quick-Upload or Web (Up to 35 files)
app.post('/api/posts/:id/attach-media', upload.array('files', 35), async (req, res) => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết.' });

    const newFiles = [];
    for (const f of (req.files || [])) {
      if (f.mimetype && !f.mimetype.startsWith('video/')) {
        const banCheck = inspectMedia({ buffer: f.buffer, url: f.originalname });
        if (banCheck.isBanned) {
          console.log(`[MediaFilter] 🚫 Bỏ qua tệp tải lên cấm: ${banCheck.reason} (${f.originalname})`);
          continue;
        }
      }
      let fileObj = null;
      try {
        const supaRes = await uploadToSupabaseStorage(f.buffer, f.originalname, f.mimetype);
        if (supaRes && supaRes.url) {
          fileObj = supaRes;
        }
      } catch (err) {
        console.warn('[Storage] Supabase upload failed, using local/tmp fallback:', err.message);
      }

      if (!fileObj) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const isVideo = (f.mimetype && f.mimetype.startsWith('video/')) || /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(f.originalname || '');
        const ext = path.extname(f.originalname) || (isVideo ? '.mp4' : '.jpg');
        const filename = `${uniqueSuffix}${ext}`;
        let localPath = null;
        try {
          const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          localPath = path.join(uploadDir, filename);
          fs.writeFileSync(localPath, f.buffer);
        } catch (e) {
          console.warn('[Storage] Local write notice:', e.message);
        }

        fileObj = {
          originalname: f.originalname,
          filename: filename,
          path: localPath,
          url: `/uploads/${filename}`,
          mimetype: f.mimetype || (isVideo ? 'video/mp4' : 'image/jpeg'),
          size: f.size
        };
      }

      newFiles.push(fileObj);
    }

    if (!post.mediaFiles) post.mediaFiles = [];
    post.mediaFiles = [...post.mediaFiles, ...newFiles];

    if (req.body.cloudLink) {
      post.cloudLink = req.body.cloudLink;
    }

    // Now that media is supplied, move post to queued (ready to publish)
    if (post.mediaFiles.length > 0 || post.cloudLink) {
      post.status = 'queued';
    }

    post.mediaReminderSent = true;
    await savePosts(posts);
    await upsertPostToDb(post);

    console.log(`[QuickUpload] 📸 Đã cập nhật ${newFiles.length} tệp media cho bài [${post.id}] - Mã #${post.machineCode}`);
    res.json({ success: true, post, message: 'Đã cập nhật hình ảnh thành công!' });
  } catch (error) {
    console.error('[AttachMedia Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove a media file from a post
app.delete('/api/posts/:id/media/:filename', async (req, res) => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết.' });

    if (post.mediaFiles) {
      post.mediaFiles = post.mediaFiles.filter(m => m.filename !== req.params.filename);
    }
    await savePosts(posts);
    await upsertPostToDb(post);
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Next Suggested Schedule Slot
app.get('/api/next-slot', async (req, res) => {
  try {
    const nextSlot = await getNextAvailableScheduleTime();
    res.json({ nextSlot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get All Posts (Queued, Posted, Draft) - Multi-tenant filtered by owner
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getPosts();
    const user = req.authUser || {};
    if (!user.role || user.role === 'superadmin') {
      return res.json(posts);
    }
    const cleanOwner = String(user.username || '').toLowerCase();
    const filtered = posts.filter((p) => {
      const pOwner = String(p.owner || '').toLowerCase();
      if (cleanOwner === 'admin') {
        return !pOwner || pOwner === 'admin' || pOwner === 'superadmin';
      }
      return pOwner === cleanOwner;
    });
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Create or Schedule a Post (with auto-deduplication: replaces old post if same machine code is in queue)
app.post('/api/posts', async (req, res) => {
  try {
    const {
      machineCode,
      machineName,
      content,
      price,
      mediaFiles = [],
      scheduledTime,
      publishImmediately = false
    } = req.body;

    let posts = await getPosts();
    const normCode = normalizeMachineCode(machineCode);
    let replacedOldPost = null;

    // Auto-deduplication: Check if an existing queued post has the exact same machine code
    if (isValidMachineCode(normCode)) {
      const oldIndex = posts.findIndex(p => 
        (p.status === 'queued' || p.status === 'pending_media' || p.status === 'skipped_no_media') &&
        normalizeMachineCode(p.machineCode) === normCode
      );
      if (oldIndex !== -1) {
        replacedOldPost = posts[oldIndex];
        console.log(`[Deduplicate] 🗑️ Tìm thấy bài cũ trùng mã #${normCode} (ID: ${replacedOldPost.id}). Xóa mã cũ để thay thế bằng mã mới.`);
        posts.splice(oldIndex, 1);
        await deletePostFromDb(replacedOldPost.id);
      }
    }

    const nextAvailableTime = await getNextAvailableScheduleTime();

    // Strict Anti-Spam: Filter out any banned media (Zalo avatars, Excel spreadsheets, tiny images)
    const cleanedMedia = (mediaFiles || []).filter(m => {
      const url = typeof m === 'string' ? m : (m.url || '');
      const check = inspectMedia({ url });
      if (check.isBanned) {
        console.log(`[MediaFilter] 🚫 Loại bỏ ảnh cấm khỏi bài đăng: ${check.reason} (${url.slice(0, 80)})`);
        return false;
      }
      return true;
    });

    const newPost = {
      id: 'post_' + Date.now(),
      owner: req.authUser?.username || 'superadmin',
      machineCode: (machineCode || 'MÁY').toUpperCase(),
      machineName: machineName || 'Laptop Nhật Bãi',
      content: content || '',
      price: price || '',
      mediaFiles: cleanedMedia,
      scheduledTime: publishImmediately ? new Date().toISOString() : (scheduledTime || nextAvailableTime),
      status: publishImmediately ? 'processing' : (cleanedMedia.length === 0 ? 'pending_media' : 'queued'),
      notes: cleanedMedia.length === 0 ? 'Chờ bổ sung ảnh máy thật (đã lọc bỏ ảnh đại diện/bảng tính).' : undefined,
      createdAt: new Date().toISOString()
    };

    if (publishImmediately) {
      posts.unshift(newPost);
      await savePosts(posts);
      await upsertPostToDb(newPost);
      // Run immediately
      executePost(newPost).then(async (executedPost) => {
        console.log(`[Instant Post] Hoàn tất đăng ngay bài ${newPost.id}`);
        await upsertPostToDb(executedPost);
      });
      return res.json({
        success: true,
        post: newPost,
        replacedOldPost: !!replacedOldPost,
        message: replacedOldPost
          ? `Đã đăng ngay mã #${newPost.machineCode}! (Đã tự động xóa bài cũ trùng mã trong hàng đợi)`
          : 'Đang tiến hành đăng bài lên Fanpage...'
      });
    } else {
      posts.unshift(newPost);
      await savePosts(posts);
      await upsertPostToDb(newPost);
      return res.json({
        success: true,
        post: newPost,
        replacedOldPost: !!replacedOldPost,
        message: replacedOldPost
          ? `Đã xếp mã #${newPost.machineCode} vào hàng đợi lúc ${new Date(newPost.scheduledTime).toLocaleString('vi-VN')}! (Đã tự động xóa bài cũ trùng mã)`
          : `Đã đưa bài vào hàng đợi lên lịch lúc: ${new Date(newPost.scheduledTime).toLocaleString('vi-VN')}`
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8.1. Dedicated 1-Click Push from Chrome Extension (Zalo Web)
app.post('/api/extension/push-post', async (req, res) => {
  try {
    const { rawText, mediaUrls = [], publishImmediately = false, customPrice = '', target = 'fanpage' } = req.body;
    if (!rawText && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({ success: false, error: 'Thiếu nội dung hoặc ảnh/video từ Zalo.' });
    }

    const settings = await getSettings();

    // 1. AI or Fallback parse post content
    const textToParse = rawText || 'Laptop xách tay Nhật Bản chính hãng';
    const generated = await generatePostWithGemini(textToParse, settings, customPrice);

    const finalCode = generated.machineCode || extractExplicitMachineCode(textToParse) || String(Date.now()).slice(-4);
    const finalName = generated.machineName || `Laptop #${finalCode}`;

    // 2. Download media URLs or decode base64 and upload directly to Supabase Storage
    const uploadedMediaFiles = [];
    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      console.log(`[Extension] 📥 Đang xử lý ${mediaUrls.length} tệp media (kênh: ${target})...`);
      for (let i = 0; i < mediaUrls.length; i++) {
        const mUrl = mediaUrls[i];
        if (!mUrl) continue;

        try {
          let buffer;
          let mime = 'image/jpeg';
          let ext = '.jpg';

          // A. Handle Base64 Data URLs (from browser blobs)
          if (mUrl.startsWith('data:')) {
            const matches = mUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              mime = matches[1];
              buffer = Buffer.from(matches[2], 'base64');
              const isVideo = mime.startsWith('video/');
              ext = isVideo ? '.mp4' : (mime.includes('png') ? '.png' : '.jpg');
            } else {
              continue;
            }
          } else if (mUrl.startsWith('http')) {
            // B. Handle HTTP / HTTPS direct CDN URLs
            const mediaRes = await axios.get(mUrl, {
              responseType: 'arraybuffer',
              timeout: 30000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://chat.zalo.me/'
              }
            });
            buffer = Buffer.from(mediaRes.data);
            const contentType = mediaRes.headers['content-type'] || '';
            const isVideo = contentType.startsWith('video/') || /\.(mp4|mov|avi)$/i.test(mUrl);
            ext = isVideo ? '.mp4' : '.jpg';
            mime = isVideo ? 'video/mp4' : 'image/jpeg';
          } else {
            continue;
          }

          if (!isVideo) {
            const banCheck = inspectMedia({ buffer, url: mUrl });
            if (banCheck.isBanned) {
              console.log(`[MediaFilter] 🚫 Đã chặn ảnh cấm từ Zalo (#${finalCode}): ${banCheck.reason}`);
              continue;
            }
          }

          const originalName = `zalo_${finalCode}_${i + 1}${ext}`;
          const uploaded = await uploadToSupabaseStorage(buffer, originalName, mime);
          if (uploaded) {
            uploadedMediaFiles.push(uploaded);
            console.log(`[Extension] ✅ Đã lưu media #${i + 1} lên Supabase Storage:`, uploaded.url);
          }
        } catch (mediaErr) {
          console.warn(`[Extension] ⚠️ Lỗi xử lý media #${i + 1}:`, mediaErr.message);
        }
      }
    }

    // 2b. Auto-Replenish Fallback: Nếu bài thiếu ảnh hoặc toàn bộ ảnh bị bộ lọc chặn, tự động bù ảnh HD từ kho Template
    if (uploadedMediaFiles.length === 0) {
      try {
        const matchRes = await dataPostService.smartMatchTemplate(`${finalName || ''} ${rawText || ''} ${generated.content || ''}`);
        if (matchRes && matchRes.matched && matchRes.template && Array.isArray(matchRes.template.media_files) && matchRes.template.media_files.length > 0) {
          uploadedMediaFiles.push(...matchRes.template.media_files);
          console.log(`[AutoReplenish] 📸 Đã tự động bù ${uploadedMediaFiles.length} ảnh HD chính hãng từ template [${matchRes.template.model_name}] cho mã #${finalCode}`);
        }
      } catch (repErr) {
        console.warn('[AutoReplenish] Không thể bù ảnh từ template:', repErr.message);
      }
    }

    // 3. Build Post Object
    const scheduledTime = await getNextAvailableScheduleTime();
    const newPost = {
      id: `post_${Date.now()}`,
      machineCode: finalCode,
      machineName: finalName,
      content: generated.content,
      price: generated.price || customPrice || '',
      mediaFiles: uploadedMediaFiles,
      scheduledTime: scheduledTime,
      status: target === 'personal' ? 'personal_draft' : (uploadedMediaFiles.length > 0 ? 'queued' : 'pending_media'),
      targetChannel: target,
      mediaReminderSent: false,
      cloudLink: null,
      createdAt: new Date().toISOString(),
      postedAt: null,
      failedAt: null,
      skippedAt: null,
      fbPostId: null,
      fbPostUrl: null,
      isSimulation: false,
      lastMessage: `Được tạo bởi Zalo Extension (Chế độ: ${target})`
    };

    // 4. Save to Posts list & Supabase DB
    const posts = await getPosts();
    posts.unshift(newPost);
    await savePosts(posts);
    await upsertPostToDb(newPost);

    // 5. Handle Target: PERSONAL (Chỉ đăng trang cá nhân)
    if (target === 'personal') {
      return res.json({
        success: true,
        target: 'personal',
        post: newPost,
        message: `Đã chuẩn bị xong bài viết #${finalCode} kèm ${uploadedMediaFiles.length} ảnh HD cho Trang Cá Nhân!`
      });
    }

    // 6. Handle Target: BOTH (Đăng Fanpage ngay + Chuẩn bị link chia sẻ Trang Cá Nhân)
    if (target === 'both') {
      console.log(`[Extension] 🚀 Đang tiến hành đăng kép Fanpage + Cá nhân cho bài [${newPost.id}]...`);
      const published = await executePost(newPost);
      await upsertPostToDb(published);

      if (published.status === 'failed') {
        return res.status(500).json({
          success: false,
          target: 'both',
          post: published,
          error: published.errorMessage || 'Lỗi xuất bản Fanpage khi đăng kép',
          message: published.errorMessage || 'Lỗi xuất bản Fanpage khi đăng kép'
        });
      }

      const shareUrl = published.fbPostUrl
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(published.fbPostUrl)}`
        : null;

      return res.json({
        success: true,
        target: 'both',
        post: published,
        fbPostUrl: published.fbPostUrl,
        shareUrl: shareUrl,
        message: 'Đã xuất bản thành công lên Fanpage và sẵn sàng chia sẻ lên Trang Cá Nhân!'
      });
    }

    // 7. Handle Target: FANPAGE (Đăng ngay hoặc lên lịch)
    if (publishImmediately) {
      console.log(`[Extension] ⚡ Đang tiến hành đăng ngay bài [${newPost.id}] lên Facebook...`);
      const published = await executePost(newPost);
      await upsertPostToDb(published);

      if (published.status === 'failed') {
        return res.status(500).json({
          success: false,
          target: 'fanpage',
          post: published,
          error: published.errorMessage || 'Lỗi xuất bản bài viết lên Facebook Fanpage',
          message: published.errorMessage || 'Lỗi xuất bản bài viết lên Facebook Fanpage'
        });
      }

      return res.json({
        success: true,
        target: 'fanpage',
        post: published,
        fbPostUrl: published.fbPostUrl,
        message: 'Đã xuất bản thành công bài viết lên Facebook Fanpage!'
      });
    }

    return res.json({
      success: true,
      target: 'fanpage',
      post: newPost,
      message: `Đã đưa bài #${finalCode} vào hàng đợi lên lịch lúc ${new Date(scheduledTime).toLocaleString('vi-VN')}!`
    });

  } catch (error) {
    console.error('[Extension Push Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Trigger Post Immediately
app.post('/api/posts/:id/publish-now', async (req, res) => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết.' });
    }

    const updatedPost = await executePost(post);
    await upsertPostToDb(updatedPost);

    if (updatedPost.status === 'failed') {
      return res.status(500).json({
        success: false,
        error: updatedPost.errorMessage || 'Lỗi đăng bài Facebook',
        post: updatedPost
      });
    }

    res.json({
      success: true,
      post: updatedPost,
      facebookPostUrl: updatedPost.fbPostUrl || updatedPost.facebookPostUrl,
      message: 'Đã thực thi đăng bài thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Delete a Post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    let posts = await getPosts();
    const initialLength = posts.length;
    posts = posts.filter(p => p.id !== req.params.id);

    if (posts.length !== initialLength) {
      await savePosts(posts);
      await deletePostFromDb(req.params.id);
      res.json({ success: true, message: 'Đã xóa bài viết khỏi danh sách.' });
    } else {
      res.status(404).json({ error: 'Không tìm thấy bài viết.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. External Cron Check Trigger (for cron-job.org / GitHub Actions / Vercel Serverless)
app.get(['/api/cron', '/api/cron-check'], async (req, res) => {
  const key = req.query.key || req.headers['authorization'];
  const expected = process.env.CRON_SECRET || 'vg_cron_2026_laptop';
  // Allow Vercel native cron (sends CRON_SECRET in header) or secret key query param
  const authHeader = req.headers['authorization'];
  const isVercelCron = authHeader === `Bearer ${expected}` || req.headers['x-vercel-cron'] === '1';

  if (!isVercelCron && key !== expected && authHeader !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized: Sai mã CRON_SECRET key.' });
  }

  console.log('[CronCheck] ⏰ Đã nhận tín hiệu quét tự động từ dịch vụ Cron bên ngoài!');
  try {
    await checkAndPublishDuePosts();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Đã quét và xử lý đăng bài thành công!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================
// 12. DATA POST & CIRCULAR ENGINE API ROUTES
// ========================================================

// 12.1. Get Model Templates with Filters
app.get('/api/data-post/templates', async (req, res) => {
  try {
    const templates = await dataPostService.getModelTemplates({
      brand: req.query.brand,
      price_range: req.query.price_range || req.query.priceRange,
      status: req.query.status,
      search: req.query.search
    });
    res.json({
      success: true,
      count: templates.length,
      data: templates,
      templates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12.2. Get Single Model Template by ID
app.get('/api/data-post/templates/:id', async (req, res) => {
  try {
    const template = await dataPostService.getModelTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy Model Template.' });
    }
    res.json({ success: true, data: template, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12.3. Create Model Template
app.post('/api/data-post/templates', async (req, res) => {
  try {
    const template = await dataPostService.createModelTemplate(req.body);
    res.status(201).json({
      success: true,
      data: template,
      template,
      message: 'Đã tạo Model Template thành công!'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 12.4. Update Model Template
app.put('/api/data-post/templates/:id', async (req, res) => {
  try {
    const updated = await dataPostService.updateModelTemplate(req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
      template: updated,
      message: 'Đã cập nhật Model Template thành công!'
    });
  } catch (error) {
    const status = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

// 12.5. Delete Model Template
app.delete('/api/data-post/templates/:id', async (req, res) => {
  try {
    const result = await dataPostService.deleteModelTemplate(req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

// 12.6. Smart Match Model Template from Zalo Text
app.post('/api/data-post/smart-match', async (req, res) => {
  try {
    const rawText = req.body.raw_text !== undefined ? req.body.raw_text : req.body.rawText;
    const result = await dataPostService.smartMatchTemplate(rawText);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12.7. Get Circular Queue
app.get('/api/data-post/queue', async (req, res) => {
  try {
    const queue = await dataPostService.getCircularQueue();
    res.json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12.8. Enqueue Circular Post
app.post('/api/data-post/queue', async (req, res) => {
  try {
    const result = await dataPostService.enqueueCircularPost(req.body);
    res.status(201).json({
      success: true,
      queue_id: result.queue_id,
      status: result.status,
      data: result.data,
      message: 'Đã đưa bài vào hàng đợi tuần hoàn thành công!'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 12.9. Delete Circular Queue Item
app.delete('/api/data-post/queue/:id', async (req, res) => {
  try {
    const result = await dataPostService.deleteCircularQueueItem(req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

// 12.10. Trigger Circular Post Immediately (Dual Route Alias)
app.post(['/api/data-post/trigger-circular', '/api/data-post/queue/trigger-post'], async (req, res) => {
  try {
    const result = await dataPostService.triggerCircularPost(req.body);
    res.json(result);
  } catch (error) {
    const status = (error.message.includes('Không tìm thấy') || error.message.includes('Vui lòng') || error.message.includes('thiếu')) ? 400 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// Start Server and Scheduler if running as standalone Node process
if (require.main === module) {
  startScheduler();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`AutoBiz AI — Hệ Sinh Thái Tiếp Thị Đa Kênh & Affiliate FinTech`);
    console.log(`Truy cập giao diện tại: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
