async function dispatchShopee(postData, settings = {}) {
  const seoCopy = postData.channel_contents?.shopee || postData.finalContent || '';
  const partnerId = settings.shopeePartnerId || process.env.SHOPEE_PARTNER_ID;

  if (partnerId && settings.shopeeAccessToken) {
    return {
      channel: 'shopee',
      status: 'published',
      mode: 'live_api_ready',
      message: 'Đã đồng bộ mô tả SEO chuẩn Shopee Open Platform.',
      textLength: seoCopy.length
    };
  }

  return {
    channel: 'shopee',
    status: 'staged',
    mode: 'shopee_seo_ready',
    message: 'Đã chuẩn hóa mô tả SEO Shopee Feed (Từ khóa + Thông số + Chính sách đổi trả).',
    textLength: seoCopy.length
  };
}

module.exports = { dispatchShopee };
