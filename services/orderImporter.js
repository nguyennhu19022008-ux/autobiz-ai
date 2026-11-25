const ExcelJS = require('exceljs');
const affiliateService = require('./affiliate');

function normalizeHeader(h = '') {
  return String(h || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === ',' || ch === ';') && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCsvBuffer(buffer) {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}

async function parseXlsxBuffer(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.worksheets[0];
  if (!sheet || sheet.rowCount < 2) return [];
  const headers = [];
  sheet.getRow(1).eachCell((cell, colNum) => {
    headers[colNum] = normalizeHeader(cell.text || cell.value || '');
  });
  const rows = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const obj = {};
    let hasValue = false;
    row.eachCell((cell, colNum) => {
      const h = headers[colNum];
      if (h) {
        const val = cell.text !== undefined ? String(cell.text).trim() : String(cell.value ?? '').trim();
        if (val) hasValue = true;
        obj[h] = val;
      }
    });
    if (hasValue) rows.push(obj);
  }
  return rows;
}

function pickField(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  return '';
}

function parseNumericAmount(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
}

function normalizeStatus(raw) {
  const s = normalizeHeader(raw || '');
  if (!s) return 'completed';
  if (['completed', 'delivered', 'paid', 'success', 'done', 'dagiao', 'hoanthanh', 'thanhcong', 'dathanhtoan'].includes(s)) {
    return 'completed';
  }
  return s;
}

async function importOrdersFromBuffer(buffer, filename = 'orders.csv', { source = 'csv_import' } = {}) {
  const isXlsx = /\.xlsx?$/i.test(filename);
  const rows = isXlsx ? await parseXlsxBuffer(buffer) : parseCsvBuffer(buffer);
  if (!rows.length) {
    throw new Error('File không có dữ liệu đơn hàng hợp lệ (cần tối thiểu 1 dòng tiêu đề và 1 dòng đơn hàng).');
  }

  let importedCount = 0;
  let duplicateCount = 0;
  let ignoredCount = 0;
  let failedCount = 0;
  let totalRevenueAdded = 0;
  let totalCommissionAdded = 0;
  const details = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const orderId = pickField(row, ['orderid', 'madonhang', 'madon', 'ordersn', 'iddon', 'id']) || `IMP-${Date.now()}-${i + 1}`;
    const shortCode = pickField(row, ['shortcode', 'malinh', 'malink', 'code', 'linkcode']);
    const subId = pickField(row, ['subid', 'subid1', 'utmterm', 'mactv', 'ctv', 'affiliatesubid']);
    const orderAmount = parseNumericAmount(pickField(row, ['orderamount', 'giatridonhang', 'giatridon', 'thanhtien', 'gmv', 'amount', 'total', 'doanhthu']));
    const quantity = Math.max(1, parseNumericAmount(pickField(row, ['quantity', 'soluong', 'qty'])) || 1);
    const status = normalizeStatus(pickField(row, ['status', 'trangthai', 'orderstatus', 'trangthaidon']));

    const res = affiliateService.processOrderWebhook({
      orderId,
      shortCode: shortCode || undefined,
      subId: subId || undefined,
      orderAmount,
      quantity,
      status,
      source
    });

    if (res.duplicate) {
      duplicateCount++;
      details.push({ row: i + 2, orderId, result: 'duplicate', message: res.message });
    } else if (res.ignored) {
      ignoredCount++;
      details.push({ row: i + 2, orderId, result: 'ignored', message: res.message });
    } else if (!res.success) {
      failedCount++;
      details.push({ row: i + 2, orderId, result: 'failed', message: res.error || 'Không khớp mã link / SubID' });
    } else {
      importedCount++;
      totalRevenueAdded += Number(res.log?.orderAmount) || 0;
      totalCommissionAdded += Number(res.log?.commissionAmount) || 0;
      details.push({ row: i + 2, orderId, result: 'confirmed', message: res.message });
    }
  }

  return {
    totalRows: rows.length,
    importedCount,
    duplicateCount,
    ignoredCount,
    failedCount,
    totalRevenueAdded,
    totalCommissionAdded,
    details: details.slice(0, 30)
  };
}

function getSampleCsvTemplate() {
  return '\uFEFForderId,shortCode,subId,orderAmount,quantity,status\n'
    + 'SP-20261125-001,,ctv01_minh,1500000,1,completed\n'
    + 'SP-20261125-002,,nguyennhu19022008,2990000,1,completed\n';
}

module.exports = {
  importOrdersFromBuffer,
  getSampleCsvTemplate
};
