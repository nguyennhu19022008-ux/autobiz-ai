const { publishPostToFanpage } = require('../facebook');

async function dispatchFacebook(postData, settings = {}) {
  const content = postData.channel_contents?.facebook || postData.finalContent || '';
  if (!settings.pageAccessToken && !process.env.FB_PAGE_ACCESS_TOKEN) {
    return {
      channel: 'facebook',
      status: 'staged',
      mode: 'preview_package',
      message: 'Đã đóng gói bài Facebook (Chưa cấu hình FB_PAGE_ACCESS_TOKEN để đăng trực tiếp).',
      previewLength: content.length
    };
  }

  const res = await publishPostToFanpage({ ...postData, finalContent: content }, settings);
  return {
    channel: 'facebook',
    status: 'published',
    mode: 'live_api',
    postId: res?.id || res?.post_id || null,
    message: 'Đã xuất bản thành công lên Facebook Fanpage!'
  };
}

module.exports = { dispatchFacebook };
