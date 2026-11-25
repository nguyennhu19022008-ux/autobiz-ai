const axios = require('axios');

const GRAPH_API_VERSION = 'v19.0';

async function verifyInstagramConnection(igAccountId, igAccessToken) {
  const cleanId = String(igAccountId || '').trim();
  const cleanToken = String(igAccessToken || '').trim();
  if (!cleanId || !cleanToken) {
    return {
      success: false,
      error: 'Vui lòng nhập đầy đủ Instagram Business Account ID và Access Token.'
    };
  }
  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(cleanId)}`;
    const { data } = await axios.get(url, {
      params: {
        fields: 'id,username,name,followers_count',
        access_token: cleanToken
      },
      timeout: 10000
    });
    return {
      success: true,
      account: data,
      message: `Kết nối thành công Instagram: @${data.username || data.name || data.id}`
    };
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message || 'Không thể kết nối Instagram Graph API.';
    return { success: false, error: msg };
  }
}

async function dispatchInstagram(postData, settings = {}) {
  const caption = String(
    postData.channel_contents?.instagram || postData.finalContent || postData.content || ''
  ).trim();

  if (!caption) {
    return {
      channel: 'instagram',
      status: 'error',
      mode: 'validation_error',
      message: 'Nội dung bài viết Instagram đang trống. Vui lòng sinh AI hoặc nhập nội dung trước khi đăng.'
    };
  }

  const igAccountId = settings.instagramAccountId || process.env.INSTAGRAM_ACCOUNT_ID || '';
  const igAccessToken = settings.instagramAccessToken || process.env.INSTAGRAM_ACCESS_TOKEN || '';

  if (!igAccountId || !igAccessToken) {
    return {
      channel: 'instagram',
      status: 'staged',
      mode: 'preview_package',
      message: 'Đã đóng gói bài Instagram (Chưa nhập Instagram Business Account ID / Access Token trong Cài đặt để đăng trực tiếp).',
      previewLength: caption.length
    };
  }

  // Instagram Graph API requires a public HTTPS image URL to create a feed media container
  const mediaList = Array.isArray(postData.mediaFiles) ? postData.mediaFiles : [];
  const firstImage = mediaList.find((m) => {
    const u = typeof m === 'string' ? m : (m?.url || '');
    return /^https:\/\//i.test(u);
  });
  const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.url || '');

  if (!imageUrl) {
    return {
      channel: 'instagram',
      status: 'staged',
      mode: 'missing_media',
      message: 'Instagram yêu cầu ít nhất 1 ảnh công khai (HTTPS) đính kèm để xuất bản bài Feed. Bài đã được lưu ở dạng bản nháp.',
      previewLength: caption.length
    };
  }

  try {
    // Step 1: Create IG Media Container
    const createRes = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(igAccountId)}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption,
          access_token: igAccessToken
        },
        timeout: 15000
      }
    );
    const creationId = createRes.data?.id;
    if (!creationId) {
      throw new Error('Instagram không trả về creation_id khi tạo media container.');
    }

    // Step 2: Publish Container
    const publishRes = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(igAccountId)}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: igAccessToken
        },
        timeout: 15000
      }
    );

    return {
      channel: 'instagram',
      status: 'published',
      mode: 'live_api',
      postId: publishRes.data?.id || creationId,
      message: 'Đã xuất bản thành công lên Instagram Business!'
    };
  } catch (err) {
    const apiErr = err.response?.data?.error?.message || err.message;
    return {
      channel: 'instagram',
      status: 'error',
      mode: 'api_error',
      message: `Lỗi Instagram Graph API: ${apiErr}`
    };
  }
}

module.exports = {
  dispatchInstagram,
  verifyInstagramConnection
};
