const crypto = require('crypto');
const { buildAffiliateUrl } = require('./gemini');
const { readJsonSafe, writeJsonSafe } = require('../utils/runtime');

const LINKS_FILENAME = 'affiliate_links.json';

function readLinks() {
  return readJsonSafe(LINKS_FILENAME, []);
}

function writeLinks(links) {
  writeJsonSafe(LINKS_FILENAME, links);
}

function generateShortCode(prefix = '') {
  const cleanPrefix = String(prefix).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${cleanPrefix}${rand}`;
}

/**
 * Create a trackable shortlink (/r/:shortCode) backed by Smart UTM URL
 */
function createShortLink({
  baseUrl,
  productId = '',
  productName = 'Sản phẩm AutoBiz AI',
  priceRetail = 0,
  commissionRate = 10,
  channel = 'facebook',
  campaign = 'autobiz_2026',
  subId = 'vuonggia',
  owner = 'superadmin',
  shopOwner = null
}) {
  const links = readLinks();
  const targetUrl = buildAffiliateUrl(baseUrl, channel, campaign, subId);

  // Return existing shortlink if exact same targetUrl already tracked by same owner
  const existing = links.find((l) => l.targetUrl === targetUrl && (!owner || !l.owner || l.owner === owner));
  if (existing) return existing;

  let shortCode = generateShortCode(channel.slice(0, 2));
  while (links.some((l) => l.shortCode === shortCode)) {
    shortCode = generateShortCode(channel.slice(0, 2));
  }

  const entry = {
    shortCode,
    productId,
    productName,
    priceRetail: Number(priceRetail) || 0,
    commissionRate: Number(commissionRate) || 10,
    channel: String(channel).toLowerCase(),
    campaign,
    subId,
    owner: owner || 'superadmin',
    shopOwner: shopOwner || null,
    baseUrl,
    targetUrl,
    clicks: 0,
    estimatedOrders: 0,
    estimatedCommission: 0,
    confirmedOrders: 0,
    confirmedRevenue: 0,
    confirmedCommission: 0,
    createdAt: new Date().toISOString(),
    lastClickedAt: null,
    lastOrderAt: null
  };

  links.unshift(entry);
  writeLinks(links);
  return entry;
}

/**
 * Increment click counter on /r/:code and update FinTech commission metrics.
 * Supports anti-spam / bot filtering via { countClick: false }.
 */
function recordClickAndResolve(shortCode, { countClick = true } = {}) {
  const links = readLinks();
  const idx = links.findIndex((l) => l.shortCode.toLowerCase() === String(shortCode).toLowerCase());
  if (idx === -1) return null;

  const item = links[idx];
  if (countClick) {
    item.clicks = (Number(item.clicks) || 0) + 1;
    item.lastClickedAt = new Date().toISOString();

    // Modelled FinTech conversion estimation (5% click-to-order conversion baseline)
    const price = Number(item.priceRetail) || 250000;
    const rate = Number(item.commissionRate) || 10;
    item.estimatedOrders = Math.floor(item.clicks * 0.05);
    item.estimatedCommission = Math.round(item.clicks * 0.05 * price * (rate / 100));
  } else {
    item.blockedSpamClicks = (Number(item.blockedSpamClicks) || 0) + 1;
  }

  links[idx] = item;
  writeLinks(links);
  return item;
}

function recordOrderForLink(shortCode, { orderAmount, quantity = 1 } = {}) {
  const links = readLinks();
  const idx = links.findIndex((l) => l.shortCode.toLowerCase() === String(shortCode || '').toLowerCase());
  if (idx === -1) return null;

  const item = links[idx];
  const qty = Math.max(1, Number(quantity) || 1);
  const unitPrice = Number(item.priceRetail) || 250000;
  const amount = Number(orderAmount) > 0 ? Number(orderAmount) : unitPrice * qty;
  const rate = Number(item.commissionRate) || 10;
  const comm = Math.round(amount * (rate / 100));

  item.confirmedOrders = (Number(item.confirmedOrders) || 0) + qty;
  item.confirmedRevenue = (Number(item.confirmedRevenue) || 0) + amount;
  item.confirmedCommission = (Number(item.confirmedCommission) || 0) + comm;
  item.lastOrderAt = new Date().toISOString();

  links[idx] = item;
  writeLinks(links);
  return item;
}

const WEBHOOK_LOGS_FILENAME = 'webhook_logs.json';
const SUCCESS_ORDER_STATUSES = new Set(['completed', 'delivered', 'paid', 'success', 'done', 'da_giao']);

function readWebhookLogs() {
  return readJsonSafe(WEBHOOK_LOGS_FILENAME, []);
}

function writeWebhookLogs(logs) {
  return writeJsonSafe(WEBHOOK_LOGS_FILENAME, Array.isArray(logs) ? logs.slice(0, 50) : []);
}

function listWebhookLogs() {
  return readWebhookLogs();
}

function processOrderWebhook({ orderId, shortCode, subId, orderAmount, quantity = 1, status = 'completed', source = 'external_pos' } = {}) {
  const cleanOrderId = String(orderId || `WH-${Date.now()}`).trim();
  const cleanStatus = String(status || 'completed').trim().toLowerCase();
  const logs = readWebhookLogs();

  // Idempotency check: never double-count the same orderId
  const existingConfirmed = logs.find((log) => log.orderId === cleanOrderId && log.result === 'confirmed');
  if (existingConfirmed) {
    return {
      success: true,
      duplicate: true,
      message: `Đơn hàng ${cleanOrderId} đã được chốt trước đó (Idempotent).`,
      log: existingConfirmed
    };
  }

  if (!SUCCESS_ORDER_STATUSES.has(cleanStatus)) {
    const ignoredLog = {
      id: `wh_${Date.now()}`,
      orderId: cleanOrderId,
      shortCode: shortCode || null,
      subId: subId || null,
      orderAmount: Number(orderAmount) || 0,
      quantity: Number(quantity) || 1,
      status: cleanStatus,
      source,
      result: 'ignored_status',
      message: `Bỏ qua vì trạng thái đơn là "${cleanStatus}" (chưa giao thành công).`,
      receivedAt: new Date().toISOString()
    };
    logs.unshift(ignoredLog);
    writeWebhookLogs(logs);
    return { success: true, ignored: true, message: ignoredLog.message, log: ignoredLog };
  }

  const links = readLinks();
  let targetLink = null;
  if (shortCode) {
    targetLink = links.find((l) => l.shortCode.toLowerCase() === String(shortCode).trim().toLowerCase());
  }
  if (!targetLink && subId) {
    targetLink = links.find((l) => String(l.subId || '').toLowerCase() === String(subId).trim().toLowerCase());
  }

  if (!targetLink) {
    const failedLog = {
      id: `wh_${Date.now()}`,
      orderId: cleanOrderId,
      shortCode: shortCode || null,
      subId: subId || null,
      orderAmount: Number(orderAmount) || 0,
      quantity: Number(quantity) || 1,
      status: cleanStatus,
      source,
      result: 'link_not_found',
      message: 'Không tìm thấy link tiếp thị khớp shortCode hoặc subId.',
      receivedAt: new Date().toISOString()
    };
    logs.unshift(failedLog);
    writeWebhookLogs(logs);
    return { success: false, error: failedLog.message, log: failedLog };
  }

  const prevRev = Number(targetLink.confirmedRevenue) || 0;
  const prevComm = Number(targetLink.confirmedCommission) || 0;
  const updated = recordOrderForLink(targetLink.shortCode, { orderAmount, quantity });
  const deltaRev = Math.max(0, (Number(updated.confirmedRevenue) || 0) - prevRev);
  const deltaComm = Math.max(0, (Number(updated.confirmedCommission) || 0) - prevComm);

  const confirmedLog = {
    id: `wh_${Date.now()}`,
    orderId: cleanOrderId,
    shortCode: updated.shortCode,
    subId: updated.subId,
    productName: updated.productName,
    orderAmount: deltaRev,
    commissionAmount: deltaComm,
    quantity: Math.max(1, Number(quantity) || 1),
    status: cleanStatus,
    source,
    result: 'confirmed',
    message: `Tự động chốt đơn ${cleanOrderId} qua Webhook (${source}) -> +${deltaRev.toLocaleString('vi-VN')} đ cho ${updated.subId}.`,
    receivedAt: new Date().toISOString()
  };
  logs.unshift(confirmedLog);
  writeWebhookLogs(logs);

  return {
    success: true,
    duplicate: false,
    message: confirmedLog.message,
    link: updated,
    log: confirmedLog,
    summary: getAnalyticsSummary()
  };
}

function filterLinksByScope(links, { subId, owner, role } = {}) {
  if (!role || role === 'superadmin') {
    if (!subId) return links;
    const cleanSub = String(subId).trim().toLowerCase();
    return links.filter((l) => String(l.subId || '').trim().toLowerCase() === cleanSub);
  }
  const cleanOwner = String(owner || '').trim().toLowerCase();
  const cleanSub = String(subId || '').trim().toLowerCase();

  if (role === 'ctv') {
    return links.filter((l) => {
      const lSub = String(l.subId || '').trim().toLowerCase();
      const lOwner = String(l.owner || '').trim().toLowerCase();
      return (cleanSub && lSub === cleanSub) || (cleanOwner && lOwner === cleanOwner);
    });
  }

  if (role === 'shop_owner' && cleanOwner) {
    if (cleanOwner === 'admin') {
      return links.filter((l) => {
        const lOwner = String(l.owner || '').trim().toLowerCase();
        const lSub = String(l.subId || '').trim().toLowerCase();
        return !lOwner || lOwner === 'admin' || lOwner === 'superadmin' || lSub.startsWith('ctv');
      });
    }
    return links.filter((l) => {
      const lOwner = String(l.owner || '').trim().toLowerCase();
      const lSub = String(l.subId || '').trim().toLowerCase();
      const lShop = String(l.shopOwner || '').trim().toLowerCase();
      return lOwner === cleanOwner || lSub === cleanOwner || lShop === cleanOwner;
    });
  }

  return links;
}

function listAffiliateLinks({ subId, owner, role } = {}) {
  return filterLinksByScope(readLinks(), { subId, owner, role });
}

function getAnalyticsSummary({ subId, owner, role } = {}) {
  const links = filterLinksByScope(readLinks(), { subId, owner, role });
  const byChannel = {
    facebook: { clicks: 0, links: 0, commission: 0, revenue: 0 },
    instagram: { clicks: 0, links: 0, commission: 0, revenue: 0 },
    tiktok: { clicks: 0, links: 0, commission: 0, revenue: 0 },
    zalo: { clicks: 0, links: 0, commission: 0, revenue: 0 },
    shopee: { clicks: 0, links: 0, commission: 0, revenue: 0 }
  };
  const subIdMap = new Map();

  let totalClicks = 0;
  let totalOrders = 0;
  let totalCommission = 0;
  let totalRevenue = 0;
  let confirmedOrders = 0;
  let confirmedRevenue = 0;
  let confirmedCommission = 0;

  for (const link of links) {
    const ch = byChannel[link.channel] ? link.channel : 'facebook';
    const clicks = Number(link.clicks) || 0;
    const estOrders = Number(link.estimatedOrders) || 0;
    const confOrders = Number(link.confirmedOrders) || 0;
    const estComm = Number(link.estimatedCommission) || 0;
    const confComm = Number(link.confirmedCommission) || 0;
    const price = Number(link.priceRetail) || 250000;
    const estRev = Math.round(clicks * 0.05 * price);
    const confRev = Number(link.confirmedRevenue) || 0;

    const linkOrders = confOrders > 0 ? confOrders : estOrders;
    const linkComm = confComm > 0 ? confComm : estComm;
    const linkRev = confRev > 0 ? confRev : estRev;

    totalClicks += clicks;
    totalOrders += linkOrders;
    totalCommission += linkComm;
    totalRevenue += linkRev;
    confirmedOrders += confOrders;
    confirmedRevenue += confRev;
    confirmedCommission += confComm;

    byChannel[ch].clicks += clicks;
    byChannel[ch].links += 1;
    byChannel[ch].commission += linkComm;
    byChannel[ch].revenue += linkRev;

    const subKey = link.subId || 'mac_dinh';
    if (!subIdMap.has(subKey)) {
      subIdMap.set(subKey, { subId: subKey, links: 0, clicks: 0, orders: 0, revenue: 0, commission: 0, netRevenue: 0 });
    }
    const subRow = subIdMap.get(subKey);
    subRow.links += 1;
    subRow.clicks += clicks;
    subRow.orders += linkOrders;
    subRow.revenue += linkRev;
    subRow.commission += linkComm;
    subRow.netRevenue = Math.max(0, subRow.revenue - subRow.commission);
    subRow.netMarginPct = subRow.revenue > 0 ? Number(((subRow.netRevenue / subRow.revenue) * 100).toFixed(1)) : 0;
    subRow.epc = subRow.clicks > 0 ? Math.round(subRow.commission / subRow.clicks) : 0;
  }

  const conversionRate = totalClicks > 0 ? Number(((totalOrders / totalClicks) * 100).toFixed(1)) : 0;
  const netShopRevenue = Math.max(0, totalRevenue - totalCommission);
  const netMarginPct = totalRevenue > 0 ? Number(((netShopRevenue / totalRevenue) * 100).toFixed(1)) : 0;
  const commissionMarginPct = totalRevenue > 0 ? Number(((totalCommission / totalRevenue) * 100).toFixed(1)) : 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const earningPerClick = totalClicks > 0 ? Math.round(totalCommission / totalClicks) : 0;
  const revenuePerClick = totalClicks > 0 ? Math.round(totalRevenue / totalClicks) : 0;
  const bySubId = Array.from(subIdMap.values()).sort((a, b) => (b.revenue - a.revenue) || (b.clicks - a.clicks));

  return {
    totalLinks: links.length,
    totalClicks,
    totalOrders,
    totalCommission,
    totalRevenue,
    netShopRevenue,
    netMarginPct,
    commissionMarginPct,
    avgOrderValue,
    earningPerClick,
    revenuePerClick,
    confirmedOrders,
    confirmedRevenue,
    confirmedCommission,
    conversionRate,
    byChannel,
    bySubId,
    topLinks: [...links].sort((a, b) => (b.confirmedRevenue || 0) - (a.confirmedRevenue || 0) || b.clicks - a.clicks).slice(0, 8)
  };
}

module.exports = {
  createShortLink,
  recordClickAndResolve,
  recordOrderForLink,
  listAffiliateLinks,
  getAnalyticsSummary,
  processOrderWebhook,
  listWebhookLogs
};
