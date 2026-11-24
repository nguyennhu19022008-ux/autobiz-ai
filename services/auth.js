const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'ab_session';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getAuthSecret() {
  return process.env.AUTOBIZ_AUTH_SECRET || process.env.GEMINI_API_KEY || 'autobiz_ai_rbac_secret_2026';
}

const DEMO_ACCOUNTS = [
  {
    username: 'admin',
    password: process.env.ADMIN_PASSWORD || 'autobiz2026',
    role: 'admin',
    subId: null,
    displayName: 'Chủ shop (Admin)'
  },
  {
    username: 'ctv01_minh',
    password: process.env.CTV_PASSWORD || 'ctv2026',
    role: 'ctv',
    subId: 'ctv01_minh',
    displayName: 'CTV Minh (ctv01_minh)'
  },
  {
    username: 'ctv02_khangthinh',
    password: process.env.CTV_PASSWORD || 'ctv2026',
    role: 'ctv',
    subId: 'ctv02_khangthinh',
    displayName: 'CTV Khang Thịnh (ctv02_khangthinh)'
  },
  {
    username: 'ctv03_hoang',
    password: process.env.CTV_PASSWORD || 'ctv2026',
    role: 'ctv',
    subId: 'ctv03_hoang',
    displayName: 'CTV Hoàng (ctv03_hoang)'
  }
];

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
  if (sig.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!parsed || !parsed.role || (parsed.exp && Date.now() > parsed.exp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = '') {
  const result = {};
  if (!cookieHeader) return result;
  for (const part of String(cookieHeader).split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

function authenticateUser({ username, password, quickRole, subId } = {}) {
  if (quickRole === 'admin') {
    const adminAcc = DEMO_ACCOUNTS[0];
    return {
      username: adminAcc.username,
      role: 'admin',
      subId: null,
      displayName: adminAcc.displayName,
      exp: Date.now() + TOKEN_TTL_MS
    };
  }

  if (quickRole === 'ctv') {
    const targetSub = String(subId || 'ctv01_minh').trim() || 'ctv01_minh';
    const matched = DEMO_ACCOUNTS.find((a) => a.subId === targetSub);
    return {
      username: matched ? matched.username : targetSub,
      role: 'ctv',
      subId: targetSub,
      displayName: matched ? matched.displayName : `CTV (${targetSub})`,
      exp: Date.now() + TOKEN_TTL_MS
    };
  }

  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '');
  const found = DEMO_ACCOUNTS.find(
    (a) => a.username.toLowerCase() === cleanUser && a.password === cleanPass
  );
  if (found) {
    return {
      username: found.username,
      role: found.role,
      subId: found.subId,
      displayName: found.displayName,
      exp: Date.now() + TOKEN_TTL_MS
    };
  }

  // Allow any ctv* account with demo CTV password for smooth multi-CTV testing
  if (cleanUser.startsWith('ctv') && cleanPass === (process.env.CTV_PASSWORD || 'ctv2026')) {
    return {
      username: cleanUser,
      role: 'ctv',
      subId: cleanUser,
      displayName: `CTV (${cleanUser})`,
      exp: Date.now() + TOKEN_TTL_MS
    };
  }

  return null;
}

function attachAuthUser(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = String(req.headers.authorization || '');
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const rawToken = bearer || req.headers['x-autobiz-token'] || cookies[SESSION_COOKIE_NAME] || '';
  const verified = verifyToken(rawToken);

  if (verified) {
    req.authUser = verified;
  } else {
    // Default demo-friendly mode keeps initial landing functional for Jury QR scan
    req.authUser = {
      username: 'admin',
      role: 'admin',
      subId: null,
      displayName: 'Chủ shop (Admin)',
      isDefaultWorkspace: true
    };
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.authUser || req.authUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Phân quyền: Tài khoản CTV không có quyền thực hiện thao tác quản trị của Chủ shop.'
    });
  }
  return next();
}

module.exports = {
  SESSION_COOKIE_NAME,
  TOKEN_TTL_MS,
  DEMO_ACCOUNTS,
  signToken,
  verifyToken,
  authenticateUser,
  attachAuthUser,
  requireAdmin
};
