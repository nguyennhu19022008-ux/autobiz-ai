/**
 * AUTOBIZ AI COLLECTOR v2.0 — POPUP CONTROLLER (popup.js)
 * Hỗ trợ thu thập sản phẩm 5 ngành hàng, đẩy vào Kho hàng (/api/products),
 * sinh nội dung 4 kênh (/api/ai/omni-generate) & tạo Shortlink Affiliate (/r/:code).
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  const prodNameInput = document.getElementById('prodNameInput');
  const prodCategoryInput = document.getElementById('prodCategoryInput');
  const prodPriceInput = document.getElementById('prodPriceInput');
  const prodCommInput = document.getElementById('prodCommInput');
  const prodChannelInput = document.getElementById('prodChannelInput');
  const prodUrlInput = document.getElementById('prodUrlInput');
  const rawTextInput = document.getElementById('rawTextInput');

  const btnGrabCurrentTab = document.getElementById('btnGrabCurrentTab');
  const btnSaveCatalog = document.getElementById('btnSaveCatalog');
  const btnGenerateOmni = document.getElementById('btnGenerateOmni');
  const statusMsg = document.getElementById('statusMsg');
  const resultBox = document.getElementById('resultBox');
  const shortlinkText = document.getElementById('shortlinkText');
  const btnCopyShortlink = document.getElementById('btnCopyShortlink');
  const omniSummary = document.getElementById('omniSummary');
  const openFullAppBtn = document.getElementById('openFullAppBtn');
  const quickStatusText = document.getElementById('quickStatusText');

  const backendUrlInput = document.getElementById('backendUrlInput');
  const btnPresetVercel = document.getElementById('btnPresetVercel');
  const btnPresetLocal = document.getElementById('btnPresetLocal');
  const subIdInput = document.getElementById('subIdInput');
  const saveBtn = document.getElementById('saveBtn');
  const connectionStatus = document.getElementById('connectionStatus');

  const DEFAULT_VERCEL_URL = 'https://autobiz-ai-seven.vercel.app';
  let currentBackendUrl = DEFAULT_VERCEL_URL;
  let currentSubId = 'vuonggia';

  if (btnPresetVercel) {
    btnPresetVercel.addEventListener('click', () => {
      backendUrlInput.value = DEFAULT_VERCEL_URL;
      saveBtn.click();
    });
  }
  if (btnPresetLocal) {
    btnPresetLocal.addEventListener('click', () => {
      backendUrlInput.value = 'http://localhost:3000';
      saveBtn.click();
    });
  }

  // 1. Chuyển tab
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });

  // 2. Nạp cấu hình đã lưu
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['backendUrl', 'subId'], (res) => {
      if (res.backendUrl) {
        currentBackendUrl = res.backendUrl.trim().replace(/\/$/, '');
        backendUrlInput.value = currentBackendUrl;
      }
      if (res.subId) {
        currentSubId = res.subId.trim();
        subIdInput.value = currentSubId;
      }
      checkServerHealth(currentBackendUrl);
    });
  } else {
    checkServerHealth(currentBackendUrl);
  }

  // 3. Lưu cấu hình
  saveBtn.addEventListener('click', () => {
    const val = backendUrlInput.value.trim().replace(/\/$/, '') || DEFAULT_VERCEL_URL;
    const sub = subIdInput.value.trim() || 'vuonggia';
    currentBackendUrl = val;
    currentSubId = sub;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ backendUrl: val, subId: sub }, () => {
        saveBtn.textContent = 'Đã lưu cấu hình';
        setTimeout(() => { saveBtn.textContent = 'Lưu Cấu Hình Kết Nối'; }, 1500);
        checkServerHealth(val);
      });
    } else {
      checkServerHealth(val);
    }
  });

  async function checkServerHealth(url) {
    quickStatusText.textContent = `Máy chủ: ${url.replace(/^https?:\/\//, '')}`;
    connectionStatus.textContent = '- Đang kiểm tra kết nối máy chủ AutoBiz AI...';
    try {
      const res = await fetch(`${url}/api/analytics/summary`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const totalProd = data?.summary?.totalProducts ?? 0;
        const totalClicks = data?.summary?.totalClicks ?? 0;
        connectionStatus.style.color = '#166534';
        connectionStatus.textContent = `- Đã kết nối thành công (${totalProd} sản phẩm | ${totalClicks} lượt click Affiliate).`;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      connectionStatus.style.color = '#7F1D1D';
      connectionStatus.textContent = `- Chưa kết nối được máy chủ tại ${url}. Hãy kiểm tra server đã bật chưa.`;
    }
  }

  function setStatus(msg, type = 'loading') {
    statusMsg.className = `status-msg ${type}`;
    statusMsg.textContent = msg;
  }

  // 4. Lấy thông tin từ Tab đang mở (Shopee / TikTok / Web)
  function detectCategoryFromTitle(title) {
    const t = String(title || '').toLowerCase();
    if (/sữa rửa mặt|kem|serum|son|nước hoa|mỹ phẩm|dầu gội|sữa tắm|cerave|hasaki|skincare|lotion/.test(t)) return 'fmcg';
    if (/áo|quần|váy|đầm|giày|dép|hoodie|túi xách|thời trang/.test(t)) return 'fashion';
    if (/laptop|macbook|thinkpad|dell|asus|hp|lenovo|iphone|ipad|màn hình|pc/.test(t)) return 'tech';
    if (/nồi|chảo|quạt|máy hút|đèn|bình giữ nhiệt|gia dụng|kệ/.test(t)) return 'home';
    return 'accessories';
  }

  btnGrabCurrentTab.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          const tab = tabs[0];
          if (tab.title) {
            const cleanTitle = tab.title
              .replace(/\| Shopee Việt Nam/gi, '')
              .replace(/- TikTok Shop/gi, '')
              .trim();
            prodNameInput.value = cleanTitle;
            prodCategoryInput.value = detectCategoryFromTitle(cleanTitle);
          }
          if (tab.url && /^https?:\/\//i.test(tab.url)) {
            prodUrlInput.value = tab.url;
          }
          setStatus('- Đã lấy tiêu đề, nhận diện ngành hàng & đường dẫn từ Tab hiện tại.', 'success');
        }
      });
    }
  });

  // 5. Lưu sản phẩm vào Kho Hàng Đa Ngành (POST /api/products)
  btnSaveCatalog.addEventListener('click', async () => {
    const name = prodNameInput.value.trim();
    const category = prodCategoryInput.value;
    const priceRetail = Number(prodPriceInput.value) || 0;
    const commissionRate = Number(prodCommInput.value) || 10;
    const affiliateBaseUrl = prodUrlInput.value.trim() || 'https://shopee.vn';
    const rawDesc = rawTextInput.value.trim();

    if (!name && !rawDesc) {
      return setStatus('- Vui lòng nhập Tên mặt hàng hoặc Mô tả thô.', 'error');
    }

    setStatus('- Đang lưu sản phẩm vào Kho Hàng Đa Ngành...', 'loading');
    try {
      const res = await fetch(`${currentBackendUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || rawDesc.split('\n')[0].slice(0, 80),
          category,
          price_retail: priceRetail,
          commission_rate: commissionRate,
          affiliate_base_url: affiliateBaseUrl,
          specs: rawDesc ? { "Điểm nổi bật": rawDesc } : {}
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lưu sản phẩm');
      }
      setStatus(`- Đã lưu "${data.product.name}" (Mã: ${data.product.sku}) vào Kho Hàng Đa Ngành.`, 'success');
      notifyWebAppRefresh();
    } catch (err) {
      setStatus(`- Lỗi: ${err.message}`, 'error');
    }
  });

  // 6. Sinh 4 kênh + Tạo Shortlink Affiliate (/r/:code)
  btnGenerateOmni.addEventListener('click', async () => {
    const name = prodNameInput.value.trim();
    const category = prodCategoryInput.value;
    const priceRetail = Number(prodPriceInput.value) || 0;
    const commissionRate = Number(prodCommInput.value) || 10;
    const channel = prodChannelInput.value || 'tiktok';
    const baseUrl = prodUrlInput.value.trim() || 'https://shopee.vn';
    const rawDesc = rawTextInput.value.trim();

    if (!name && !rawDesc) {
      return setStatus('- Vui lòng nhập Tên mặt hàng hoặc Mô tả để AI xử lý.', 'error');
    }

    setStatus('- Đang tạo Shortlink Affiliate & sinh nội dung 4 kênh...', 'loading');
    resultBox.classList.remove('visible');

    try {
      // Bước 1: Tạo Shortlink /r/:code
      const linkRes = await fetch(`${currentBackendUrl}/api/affiliate/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          productName: name || rawDesc.slice(0, 60),
          priceRetail,
          commissionRate,
          channel,
          campaign: 'ext_collector_2026',
          subId: currentSubId
        })
      });
      const linkData = await linkRes.json();
      if (!linkRes.ok || !linkData.success) {
        throw new Error(linkData.error || 'Lỗi tạo Shortlink');
      }

      const linkObj = linkData.entry || linkData.link || {};
      const fullShortUrl = linkData.shortUrl || `${currentBackendUrl}/r/${linkObj.shortCode}`;

      // Bước 2: Gọi Gemini AI sinh 4 kênh
      const combinedText = `${name}\nGiá: ${priceRetail.toLocaleString('vi-VN')}đ\n${rawDesc}`;
      const aiRes = await fetch(`${currentBackendUrl}/api/ai/omni-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: combinedText,
          category,
          affiliateUrl: fullShortUrl,
          campaign: 'ext_collector_2026',
          subId: currentSubId
        })
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok || !aiData.success) {
        throw new Error(aiData.error || 'Lỗi sinh nội dung 4 kênh');
      }

      shortlinkText.textContent = fullShortUrl;
      const ch = aiData.channels || {};
      omniSummary.innerHTML = [
        `- Đã sinh đủ 4 bản: Facebook (${(ch.facebook || '').length} ký tự), TikTok Script (${(ch.tiktok || '').length} ký tự), Zalo OA, Shopee SEO.`,
        `- Hoa hồng dự kiến/đơn: ${Math.round((priceRetail * commissionRate) / 100).toLocaleString('vi-VN')} VNĐ.`
      ].join('<br>');

      resultBox.classList.add('visible');
      setStatus('- Hoàn tất! Đã tạo Shortlink & nội dung 4 kênh.', 'success');
      notifyWebAppRefresh();
    } catch (err) {
      setStatus(`- Lỗi: ${err.message}`, 'error');
    }
  });

  // 7. Sao chép Shortlink
  btnCopyShortlink.addEventListener('click', () => {
    const text = shortlinkText.textContent;
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text).then(() => {
      btnCopyShortlink.textContent = 'ĐÃ CHÉP';
      setTimeout(() => { btnCopyShortlink.textContent = 'SAO CHÉP'; }, 1500);
    });
  });

  // 8. Mở WebApp
  openFullAppBtn.addEventListener('click', () => {
    const targetUrl = `${currentBackendUrl}/`;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, '_blank');
    }
  });

  function notifyWebAppRefresh() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((t) => {
          if (t.url && t.url.startsWith(currentBackendUrl)) {
            chrome.tabs.sendMessage(t.id, { action: 'AUTOBIZ_REFRESH_DATA' }, () => {});
          }
        });
      });
    }
  }
});
