const axios = require('axios');

async function dispatchZalo(postData, settings = {}) {
  const messageText = postData.channel_contents?.zalo || postData.finalContent || '';
  const oaToken = settings.zaloOaToken || process.env.ZALO_OA_ACCESS_TOKEN;

  if (oaToken && postData.zaloUserId) {
    try {
      const resp = await axios.post(
        'https://openapi.zalo.me/v3.0/oa/message/cs',
        {
          recipient: { user_id: postData.zaloUserId },
          message: { text: messageText.slice(0, 2000) }
        },
        {
          headers: { access_token: oaToken, 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );
      return {
        channel: 'zalo',
        status: 'published',
        mode: 'live_api',
        messageId: resp.data?.data?.message_id || null,
        message: 'Đã gửi Broadcast Zalo OA thành công!'
      };
    } catch (err) {
      return {
        channel: 'zalo',
        status: 'staged',
        mode: 'api_fallback',
        message: `Zalo OA API fallback (${err.message}). Đã lưu thông điệp Zalo OA.`,
        textLength: messageText.length
      };
    }
  }

  return {
    channel: 'zalo',
    status: 'staged',
    mode: 'zalo_broadcast_ready',
    message: 'Đã đóng gói tin nhắn Zalo OA Catalog sẵn sàng gửi nhóm sỉ-lẻ & khách hàng.',
    textLength: messageText.length
  };
}

module.exports = { dispatchZalo };
