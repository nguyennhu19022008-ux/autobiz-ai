const crypto = require('crypto');
const { readJsonSafe, writeJsonSafe } = require('../utils/runtime');

const SESSION_COOKIE_NAME = 'ab_session';
const USERS_FILENAME = 'users.json';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const VALID_ROLES = new Set(['superadmin', 'shop_owner', 'ctv']);

function getAuthSecret() {
  return process.env.AUTOBIZ_AUTH_SECRET || process.env.GEMINI_API_KEY || 'autobiz_ai_rbac_secret_2026';
}

const DEFAULT_USERS = [
  {
    username: 'superadmin',
    password: process.env.SUPERADMIN_PASSWORD || 'superadmin2026',
    role: 'superadmin',
    subId: null,
    displayName: 'Admin Tổng (Hệ thống)',
    active: true,
    createdAt: '2026-11-16T08:00:00.000Z'
  },
  {
    username: 'admin',
    password: process.env.ADMIN_PASSWORD || 'autobiz2026',
    role: 'shop_owner',
    subId: null,
    displayName: 'Chủ shop Vương Gia',
    active: true,
    createdAt: '2026-11-16T08:05:00.000Z'
  },
  {
    username: 'ctv01_minh',
    password: process.env.CTV_PASSWORD || 'ctv2026',
    role: 'ctv',
    subId: 'ctv01_minh',
    displayName: 'CTV Minh',
    active: true,
    createdAt: '2026-11-16T08:10:00.000Z'
  },
  {
    username: 'ctv02_khangthinh',
    password: process.env.CTV_PASSWORD || 'ctv2026',
    role: 'ctv',
    subId: 'ctv02_khangthinh',
    displayName: 'CTV Khang Thịnh',
    active: true,
    createdAt: '2026-11-16T08:15:00.000Z'
  },
  {
    username: 'ctv03_hoang',
    password: process.env.CTV_PASSWORD || 'ctv2026',
    role: 'ctv',
    subId: 'ctv03_hoang',
    displayName: 'CTV Hoàng',
    active: true,
    createdAt: '2026-11-16T08:20:00.000Z'
  }
];

function readUsers() {
  const users = readJsonSafe(USERS_FILENAME, null);
  if (!Array.isArray(users) || users.length === 0) {
    writeJsonSafe(USERS_FILENAME, DEFAULT_USERS);
    return [...DEFAULT_USERS];
  }
  return users;
}

function writeUsers(users) {
  writeJsonSafe(USERS_FILENAME, users);
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

function listUsers(actorRole = 'superadmin') {
  const users = readUsers();
  if (actorRole === 'superadmin') {
    return users.map(sanitizeUser);
  }
  if (actorRole === 'shop_owner') {
    return users.filter((u) => u.role === 'ctv').map(sanitizeUser);
  }
  return [];
}

function createUser({ username, password, role = 'ctv', subId, displayName } = {}) {
  const cleanUser = String(username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  if (!cleanUser || cleanUser.length < 3) {
    throw new Error('Tên đăng nhập phải có ít nhất 3 ký tự (chữ, số, _, ., -).');
  }
  const cleanPass = String(password || '').trim();
  if (!cleanPass || cleanPass.length < 4) {
    throw new Error('Mật khẩu phải có ít nhất 4 ký tự.');
  }
  const normalizedRole = VALID_ROLES.has(role) ? role : 'ctv';
  const users = readUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUser)) {
    throw new Error(`Tài khoản "${cleanUser}" đã tồn tại.`);
  }

  const entry = {
    username: cleanUser,
    password: cleanPass,
    role: normalizedRole,
    subId: normalizedRole === 'ctv' ? String(subId || cleanUser).trim() : null,
    displayName: String(displayName || cleanUser).trim(),
    active: true,
    createdAt: new Date().toISOString()
  };

  users.push(entry);
  writeUsers(users);
  return sanitizeUser(entry);
}

function updateUser(targetUsername, updates = {}) {
  const cleanTarget = String(targetUsername || '').trim().toLowerCase();
  const users = readUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === cleanTarget);
  if (idx === -1) return null;

  const user = { ...users[idx] };
  if (updates.role && VALID_ROLES.has(updates.role)) {
    user.role = updates.role;
    user.subId = updates.role === 'ctv' ? String(updates.subId || user.subId || user.username).trim() : null;
  } else if (updates.subId !== undefined && user.role === 'ctv') {
    user.subId = String(updates.subId).trim() || user.username;
  }
  if (updates.displayName !== undefined && String(updates.displayName).trim()) {
    user.displayName = String(updates.displayName).trim();
  }
  if (updates.password !== undefined && String(updates.password).trim().length >= 4) {
    user.password = String(updates.password).trim();
  }
  if (typeof updates.active === 'boolean') {
    user.active = updates.active;
  }
  user.updatedAt = new Date().toISOString();

  users[idx] = user;
  writeUsers(users);
  return sanitizeUser(user);
}

function deleteUser(targetUsername) {
  const cleanTarget = String(targetUsername || '').trim().toLowerCase();
  const users = readUsers();
  const target = users.find((u) => u.username.toLowerCase() === cleanTarget);
  if (!target) return { deleted: false, error: 'Không tìm thấy tài khoản.' };

  if (target.role === 'superadmin') {
    const superadminCount = users.filter((u) => u.role === 'superadmin' && u.active !== false).length;
    if (superadminCount <= 1) {
      return { deleted: false, error: 'Không thể xóa tài khoản Admin Tổng cuối cùng.' };
    }
  }

  const next = users.filter((u) => u.username.toLowerCase() !== cleanTarget);
  writeUsers(next);
  return { deleted: true };
}

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
  const users = readUsers();

  if (quickRole === 'superadmin') {
    const found = users.find((u) => u.role === 'superadmin' && u.active !== false) || DEFAULT_USERS[0];
    return {
      username: found.username,
      role: 'superadmin',
      subId: null,
      displayName: found.displayName,
      exp: Date.now() + TOKEN_TTL_MS
    };
  }

  if (quickRole === 'shop_owner' || quickRole === 'admin') {
    const found = users.find((u) => u.role === 'shop_owner' && u.active !== false) || DEFAULT_USERS[1];
    return {
      username: found.username,
      role: 'shop_owner',
      subId: null,
      displayName: found.displayName,
      exp: Date.now() + TOKEN_TTL_MS
    };
  }

  if (quickRole === 'ctv') {
    const targetSub = String(subId || 'ctv01_minh').trim() || 'ctv01_minh';
    const matched = users.find((u) => u.role === 'ctv' && u.subId === targetSub && u.active !== false);
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
  const found = users.find(
    (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
  );
  if (!found) return null;
  if (found.active === false) {
    return { locked: true };
  }

  return {
    username: found.username,
    role: found.role,
    subId: found.role === 'ctv' ? (found.subId || found.username) : null,
    displayName: found.displayName,
    exp: Date.now() + TOKEN_TTL_MS
  };
}

function attachAuthUser(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = String(req.headers.authorization || '');
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const rawToken = bearer || req.headers['x-autobiz-token'] || cookies[SESSION_COOKIE_NAME] || '';
  const verified = verifyToken(rawToken);

  if (verified) {
    // Normalize legacy 'admin' token role to 'shop_owner' if present
    if (verified.role === 'admin') verified.role = 'shop_owner';
    req.authUser = verified;
  } else {
    // Default workspace mode: Super Admin for full Jury/Demo visibility
    req.authUser = {
      username: 'superadmin',
      role: 'superadmin',
      subId: null,
      displayName: 'Admin Tổng (Hệ thống)',
      isDefaultWorkspace: true
    };
  }
  next();
}

function isShopOrAdmin(user) {
  return Boolean(user && (user.role === 'superadmin' || user.role === 'shop_owner' || user.role === 'admin'));
}

function requireAdmin(req, res, next) {
  if (!isShopOrAdmin(req.authUser)) {
    return res.status(403).json({
      success: false,
      error: 'Phân quyền: Tài khoản CTV không có quyền thực hiện thao tác quản trị của Chủ shop / Admin.'
    });
  }
  return next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.authUser || req.authUser.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Phân quyền: Chỉ Admin Tổng mới có quyền quản lý toàn bộ Chủ shop và cấp quyền cấp cao.'
    });
  }
  return next();
}

module.exports = {
  SESSION_COOKIE_NAME,
  TOKEN_TTL_MS,
  VALID_ROLES,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  signToken,
  verifyToken,
  authenticateUser,
  attachAuthUser,
  isShopOrAdmin,
  requireAdmin,
  requireSuperAdmin
};
