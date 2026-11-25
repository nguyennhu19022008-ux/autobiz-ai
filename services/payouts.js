const { readJsonSafe, writeJsonSafe } = require('../utils/runtime');
const affiliateService = require('./affiliate');

const PAYOUTS_FILENAME = 'payout_requests.json';
const MIN_PAYOUT_AMOUNT = 50000;

const SUPPORTED_BANKS = [
  { code: 'MB', name: 'MB Bank (Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'VIB', name: 'VIB' }
];

function readPayouts() {
  return readJsonSafe(PAYOUTS_FILENAME, []);
}

function writePayouts(list) {
  writeJsonSafe(PAYOUTS_FILENAME, list);
}

function buildVietQrUrl({ bankCode, accountNumber, accountName, amount, subId }) {
  const cleanBank = encodeURIComponent(String(bankCode || 'MB').trim().toUpperCase());
  const cleanAcc = encodeURIComponent(String(accountNumber || '').replace(/\s+/g, ''));
  const cleanName = encodeURIComponent(String(accountName || '').trim().toUpperCase());
  const cleanAmount = Math.max(0, Math.round(Number(amount) || 0));
  const addInfo = encodeURIComponent(`AUTOBIZ HOA HONG ${String(subId || 'CTV').toUpperCase()}`);
  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${cleanAmount}&addInfo=${addInfo}&accountName=${cleanName}`;
}

function getPayoutSummaryForCtv(user) {
  const username = String(user?.username || '').trim().toLowerCase();
  const subId = String(user?.subId || user?.username || '').trim().toLowerCase();
  const analytics = affiliateService.getAnalyticsSummary({
    subId,
    owner: username,
    role: 'ctv'
  });

  const earnedCommission = Number(analytics.confirmedCommission) > 0
    ? Number(analytics.confirmedCommission)
    : Number(analytics.totalCommission) || 0;

  const all = readPayouts();
  const mine = all.filter(
    (p) => String(p.ctvUsername || '').toLowerCase() === username || String(p.subId || '').toLowerCase() === subId
  );

  let paidAmount = 0;
  let pendingAmount = 0;
  for (const req of mine) {
    if (req.status === 'paid') paidAmount += Number(req.amount) || 0;
    else if (req.status === 'pending') pendingAmount += Number(req.amount) || 0;
  }

  const availableBalance = Math.max(0, earnedCommission - paidAmount - pendingAmount);
  return {
    earnedCommission,
    paidAmount,
    pendingAmount,
    availableBalance,
    requests: mine
  };
}

function listPayoutsForUser(user) {
  const role = user?.role || 'superadmin';
  const username = String(user?.username || '').trim().toLowerCase();
  const all = readPayouts();

  if (role === 'superadmin') {
    return { requests: all, balance: null };
  }
  if (role === 'shop_owner') {
    const mine = all.filter((p) => {
      const pShop = String(p.shopOwner || '').toLowerCase();
      if (username === 'admin') {
        return !pShop || pShop === 'admin' || pShop === 'superadmin';
      }
      return pShop === username;
    });
    return { requests: mine, balance: null };
  }
  // CTV / KOC
  const summary = getPayoutSummaryForCtv(user);
  return {
    requests: summary.requests,
    balance: {
      earnedCommission: summary.earnedCommission,
      paidAmount: summary.paidAmount,
      pendingAmount: summary.pendingAmount,
      availableBalance: summary.availableBalance
    }
  };
}

function createPayoutRequest(user, { amount, bankCode, accountNumber, accountName, note = '' } = {}) {
  if (!user || !user.username) {
    throw new Error('Vui lòng đăng nhập để gửi yêu cầu rút hoa hồng.');
  }
  const cleanAmount = Math.round(Number(amount) || 0);
  if (cleanAmount < MIN_PAYOUT_AMOUNT) {
    throw new Error(`Số tiền rút tối thiểu là ${MIN_PAYOUT_AMOUNT.toLocaleString('vi-VN')} đ.`);
  }
  const cleanBank = String(bankCode || '').trim().toUpperCase();
  const cleanAcc = String(accountNumber || '').replace(/\s+/g, '');
  const cleanName = String(accountName || '').trim();
  if (!cleanBank || !cleanAcc || cleanAcc.length < 6 || !cleanName) {
    throw new Error('Vui lòng nhập đầy đủ Ngân hàng, Số tài khoản và Tên chủ tài khoản.');
  }

  const summary = getPayoutSummaryForCtv(user);
  if (cleanAmount > summary.availableBalance) {
    throw new Error(`Số dư khả dụng (${summary.availableBalance.toLocaleString('vi-VN')} đ) không đủ để rút ${cleanAmount.toLocaleString('vi-VN')} đ.`);
  }

  const subId = user.subId || user.username;
  const entry = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ctvUsername: user.username,
    ctvDisplayName: user.displayName || user.username,
    subId,
    shopOwner: user.shopOwner || 'admin',
    amount: cleanAmount,
    bankCode: cleanBank,
    accountNumber: cleanAcc,
    accountName: cleanName.toUpperCase(),
    note: String(note || '').trim().slice(0, 160),
    vietQrUrl: buildVietQrUrl({
      bankCode: cleanBank,
      accountNumber: cleanAcc,
      accountName: cleanName,
      amount: cleanAmount,
      subId
    }),
    status: 'pending',
    createdAt: new Date().toISOString(),
    processedAt: null,
    processedBy: null
  };

  const all = readPayouts();
  all.unshift(entry);
  writePayouts(all);
  return entry;
}

function updatePayoutStatus(id, { status, note } = {}, actorUser) {
  const validStatuses = new Set(['paid', 'rejected', 'pending']);
  if (!validStatuses.has(status)) {
    throw new Error('Trạng thái duyệt không hợp lệ (chỉ chấp nhận paid / rejected).');
  }
  const all = readPayouts();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const existing = all[idx];
  const actorName = String(actorUser?.username || '').toLowerCase();
  const pShop = String(existing.shopOwner || '').toLowerCase();
  if (actorUser?.role !== 'superadmin' && actorName !== 'admin' && pShop !== actorName) {
    const err = new Error('Bạn chỉ có thể duyệt yêu cầu rút tiền của CTV thuộc Shop của mình.');
    err.statusCode = 403;
    throw err;
  }

  const updated = {
    ...existing,
    status,
    note: note !== undefined ? String(note).trim().slice(0, 160) : existing.note,
    processedAt: new Date().toISOString(),
    processedBy: actorUser?.username || 'admin'
  };
  all[idx] = updated;
  writePayouts(all);
  return updated;
}

module.exports = {
  SUPPORTED_BANKS,
  MIN_PAYOUT_AMOUNT,
  buildVietQrUrl,
  listPayoutsForUser,
  createPayoutRequest,
  updatePayoutStatus
};
