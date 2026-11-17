const axios = require('axios');

async function dispatchTikTok(postData, settings = {}) {
  const script = postData.channel_contents?.tiktok || postData.finalContent || '';
  const token = settings.tiktokAccessToken || process.env.TIKTOK_ACCESS_TOKEN;

  if (token && postData.videoUrl) {
    try {
      const resp = await axios.post(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
        {
          post_info: {
            title: script.slice(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE'
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: postData.videoUrl
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8'
          },
          timeout: 15000
        }
      );
      return {
        channel: 'tiktok',
        status: 'published',
        mode: 'live_api',
        publishId: resp.data?.data?.publish_id || null,
        message: 'Đã đẩy video & caption lên TikTok Creator API!'
      };
    } catch (err) {
      return {
        channel: 'tiktok',
        status: 'staged',
        mode: 'api_fallback',
        message: `TikTok API tạm thời chưa sẵn sàng (${err.message}). Đã lưu gói kịch bản 30s.`,
        scriptLength: script.length
      };
    }
  }

  return {
    channel: 'tiktok',
    status: 'staged',
    mode: 'creator_script_ready',
    message: 'Đã xuất gói Kịch bản TikTok 30s (Hook 3s + USP + CTA Link Bio) sẵn sàng quay/đăng.',
    scriptLength: script.length
  };
}

module.exports = { dispatchTikTok };
