/**
 * utils/runtime.js
 * Cấu hình môi trường chạy dùng chung (đường dẫn dữ liệu + chế độ kiểm thử).
 *
 * - VG_TEST_MODE=1  : Chế độ kiểm thử cô lập. Không đăng bài thật lên Facebook,
 *                     không gửi email / Telegram. (Supabase được tắt bởi test runner
 *                     bằng cách xóa SUPABASE_URL trước khi nạp module.)
 * - VG_DATA_DIR     : Thư mục dữ liệu thay thế cho `data/` (test runner trỏ tới
 *                     một bản sao tạm để không làm bẩn dữ liệu production).
 */
const fs = require('fs');
const path = require('path');

const IS_TEST_MODE = process.env.VG_TEST_MODE === '1';
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const DATA_DIR = process.env.VG_DATA_DIR || path.join(__dirname, '..', 'data');

// Thư mục fallback ghi được trên serverless (Vercel chỉ cho ghi /tmp)
const TMP_DIR = process.env.VG_DATA_DIR ? path.join(process.env.VG_DATA_DIR, '_tmp') : '/tmp';

function dataFile(name) {
  return path.join(DATA_DIR, name);
}

function tmpFile(name) {
  return path.join(TMP_DIR, name);
}

function readJsonSafe(name, fallback = []) {
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
  const fallbackPath = tmpFile(name);
  const tmpDir = path.dirname(fallbackPath);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(fallbackPath, serialized, 'utf8');
}

module.exports = { IS_TEST_MODE, IS_SERVERLESS, DATA_DIR, TMP_DIR, dataFile, tmpFile, readJsonSafe, writeJsonSafe };
