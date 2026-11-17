const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { buildAffiliateUrl } = require('./gemini');

const LINKS_FILE = path.join(__dirname, '..', 'data', 'affiliate_links.json');

function ensureFile() {
  const dir = path.dirname(LINKS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LINKS_FILE)) fs.writeFileSync(LINKS_FILE, '[]', 'utf8');
}

function readLinks() {
  ensureFile();
  try {
    const raw = fs.readFileSync(LINKS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLinks(links) {
  ensureFile();
  fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf8');
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
    createdAt: new Date().toISOString(),
    lastClickedAt: null
  };

  links.unshift(entry);
  writeLinks(links);
  return entry;
}

/**
 * Increment click counter on /r/:code and update FinTech commission metrics
 */
function recordClickAndResolve(shortCode) {
  const links = readLinks();
  const idx = links.findIndex((l) => l.shortCode.toLowerCase() === String(shortCode).toLowerCase());
  if (idx === -1) return null;

  const item = links[idx];
  item.clicks = (Number(item.clicks) || 0) + 1;
  item.lastClickedAt = new Date().toISOString();

  // Modelled FinTech conversion estimation (5% click-to-order conversion baseline, minimum 1 order at 10 clicks)
  const price = Number(item.priceRetail) || 250000;
  const rate = Number(item.commissionRate) || 10;
  item.estimatedOrders = Math.floor(item.clicks * 0.05);
  item.estimatedCommission = Math.round(item.clicks * 0.05 * price * (rate / 100));

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
    facebook: { clicks: 0, links: 0, commission: 0 },
    tiktok: { clicks: 0, links: 0, commission: 0 },
    zalo: { clicks: 0, links: 0, commission: 0 },
    shopee: { clicks: 0, links: 0, commission: 0 }
  };

  let totalClicks = 0;
  let totalOrders = 0;
  let totalCommission = 0;

  for (const link of links) {
    const ch = byChannel[link.channel] ? link.channel : 'facebook';
    const clicks = Number(link.clicks) || 0;
    const orders = Number(link.estimatedOrders) || 0;
    const comm = Number(link.estimatedCommission) || 0;

    totalClicks += clicks;
    totalOrders += orders;
    totalCommission += comm;

    byChannel[ch].clicks += clicks;
    byChannel[ch].links += 1;
    byChannel[ch].commission += comm;
  }

  const conversionRate = totalClicks > 0 ? Number(((totalOrders / totalClicks) * 100).toFixed(1)) : 0;

  return {
    totalLinks: links.length,
    totalClicks,
    totalOrders,
    totalCommission,
    conversionRate,
    byChannel,
    topLinks: [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 6)
  };
}

module.exports = {
  createShortLink,
  recordClickAndResolve,
  listAffiliateLinks,
  getAnalyticsSummary
};
