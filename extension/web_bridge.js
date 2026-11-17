/**
 * AUTOBIZ AI COLLECTOR v2.0 — WEB APP BRIDGE (web_bridge.js)
 * Cầu nối đồng bộ thời gian thực giữa Chrome Extension và giao diện WebApp AutoBiz AI
 */

(function () {
  'use strict';

  window.sessionStorage.setItem('autobiz_extension_installed', 'true');
  document.documentElement.setAttribute('data-autobiz-extension', 'active');

  console.log('[AutoBiz Bridge] Kết nối Chrome Extension v2.0 sẵn sàng.');

  // Lắng nghe tín hiệu làm mới dữ liệu khi người dùng thêm sản phẩm từ Extension Popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg && msg.action === 'AUTOBIZ_REFRESH_DATA') {
        window.postMessage({ action: 'AUTOBIZ_EXTENSION_SYNC' }, '*');
        sendResponse({ ok: true });
      }
    });
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || !data.action) return;

    if (data.action === 'AUTOBIZ_CHECK_EXTENSION') {
      window.postMessage({
        action: 'AUTOBIZ_EXTENSION_RESPONSE',
        installed: true,
        version: (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest)
          ? chrome.runtime.getManifest().version
          : '2.0.0'
      }, '*');
    }
  });
})();
