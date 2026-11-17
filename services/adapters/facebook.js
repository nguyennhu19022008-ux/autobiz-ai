const { publishPostToFanpage } = require('../facebook');

async function dispatchFacebook(postData, settings = {}) {
  const content = String(postData.channel_contents?.facebook || postData.finalContent || postData.content || '').trim();
  if (!content) {
    return {
      channel: 'facebook',
      status: 'error',
      mode: 'validation_error',
      message: 'Nội dung bài viết Facebook đang trống. Vui lòng sinh AI hoặc nhập nội dung trước khi đăng.'
    };
  }
  const fbToken = settings.facebookPageToken || settings.pageAccessToken || process.env.FB_PAGE_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN;
  const fanpageId = settings.fanpageId || process.env.FANPAGE_ID;
  if (!fbToken || !fanpageId) {
    return {
      channel: 'facebook',
      status: 'staged',
      mode: 'preview_package',
      message: 'Đã đóng gói bài Facebook (Chưa cấu hình FB_PAGE_TOKEN / FANPAGE_ID để đăng trực tiếp).',
      previewLength: content.length
    };
  }

  const res = await publishPostToFanpage(
    { ...postData, content, finalContent: content },
    { ...settings, facebookPageToken: fbToken, fanpageId }
  );
  return {
    channel: 'facebook',
    status: 'published',
    mode: 'live_api',
    postId: res?.id || res?.post_id || null,
    message: 'Đã xuất bản thành công lên Facebook Fanpage!'
  };
}

module.exports = { dispatchFacebook };
