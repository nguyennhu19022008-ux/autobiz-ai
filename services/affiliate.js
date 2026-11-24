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
  subId = 'vuonggia'
}) {
  const links = readLinks();
  const targetUrl = buildAffiliateUrl(baseUrl, channel, campaign, subId);

  // Return existing shortlink if exact same targetUrl already tracked
  const existing = links.find((l) => l.targetUrl === targetUrl);
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

function listAffiliateLinks() {
  return readLinks();
}

function getAnalyticsSummary() {
  const links = readLinks();
  const byChannel = {
    facebook: { clicks: 0, links: 0, commission: 0, revenue: 0 },
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
  getAnalyticsSummary
};
