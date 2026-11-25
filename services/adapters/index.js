const { dispatchFacebook } = require('./facebook');
const { dispatchInstagram } = require('./instagram');
const { dispatchTikTok } = require('./tiktok');
const { dispatchZalo } = require('./zalo');
const { dispatchShopee } = require('./shopee');

const ADAPTERS = {
  facebook: dispatchFacebook,
  instagram: dispatchInstagram,
  tiktok: dispatchTikTok,
  zalo: dispatchZalo,
  shopee: dispatchShopee
};

/**
 * Dispatch a product campaign simultaneously across selected Omni-Channels
 */
async function dispatchToChannels(postData, settings = {}) {
  const channels = Array.isArray(postData.target_channels) && postData.target_channels.length > 0
    ? postData.target_channels
    : ['facebook', 'instagram', 'tiktok', 'zalo', 'shopee'];

  const results = [];
  await Promise.all(
    channels.map(async (ch) => {
      const key = String(ch).toLowerCase();
      const handler = ADAPTERS[key];
      if (!handler) {
        results.push({ channel: key, status: 'skipped', message: `Chưa hỗ trợ kênh ${key}` });
        return;
      }
      try {
        const res = await handler(postData, settings);
        results.push({ ...res, timestamp: new Date().toISOString() });
      } catch (err) {
        results.push({
          channel: key,
          status: 'error',
          message: err.message,
          timestamp: new Date().toISOString()
        });
      }
    })
  );

  return results;
}

module.exports = {
  ADAPTERS,
  dispatchToChannels
};
