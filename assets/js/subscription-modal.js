(function () {
  'use strict';

  function getById(id) { return document.getElementById(id); }
  function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function showStatus(type, msg) { var el = getById('subscription-status'); if (!el) return; el.className = 'subscription-status subscription-status--' + type; el.textContent = msg; el.hidden = false; }
  function hideStatus() { var el = getById('subscription-status'); if (el) el.hidden = true; }
  function showStatusBrief(type, msg) { showStatus(type, msg); setTimeout(hideStatus, 3500); }
  function setText(id, v) { var el = getById(id); if (el) el.textContent = v; }
  function fmtBytes(b) { if (!b) return '—'; var n = Number(b); if (isNaN(n)) return String(b); if (n < 1024) return n + ' B'; if (n < 1048576) return (n/1024).toFixed(1) + ' KB'; if (n < 1073741824) return (n/1048576).toFixed(1) + ' MB'; return (n/1073741824).toFixed(2) + ' GB'; }
  function fmtDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString(); } catch(e) { return ''; } }
  function extractList(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.result)) return data.result;
    if (data.result && Array.isArray(data.result.result)) return data.result.result;
    return [];
  }

  async function loadPlans() {
    var list = getById('sub-plans-list');
    if (list) list.innerHTML = '<div class="map-empty"><p>Loading plans…</p></div>';
    if (!window.oasisClient) return;
    try {
      var sdkRes = await window.oasisClient.subscription.getPlans();
      var plans = extractList(sdkRes && !sdkRes.isError ? sdkRes.result : null);
      if (!list) return;
      if (!plans.length) { list.innerHTML = '<div class="map-empty"><p>No plans available.</p></div>'; return; }
      list.innerHTML = plans.map(function(p) {
        var name    = p.name || p.Name || p.planName || 'Plan';
        var price   = p.price || p.Price || p.amount || '';
        var currency= p.currency || p.Currency || 'USD';
        var interval= p.interval || p.Interval || p.billingPeriod || '';
        var features= p.features || p.Features || [];
        var priceStr = price ? (currency + ' ' + price + (interval ? '/' + interval : '')) : 'Free';
        return '<div class="modal-item-row">' +
          '<div class="modal-item-icon">⭐</div>' +
          '<div class="modal-item-body">' +
            '<div class="modal-item-title">' + escHtml(name) + '</div>' +
            '<div class="modal-item-meta">' + escHtml(priceStr) + '</div>' +
            (Array.isArray(features) && features.length ? '<div class="modal-item-meta">' + features.slice(0,3).map(function(f){ return escHtml(String(f)); }).join(' · ') + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    } catch(e) { if (list) list.innerHTML = '<div class="map-empty"><p>Could not load plans.</p></div>'; }
  }

  async function loadMySubscriptions() {
    var list = getById('sub-mysubs-list');
    if (list) list.innerHTML = '<div class="map-empty"><p>Loading…</p></div>';
    if (!window.oasisClient) return;
    try {
      var sdkRes = await window.oasisClient.subscription.getMySubscriptions();
      var subs = extractList(sdkRes && !sdkRes.isError ? sdkRes.result : null);
      if (subs.length) {
        var active = subs.find(function(s) { return s.status === 'active' || s.Status === 'active' || s.isActive || s.IsActive; });
        if (active) setText('sub-stat-plan', active.planName || active.PlanName || active.name || active.Name || '—');
      }
      if (!list) return;
      if (!subs.length) { list.innerHTML = '<div class="map-empty"><p>No active subscriptions.</p></div>'; return; }
      list.innerHTML = subs.map(function(s) {
        var name    = s.planName || s.PlanName || s.name || s.Name || 'Subscription';
        var status  = s.status   || s.Status   || 'active';
        var expires = fmtDate(s.expiresAt || s.ExpiresAt || s.endDate || '');
        return '<div class="modal-item-row">' +
          '<div class="modal-item-icon">📋</div>' +
          '<div class="modal-item-body">' +
            '<div class="modal-item-title">' + escHtml(name) + '</div>' +
            '<div class="modal-item-meta">Status: ' + escHtml(status) + (expires ? ' · Expires: ' + expires : '') + '</div>' +
          '</div>' +
          '<span class="modal-badge modal-badge--' + (status === 'active' ? 'green' : 'dim') + '">' + escHtml(status) + '</span>' +
        '</div>';
      }).join('');
    } catch(e) { if (list) list.innerHTML = '<div class="map-empty"><p>Could not load subscriptions.</p></div>'; }
  }

  async function loadUsage() {
    var panel = getById('sub-usage-panel');
    if (panel) panel.innerHTML = '<div class="map-empty"><p>Loading…</p></div>';
    if (!window.oasisClient) return;
    try {
      var [usageRes, hdRes] = await Promise.all([
        window.oasisClient.subscription.getUsage().catch(function(){ return { isError: true }; }),
        window.oasisClient.subscription.getHyperDriveUsage().catch(function(){ return { isError: true }; }),
      ]);
      var usage = usageRes && !usageRes.isError ? (usageRes.result || usageRes) : null;
      var hd    = hdRes    && !hdRes.isError    ? (hdRes.result    || hdRes)    : null;
      var hdUsed  = hd && (hd.used   || hd.Used   || hd.usedBytes  || hd.storageUsed  || 0);
      var hdLimit = hd && (hd.limit  || hd.Limit  || hd.limitBytes || hd.storageLimit || 0);
      setText('sub-stat-hd-used',  fmtBytes(hdUsed));
      setText('sub-stat-hd-limit', fmtBytes(hdLimit));
      if (!panel) return;
      var rows = [];
      if (hd) {
        rows.push(['HyperDrive Used',  fmtBytes(hdUsed)]);
        rows.push(['HyperDrive Limit', fmtBytes(hdLimit)]);
        if (hdLimit > 0) { var pct = Math.round((hdUsed / hdLimit) * 100); rows.push(['Usage %', pct + '%']); }
      }
      if (usage) {
        Object.entries(usage).forEach(function(kv) {
          if (typeof kv[1] !== 'object' || kv[1] == null) rows.push([kv[0], String(kv[1])]);
        });
      }
      panel.innerHTML = rows.length ?
        '<div class="modal-kv-grid">' + rows.map(function(r) {
          return '<div class="modal-kv"><span class="modal-kv-label">' + escHtml(r[0]) + '</span><span class="modal-kv-value">' + escHtml(r[1]) + '</span></div>';
        }).join('') + '</div>' :
        '<div class="map-empty"><p>No usage data available.</p></div>';
    } catch(e) { if (panel) panel.innerHTML = '<div class="map-empty"><p>Could not load usage.</p></div>'; }
  }

  async function loadOrders() {
    var list = getById('sub-orders-list');
    if (list) list.innerHTML = '<div class="map-empty"><p>Loading…</p></div>';
    if (!window.oasisClient) return;
    try {
      var sdkRes = await window.oasisClient.subscription.getMyOrders();
      var orders = extractList(sdkRes && !sdkRes.isError ? sdkRes.result : null);
      if (!list) return;
      if (!orders.length) { list.innerHTML = '<div class="map-empty"><p>No orders found.</p></div>'; return; }
      list.innerHTML = orders.map(function(o) {
        var id     = o.id || o.Id || o.orderId || '';
        var name   = o.planName || o.PlanName || o.description || o.Description || 'Order';
        var amount = o.amount || o.Amount || o.total || '';
        var cur    = o.currency || o.Currency || 'USD';
        var date   = fmtDate(o.createdAt || o.CreatedAt || o.date || '');
        var status = o.status || o.Status || '';
        return '<div class="modal-item-row">' +
          '<div class="modal-item-icon">🧾</div>' +
          '<div class="modal-item-body">' +
            '<div class="modal-item-title">' + escHtml(name) + '</div>' +
            '<div class="modal-item-meta">' + (amount ? cur + ' ' + amount + ' · ' : '') + (date || '') + '</div>' +
          '</div>' +
          (status ? '<span class="modal-badge">' + escHtml(status) + '</span>' : '') +
        '</div>';
      }).join('');
    } catch(e) { if (list) list.innerHTML = '<div class="map-empty"><p>Could not load orders.</p></div>'; }
  }

  function switchTab(tab) {
    var block = getById('subscription-modal-block');
    if (!block) return;
    block.querySelectorAll('.map-tab').forEach(function(t) { t.classList.toggle('is-active', t.dataset.tab === tab); });
    block.querySelectorAll('.map-tab-panel').forEach(function(p) { p.hidden = p.id !== 'sub-tab-' + tab; });
    if (tab === 'usage')  loadUsage();
    if (tab === 'orders') loadOrders();
  }

  function openSubscriptionModal() {
    var modal = document.querySelector('.js-modal');
    var block = getById('subscription-modal-block');
    if (!modal || !block) return false;
    document.querySelectorAll('.js-modal-block').forEach(function(b) { b.classList.remove('is-selected'); });
    modal.classList.add('is-visible');
    block.classList.add('is-selected');
    switchTab('plans'); loadPlans(); loadMySubscriptions();
    return false;
  }

  function closeSubscriptionModal() {
    var modal = document.querySelector('.js-modal');
    var block = getById('subscription-modal-block');
    if (modal) modal.classList.remove('is-visible');
    if (block) block.classList.remove('is-selected');
  }

  function bind() {
    var block = getById('subscription-modal-block');
    if (!block || block.dataset.subBound === 'true') { window.openSubscriptionModal = openSubscriptionModal; window.closeSubscriptionModal = closeSubscriptionModal; return; }
    var closeBtn = getById('subscription-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', function(e) { e.preventDefault(); closeSubscriptionModal(); });
    var tabBar = block.querySelector('.map-tabs');
    if (tabBar) tabBar.addEventListener('click', function(e) { var t = e.target.closest('.map-tab'); if (t) switchTab(t.dataset.tab); });
    block.dataset.subBound = 'true';
    window.openSubscriptionModal = openSubscriptionModal; window.closeSubscriptionModal = closeSubscriptionModal;
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bind); } else { bind(); }
  window.addEventListener('portal-components-ready', bind);
})();
