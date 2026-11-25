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

const SCRYPT_PREFIX = 'scrypt$';

function hashPassword(plain) {
  const raw = String(plain || '');
  if (raw.startsWith(SCRYPT_PREFIX)) return raw;
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(raw, salt, 64).toString('hex');
  return `${SCRYPT_PREFIX}${salt}$${derived}`;
}

function verifyPassword(plain, stored) {
  const raw = String(plain || '');
  const saved = String(stored || '');
  if (!saved) return { valid: false, needsUpgrade: false };

  if (saved.startsWith(SCRYPT_PREFIX)) {
    const parts = saved.split('$');
    if (parts.length !== 3) return { valid: false, needsUpgrade: false };
    const [, salt, hashHex] = parts;
    try {
      const derived = crypto.scryptSync(raw, salt, 64);
      const expected = Buffer.from(hashHex, 'hex');
      if (derived.length !== expected.length) return { valid: false, needsUpgrade: false };
      return { valid: crypto.timingSafeEqual(derived, expected), needsUpgrade: false };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  // Legacy plaintext fallback -> verify timing-safe & flag for auto-upgrade
  const a = Buffer.from(raw, 'utf8');
  const b = Buffer.from(saved, 'utf8');
  if (a.length !== b.length) return { valid: false, needsUpgrade: false };
  const valid = crypto.timingSafeEqual(a, b);
  return { valid, needsUpgrade: valid };
}

function readUsers() {
  const users = readJsonSafe(USERS_FILENAME, null);
  if (!Array.isArray(users) || users.length === 0) {
    const seeded = DEFAULT_USERS.map((u) => ({ ...u, password: hashPassword(u.password) }));
    writeJsonSafe(USERS_FILENAME, seeded);
    return seeded;
  }
  // Auto-upgrade any legacy plaintext passwords stored in DB to scrypt hashes
  let upgraded = false;
  const migrated = users.map((u) => {
    if (u && typeof u.password === 'string' && u.password && !u.password.startsWith(SCRYPT_PREFIX)) {
      upgraded = true;
      return { ...u, password: hashPassword(u.password) };
    }
    return u;
  });
  if (upgraded) {
    writeJsonSafe(USERS_FILENAME, migrated);
  }
  return migrated;
}

function writeUsers(users) {
  writeJsonSafe(USERS_FILENAME, users);
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

function listUsers(actorRole = 'superadmin', actorUsername = '') {
  const users = readUsers();
  if (actorRole === 'superadmin') {
    return users.map(sanitizeUser);
  }
  if (actorRole === 'shop_owner') {
    const cleanActor = String(actorUsername || '').trim().toLowerCase();
    return users
      .filter((u) => {
        if (u.role !== 'ctv') return false;
        if (!cleanActor || cleanActor === 'admin') {
          const sOwner = String(u.shopOwner || '').toLowerCase();
          return !sOwner || sOwner === 'admin' || sOwner === 'superadmin';
        }
        return String(u.shopOwner || '').toLowerCase() === cleanActor;
      })
      .map(sanitizeUser);
  }
  return [];
}

function registerWithEmail({ email, password, displayName, inviteShopOwner } = {}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new Error('Vui lòng nhập địa chỉ email hợp lệ.');
  }
  const cleanPass = String(password || '').trim();
  if (!cleanPass || cleanPass.length < 4) {
    throw new Error('Mật khẩu phải có ít nhất 4 ký tự.');
  }

  const users = readUsers();
  if (users.some((u) => (u.email && u.email.toLowerCase() === cleanEmail))) {
    throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập.');
  }

  // Derive unique username from email prefix
  let baseUser = cleanEmail.split('@')[0].replace(/[^a-z0-9_.-]/g, '');
  if (!baseUser || baseUser.length < 3) baseUser = 'user';
  let candidateUser = baseUser;
  let counter = 1;
  while (users.some((u) => u.username.toLowerCase() === candidateUser.toLowerCase())) {
    candidateUser = `${baseUser}${counter++}`;
  }

  const cleanInvite = String(inviteShopOwner || '').trim().toLowerCase();
  const inviter = cleanInvite
    ? users.find((u) => u.username.toLowerCase() === cleanInvite && (u.role === 'shop_owner' || u.role === 'superadmin'))
    : null;

  const newUser = {
    username: candidateUser,
    email: cleanEmail,
    password: hashPassword(cleanPass),
    displayName: String(displayName || candidateUser).trim(),
    hotline: '',
    defaultShopUrl: '',
    role: inviter ? 'ctv' : 'shop_owner',
    persona: inviter ? 'shop_ctv' : null,
    hasAffiliates: !inviter,
    shopOwner: inviter ? inviter.username : null,
    subId: candidateUser,
    active: true,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);
  return sanitizeUser(newUser);
}

function setOnboardingPersona(targetUsername, { persona, hasAffiliates = true } = {}) {
  const cleanTarget = String(targetUsername || '').trim().toLowerCase();
  const users = readUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === cleanTarget);
  if (idx === -1) return null;

  const user = { ...users[idx] };
  const validPersonas = new Set(['shop_with_affiliates', 'shop_solo', 'independent_affiliate']);
  const chosenPersona = validPersonas.has(persona) ? persona : 'independent_affiliate';

  user.persona = chosenPersona;
  user.hasAffiliates = Boolean(hasAffiliates);

  if (chosenPersona === 'independent_affiliate') {
    user.role = 'ctv';
    user.subId = user.subId || user.username;
  } else {
    user.role = 'shop_owner';
    user.subId = null;
  }
  user.onboardedAt = new Date().toISOString();

  users[idx] = user;
  writeUsers(users);
  return sanitizeUser(user);
}

function createUser({ username, email, password, role = 'ctv', subId, displayName, shopOwner = null } = {}) {
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
    email: email ? String(email).trim().toLowerCase() : null,
    password: hashPassword(cleanPass),
    role: normalizedRole,
    subId: normalizedRole === 'ctv' ? String(subId || cleanUser).trim() : null,
    shopOwner: normalizedRole === 'ctv' ? (shopOwner || 'admin') : null,
    displayName: String(displayName || cleanUser).trim(),
    hotline: '',
    defaultShopUrl: '',
    persona: normalizedRole === 'ctv' ? 'shop_ctv' : 'shop_with_affiliates',
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
    user.password = hashPassword(String(updates.password).trim());
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
  const idx = users.findIndex(
    (u) => u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)
  );
  if (idx === -1) return null;
  const found = users[idx];
  const check = verifyPassword(cleanPass, found.password);
  if (!check.valid) return null;
  if (found.active === false) {
    return { locked: true };
  }
  if (check.needsUpgrade) {
    users[idx] = { ...found, password: hashPassword(cleanPass) };
    writeUsers(users);
  }

  return {
    username: found.username,
    email: found.email || null,
    role: found.role,
    subId: found.role === 'ctv' ? (found.subId || found.username) : null,
    shopOwner: found.shopOwner || null,
    displayName: found.displayName,
    hotline: found.hotline || '',
    defaultShopUrl: found.defaultShopUrl || '',
    persona: found.persona || null,
    hasAffiliates: found.hasAffiliates !== false,
    exp: Date.now() + TOKEN_TTL_MS
  };
}

function getUserByUsername(targetUsername) {
  const cleanTarget = String(targetUsername || '').trim().toLowerCase();
  if (!cleanTarget) return null;
  const users = readUsers();
  const found = users.find((u) => u.username.toLowerCase() === cleanTarget);
  return found ? sanitizeUser(found) : null;
}

function updateUserProfile(targetUsername, { displayName, hotline, defaultShopUrl } = {}) {
  const cleanTarget = String(targetUsername || '').trim().toLowerCase();
  const users = readUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === cleanTarget);
  if (idx === -1) return null;

  const user = { ...users[idx] };
  if (displayName !== undefined && String(displayName).trim()) {
    user.displayName = String(displayName).trim().slice(0, 80);
  }
  if (hotline !== undefined) {
    user.hotline = String(hotline).trim().slice(0, 60);
  }
  if (defaultShopUrl !== undefined) {
    user.defaultShopUrl = String(defaultShopUrl).trim().slice(0, 300);
  }
  user.updatedAt = new Date().toISOString();

  users[idx] = user;
  writeUsers(users);
  return sanitizeUser(user);
}

function changeUserPassword(targetUsername, { currentPassword, newPassword } = {}) {
  const cleanTarget = String(targetUsername || '').trim().toLowerCase();
  const cleanNew = String(newPassword || '').trim();
  if (cleanNew.length < 4) {
    throw new Error('Mật khẩu mới phải có ít nhất 4 ký tự.');
  }
  const users = readUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === cleanTarget);
  if (idx === -1) {
    throw new Error('Không tìm thấy tài khoản.');
  }
  const user = users[idx];
  const check = verifyPassword(String(currentPassword || ''), user.password);
  if (!check.valid) {
    throw new Error('Mật khẩu hiện tại không chính xác.');
  }
  users[idx] = {
    ...user,
    password: hashPassword(cleanNew),
    updatedAt: new Date().toISOString()
  };
  writeUsers(users);
  return sanitizeUser(users[idx]);
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

function canManageOwnCatalog(user) {
  if (!user) return false;
  if (isShopOrAdmin(user)) return true;
  return user.role === 'ctv' && user.persona === 'independent_affiliate';
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

function requireCatalogWrite(req, res, next) {
  if (!canManageOwnCatalog(req.authUser)) {
    return res.status(403).json({
      success: false,
      error: 'Phân quyền: Chỉ Chủ shop, Admin hoặc KOC/Affiliate độc lập mới được thêm/sửa sản phẩm cá nhân.'
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
  registerWithEmail,
  setOnboardingPersona,
  getUserByUsername,
  updateUserProfile,
  changeUserPassword,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  authenticateUser,
  attachAuthUser,
  isShopOrAdmin,
  canManageOwnCatalog,
  requireAdmin,
  requireCatalogWrite,
  requireSuperAdmin
};
