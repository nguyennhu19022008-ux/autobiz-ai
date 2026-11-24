/**
 * utils/runtime.js
 * Cấu hình môi trường chạy dùng chung (đường dẫn dữ liệu + đồng bộ Supabase Cloud + chế độ kiểm thử).
 *
 * - VG_TEST_MODE=1  : Chế độ kiểm thử cô lập. Không đồng bộ Supabase, không đăng bài thật.
 * - VG_DATA_DIR     : Thư mục dữ liệu thay thế cho `data/`.
 */
const fs = require('fs');
const path = require('path');

const IS_TEST_MODE = process.env.VG_TEST_MODE === '1';
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const DATA_DIR = process.env.VG_DATA_DIR || path.join(__dirname, '..', 'data');
const TMP_DIR = process.env.VG_DATA_DIR ? path.join(process.env.VG_DATA_DIR, '_tmp') : '/tmp';

// In-memory write-through cache & serialized remote sync hooks (Supabase Postgres)
const memoryStore = new Map();
const pendingWrites = new Set();
const writeQueues = new Map();
let remoteHydrateFn = null;
let remoteWriteFn = null;
let lastHydratedAt = 0;
let activeHydrationPromise = null;
const HYDRATE_TTL_MS = IS_SERVERLESS ? 8000 : 30000;

function registerRemoteSync({ hydrateFn, writeFn } = {}) {
  if (IS_TEST_MODE) return;
  remoteHydrateFn = typeof hydrateFn === 'function' ? hydrateFn : null;
  remoteWriteFn = typeof writeFn === 'function' ? writeFn : null;
}

async function ensureHydrated(force = false) {
  if (IS_TEST_MODE || !remoteHydrateFn) return false;
  const now = Date.now();
  if (!force && lastHydratedAt > 0 && (now - lastHydratedAt) < HYDRATE_TTL_MS) {
    return true;
  }
  if (activeHydrationPromise) {
    return activeHydrationPromise;
  }
  activeHydrationPromise = (async () => {
    try {
      const remoteMap = await remoteHydrateFn();
      if (remoteMap && typeof remoteMap === 'object') {
        for (const [key, val] of Object.entries(remoteMap)) {
          memoryStore.set(key, val);
          writeLocalOnly(key, val);
        }
        lastHydratedAt = Date.now();
        return true;
      }
    } catch (err) {
      console.warn('[Runtime Hydrate Notice]', err.message);
    } finally {
      activeHydrationPromise = null;
    }
    return false;
  })();
  return activeHydrationPromise;
}

async function flushRemoteWrites() {
  if (pendingWrites.size === 0) return;
  const batch = Array.from(pendingWrites);
  await Promise.allSettled(batch);
}

function dataFile(name) {
  return path.join(DATA_DIR, name);
}

function tmpFile(name) {
  return path.join(TMP_DIR, name);
}

function writeLocalOnly(name, value) {
  const serialized = JSON.stringify(value, null, 2);
  const primary = dataFile(name);
  if (!IS_SERVERLESS) {
    try {
      const dir = path.dirname(primary);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(primary, serialized, 'utf8');
      return;
    } catch (err) {
      if (err.code !== 'EROFS' && err.code !== 'EACCES' && err.code !== 'EPERM') throw err;
    }
  }
  try {
    const fallbackPath = tmpFile(name);
    const tmpDir = path.dirname(fallbackPath);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(fallbackPath, serialized, 'utf8');
  } catch {
    // Ignore local tmp write failure if memoryStore + remote DB are active
  }
}

function readJsonSafe(name, fallback = []) {
  if (!IS_TEST_MODE && remoteHydrateFn && memoryStore.has(name)) {
    const cached = memoryStore.get(name);
    if (Array.isArray(fallback)) {
      return Array.isArray(cached) ? JSON.parse(JSON.stringify(cached)) : [...fallback];
    }
    return cached !== undefined ? JSON.parse(JSON.stringify(cached)) : fallback;
  }

  const candidates = IS_SERVERLESS ? [tmpFile(name), dataFile(name)] : [dataFile(name), tmpFile(name)];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(fallback)) {
          return Array.isArray(parsed) ? parsed : fallback;
        }
        return parsed ?? fallback;
      } catch {
        // Thử đường dẫn dự phòng tiếp theo
      }
    }
  }
  return Array.isArray(fallback) ? [...fallback] : fallback;
}

function writeJsonSafe(name, value) {
  const snapshot = JSON.parse(JSON.stringify(value));
  memoryStore.set(name, snapshot);
  writeLocalOnly(name, snapshot);

  if (!IS_TEST_MODE && remoteWriteFn) {
    const prev = writeQueues.get(name) || Promise.resolve();
    const next = prev
      .then(() => remoteWriteFn(name, snapshot))
      .catch((err) => {
        console.warn(`[Runtime Remote Write Notice] (${name}):`, err.message);
      })
      .finally(() => {
        if (writeQueues.get(name) === next) {
          writeQueues.delete(name);
        }
        pendingWrites.delete(next);
      });
    writeQueues.set(name, next);
    pendingWrites.add(next);
  }
}

module.exports = {
  IS_TEST_MODE,
  IS_SERVERLESS,
  DATA_DIR,
  TMP_DIR,
  dataFile,
  tmpFile,
  readJsonSafe,
  writeJsonSafe,
  registerRemoteSync,
  ensureHydrated,
  flushRemoteWrites
};
