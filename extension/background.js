/**
 * AUTOBIZ AI COLLECTOR v2.0 — BACKGROUND SERVICE WORKER (MV3)
 * Xử lý đồng bộ sản phẩm đa ngành hàng và tạo link Affiliate từ Content Script về Server
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[AutoBiz AI Collector] Background Service Worker v2.0 đã sẵn sàng.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const serverUrl = (request.serverUrl || 'http://localhost:3000').replace(/\/$/, '');

  // 1. Lưu nhanh sản phẩm đa ngành từ trang web / Zalo về Kho hàng (/api/products)
  if (request.action === 'pushProductToCatalog') {
    fetch(`${serverUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload || {})
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({ success: false, error: 'Phản hồi JSON không hợp lệ' }));
        sendResponse({ success: res.ok && json.success, data: json });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // 2. Tương thích ngược với nút thu thập nhanh trên Zalo (pushPost)
  if (request.action === 'pushPost') {
    fetch(`${serverUrl}/api/extension/push-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload || {})
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({ success: false, error: 'Phản hồi JSON không hợp lệ' }));
        sendResponse({ success: res.ok && json.success, data: json });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});
