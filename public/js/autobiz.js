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
              if (typeof showToast === 'function') showToast(data.message || 'Đã nạp dữ liệu mẫu BGK!', 'success');
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

      showToast('Đã phân tích AI và khởi tạo bài viết 4 kênh!');
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
              <button class="btn btn-secondary btn-sm" onclick="window.AutoBiz.deleteProduct('${p.id}')" title="Xóa">
                ✕
              </button>
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
    const map = Object.assign({ facebook: true, tiktok: true, zalo: true, shopee: true }, savedLocal || {}, rawMap || {});
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

      form.geminiApiKey.value = data.geminiApiKey || '';
      form.fanpageName.value = data.fanpageName || '';
      form.hotline.value = data.hotline || '';
      form.email.value = data.email || '';
      form.fanpageId.value = data.fanpageId || '';
      form.facebookPageToken.value = data.facebookPageToken || '';
      form.tiktokToken.value = data.tiktokToken || '';
      form.zaloToken.value = data.zaloToken || '';
      form.shopeePartnerId.value = data.shopeePartnerId || '';
      if (form.webhookSecret) form.webhookSecret.value = data.webhookSecret || 'autobiz_wh_secret_2026';
      const webhookUrlInput = $('#settingWebhookUrl');
      if (webhookUrlInput) webhookUrlInput.value = `${window.location.origin}/api/webhooks/order`;
      if (data.enabledChannels) {
        applyEnabledChannels(data.enabledChannels);
      }
      loadWebhookLogs();
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
      geminiApiKey: form.geminiApiKey.value.trim(),
      fanpageName: form.fanpageName.value.trim(),
      hotline: form.hotline.value.trim(),
      email: form.email.value.trim(),
      fanpageId: form.fanpageId.value.trim(),
      facebookPageToken: form.facebookPageToken.value.trim(),
      tiktokToken: form.tiktokToken.value.trim(),
      zaloToken: form.zaloToken.value.trim(),
      shopeePartnerId: form.shopeePartnerId.value.trim(),
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
    const badge = $('#currentRoleBadge');
    if (badge) {
      if (isCtv) {
        badge.textContent = `CTV: ${user.subId}`;
        badge.className = 'tag tag-tech';
      } else if (isSuperAdmin) {
        badge.textContent = 'Admin Tổng';
        badge.className = 'tag tag-fashion';
      } else {
        badge.textContent = 'Chủ shop';
        badge.className = 'tag tag-accessories';
      }
    }

    // Hide Admin-only buttons, tabs and actions when logged in as CTV
    $$('.admin-only').forEach((el) => {
      el.style.display = isCtv ? 'none' : '';
    });

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

    const analyticsSubtitle = $('#view-analytics .page-subtitle');
    if (analyticsSubtitle) {
      analyticsSubtitle.textContent = isCtv
        ? `Cổng Cộng Tác Viên (${user.subId}) — Giám sát lượt click & hoa hồng cá nhân theo thời gian thực.`
        : 'Giám sát số liệu tiếp thị liên kết, lượt click UTM và hoa hồng ước tính theo thời gian thực.';
    }

    const studioSubInput = $('#studioSubId');
    if (studioSubInput) {
      if (isCtv) {
        studioSubInput.value = user.subId || 'ctv01_minh';
        studioSubInput.readOnly = true;
      } else {
        studioSubInput.readOnly = false;
      }
    }

    if (isCtv && (state.currentView === 'settings' || state.currentView === 'users')) {
      switchView('analytics');
    } else if (!isCtv && state.currentView === 'users') {
      loadUsersTable();
    }
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
      applyRolePermissions(data.user);
      const modal = $('#modalAuthRole');
      if (modal) modal.classList.remove('open');
      showToast(`Đã chuyển sang tài khoản: ${data.user.displayName}`);
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
        throw new Error(data.error || 'Webhook test thất bại (Hãy đảm bảo đã nạp dữ liệu mẫu BGK trước).');
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
    deleteUserAccount
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

    // Init Studio, Auth & Default view
    initStudio();
    loadAuthState();
    switchView('analytics');
  });

})();
