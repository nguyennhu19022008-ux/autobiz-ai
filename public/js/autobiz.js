/**
 * AutoBiz AI - Phase 3 Minimalist SaaS Frontend Controller
 * High-performance, anti-AI-slop, utilitarian architecture
 */

(function () {
  'use strict';

  // ======================== STATE STORE ========================
  const state = {
    currentView: 'analytics',
    activeStudioTab: 'facebook',
    studioContents: {
      facebook: '',
      instagram: '',
      tiktok: '',
      zalo: '',
      shopee: ''
    },
    catalogProducts: [],
    catalogFilter: 'all',
    catalogSearch: '',
    queuePosts: [],
    settings: {}
  };

  // Category labels and pastel classes
  const CATEGORY_MAP = {
    tech: { label: 'Công nghệ', class: 'tag-tech' },
    accessories: { label: 'Phụ kiện', class: 'tag-accessories' },
    home: { label: 'Gia dụng', class: 'tag-home' },
    fashion: { label: 'Thời trang', class: 'tag-fashion' },
    fmcg: { label: 'Tiêu dùng', class: 'tag-fmcg' },
    auto: { label: 'Tự động', class: 'tag-accessories' }
  };

  // ======================== DOM UTILITIES ========================
  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatCurrency(num) {
    const val = Number(num) || 0;
    return val.toLocaleString('vi-VN') + ' đ';
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return '--';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // ======================== TOAST SYSTEM ========================
  function showToast(message, isError = false) {
    let container = $('#toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    
    const iconSvg = isError
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  // ======================== NAVIGATION CONTROLLER ========================
  function switchView(viewName) {
    state.currentView = viewName;

    // Update Nav Buttons
    $$('.nav-item').forEach((btn) => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Sections
    $$('.view-section').forEach((sec) => {
      sec.classList.remove('active');
    });

    const targetSec = $(`#view-${viewName}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Close mobile sidebar if open
    closeMobileSidebar();

    // Load data specific to view
    if (viewName === 'analytics') {
      loadAnalyticsSummary();
    } else if (viewName === 'catalog') {
      loadCatalogProducts();
    } else if (viewName === 'queue') {
      loadQueuePosts();
    } else if (viewName === 'settings') {
      loadSettings();
    } else if (viewName === 'users') {
      loadUsersTable();
    }
  }

  function toggleMobileSidebar() {
    const sidebar = $('#appSidebar');
    const overlay = $('#sidebarOverlay');
    if (sidebar && overlay) {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    }
  }

  function closeMobileSidebar() {
    const sidebar = $('#appSidebar');
    const overlay = $('#sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  }

  // ======================== PHÂN HỆ 1: TỔNG QUAN & FINTECH ========================
  async function loadAnalyticsSummary() {
    try {
      const res = await fetch('/api/analytics/summary');
      if (!res.ok) throw new Error('Không thể nạp số liệu thống kê.');
      const data = await res.json();
      const summary = data.summary || {};

      // Big Stats
      const statClicks = $('#statClicks');
      const statLinks = $('#statLinks');
      const statConversion = $('#statConversion');
      const statCommission = $('#statCommission');

      if (statClicks) statClicks.textContent = (summary.totalClicks || 0).toLocaleString('vi-VN');
      if (statLinks) statLinks.textContent = (summary.totalLinks || 0).toLocaleString('vi-VN');
      if (statConversion) statConversion.textContent = `${Number(summary.conversionRate || 0).toFixed(1)}%`;
      if (statCommission) statCommission.textContent = formatCurrency(summary.totalCommission || 0);

      // Finance & Revenue Stats
      const statTotalRevenue = $('#statTotalRevenue');
      const statConfirmedRevenue = $('#statConfirmedRevenue');
      const statNetRevenue = $('#statNetRevenue');
      const statTotalOrders = $('#statTotalOrders');

      if (statTotalRevenue) statTotalRevenue.textContent = formatCurrency(summary.totalRevenue || 0);
      if (statConfirmedRevenue) statConfirmedRevenue.textContent = formatCurrency(summary.confirmedRevenue || 0);
      if (statNetRevenue) statNetRevenue.textContent = formatCurrency(summary.netShopRevenue || 0);
      if (statTotalOrders) statTotalOrders.textContent = (summary.totalOrders || 0).toLocaleString('vi-VN');

      // Financial Margin & Efficiency Trends (EPC, Net Margin %, AOV)
      const statCommissionTrend = $('#statCommissionTrend');
      const statNetRevenueTrend = $('#statNetRevenueTrend');
      const statTotalOrdersTrend = $('#statTotalOrdersTrend');
      if (statCommissionTrend) {
        statCommissionTrend.textContent = `EPC: ${formatCurrency(summary.earningPerClick || 0)}/click | Tỷ lệ HH: ${Number(summary.commissionMarginPct || 0).toFixed(1)}%`;
      }
      if (statNetRevenueTrend) {
        statNetRevenueTrend.textContent = `Biên thực thu Shop: ${Number(summary.netMarginPct || 0).toFixed(1)}% sau trừ HH`;
      }
      if (statTotalOrdersTrend) {
        statTotalOrdersTrend.textContent = `Giá trị đơn TB (AOV): ${formatCurrency(summary.avgOrderValue || 0)}`;
      }

      // Bind 1-Click Demo Seed & Clear buttons once
      const btnSeedDemo = $('#btnSeedDemo');
      if (btnSeedDemo && !btnSeedDemo.dataset.bound) {
        btnSeedDemo.dataset.bound = '1';
        btnSeedDemo.addEventListener('click', async () => {
          const origHtml = btnSeedDemo.innerHTML;
          btnSeedDemo.disabled = true;
          btnSeedDemo.innerHTML = '<span>Đang nạp dữ liệu mẫu...</span>';
          try {
            const res = await fetch('/api/demo/seed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ includeLinks: true })
            });
            const data = await res.json();
            if (data.success) {
              if (typeof showToast === 'function') showToast(data.message || 'Đã khởi tạo dữ liệu thử nghiệm!');
              await loadAnalyticsSummary();
              if (typeof loadCatalogProducts === 'function') await loadCatalogProducts();
              if (typeof loadAffiliateLinks === 'function') await loadAffiliateLinks();
            }
          } catch (err) {
            console.error('[Demo Seed Error]', err);
          } finally {
            btnSeedDemo.disabled = false;
            btnSeedDemo.innerHTML = origHtml;
          }
        });
      }

      const btnClearDemo = $('#btnClearDemo');
      if (btnClearDemo && !btnClearDemo.dataset.bound) {
        btnClearDemo.dataset.bound = '1';
        btnClearDemo.addEventListener('click', async () => {
          const origHtml = btnClearDemo.innerHTML;
          btnClearDemo.disabled = true;
          btnClearDemo.innerHTML = '<span>Đang làm sạch...</span>';
          try {
            const res = await fetch('/api/demo/clear', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
              if (typeof showToast === 'function') showToast(data.message || 'Đã làm sạch dữ liệu mẫu!', 'info');
              await loadAnalyticsSummary();
              if (typeof loadCatalogProducts === 'function') await loadCatalogProducts();
              if (typeof loadAffiliateLinks === 'function') await loadAffiliateLinks();
            }
          } catch (err) {
            console.error('[Demo Clear Error]', err);
          } finally {
            btnClearDemo.disabled = false;
            btnClearDemo.innerHTML = origHtml;
          }
        });
      }

      // Horizontal Bar Chart
      renderChannelChart(summary.byChannel || {});

      // Top Links Table
      renderTopLinksTable(summary.topLinks || []);

      // CTV Revenue Leaderboard
      renderCtvRevenueTable(summary.bySubId || []);

      // Payouts & VietQR Reconciliation
      loadPayouts();
    } catch (err) {
      console.error('[Analytics Error]', err);
      showToast(err.message, true);
    }
  }

  function renderChannelChart(byChannel) {
    const container = $('#channelChartContainer');
    if (!container) return;

    const channels = [
      { key: 'facebook', label: 'Facebook' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'tiktok', label: 'TikTok' },
      { key: 'zalo', label: 'Zalo' },
      { key: 'shopee', label: 'Shopee' }
    ];

    let maxClicks = 1;
    channels.forEach(ch => {
      const c = (byChannel[ch.key] && byChannel[ch.key].clicks) || 0;
      if (c > maxClicks) maxClicks = c;
    });

    let html = '';
    channels.forEach(ch => {
      const data = byChannel[ch.key] || { clicks: 0, commission: 0 };
      const clicks = Number(data.clicks) || 0;
      const commission = Number(data.commission) || 0;
      const pct = Math.max(4, Math.round((clicks / maxClicks) * 100));

      html += `
        <div class="chart-row">
          <div class="chart-channel">
            <span>${escapeHtml(ch.label)}</span>
          </div>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="chart-values">
            <strong>${clicks.toLocaleString('vi-VN')}</strong> clicks • ${formatCurrency(commission)}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderTopLinksTable(links) {
    const tbody = $('#topLinksTableBody');
    if (!tbody) return;

    if (!Array.isArray(links) || links.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">Chưa có link affiliate nào được tạo.</td></tr>`;
      return;
    }

    let html = '';
    links.forEach(l => {
      const chName = (l.channel || 'facebook').toUpperCase();
      const code = escapeHtml(l.shortCode || '');
      const clicks = Number(l.clicks) || 0;
      const price = Number(l.priceRetail) || 250000;
      const rev = Number(l.confirmedRevenue) > 0 ? Number(l.confirmedRevenue) : Math.round(clicks * 0.05 * price);
      const comm = Number(l.confirmedCommission) > 0 ? Number(l.confirmedCommission) : (Number(l.estimatedCommission) || 0);

      html += `
        <tr>
          <td><span class="shortcode-badge">/r/${code}</span></td>
          <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(l.productName || '')}">
            <strong>${escapeHtml(l.productName || 'Sản phẩm')}</strong>
          </td>
          <td><span class="tag tag-tech">${chName}</span></td>
          <td><strong>${clicks.toLocaleString('vi-VN')}</strong></td>
          <td style="color: #7F1D1D; font-weight: 600;">${formatCurrency(rev)}</td>
          <td>${formatCurrency(comm)}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="window.AutoBiz.openShortlink('${code}')" title="Mở đường link để kiểm tra click thực tế">
                Mở /r/${code}
              </button>
              ${state.authUser?.role === 'ctv' ? '' : `<button class="btn btn-primary btn-sm admin-only" onclick="window.AutoBiz.recordOrder('${code}', ${price})" title="Ghi nhận 1 đơn hàng chốt thành công">
                + Chốt đơn
              </button>`}
              <button class="btn btn-secondary btn-sm" onclick="window.AutoBiz.copyLink('/r/${code}')" title="Sao chép link rút gọn">
                Sao chép
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  function renderCtvRevenueTable(rows) {
    const tbody = $('#ctvRevenueTableBody');
    if (!tbody) return;

    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">Chưa có dữ liệu doanh thu theo CTV.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td><strong>${escapeHtml(r.subId || 'mac_dinh')}</strong></td>
        <td>${Number(r.links || 0).toLocaleString('vi-VN')}</td>
        <td>${Number(r.clicks || 0).toLocaleString('vi-VN')}</td>
        <td><strong>${Number(r.orders || 0).toLocaleString('vi-VN')}</strong></td>
        <td style="color: #7F1D1D; font-weight: 600;">${formatCurrency(r.revenue || 0)}</td>
        <td>${formatCurrency(r.commission || 0)}</td>
        <td style="color: #166534; font-weight: 600;">${formatCurrency(r.netRevenue || 0)}</td>
      </tr>
    `).join('');
  }

  async function recordOrder(shortCode, defaultPrice = 250000) {
    const input = window.prompt(`Nhập giá trị đơn hàng cho link /r/${shortCode} (VNĐ):`, String(defaultPrice || 250000));
    if (input === null) return;
    const orderAmount = Number(String(input).replace(/[^\d]/g, '')) || Number(defaultPrice) || 250000;
    try {
      const res = await fetch('/api/affiliate/record-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortCode, orderAmount, quantity: 1 })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể ghi nhận đơn hàng.');
      showToast(`Đã ghi nhận đơn ${formatCurrency(orderAmount)} cho /r/${shortCode}!`);
      await loadAnalyticsSummary();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function openShortlink(code) {
    const fullUrl = `${window.location.origin}/r/${encodeURIComponent(code)}`;
    window.open(fullUrl, '_blank');
    showToast(`Đã mở /r/${code} trong tab mới! Đang ghi nhận lượt click...`);
    // Refresh stats automatically after 1 second to show updated click count
    setTimeout(() => {
      loadAnalyticsSummary();
    }, 1200);
  }

  function copyLink(path) {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast(`Đã sao chép: ${fullUrl}`);
    }).catch(() => {
      showToast(`Không thể tự động sao chép. URL: ${fullUrl}`);
    });
  }

  // ======================== PHÂN HỆ 2: STUDIO ĐA KÊNH ========================
  function initStudio() {
    // Channel Tab Switcher
    $$('.channel-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetChannel = btn.getAttribute('data-channel');
        switchStudioTab(targetChannel);
      });
    });

    // Editor Textarea input sync
    const editor = $('#studioEditor');
    if (editor) {
      editor.addEventListener('input', () => {
        state.studioContents[state.activeStudioTab] = editor.value;
        updateCharCounter();
      });
    }

    // Copy Content Button
    const btnCopy = $('#btnCopyStudioContent');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const content = ($('#studioEditor') && $('#studioEditor').value) || '';
        if (!content.trim()) {
          showToast('Nội dung đang trống.', true);
          return;
        }
        navigator.clipboard.writeText(content).then(() => {
          showToast('Đã sao chép nội dung bài viết!');
        });
      });
    }

    // Create Shortlink Button
    const btnShorten = $('#btnCreateShortlink');
    if (btnShorten) {
      btnShorten.addEventListener('click', handleCreateStudioShortlink);
    }

    // AI Generate Button
    const btnGenerate = $('#btnGenerateContent');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', handleAIGenerate);
    }

    // Dispatch Button
    const btnDispatch = $('#btnDispatchNow');
    if (btnDispatch) {
      btnDispatch.addEventListener('click', handleDispatchChannels);
    }

    // Add to Queue Button
    const btnQueue = $('#btnAddToQueue');
    if (btnQueue) {
      btnQueue.addEventListener('click', handleAddToQueue);
    }
  }

  function switchStudioTab(channelKey) {
    const editor = $('#studioEditor');
    if (editor) {
      // Save current tab's text first
      state.studioContents[state.activeStudioTab] = editor.value;
      // Set new active tab
      state.activeStudioTab = channelKey;
      // Populate editor with saved text
      editor.value = state.studioContents[channelKey] || '';
      updateCharCounter();
    }

    // Update tab button styles
    $$('.channel-tab-btn').forEach((btn) => {
      if (btn.getAttribute('data-channel') === channelKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateCharCounter() {
    const editor = $('#studioEditor');
    const counter = $('#studioCharCount');
    if (!editor || !counter) return;

    const len = editor.value.length;
    const lines = editor.value ? editor.value.split('\n').length : 0;
    counter.textContent = `${len} ký tự • ${lines} dòng`;
  }

  async function handleCreateStudioShortlink() {
    const baseUrlInput = $('#studioBaseUrl');
    const campaignInput = $('#studioCampaign');
    const subIdInput = $('#studioSubId');
    const priceInput = $('#studioPrice');
    const rawTextInput = $('#studioRawText');

    const baseUrl = baseUrlInput ? baseUrlInput.value.trim() : '';
    if (!baseUrl) {
      showToast('Vui lòng nhập Link gốc sản phẩm (Shopee, Web...).', true);
      if (baseUrlInput) baseUrlInput.focus();
      return;
    }

    const payload = {
      baseUrl,
      productName: (rawTextInput && rawTextInput.value.trim().slice(0, 60)) || 'Sản phẩm Studio',
      priceRetail: (priceInput && Number(priceInput.value)) || 0,
      channel: state.activeStudioTab || 'facebook',
      campaign: (campaignInput && campaignInput.value.trim()) || 'autobiz_2026',
      subId: (subIdInput && subIdInput.value.trim()) || 'vuonggia'
    };

    try {
      const res = await fetch('/api/affiliate/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi tạo shortlink.');
      }

      const container = $('#studioGeneratedLinkContainer');
      const textSpan = $('#studioGeneratedLinkText');
      if (container && textSpan) {
        textSpan.textContent = data.shortUrl;
        container.style.display = 'flex';
      }

      showToast(`Đã tạo link rút gọn thành công: ${data.shortUrl}`);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleAIGenerate() {
    const rawTextInput = $('#studioRawText');
    const categorySelect = $('#studioCategory');
    const priceInput = $('#studioPrice');
    const baseUrlInput = $('#studioBaseUrl');
    const campaignInput = $('#studioCampaign');
    const btnGenerate = $('#btnGenerateContent');

    const rawText = rawTextInput ? rawTextInput.value.trim() : '';
    if (!rawText) {
      showToast('Vui lòng nhập mô tả hoặc dán thông số sản phẩm.', true);
      if (rawTextInput) rawTextInput.focus();
      return;
    }

    const originalBtnText = btnGenerate ? btnGenerate.innerHTML : '';
    if (btnGenerate) {
      btnGenerate.disabled = true;
      btnGenerate.innerHTML = `<svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"></circle></svg> Đang phân tích AI & tạo 4 kênh...`;
    }

    try {
      const payload = {
        rawText,
        category: categorySelect ? categorySelect.value : 'auto',
        customPrice: priceInput ? priceInput.value.trim() : '',
        affiliateUrl: baseUrlInput ? baseUrlInput.value.trim() : '',
        campaign: campaignInput ? campaignInput.value.trim() : 'autobiz_2026',
        channel: state.activeStudioTab
      };

      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Lỗi xử lý từ AI Service.');
      }

      // Populate multi-channel state
      if (data.multiChannel) {
        state.studioContents.facebook = data.multiChannel.facebook || '';
        state.studioContents.instagram = data.multiChannel.instagram || '';
        state.studioContents.tiktok = data.multiChannel.tiktok || '';
        state.studioContents.zalo = data.multiChannel.zalo || '';
        state.studioContents.shopee = data.multiChannel.shopee || '';
      } else if (data.content) {
        state.studioContents[state.activeStudioTab] = data.content;
      }

      // Populate parsed SKU if provided and not yet filled
      const skuInput = $('#studioSku');
      if (skuInput && !skuInput.value.trim() && data.machineCode) {
        skuInput.value = data.machineCode;
      }

      // Reflect current tab in editor
      const editor = $('#studioEditor');
      if (editor) {
        editor.value = state.studioContents[state.activeStudioTab] || '';
        updateCharCounter();
      }

      showToast('Đã phân tích AI và khởi tạo bài viết đa kênh!');
    } catch (err) {
      console.error('[AI Generate Error]', err);
      showToast(err.message, true);
    } finally {
      if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = originalBtnText;
      }
    }
  }

  function getStudioMediaFiles() {
    const input = $('#studioImageUrls');
    if (!input) return [];
    return input.value
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 8)
      .map((url) => ({ url, mimetype: 'image/jpeg' }));
  }

  function renderStudioImagePreview() {
    const preview = $('#studioImagePreview');
    if (!preview) return;
    const files = getStudioMediaFiles();
    preview.innerHTML = files
      .map((f) => `<img src="${escapeHtml(f.url)}" alt="Ảnh sản phẩm" style="width:48px;height:48px;object-fit:cover;border:1px solid var(--border-subtle);border-radius:4px;" />`)
      .join('');
  }

  async function handleDispatchChannels() {
    const editor = $('#studioEditor');
    const finalContent = editor ? editor.value.trim() : '';

    if (!finalContent) {
      showToast('Nội dung bài viết đang trống. Vui lòng tạo nội dung trước.', true);
      return;
    }

    // Save editor value to current tab
    state.studioContents[state.activeStudioTab] = finalContent;

    const checkedBoxes = $$('.dispatch-channel-cb:checked');
    if (checkedBoxes.length === 0) {
      showToast('Vui lòng tích chọn ít nhất 1 kênh phân phối.', true);
      return;
    }

    const target_channels = checkedBoxes.map((cb) => cb.value);
    const mediaFiles = getStudioMediaFiles();
    const btnDispatch = $('#btnDispatchNow');
    const originalText = btnDispatch ? btnDispatch.innerHTML : '';
    if (btnDispatch) {
      btnDispatch.disabled = true;
      btnDispatch.innerHTML = 'Đang phân phối...';
    }

    try {
      const payload = {
        target_channels,
        channel_contents: state.studioContents,
        finalContent,
        mediaFiles
      };

      const res = await fetch('/api/autobiz/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi phân phối kênh.');
      }

      renderDispatchResults(data.results || []);
      showToast('Đã thực thi phân phối đa kênh thành công!');
    } catch (err) {
      console.error('[Dispatch Error]', err);
      showToast(err.message, true);
    } finally {
      if (btnDispatch) {
        btnDispatch.disabled = false;
        btnDispatch.innerHTML = originalText;
      }
    }
  }

  function renderDispatchResults(results) {
    const container = $('#dispatchResultsContainer');
    if (!container) return;

    if (!Array.isArray(results) || results.length === 0) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    results.forEach((r) => {
      const isSuccess = r.status === 'success' || r.status === 'published';
      const isStaged = r.status === 'simulated' || r.status === 'staged' || r.status === 'packaged';
      const tagClass = isSuccess ? 'tag-posted' : (isStaged ? 'tag-pending' : 'tag-failed');
      const statusLabel = isSuccess ? 'Thành công' : (isStaged ? 'Đóng gói sẵn' : 'Lỗi');

      html += `
        <div class="dispatch-result-item">
          <div>
            <strong>${escapeHtml(r.channel ? r.channel.toUpperCase() : 'KÊNH')}</strong>:
            <span style="color: var(--text-muted); margin-left: 6px;">${escapeHtml(r.message || '')}</span>
          </div>
          <span class="tag ${tagClass}">${statusLabel}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  async function handleAddToQueue() {
    const editor = $('#studioEditor');
    const skuInput = $('#studioSku');
    const priceInput = $('#studioPrice');

    const content = editor ? editor.value.trim() : '';
    if (!content) {
      showToast('Nội dung bài viết đang trống.', true);
      return;
    }

    const payload = {
      machineCode: (skuInput && skuInput.value.trim()) || 'AUTOBIZ',
      machineName: 'Sản phẩm Studio',
      content,
      price: (priceInput && priceInput.value.trim()) || '',
      publishImmediately: false
    };

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể đưa vào hàng đợi.');

      showToast('Đã đưa bài viết vào Hàng đợi lên lịch thành công!');
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ======================== PHÂN HỆ 3: KHO HÀNG ĐA NGÀNH ========================
  async function loadCatalogProducts() {
    try {
      const params = new URLSearchParams();
      if (state.catalogFilter && state.catalogFilter !== 'all') {
        params.set('category', state.catalogFilter);
      }
      if (state.catalogSearch && state.catalogSearch.trim()) {
        params.set('search', state.catalogSearch.trim());
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể nạp danh mục sản phẩm.');
      const data = await res.json();

      state.catalogProducts = data.products || [];
      renderCatalogTable(state.catalogProducts);
    } catch (err) {
      console.error('[Catalog Error]', err);
      showToast(err.message, true);
    }
  }

  function renderCatalogTable(products) {
    const tbody = $('#catalogTableBody');
    if (!tbody) return;

    if (!Array.isArray(products) || products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 28px;">Không tìm thấy sản phẩm nào phù hợp.</td></tr>`;
      return;
    }

    let html = '';
    products.forEach((p) => {
      const catInfo = CATEGORY_MAP[p.category] || { label: p.category || 'Khác', class: 'tag-tech' };
      const specsSummary = Array.isArray(p.specs) ? p.specs.join(' • ') : (p.specs || '');

      html += `
        <tr>
          <td><span class="shortcode-badge">${escapeHtml(p.sku || '')}</span></td>
          <td style="max-width: 280px;">
            <div style="font-weight: 600; color: var(--text-main); margin-bottom: 2px;">${escapeHtml(p.name || '')}</div>
            <div style="font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(specsSummary)}">
              ${escapeHtml(specsSummary)}
            </div>
          </td>
          <td><span class="tag ${catInfo.class}">${catInfo.label}</span></td>
          <td><strong>${formatCurrency(p.price_retail || 0)}</strong></td>
          <td>${Number(p.commission_rate || 0)}%</td>
          <td style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <a href="${escapeHtml(p.affiliate_base_url || '#')}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: var(--text-muted); text-decoration: underline;">
              ${escapeHtml(p.affiliate_base_url ? 'Link Shopee/Web' : '--')}
            </a>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-primary btn-sm" onclick="window.AutoBiz.loadProductToStudio('${p.id}')">
                Nạp vào Studio
              </button>
              ${(state.authUser?.role !== 'ctv' || state.authUser?.persona === 'independent_affiliate') ? `<button class="btn btn-secondary btn-sm" onclick="window.AutoBiz.deleteProduct('${p.id}')" title="Xóa">
                ✕
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  function loadProductToStudio(productId) {
    const product = state.catalogProducts.find((p) => p.id === productId);
    if (!product) {
      showToast('Không tìm thấy thông tin sản phẩm.', true);
      return;
    }

    // Populate Studio Inputs
    const skuInput = $('#studioSku');
    const priceInput = $('#studioPrice');
    const categorySelect = $('#studioCategory');
    const baseUrlInput = $('#studioBaseUrl');
    const rawTextInput = $('#studioRawText');

    if (skuInput) skuInput.value = product.sku || '';
    if (priceInput) priceInput.value = product.price_retail || '';
    if (categorySelect) categorySelect.value = product.category || 'auto';
    if (baseUrlInput) baseUrlInput.value = product.affiliate_base_url || '';

    const imageInput = $('#studioImageUrls');
    if (imageInput) {
      const imgs = Array.isArray(product.images) ? product.images : [];
      imageInput.value = imgs.join('\n');
      renderStudioImagePreview();
    }

    // Compose formatted text for raw text box
    const specsList = Array.isArray(product.specs) ? product.specs.join('\n- ') : product.specs;
    const rawText = `${product.name}\n- ${specsList}\nGiá bán: ${formatCurrency(product.price_retail || 0)}`;
    if (rawTextInput) rawTextInput.value = rawText;

    // Switch view to Studio
    switchView('studio');
    showToast(`Đã nạp sản phẩm [${product.sku}] ${product.name} sang Studio Đa Kênh!`);
  }

  async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi Kho hàng?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể xóa sản phẩm.');
      showToast('Đã xóa sản phẩm thành công.');
      loadCatalogProducts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function openAddProductModal() {
    const modal = $('#modalAddProduct');
    if (modal) modal.classList.add('open');
  }

  function closeAddProductModal() {
    const modal = $('#modalAddProduct');
    if (modal) modal.classList.remove('open');
  }

  async function handleSaveNewProduct(e) {
    e.preventDefault();

    const form = $('#formAddProduct');
    if (!form) return;

    const payload = {
      sku: form.sku.value.trim(),
      name: form.name.value.trim(),
      category: form.category.value,
      price_retail: Number(form.price_retail.value) || 0,
      commission_rate: Number(form.commission_rate.value) || 10,
      affiliate_base_url: form.affiliate_base_url.value.trim(),
      specs: form.specs.value.trim()
    };

    if (!payload.name) {
      showToast('Vui lòng nhập tên sản phẩm.', true);
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi thêm sản phẩm.');
      }

      form.reset();
      closeAddProductModal();
      showToast('Đã thêm sản phẩm mới vào Kho hàng!');
      loadCatalogProducts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ======================== PHÂN HỆ 4: HÀNG ĐỢI & LỊCH PHÁT ========================
  async function loadQueuePosts() {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Không thể nạp danh sách bài viết.');
      const posts = await res.json();
      state.queuePosts = Array.isArray(posts) ? posts : [];
      renderQueueTable(state.queuePosts);
    } catch (err) {
      console.error('[Queue Error]', err);
      showToast(err.message, true);
    }
  }

  function renderQueueTable(posts) {
    const tbody = $('#queueTableBody');
    const queueCountBadge = $('#queueCountBadge');
    if (!tbody) return;

    const queuedOnly = posts.filter((p) => p.status === 'queued' || p.status === 'pending_media');
    if (queueCountBadge) {
      queueCountBadge.textContent = `${queuedOnly.length} bài chờ`;
    }

    if (posts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 28px;">Hàng đợi đang trống. Bạn có thể tạo bài mới từ Studio Đa Kênh.</td></tr>`;
      return;
    }

    let html = '';
    posts.forEach((p) => {
      let statusTag = '<span class="tag tag-queued">Đang chờ</span>';
      if (p.status === 'posted') {
        statusTag = '<span class="tag tag-posted">Đã phát</span>';
      } else if (p.status === 'failed') {
        statusTag = '<span class="tag tag-failed">Thất bại</span>';
      }

      const scheduledTimeStr = formatDateTime(p.scheduled_time || p.scheduledTime);
      const excerpt = (p.content || '').slice(0, 90).replace(/\n/g, ' ');

      html += `
        <tr>
          <td><span class="shortcode-badge">${escapeHtml(p.machineCode || p.id.slice(-6))}</span></td>
          <td style="max-width: 320px;">
            <div style="font-size: 13px; color: var(--text-main); font-weight: 500;">${escapeHtml(p.machineName || 'Bài viết đa kênh')}</div>
            <div style="font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(p.content || '')}">
              ${escapeHtml(excerpt)}...
            </div>
          </td>
          <td>${statusTag}</td>
          <td><span style="font-size: 12px; color: var(--text-muted);">${scheduledTimeStr}</span></td>
          <td>
            <div style="display: flex; gap: 6px;">
              ${p.status !== 'posted' ? `
                <button class="btn btn-primary btn-sm" onclick="window.AutoBiz.publishPostNow('${p.id}')">
                  Đăng ngay
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.5;">
                  Hoàn thành
                </button>
              `}
              <button class="btn btn-secondary btn-sm" onclick="window.AutoBiz.deletePost('${p.id}')" title="Xóa">
                ✕
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  async function publishPostNow(postId) {
    if (!confirm('Bạn có chắc chắn muốn phát bài này ngay lập tức lên các kênh đã cấu hình?')) return;

    try {
      showToast('Đang phát bài viết...');
      const res = await fetch(`/api/posts/${postId}/publish-now`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi phát bài viết.');
      }

      showToast(data.message || 'Đã thực thi phát bài thành công!');
      loadQueuePosts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function deletePost(postId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này khỏi danh sách?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể xóa bài viết.');
      showToast('Đã xóa bài viết.');
      loadQueuePosts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ======================== PHÂN HỆ 5: KẾT NỐI KÊNH & CÀI ĐẶT ========================
  function readChannelTogglesFromUI() {
    const map = { facebook: true, tiktok: true, zalo: true, shopee: true };
    $$('.setting-channel-toggle').forEach((cb) => {
      const ch = cb.dataset.channel;
      if (ch) map[ch] = Boolean(cb.checked);
    });
    return map;
  }

  function applyEnabledChannels(rawMap) {
    let savedLocal = null;
    try {
      savedLocal = JSON.parse(localStorage.getItem('autobiz_enabled_channels') || 'null');
    } catch (_) {}
    const map = Object.assign({ facebook: true, instagram: true, tiktok: true, zalo: true, shopee: true }, savedLocal || {}, rawMap || {});
    try {
      localStorage.setItem('autobiz_enabled_channels', JSON.stringify(map));
    } catch (_) {}

    // 1. Sync Settings checkboxes
    $$('.setting-channel-toggle').forEach((cb) => {
      const ch = cb.dataset.channel;
      if (ch && typeof map[ch] === 'boolean') cb.checked = map[ch];
    });

    // 2. Show/hide Studio channel tabs & switch active tab if disabled
    let firstEnabled = null;
    $$('.channel-tab-btn').forEach((btn) => {
      const ch = btn.dataset.channel;
      const isOn = map[ch] !== false;
      btn.style.display = isOn ? '' : 'none';
      if (isOn && !firstEnabled) firstEnabled = btn;
    });
    if (map[state.activeStudioTab] === false && firstEnabled) {
      firstEnabled.click();
    }

    // 3. Show/hide & uncheck Dispatch checkboxes
    $$('.dispatch-channel-cb').forEach((cb) => {
      const ch = cb.value;
      const isOn = map[ch] !== false;
      const wrapper = cb.closest('.dispatch-checkbox-label');
      if (wrapper) wrapper.style.display = isOn ? '' : 'none';
      cb.disabled = !isOn;
      if (!isOn) cb.checked = false;
    });
  }

  async function loadSettings() {
    applyEnabledChannels(null);
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Không thể tải cài đặt.');
      const data = await res.json();
      state.settings = data || {};

      const form = $('#formSettings');
      if (!form) return;

      if (form.geminiApiKey) form.geminiApiKey.value = data.geminiApiKey || '';
      if (form.fanpageName) form.fanpageName.value = data.fanpageName || '';
      if (form.hotline) form.hotline.value = data.hotline || '';
      if (form.email) form.email.value = data.email || '';
      if (form.aiTone) form.aiTone.value = data.aiTone || 'balanced';
      if (form.autoSignature) form.autoSignature.value = data.autoSignature || '';
      if (form.scheduleGapMinutes) form.scheduleGapMinutes.value = data.scheduleGapMinutes || 45;
      if (form.autoShortenLinks) form.autoShortenLinks.checked = data.autoShortenLinks !== false;
      if (form.fanpageId) form.fanpageId.value = data.fanpageId || '';
      if (form.facebookPageToken) form.facebookPageToken.value = data.facebookPageToken || '';
      if (form.instagramAccountId) form.instagramAccountId.value = data.instagramAccountId || '';
      if (form.instagramAccessToken) form.instagramAccessToken.value = data.instagramAccessToken || '';
      if (form.tiktokOpenId) form.tiktokOpenId.value = data.tiktokOpenId || '';
      if (form.tiktokToken) form.tiktokToken.value = data.tiktokToken || '';
      if (form.zaloOaId) form.zaloOaId.value = data.zaloOaId || '';
      if (form.zaloToken) form.zaloToken.value = data.zaloToken || '';
      if (form.shopeePartnerId) form.shopeePartnerId.value = data.shopeePartnerId || '';
      if (form.shopeePartnerKey) form.shopeePartnerKey.value = data.shopeePartnerKey || '';
      if (form.telegramBotToken) form.telegramBotToken.value = data.telegramBotToken || '';
      if (form.telegramChatId) form.telegramChatId.value = data.telegramChatId || '';
      if (form.webhookSecret) form.webhookSecret.value = data.webhookSecret || 'autobiz_wh_secret_2026';
      const webhookUrlInput = $('#settingWebhookUrl');
      if (webhookUrlInput) webhookUrlInput.value = `${window.location.origin}/api/webhooks/order`;
      if (data.enabledChannels) {
        applyEnabledChannels(data.enabledChannels);
      }
      if (state.authUser?.role !== 'ctv') {
        loadWebhookLogs();
      }
    } catch (err) {
      console.error('[Settings Error]', err);
      showToast(err.message, true);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();

    const form = $('#formSettings');
    if (!form) return;

    const enabledChannels = readChannelTogglesFromUI();
    applyEnabledChannels(enabledChannels);

    const payload = {
      geminiApiKey: form.geminiApiKey ? form.geminiApiKey.value.trim() : '',
      fanpageName: form.fanpageName ? form.fanpageName.value.trim() : '',
      hotline: form.hotline ? form.hotline.value.trim() : '',
      email: form.email ? form.email.value.trim() : '',
      aiTone: form.aiTone ? form.aiTone.value : 'balanced',
      autoSignature: form.autoSignature ? form.autoSignature.value.trim() : '',
      scheduleGapMinutes: form.scheduleGapMinutes ? (Number(form.scheduleGapMinutes.value) || 45) : 45,
      autoShortenLinks: form.autoShortenLinks ? form.autoShortenLinks.checked : true,
      fanpageId: form.fanpageId ? form.fanpageId.value.trim() : '',
      facebookPageToken: form.facebookPageToken ? form.facebookPageToken.value.trim() : '',
      instagramAccountId: form.instagramAccountId ? form.instagramAccountId.value.trim() : '',
      instagramAccessToken: form.instagramAccessToken ? form.instagramAccessToken.value.trim() : '',
      tiktokOpenId: form.tiktokOpenId ? form.tiktokOpenId.value.trim() : '',
      tiktokToken: form.tiktokToken ? form.tiktokToken.value.trim() : '',
      zaloOaId: form.zaloOaId ? form.zaloOaId.value.trim() : '',
      zaloToken: form.zaloToken ? form.zaloToken.value.trim() : '',
      shopeePartnerId: form.shopeePartnerId ? form.shopeePartnerId.value.trim() : '',
      shopeePartnerKey: form.shopeePartnerKey ? form.shopeePartnerKey.value.trim() : '',
      telegramBotToken: form.telegramBotToken ? form.telegramBotToken.value.trim() : '',
      telegramChatId: form.telegramChatId ? form.telegramChatId.value.trim() : '',
      webhookSecret: form.webhookSecret ? form.webhookSecret.value.trim() : 'autobiz_wh_secret_2026',
      enabledChannels
    };

    const btn = $('#btnSaveSettings');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Đang lưu...';
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lưu cài đặt.');
      }

      showToast(data.message || 'Đã lưu cấu hình thành công!');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }

  // ======================== RBAC AUTH (CHỦ SHOP vs CTV) & ORDER WEBHOOK ========================
  async function loadAuthState() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        state.authUser = data.user;
        applyRolePermissions(data.user);
      }
    } catch (err) {
      console.error('[Auth State Error]', err);
    }
  }

  function applyRolePermissions(user) {
    const role = user?.role || 'superadmin';
    const isCtv = role === 'ctv';
    const isSuperAdmin = role === 'superadmin';
    const isIndependentAffiliate = user?.persona === 'independent_affiliate' || (isCtv && user?.hasAffiliates === false);
    const isShopSolo = !isCtv && !isSuperAdmin && (user?.persona === 'shop_solo' || user?.hasAffiliates === false);
    const hasCtvNetwork = isSuperAdmin || (!isCtv && !isShopSolo);
    const canWriteCatalog = isSuperAdmin || !isCtv || isIndependentAffiliate;

    const userNameEl = $('#currentUserName');
    if (userNameEl) {
      userNameEl.textContent = user?.displayName || user?.username || 'AutoBiz User';
    }

    // Update Bio Page Link & CTV Invite Link dynamically for current user
    const cleanU = user?.username || 'admin';
    const bioBtn = $('#btnOpenBioPage');
    if (bioBtn) bioBtn.href = `/u/${encodeURIComponent(cleanU)}`;
    const inviteInput = $('#shopInviteLinkInput');
    if (inviteInput) inviteInput.value = `${window.location.origin}/join/${encodeURIComponent(cleanU)}`;

    // Toggle CTV Payout Request Card
    const ctvPayoutCard = $('#cardCtvPayoutRequest');
    if (ctvPayoutCard) ctvPayoutCard.style.display = isCtv ? '' : 'none';

    const badge = $('#currentRoleBadge');
    if (badge) {
      if (isIndependentAffiliate) {
        badge.textContent = 'KOC / Affiliate Sàn';
        badge.className = 'tag tag-tech';
      } else if (isCtv) {
        badge.textContent = `CTV: ${user.subId}`;
        badge.className = 'tag tag-tech';
      } else if (isSuperAdmin) {
        badge.textContent = 'Admin Tổng';
        badge.className = 'tag tag-fashion';
      } else if (isShopSolo) {
        badge.textContent = 'Chủ shop (Tự bán)';
        badge.className = 'tag tag-accessories';
      } else {
        badge.textContent = 'Chủ shop (Có CTV)';
        badge.className = 'tag tag-accessories';
      }
    }

    // 1. Admin-only controls (Settings, Demo Seed/Clear)
    $$('.admin-only').forEach((el) => {
      el.style.display = isCtv ? 'none' : '';
    });

    // 2. CTV Network controls (User/CTV management tab, CTV revenue split table)
    $$('.ctv-network-only').forEach((el) => {
      el.style.display = hasCtvNetwork ? '' : 'none';
    });

    // 3. Catalog write button (Allowed for Admin, Shop Owner, AND Independent Affiliate KOC)
    $$('.catalog-write-allowed').forEach((el) => {
      el.style.display = canWriteCatalog ? '' : 'none';
    });

    // 4. Tailor labels & copy by persona
    const btnAddProductLabel = $('#btnAddProductLabel');
    if (btnAddProductLabel) {
      btnAddProductLabel.textContent = isIndependentAffiliate ? '+ Thêm Link Affiliate Sàn' : '+ Thêm sản phẩm';
    }
    const catalogTitle = $('#catalogPageTitle');
    const catalogSubtitle = $('#catalogPageSubtitle');
    if (catalogTitle && catalogSubtitle) {
      if (isIndependentAffiliate) {
        catalogTitle.textContent = 'Danh Sách Link Affiliate Cá Nhân';
        catalogSubtitle.textContent = 'Lưu sản phẩm kèm link affiliate Shopee / TikTok Shop cá nhân của bạn để AI viết bài và rút gọn link đo click.';
      } else {
        catalogTitle.textContent = 'Kho Hàng Đa Ngành';
        catalogSubtitle.textContent = 'Quản lý cơ sở dữ liệu sản phẩm đa lĩnh vực: Công nghệ, Phụ kiện, Gia dụng, Thời trang & FMCG.';
      }
    }

    const studioSmartLinkTitle = $('#studioSmartLinkTitle');
    if (studioSmartLinkTitle) {
      studioSmartLinkTitle.textContent = isIndependentAffiliate
        ? 'Link Affiliate Sàn Của Bạn (Shopee / TikTok)'
        : 'Smart Affiliate Link (UTM Tracking)';
    }

    const statNetLabel = $('#statNetRevenueLabel');
    const statNetTrend = $('#statNetRevenueTrend');
    if (statNetLabel && statNetTrend) {
      if (isIndependentAffiliate) {
        statNetLabel.textContent = 'Hoa Hồng Cá Nhân';
        statNetTrend.textContent = 'Ước tính từ các link Affiliate sàn của bạn';
      } else if (isShopSolo) {
        statNetLabel.textContent = 'Doanh Thu Tự Bán';
        statNetTrend.textContent = '100% doanh thu tự bán (không chia CTV)';
      } else {
        statNetLabel.textContent = 'Tiền Thực Thu Chủ Shop';
        statNetTrend.textContent = 'Doanh thu sau khi trừ hoa hồng CTV';
      }
    }

    // Restrict role dropdown in Create User form if current user is shop_owner
    const newUserRoleSelect = $('#newUserRole');
    if (newUserRoleSelect) {
      Array.from(newUserRoleSelect.options).forEach((opt) => {
        if (opt.value !== 'ctv') {
          opt.disabled = !isSuperAdmin;
        }
      });
      if (!isSuperAdmin) {
        newUserRoleSelect.value = 'ctv';
      }
    }

    const analyticsSubtitle = $('#analyticsSubtitle') || $('#view-analytics .page-subtitle');
    if (analyticsSubtitle) {
      if (isIndependentAffiliate) {
        analyticsSubtitle.textContent = 'Không gian Affiliate / KOC độc lập — Dán link Shopee/TikTok, AI viết bài 4 kênh và theo dõi click chuyển đổi cá nhân.';
      } else if (isCtv) {
        analyticsSubtitle.textContent = `Cổng Cộng Tác Viên (${user.subId}) — Giám sát lượt click & hoa hồng cá nhân theo thời gian thực.`;
      } else if (isShopSolo) {
        analyticsSubtitle.textContent = 'Không gian Chủ shop tự bán — Tự động hóa nội dung 4 kênh và theo dõi đơn hàng trực tiếp.';
      } else {
        analyticsSubtitle.textContent = 'Giám sát số liệu tiếp thị liên kết, lượt click UTM và hoa hồng CTV theo thời gian thực.';
      }
    }

    const studioSubInput = $('#studioSubId');
    if (studioSubInput) {
      if (isCtv) {
        studioSubInput.value = user.subId || user.username || 'ctv01_minh';
        studioSubInput.readOnly = true;
      } else {
        studioSubInput.readOnly = false;
        if (!studioSubInput.value) studioSubInput.value = user?.username || 'vuonggia';
      }
    }

    if (!hasCtvNetwork && state.currentView === 'users') {
      switchView('analytics');
    } else if (hasCtvNetwork && state.currentView === 'users') {
      loadUsersTable();
    }
  }

  async function logoutUser() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {
      // Ignore network errors on logout
    }
    sessionStorage.removeItem('autobiz_logged_in');
    state.authUser = null;
    const uInput = $('#authUsername');
    const pInput = $('#authPassword');
    if (uInput) uInput.value = '';
    if (pInput) pInput.value = '';
    showLandingPage();
    showToast('Đã đăng xuất tài khoản.');
  }

  async function loginWithPayload(payload) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đăng nhập thất bại.');
      }
      state.authUser = data.user;
      sessionStorage.setItem('autobiz_logged_in', '1');
      applyRolePermissions(data.user);
      hideLandingPage();
      const modal = $('#modalAuthRole');
      if (modal) modal.classList.remove('open');
      showToast(`Đã chuyển sang tài khoản: ${data.user.displayName}`);
      await loadAnalyticsSummary();
      await loadCatalogProducts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function registerNewUser(payload) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đăng ký tài khoản thất bại.');
      }
      state.authUser = data.user;
      const modalAuth = $('#modalAuthRole');
      if (modalAuth) modalAuth.classList.remove('open');

      showToast(data.message || 'Đăng ký thành công!');
      // Prompt 2-Stream Onboarding survey immediately
      const modalOnboard = $('#modalOnboarding');
      if (modalOnboard) modalOnboard.classList.add('open');
      applyRolePermissions(data.user);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function chooseOnboardingPersona(persona, hasAffiliates) {
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, hasAffiliates })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể thiết lập hồ sơ.');
      }
      state.authUser = data.user;
      const modalOnboard = $('#modalOnboarding');
      if (modalOnboard) modalOnboard.classList.remove('open');

      showToast(data.message || 'Đã thiết lập không gian làm việc thành công!');
      applyRolePermissions(data.user);
      await loadAnalyticsSummary();
      await loadCatalogProducts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ======================== PAYOUTS & VIETQR RECONCILIATION ========================
  let activeVietQrPayoutId = null;

  async function loadPayouts() {
    try {
      const res = await fetch('/api/payouts');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      const list = Array.isArray(data.requests) ? data.requests : [];
      const balance = data.balance;

      // Render CTV personal balance & history
      if (balance) {
        const balBadge = $('#ctvPayoutBalanceBadge');
        if (balBadge) balBadge.textContent = `Khả dụng: ${formatCurrency(balance.availableBalance)}`;
        if ($('#ctvEarnedComm')) $('#ctvEarnedComm').textContent = formatCurrency(balance.earnedCommission);
        if ($('#ctvPendingComm')) $('#ctvPendingComm').textContent = formatCurrency(balance.pendingAmount);
        if ($('#ctvPaidComm')) $('#ctvPaidComm').textContent = formatCurrency(balance.paidAmount);

        const ctvBody = $('#ctvPayoutHistoryBody');
        if (ctvBody) {
          if (list.length === 0) {
            ctvBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 16px;">Chưa có yêu cầu rút tiền nào.</td></tr>';
          } else {
            ctvBody.innerHTML = list.map((p) => {
              const statusLabel = p.status === 'paid' ? 'Đã thanh toán' : (p.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt');
              const statusClass = p.status === 'paid' ? 'tag-home' : (p.status === 'rejected' ? 'tag-fashion' : 'tag-accessories');
              return `<tr>
                <td style="font-size: 12px;">${formatDateTime(p.createdAt)}</td>
                <td><strong>${escapeHtml(p.bankCode)}</strong> • ${escapeHtml(p.accountNumber)}<div style="font-size:11px;color:var(--text-muted);">${escapeHtml(p.accountName)}</div></td>
                <td><strong>${formatCurrency(p.amount)}</strong></td>
                <td><span class="tag ${statusClass}">${statusLabel}</span></td>
              </tr>`;
            }).join('');
          }
        }
      }

      // Render Shop Owner / Admin approval table
      const shopBody = $('#shopPayoutTableBody');
      if (shopBody) {
        if (list.length === 0) {
          shopBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có yêu cầu rút hoa hồng nào từ CTV.</td></tr>';
        } else {
          shopBody.innerHTML = list.map((p) => {
            const statusLabel = p.status === 'paid' ? 'Đã thanh toán' : (p.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt');
            const statusClass = p.status === 'paid' ? 'tag-home' : (p.status === 'rejected' ? 'tag-fashion' : 'tag-accessories');
            const safeQr = encodeURIComponent(p.vietQrUrl || '');
            const safeInfo = encodeURIComponent(`${p.ctvDisplayName} (${p.bankCode} - ${p.accountNumber}) • ${formatCurrency(p.amount)}`);
            return `<tr>
              <td><strong>${escapeHtml(p.ctvDisplayName)}</strong><div style="font-size:11px;color:var(--text-muted);">${escapeHtml(p.subId)}</div></td>
              <td><strong>${escapeHtml(p.bankCode)}</strong> • ${escapeHtml(p.accountNumber)}<div style="font-size:11px;color:var(--text-muted);">${escapeHtml(p.accountName)}</div></td>
              <td><strong>${formatCurrency(p.amount)}</strong></td>
              <td><span class="tag ${statusClass}">${statusLabel}</span></td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${p.status === 'pending' ? `
                    <button type="button" class="btn btn-primary btn-sm" onclick="window.AutoBiz.openVietQrModal('${p.id}', '${safeQr}', '${safeInfo}')">Xem VietQR</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.AutoBiz.processPayoutStatus('${p.id}', 'paid')">Duyệt</button>
                    <button type="button" class="btn btn-secondary btn-sm" style="color:#B91C1C;" onclick="window.AutoBiz.processPayoutStatus('${p.id}', 'rejected')">Từ chối</button>
                  ` : `<span style="font-size:12px;color:var(--text-muted);">${p.processedAt ? formatDateTime(p.processedAt) : '--'}</span>`}
                </div>
              </td>
            </tr>`;
          }).join('');
        }
      }
    } catch (err) {
      console.error('[Payouts Error]', err);
    }
  }

  function openVietQrModal(payoutId, encodedQrUrl, encodedInfo) {
    activeVietQrPayoutId = payoutId;
    const modal = $('#modalVietQr');
    const img = $('#vietQrImage');
    const info = $('#vietQrInfoText');
    if (img) img.src = decodeURIComponent(encodedQrUrl || '');
    if (info) info.textContent = decodeURIComponent(encodedInfo || '');
    if (modal) modal.classList.add('open');
  }

  async function processPayoutStatus(payoutId, status) {
    try {
      const res = await fetch(`/api/payouts/${encodeURIComponent(payoutId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể cập nhật trạng thái.');
      showToast(data.message || 'Đã cập nhật yêu cầu rút tiền!');
      const modal = $('#modalVietQr');
      if (modal) modal.classList.remove('open');
      loadPayouts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function extractUrlData(urlStr) {
    const clean = String(urlStr || '').trim();
    if (!clean) throw new Error('Vui lòng dán đường dẫn URL sản phẩm trước.');
    const res = await fetch('/api/catalog/extract-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: clean })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Không thể bóc tách thông tin từ link.');
    return data.extracted;
  }

  // ======================== LANDING PAGE & ONBOARDING QUESTIONNAIRE ========================
  let pendingSurveyUser = null;
  let activeInviteShopCode = null;

  function showLandingPage() {
    const landing = $('#landingPage');
    if (landing) landing.style.display = 'flex';
  }

  function hideLandingPage() {
    const landing = $('#landingPage');
    if (landing) landing.style.display = 'none';
  }

  function openRegisterSurvey() {
    pendingSurveyUser = null;
    const modal = $('#modalRegisterSurvey');
    const step1 = $('#surveyStep1');
    const step2 = $('#surveyStep2');
    const step3 = $('#surveyStep3Shop');
    const title = $('#surveyModalTitle');

    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
    if (step3) step3.style.display = 'none';
    if (title) title.textContent = 'Đăng Ký Tài Khoản Mới';
    if (modal) modal.classList.add('open');
  }

  function closeRegisterSurvey() {
    const modal = $('#modalRegisterSurvey');
    if (modal) modal.classList.remove('open');
  }

  async function registerAndCompleteSurvey(regData, surveyData) {
    try {
      showToast('Đang khởi tạo tài khoản & không gian làm việc...');
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const regJson = await regRes.json();
      if (!regRes.ok || !regJson.success) {
        throw new Error(regJson.error || 'Đăng ký tài khoản thất bại.');
      }

      state.authUser = regJson.user;

      const onbRes = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + regJson.token
        },
        body: JSON.stringify(surveyData)
      });
      const onbJson = await onbRes.json();
      if (onbRes.ok && onbJson.success && onbJson.user) {
        state.authUser = onbJson.user;
      }

      sessionStorage.setItem('autobiz_logged_in', '1');
      closeRegisterSurvey();
      hideLandingPage();
      applyRolePermissions(state.authUser);
      showToast(onbJson.message || `Chào mừng ${state.authUser.displayName} đến với AutoBiz AI!`);
      await loadAnalyticsSummary();
      await loadCatalogProducts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function loadWebhookLogs() {
    const listEl = $('#webhookLogsList');
    if (!listEl) return;
    try {
      const res = await fetch('/api/webhooks/logs');
      if (!res.ok) return;
      const data = await res.json();
      const logs = data.logs || [];
      if (logs.length === 0) {
        listEl.innerHTML = 'Chưa có đơn hàng tự động nào được ghi nhận qua Webhook.';
        return;
      }
      listEl.innerHTML = logs.slice(0, 8).map((log) => {
        const badgeClass = log.result === 'confirmed' ? 'tag-posted' : 'tag-queued';
        const timeStr = log.receivedAt ? new Date(log.receivedAt).toLocaleTimeString('vi-VN') : '';
        return `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px dashed var(--border-color); gap:8px;">
          <div>
            <strong>${escapeHtml(log.orderId)}</strong> · <code>${escapeHtml(log.shortCode || log.subId || 'N/A')}</code>
            <span style="color:var(--text-muted);">(${escapeHtml(log.source || 'pos')})</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="tag ${badgeClass}">${escapeHtml(log.result)}</span>
            <span>${timeStr}</span>
          </div>
        </div>`;
      }).join('');
    } catch (err) {
      console.error('[Webhook Logs Error]', err);
    }
  }

  async function handleTestWebhookOrder() {
    const btn = $('#btnTestWebhookOrder');
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>Đang gửi Webhook...</span>';
    try {
      const secretInput = $('#settingWebhookSecret');
      const secret = secretInput ? secretInput.value.trim() : 'autobiz_wh_secret_2026';
      const orderId = `WH-${Date.now().toString().slice(-6)}`;
      const res = await fetch('/api/webhooks/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': secret
        },
        body: JSON.stringify({
          orderId,
          shortCode: 'FA101A',
          subId: 'ctv01_minh',
          orderAmount: 14500000,
          quantity: 1,
          status: 'completed',
          source: 'pancake_pos_demo'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Webhook test thất bại (Hãy tạo ít nhất 1 link tiếp thị trước).');
      }
      showToast(data.message || `Webhook tự động chốt đơn ${orderId} thành công!`);
      await loadWebhookLogs();
      await loadAnalyticsSummary();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  }

  // ======================== 3-TIER ACCOUNT & ROLE MANAGEMENT (SUPERADMIN / SHOP / CTV) ========================
  async function loadUsersTable() {
    const tbody = $('#usersTableBody');
    const scopeNote = $('#usersScopeNote');
    if (!tbody) return;
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok || !data.success) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(data.error || 'Không có quyền xem danh sách.')}</td></tr>`;
        return;
      }
      const isSuperAdmin = data.actorRole === 'superadmin';
      if (scopeNote) {
        scopeNote.textContent = isSuperAdmin
          ? 'Chế độ Admin Tổng: Quản lý tất cả Chủ shop & CTV'
          : 'Chế độ Chủ shop: Quản lý danh sách CTV của cửa hàng';
      }
      const users = data.users || [];
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Chưa có tài khoản nào.</td></tr>';
        return;
      }

      tbody.innerHTML = users.map((u) => {
        const isActive = u.active !== false;
        const roleSelect = isSuperAdmin
          ? `<select class="form-select" style="padding:4px 8px; font-size:12px;" onchange="window.AutoBiz.changeUserRole('${escapeHtml(u.username)}', this.value)">
              <option value="ctv" ${u.role === 'ctv' ? 'selected' : ''}>Cộng tác viên (CTV)</option>
              <option value="shop_owner" ${u.role === 'shop_owner' ? 'selected' : ''}>Chủ shop</option>
              <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>Admin Tổng</option>
            </select>`
          : `<span class="tag tag-tech">CTV</span>`;

        const statusBadge = isActive
          ? '<span class="tag tag-posted">Hoạt động</span>'
          : '<span class="tag tag-failed">Đã khóa</span>';

        return `<tr>
          <td><strong>${escapeHtml(u.username)}</strong></td>
          <td>${escapeHtml(u.displayName || u.username)}</td>
          <td>${roleSelect}</td>
          <td><code>${escapeHtml(u.subId || '—')}</code></td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AutoBiz.toggleUserActive('${escapeHtml(u.username)}', ${!isActive})">
                ${isActive ? 'Khóa' : 'Mở'}
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.AutoBiz.deleteUserAccount('${escapeHtml(u.username)}')">
                Xóa
              </button>
            </div>
          </td>
        </tr>`;
      }).join('');
    } catch (err) {
      console.error('[Load Users Error]', err);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    const form = $('#formCreateUser');
    if (!form) return;
    const payload = {
      username: form.username.value.trim(),
      displayName: form.displayName.value.trim(),
      password: form.password.value.trim(),
      role: form.role.value,
      subId: form.subId.value.trim()
    };
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể tạo tài khoản.');
      showToast(data.message || 'Đã tạo & cấp quyền thành công!');
      form.reset();
      if (form.password) form.password.value = '123456';
      await loadUsersTable();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function changeUserRole(username, newRole) {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể đổi vai trò.');
      showToast(data.message || `Đã đổi vai trò ${username} thành ${newRole}.`);
      await loadUsersTable();
    } catch (err) {
      showToast(err.message, true);
      await loadUsersTable();
    }
  }

  async function toggleUserActive(username, nextActive) {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể cập nhật trạng thái.');
      showToast(nextActive ? `Đã mở khóa ${username}.` : `Đã tạm khóa ${username}.`);
      await loadUsersTable();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function deleteUserAccount(username) {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể xóa tài khoản.');
      showToast(data.message || `Đã xóa tài khoản ${username}.`);
      await loadUsersTable();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ======================== GLOBAL ATTACHMENTS & INITIALIZATION ========================
  window.AutoBiz = {
    switchView,
    openShortlink,
    copyLink,
    recordOrder,
    loadProductToStudio,
    deleteProduct,
    publishPostNow,
    deletePost,
    changeUserRole,
    toggleUserActive,
    deleteUserAccount,
    chooseOnboardingPersona,
    showLandingPage,
    hideLandingPage,
    openVietQrModal,
    processPayoutStatus,
    openRegisterSurvey
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Nav Items click bindings
    $$('.nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (view) switchView(view);
      });
    });

    // Mobile Hamburger & Overlay
    const btnMobileMenu = $('#btnMobileMenu');
    const sidebarOverlay = $('#sidebarOverlay');
    if (btnMobileMenu) btnMobileMenu.addEventListener('click', toggleMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Refresh Analytics Button
    const btnRefreshAnalytics = $('#btnRefreshAnalytics');
    if (btnRefreshAnalytics) {
      btnRefreshAnalytics.addEventListener('click', () => {
        showToast('Đang làm mới số liệu FinTech...');
        loadAnalyticsSummary();
      });
    }

    // Catalog Filter Pills
    $$('.filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        $$('.filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        state.catalogFilter = pill.getAttribute('data-category') || 'all';
        loadCatalogProducts();
      });
    });

    // Catalog Search Input
    const catalogSearchInput = $('#catalogSearch');
    if (catalogSearchInput) {
      let debounceTimer = null;
      catalogSearchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.catalogSearch = catalogSearchInput.value;
          loadCatalogProducts();
        }, 300);
      });
    }

    // Modal Add Product
    const btnOpenAddModal = $('#btnOpenAddProductModal');
    const btnCloseAddModal = $('#btnCloseAddProductModal');
    const btnCancelAddModal = $('#btnCancelAddProductModal');
    const formAddProduct = $('#formAddProduct');

    if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', openAddProductModal);
    if (btnCloseAddModal) btnCloseAddModal.addEventListener('click', closeAddProductModal);
    if (btnCancelAddModal) btnCancelAddModal.addEventListener('click', closeAddProductModal);
    if (formAddProduct) formAddProduct.addEventListener('submit', handleSaveNewProduct);

    // Settings Form
    const formSettings = $('#formSettings');
    if (formSettings) formSettings.addEventListener('submit', handleSaveSettings);
    $$('.setting-channel-toggle').forEach((cb) => {
      cb.addEventListener('change', () => applyEnabledChannels(readChannelTogglesFromUI()));
    });
    const studioImageUrlsInput = $('#studioImageUrls');
    if (studioImageUrlsInput) {
      studioImageUrlsInput.addEventListener('input', renderStudioImagePreview);
    }

    // Refresh Queue
    const btnRefreshQueue = $('#btnRefreshQueue');
    if (btnRefreshQueue) btnRefreshQueue.addEventListener('click', loadQueuePosts);

    // Listen for live sync events from AutoBiz AI Collector Chrome Extension (v2.0)
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.action === 'AUTOBIZ_EXTENSION_SYNC') {
        loadCatalogProducts();
        loadAnalyticsSummary();
        showToast('Đã đồng bộ sản phẩm & link mới từ AutoBiz Collector Extension!');
      }
    });

    // Auth & Role Switcher Modal bindings
    const modalAuthRole = $('#modalAuthRole');
    const btnOpenAuthModal = $('#btnOpenAuthModal');
    const btnCloseAuthModal = $('#btnCloseAuthModal');
    const btnCancelAuthModal = $('#btnCancelAuthModal');
    const btnQuickSuperAdmin = $('#btnQuickSuperAdmin');
    const btnQuickAdmin = $('#btnQuickAdmin');
    const btnQuickCtvMinh = $('#btnQuickCtvMinh');
    const formAuthLogin = $('#formAuthLogin');

    if (btnOpenAuthModal && modalAuthRole) {
      btnOpenAuthModal.addEventListener('click', () => modalAuthRole.classList.add('open'));
    }
    if (btnCloseAuthModal && modalAuthRole) {
      btnCloseAuthModal.addEventListener('click', () => modalAuthRole.classList.remove('open'));
    }
    if (btnCancelAuthModal && modalAuthRole) {
      btnCancelAuthModal.addEventListener('click', () => modalAuthRole.classList.remove('open'));
    }
    if (btnQuickSuperAdmin) {
      btnQuickSuperAdmin.addEventListener('click', () => loginWithPayload({ quickRole: 'superadmin' }));
    }
    if (btnQuickAdmin) {
      btnQuickAdmin.addEventListener('click', () => loginWithPayload({ quickRole: 'shop_owner' }));
    }

    // 3-Tier User Management UI bindings
    const formCreateUser = $('#formCreateUser');
    if (formCreateUser) formCreateUser.addEventListener('submit', handleCreateUser);
    const btnRefreshUsers = $('#btnRefreshUsers');
    if (btnRefreshUsers) btnRefreshUsers.addEventListener('click', loadUsersTable);
    if (btnQuickCtvMinh) {
      btnQuickCtvMinh.addEventListener('click', () => loginWithPayload({ quickRole: 'ctv', subId: 'ctv01_minh' }));
    }
    if (formAuthLogin) {
      formAuthLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        loginWithPayload({
          username: $('#authUsername')?.value || '',
          password: $('#authPassword')?.value || ''
        });
      });
    }

    // Auth Tabs & Register Form bindings
    const tabAuthLoginBtn = $('#tabAuthLoginBtn');
    const tabAuthRegisterBtn = $('#tabAuthRegisterBtn');
    const panelAuthLogin = $('#panelAuthLogin');
    const panelAuthRegister = $('#panelAuthRegister');

    if (tabAuthLoginBtn && tabAuthRegisterBtn && panelAuthLogin && panelAuthRegister) {
      tabAuthLoginBtn.addEventListener('click', () => {
        tabAuthLoginBtn.className = 'btn btn-sm btn-primary';
        tabAuthRegisterBtn.className = 'btn btn-sm btn-secondary';
        panelAuthLogin.style.display = 'block';
        panelAuthRegister.style.display = 'none';
      });
      tabAuthRegisterBtn.addEventListener('click', () => {
        tabAuthRegisterBtn.className = 'btn btn-sm btn-primary';
        tabAuthLoginBtn.className = 'btn btn-sm btn-secondary';
        panelAuthRegister.style.display = 'block';
        panelAuthLogin.style.display = 'none';
      });
    }

    const formAuthRegister = $('#formAuthRegister');
    if (formAuthRegister) {
      formAuthRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        registerNewUser({
          email: $('#regEmail')?.value || '',
          displayName: $('#regDisplayName')?.value || '',
          password: $('#regPassword')?.value || ''
        });
      });
    }
    const btnCancelRegister = $('#btnCancelRegister');
    if (btnCancelRegister && modalAuthRole) {
      btnCancelRegister.addEventListener('click', () => modalAuthRole.classList.remove('open'));
    }

    // Logout & Profile Modal bindings
    const btnLogout = $('#btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', logoutUser);
    }

    const modalProfile = $('#modalProfile');
    const btnOpenProfileModal = $('#btnOpenProfileModal');
    const btnCloseProfileModal = $('#btnCloseProfileModal');
    const btnCancelProfileModal = $('#btnCancelProfileModal');
    const formUpdateProfile = $('#formUpdateProfile');
    const formChangePassword = $('#formChangePassword');

    const openProfileModal = () => {
      if (!modalProfile) return;
      const u = state.authUser || {};
      if ($('#profileDisplayName')) $('#profileDisplayName').value = u.displayName || u.username || '';
      if ($('#profileHotline')) $('#profileHotline').value = u.hotline || '';
      if ($('#profileDefaultShopUrl')) $('#profileDefaultShopUrl').value = u.defaultShopUrl || '';
      if ($('#profileCurrentPassword')) $('#profileCurrentPassword').value = '';
      if ($('#profileNewPassword')) $('#profileNewPassword').value = '';
      if ($('#profileConfirmPassword')) $('#profileConfirmPassword').value = '';
      modalProfile.classList.add('open');
    };

    if (btnOpenProfileModal) btnOpenProfileModal.addEventListener('click', openProfileModal);
    if (btnCloseProfileModal && modalProfile) btnCloseProfileModal.addEventListener('click', () => modalProfile.classList.remove('open'));
    if (btnCancelProfileModal && modalProfile) btnCancelProfileModal.addEventListener('click', () => modalProfile.classList.remove('open'));

    if (formUpdateProfile) {
      formUpdateProfile.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              displayName: $('#profileDisplayName')?.value?.trim() || '',
              hotline: $('#profileHotline')?.value?.trim() || '',
              defaultShopUrl: $('#profileDefaultShopUrl')?.value?.trim() || ''
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Không thể cập nhật hồ sơ.');
          state.authUser = data.user;
          applyRolePermissions(data.user);
          showToast(data.message || 'Đã cập nhật hồ sơ!');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    }

    if (formChangePassword) {
      formChangePassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = $('#profileCurrentPassword')?.value || '';
        const newPassword = $('#profileNewPassword')?.value || '';
        const confirmPassword = $('#profileConfirmPassword')?.value || '';
        if (newPassword !== confirmPassword) {
          showToast('Mật khẩu nhập lại không khớp.', true);
          return;
        }
        try {
          const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Đổi mật khẩu thất bại.');
          if ($('#profileCurrentPassword')) $('#profileCurrentPassword').value = '';
          if ($('#profileNewPassword')) $('#profileNewPassword').value = '';
          if ($('#profileConfirmPassword')) $('#profileConfirmPassword').value = '';
          showToast(data.message || 'Đổi mật khẩu thành công!');
          if (modalProfile) modalProfile.classList.remove('open');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    }

    // Bio Link Copy, Shop Invite Link Copy, URL Extractor & VietQR Payout bindings
    const btnCopyBioLink = $('#btnCopyBioLink');
    if (btnCopyBioLink) {
      btnCopyBioLink.addEventListener('click', () => {
        const u = state.authUser?.username || 'admin';
        const url = `${window.location.origin}/u/${encodeURIComponent(u)}`;
        navigator.clipboard?.writeText(url);
        showToast(`Đã sao chép Link Bio: ${url}`);
      });
    }

    const btnCopyShopInviteLink = $('#btnCopyShopInviteLink');
    if (btnCopyShopInviteLink) {
      btnCopyShopInviteLink.addEventListener('click', () => {
        const val = $('#shopInviteLinkInput')?.value || `${window.location.origin}/join/${state.authUser?.username || 'admin'}`;
        navigator.clipboard?.writeText(val);
        showToast('Đã sao chép Link Mời CTV!');
      });
    }

    const btnExtractUrlToModal = $('#btnExtractUrlToModal');
    if (btnExtractUrlToModal) {
      btnExtractUrlToModal.addEventListener('click', async () => {
        const urlVal = $('#extractProductUrlInput')?.value?.trim() || '';
        const orig = btnExtractUrlToModal.textContent;
        btnExtractUrlToModal.disabled = true;
        btnExtractUrlToModal.textContent = 'Đang lấy...';
        try {
          const ex = await extractUrlData(urlVal);
          const form = $('#formAddProduct');
          if (form) {
            if (form.sku) form.sku.value = ex.sku || '';
            if (form.category) form.category.value = ex.category || 'accessories';
            if (form.name) form.name.value = ex.name || '';
            if (form.price_retail) form.price_retail.value = ex.price_retail || '';
            if (form.affiliate_base_url) form.affiliate_base_url.value = ex.affiliate_base_url || urlVal;
            if (form.specs) form.specs.value = Array.isArray(ex.specs) ? ex.specs.join('\n') : '';
            if (form.images) form.images.value = Array.isArray(ex.images) ? ex.images.join('\n') : '';
          }
          showToast(`Đã tự điền thông tin: ${ex.name}`);
        } catch (err) {
          showToast(err.message, true);
        } finally {
          btnExtractUrlToModal.disabled = false;
          btnExtractUrlToModal.textContent = orig;
        }
      });
    }

    const btnStudioExtractUrl = $('#btnStudioExtractUrl');
    if (btnStudioExtractUrl) {
      btnStudioExtractUrl.addEventListener('click', async () => {
        const urlVal = $('#studioBaseUrl')?.value?.trim() || '';
        const orig = btnStudioExtractUrl.textContent;
        btnStudioExtractUrl.disabled = true;
        btnStudioExtractUrl.textContent = 'Đang lấy...';
        try {
          const ex = await extractUrlData(urlVal);
          if ($('#studioSku')) $('#studioSku').value = ex.sku || '';
          if ($('#studioPrice')) $('#studioPrice').value = ex.price_retail || '';
          if ($('#studioCategory')) $('#studioCategory').value = ex.category || 'auto';
          if ($('#studioRawText')) {
            $('#studioRawText').value = `${ex.name}\n${(ex.specs || []).map((s) => '- ' + s).join('\n')}`.trim();
          }
          if ($('#studioImageUrls') && Array.isArray(ex.images) && ex.images.length) {
            $('#studioImageUrls').value = ex.images.join('\n');
            renderStudioImagePreview();
          }
          showToast(`Đã bóc tách từ link: ${ex.name}`);
        } catch (err) {
          showToast(err.message, true);
        } finally {
          btnStudioExtractUrl.disabled = false;
          btnStudioExtractUrl.textContent = orig;
        }
      });
    }

    const formCreatePayout = $('#formCreatePayout');
    if (formCreatePayout) {
      formCreatePayout.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/payouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bankCode: $('#payoutBankCode')?.value || 'MB',
              accountNumber: $('#payoutAccountNumber')?.value?.trim() || '',
              accountName: $('#payoutAccountName')?.value?.trim() || '',
              amount: Number($('#payoutAmount')?.value) || 0
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Gửi yêu cầu rút tiền thất bại.');
          showToast(data.message || 'Đã gửi yêu cầu rút hoa hồng!');
          if ($('#payoutAmount')) $('#payoutAmount').value = '';
          loadPayouts();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    }

    const btnRefreshPayouts = $('#btnRefreshPayouts');
    if (btnRefreshPayouts) btnRefreshPayouts.addEventListener('click', loadPayouts);
    const btnCloseVietQrModal = $('#btnCloseVietQrModal');
    const btnCancelVietQr = $('#btnCancelVietQr');
    const btnConfirmVietQrPaid = $('#btnConfirmVietQrPaid');
    const modalVietQr = $('#modalVietQr');
    if (btnCloseVietQrModal && modalVietQr) btnCloseVietQrModal.addEventListener('click', () => modalVietQr.classList.remove('open'));
    if (btnCancelVietQr && modalVietQr) btnCancelVietQr.addEventListener('click', () => modalVietQr.classList.remove('open'));
    if (btnConfirmVietQrPaid) {
      btnConfirmVietQrPaid.addEventListener('click', () => {
        if (activeVietQrPayoutId) processPayoutStatus(activeVietQrPayoutId, 'paid');
      });
    }

    // Settings Hub Sub-Tab Switching & Channel Connection Tests
    $$('.settings-tab-btn').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const targetTab = tabBtn.getAttribute('data-settings-tab');
        $$('.settings-tab-btn').forEach((b) => b.classList.remove('active'));
        tabBtn.classList.add('active');
        $$('.settings-tab-panel').forEach((panel) => {
          panel.style.display = panel.getAttribute('data-settings-panel') === targetTab ? 'block' : 'none';
        });
      });
    });

    const btnTestFb = $('#btnTestFb');
    if (btnTestFb) {
      btnTestFb.addEventListener('click', async () => {
        const orig = btnTestFb.textContent;
        btnTestFb.disabled = true;
        btnTestFb.textContent = 'Đang kiểm tra...';
        try {
          const res = await fetch('/api/test-fb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fanpageId: $('#settingFanpageId')?.value?.trim() || '',
              facebookPageToken: $('#settingFacebookPageToken')?.value?.trim() || ''
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Kết nối Facebook thất bại.');
          showToast(data.message || 'Kết nối Facebook Fanpage thành công!');
        } catch (err) {
          showToast(err.message, true);
        } finally {
          btnTestFb.disabled = false;
          btnTestFb.textContent = orig;
        }
      });
    }

    const btnTestInstagram = $('#btnTestInstagram');
    if (btnTestInstagram) {
      btnTestInstagram.addEventListener('click', async () => {
        const orig = btnTestInstagram.textContent;
        btnTestInstagram.disabled = true;
        btnTestInstagram.textContent = 'Đang kiểm tra...';
        try {
          const res = await fetch('/api/test-instagram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instagramAccountId: $('#settingInstagramAccountId')?.value?.trim() || '',
              instagramAccessToken: $('#settingInstagramAccessToken')?.value?.trim() || ''
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Kết nối Instagram thất bại.');
          showToast(data.message || 'Kết nối Instagram Business thành công!');
        } catch (err) {
          showToast(err.message, true);
        } finally {
          btnTestInstagram.disabled = false;
          btnTestInstagram.textContent = orig;
        }
      });
    }

    // Webhook UI bindings
    const btnTestWebhookOrder = $('#btnTestWebhookOrder');
    if (btnTestWebhookOrder) btnTestWebhookOrder.addEventListener('click', handleTestWebhookOrder);
    const btnCopyWebhookUrl = $('#btnCopyWebhookUrl');
    if (btnCopyWebhookUrl) {
      btnCopyWebhookUrl.addEventListener('click', () => {
        const val = $('#settingWebhookUrl')?.value || `${window.location.origin}/api/webhooks/order`;
        navigator.clipboard?.writeText(val);
        showToast('Đã sao chép Webhook URL!');
      });
    }

    // Landing Page Entry & Bypass bindings
    const btnLandingLogin = $('#btnLandingLogin');
    const btnLandingHeroLogin = $('#btnLandingHeroLogin');
    const btnLandingRegister = $('#btnLandingRegister');
    const btnLandingHeroRegister = $('#btnLandingHeroRegister');
    const btnBypassToWorkspace = $('#btnBypassToWorkspace');
    const btnBackToLanding = $('#btnBackToLanding');

    const openLoginFromLanding = () => {
      const modal = $('#modalAuthRole');
      if (modal) {
        modal.classList.add('open');
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) modalTitle.textContent = 'Đăng Nhập';
      }
    };

    const linkSwitchToRegister = $('#linkSwitchToRegister');
    if (linkSwitchToRegister) {
      linkSwitchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = $('#modalAuthRole');
        if (modal) modal.classList.remove('open');
        openRegisterSurvey();
      });
    }

    const linkSwitchToLogin = $('#linkSwitchToLogin');
    if (linkSwitchToLogin) {
      linkSwitchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeRegisterSurvey();
        openLoginFromLanding();
      });
    }

    if (btnLandingLogin) btnLandingLogin.addEventListener('click', openLoginFromLanding);
    if (btnLandingHeroLogin) btnLandingHeroLogin.addEventListener('click', openLoginFromLanding);
    if (btnLandingRegister) btnLandingRegister.addEventListener('click', openRegisterSurvey);
    if (btnLandingHeroRegister) btnLandingHeroRegister.addEventListener('click', openRegisterSurvey);
    if (btnBypassToWorkspace) {
      btnBypassToWorkspace.addEventListener('click', () => {
        hideLandingPage();
        showToast('Đang ở chế độ xem nhanh Workspace dành cho Ban Giám khảo.');
      });
    }
    if (btnBackToLanding) {
      btnBackToLanding.addEventListener('click', () => {
        sessionStorage.removeItem('autobiz_logged_in');
        showLandingPage();
      });
    }

    // Dismiss modal when clicking on backdrop
    $$('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });

    // Step-by-Step Questionnaire Form bindings
    const formSurveyStep1 = $('#formSurveyStep1');
    const btnCloseRegisterSurvey = $('#btnCloseRegisterSurvey');
    const btnCancelSurvey = $('#btnCancelSurvey');
    const optRoleShop = $('#optRoleShop');
    const optRoleAffiliate = $('#optRoleAffiliate');
    const optCtvYes = $('#optCtvYes');
    const optCtvNo = $('#optCtvNo');
    const btnBackToStep1 = $('#btnBackToStep1');
    const btnBackToStep2 = $('#btnBackToStep2');

    if (btnCloseRegisterSurvey) btnCloseRegisterSurvey.addEventListener('click', closeRegisterSurvey);
    if (btnCancelSurvey) btnCancelSurvey.addEventListener('click', closeRegisterSurvey);

    if (formSurveyStep1) {
      formSurveyStep1.addEventListener('submit', async (e) => {
        e.preventDefault();
        pendingSurveyUser = {
          email: $('#surveyEmail')?.value?.trim() || '',
          displayName: $('#surveyDisplayName')?.value?.trim() || '',
          password: $('#surveyPassword')?.value || ''
        };

        // If user arrived via /join/:shopCode, register directly as CTV of that Shop
        if (activeInviteShopCode) {
          try {
            showToast(`Đang đăng ký làm CTV cho Shop @${activeInviteShopCode}...`);
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...pendingSurveyUser, inviteShopOwner: activeInviteShopCode })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Đăng ký CTV thất bại.');
            state.authUser = data.user;
            sessionStorage.setItem('autobiz_logged_in', '1');
            activeInviteShopCode = null;
            closeRegisterSurvey();
            hideLandingPage();
            applyRolePermissions(state.authUser);
            showToast(`Chào mừng CTV ${state.authUser.displayName} gia nhập hệ thống!`);
            await loadAnalyticsSummary();
            await loadCatalogProducts();
          } catch (err) {
            showToast(err.message, true);
          }
          return;
        }

        const step1 = $('#surveyStep1');
        const step2 = $('#surveyStep2');
        const title = $('#surveyModalTitle');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
        if (title) title.textContent = 'Định Hướng Tài Khoản';
      });
    }

    if (btnBackToStep1) {
      btnBackToStep1.addEventListener('click', () => {
        const step1 = $('#surveyStep1');
        const step2 = $('#surveyStep2');
        const title = $('#surveyModalTitle');
        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
        if (title) title.textContent = 'Đăng Ký Tài Khoản Mới';
      });
    }

    if (optRoleShop) {
      optRoleShop.addEventListener('click', () => {
        if (!pendingSurveyUser) return;
        pendingSurveyUser.role = 'shop_owner';
        const step2 = $('#surveyStep2');
        const step3 = $('#surveyStep3Shop');
        const title = $('#surveyModalTitle');
        if (step2) step2.style.display = 'none';
        if (step3) step3.style.display = 'block';
        if (title) title.textContent = 'Xác Nhận Mô Hình';
      });
    }

    if (btnBackToStep2) {
      btnBackToStep2.addEventListener('click', () => {
        const step2 = $('#surveyStep2');
        const step3 = $('#surveyStep3Shop');
        const title = $('#surveyModalTitle');
        if (step2) step2.style.display = 'block';
        if (step3) step3.style.display = 'none';
        if (title) title.textContent = 'Định Hướng Tài Khoản';
      });
    }

    if (optRoleAffiliate) {
      optRoleAffiliate.addEventListener('click', () => {
        if (!pendingSurveyUser) return;
        registerAndCompleteSurvey(pendingSurveyUser, {
          persona: 'independent_affiliate',
          hasAffiliates: false
        });
      });
    }

    if (optCtvYes) {
      optCtvYes.addEventListener('click', () => {
        if (!pendingSurveyUser) return;
        registerAndCompleteSurvey(pendingSurveyUser, {
          persona: 'shop_with_affiliates',
          hasAffiliates: true
        });
      });
    }

    if (optCtvNo) {
      optCtvNo.addEventListener('click', () => {
        if (!pendingSurveyUser) return;
        registerAndCompleteSurvey(pendingSurveyUser, {
          persona: 'shop_solo',
          hasAffiliates: false
        });
      });
    }

    // Default Landing Display, CTV Invite (/join/:shopCode) & Hidden Admin Portal (/admin)
    const joinMatch = window.location.pathname.match(/^\/join\/([a-zA-Z0-9_.-]+)/);
    const isAdminPath = ['/admin', '/admin/'].includes(window.location.pathname) || window.location.search.includes('role=admin');
    const isExplicitAppPath = ['/app', '/dashboard', '/cockpit'].includes(window.location.pathname) || window.location.search.includes('mode=demo');
    const hasActiveLoginSession = sessionStorage.getItem('autobiz_logged_in') === '1';

    if (joinMatch && joinMatch[1]) {
      activeInviteShopCode = joinMatch[1];
      showLandingPage();
      openRegisterSurvey();
      const banner = $('#inviteShopBanner');
      const nameSpan = $('#inviteShopNameText');
      if (banner) banner.style.display = 'block';
      if (nameSpan) nameSpan.textContent = `@${activeInviteShopCode}`;
      const title = $('#surveyModalTitle');
      if (title) title.textContent = `Đăng Ký CTV Cho Shop @${activeInviteShopCode}`;
    } else if (isAdminPath) {
      hideLandingPage();
      const modal = $('#modalAuthRole');
      if (modal) {
        modal.classList.add('open');
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) modalTitle.textContent = 'Cổng Đăng Nhập Quản Trị Viên (Admin Portal)';
        const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        const uInput = $('#authUsername');
        const pInput = $('#authPassword');
        if (uInput) {
          uInput.value = 'superadmin';
        }
        if (pInput) {
          // Bảo mật Production: Không điền sẵn mật khẩu Admin trên môi trường công khai
          pInput.value = isLocalDev ? 'superadmin2026' : '';
          pInput.focus();
        }
        showToast('Truy cập Cổng Quản Trị Viên qua /admin. Vui lòng nhập mật khẩu Admin.');
      }
    } else if (isExplicitAppPath || hasActiveLoginSession) {
      hideLandingPage();
    } else {
      showLandingPage();
    }

    // Init Studio, Auth & Default view
    initStudio();
    loadAuthState();
    switchView('analytics');
  });

})();
