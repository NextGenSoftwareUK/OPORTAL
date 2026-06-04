(function () {
  var API_BASE = window.apiUrl || window.API_BASE;
  var currentProvider = 'all';
  var isFetching = false;

  function getById(id) { return document.getElementById(id); }

  function escapeHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function readAvatar() {
    try { var r = localStorage.getItem('avatar'); return (r && r !== 'undefined') ? JSON.parse(r) : null; }
    catch (e) { return null; }
  }

  function getToken(p) { return p && (p.jwtToken || p.token || ''); }

  // ── Status ───────────────────────────────────────────────────────────────────

  function showStatus(type, msg) {
    var el = getById('data-modal-status');
    if (!el) return;
    el.className = 'data-status data-status--' + type;
    el.textContent = msg;
    el.hidden = false;
  }

  function hideStatus() {
    var el = getById('data-modal-status');
    if (el) el.hidden = true;
  }

  // ── Holon card ────────────────────────────────────────────────────────────────

  function buildHolonCard(h, showDelete) {
    var id = escapeHtml(h.id || h.Id || h.holonId || h.HolonId || '');
    var name = escapeHtml(h.name || h.Name || h.title || h.Title || 'Unnamed Holon');
    var desc = escapeHtml(h.description || h.Description || '');
    var type = escapeHtml(h.holonType || h.HolonType || h.type || h.Type || '');
    var provider = escapeHtml(h.providerType || h.ProviderType || h.provider || h.Provider || '');
    var created = h.createdDate || h.CreatedDate || h.date || h.Date || '';
    var dateStr = '';
    if (created) {
      try { dateStr = new Date(created).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
      catch (e) { dateStr = escapeHtml(String(created)); }
    }

    var deleteBtn = showDelete && id
      ? '<button class="data-card-delete" onclick="window._dataDeleteHolon(\'' + id + '\')" title="Delete">&#x2715;</button>'
      : '';

    return '<div class="data-holon-card">' +
      '<div class="data-holon-card-header">' +
        '<div class="data-holon-card-name">' + name + '</div>' +
        deleteBtn +
      '</div>' +
      (desc ? '<div class="data-holon-card-desc">' + desc + '</div>' : '') +
      '<div class="data-holon-card-meta">' +
        (type ? '<span class="data-holon-badge">' + type + '</span>' : '') +
        (provider ? '<span class="data-holon-badge data-holon-badge--provider">' + provider + '</span>' : '') +
        (dateStr ? '<span class="data-holon-date">' + dateStr + '</span>' : '') +
      '</div>' +
      (id ? '<div class="data-holon-id" title="' + id + '">' + id + '</div>' : '') +
    '</div>';
  }

  function extractList(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.result)) return data.result;
    if (data.result && Array.isArray(data.result.result)) return data.result.result;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.holons)) return data.holons;
    if (Array.isArray(data.items)) return data.items;
    // Single holon returned
    if (data.id || data.Id || data.name || data.Name) return [data];
    return null;
  }

  // ── Browse ────────────────────────────────────────────────────────────────────

  async function loadAllHolons() {
    if (isFetching) return;
    isFetching = true;
    showStatus('loading', 'Loading holons…');

    var profile = readAvatar();
    var token = getToken(profile);
    if (!token) { showStatus('error', 'Please sign in to load holons.'); isFetching = false; return; }

    var path = currentProvider === 'all'
      ? '/api/data/load-all-holons/all'
      : '/api/data/load-all-holons/all/true/true/0/true/0/' + encodeURIComponent(currentProvider) + '/false';

    try {
      var res = await fetch(API_BASE + path, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var data = res.ok ? await res.json() : null;
      hideStatus();
      var list = extractList(data);
      renderBrowseGrid(list);
      if (!list) showStatus('warn', 'No holons returned from the API.');
    } catch (e) {
      hideStatus();
      showStatus('error', 'Network error loading holons.');
    } finally {
      isFetching = false;
    }
  }

  function renderBrowseGrid(list) {
    var grid = getById('data-browse-grid');
    var empty = getById('data-browse-empty');
    if (!grid) return;

    var existing = grid.querySelectorAll('.data-holon-card');
    existing.forEach(function (el) { el.parentNode.removeChild(el); });

    if (!list || !list.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.insertAdjacentHTML('beforeend', list.map(function (h) { return buildHolonCard(h, true); }).join(''));
  }

  // ── Load by ID ────────────────────────────────────────────────────────────────

  async function loadHolonById(id, provider) {
    var profile = readAvatar();
    var token = getToken(profile);
    if (!token) { showStatus('error', 'Please sign in first.'); return; }

    var path = provider
      ? '/api/data/load-holon/' + encodeURIComponent(id) + '/true/true/0/true/0/' + encodeURIComponent(provider) + '/false'
      : '/api/data/load-holon/' + encodeURIComponent(id);

    showStatus('loading', 'Loading holon…');
    var btn = getById('data-load-btn');
    if (btn) btn.disabled = true;

    try {
      var res = await fetch(API_BASE + path, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var data = res.ok ? await res.json() : null;
      hideStatus();
      var list = extractList(data);
      var resultEl = getById('data-load-result');
      if (resultEl) {
        if (list && list.length) {
          resultEl.innerHTML = list.map(function (h) { return buildHolonCard(h, false); }).join('');
        } else {
          resultEl.innerHTML = '<div class="data-empty"><div class="data-empty-icon">🔍</div><p>No holon found with that ID.</p></div>';
        }
      }
      if (!res.ok) showStatus('error', (data && (data.message || data.error)) || 'Load failed.');
    } catch (e) {
      showStatus('error', 'Network error loading holon.');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  async function saveHolon(name, desc, type, provider, offchain) {
    var profile = readAvatar();
    var token = getToken(profile);
    if (!token) { showStatus('error', 'Please sign in first.'); return; }

    var payload = { name: name, description: desc, holonType: Number(type) };
    var path = offchain ? '/api/data/save-holon-offchain' : '/api/data/save-holon';
    if (provider && !offchain) path += '/' + encodeURIComponent(provider);

    showStatus('loading', 'Saving holon…');
    var btnId = offchain ? 'data-offchain-btn' : 'data-save-btn';
    var btn = getById(btnId);
    if (btn) btn.disabled = true;

    try {
      var res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      var data = {};
      try { data = await res.json(); } catch (e) {}

      if (res.ok) {
        showStatus('success', (data && (data.message || data.title)) || 'Holon saved successfully.');
        setTimeout(hideStatus, 3500);
        // Refresh browse list
        loadAllHolons();
      } else {
        showStatus('error', (data && (data.message || data.error)) || 'Save failed.');
      }
    } catch (e) {
      showStatus('error', 'Network error saving holon.');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  window._dataDeleteHolon = async function (id) {
    if (!confirm('Delete this holon? This cannot be undone.')) return;
    var profile = readAvatar();
    var token = getToken(profile);
    if (!token) return;

    showStatus('loading', 'Deleting holon…');
    try {
      var res = await fetch(API_BASE + '/api/data/delete-holon/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        showStatus('success', 'Holon deleted.');
        setTimeout(function () { hideStatus(); loadAllHolons(); }, 1500);
      } else {
        showStatus('error', 'Delete failed.');
      }
    } catch (e) {
      showStatus('error', 'Network error deleting holon.');
    }
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────────

  function switchTab(tab) {
    var block = getById('data-modal-block');
    if (!block) return;
    block.querySelectorAll('.data-tab').forEach(function (t) {
      t.classList.toggle('is-active', t.dataset.tab === tab);
    });
    block.querySelectorAll('.data-tab-panel').forEach(function (p) {
      p.hidden = p.id !== 'data-tab-' + tab;
    });
  }

  // ── Open / close ─────────────────────────────────────────────────────────────

  function openDataModal() {
    var loggedIn = localStorage.getItem('loggedIn') === 'true';
    if (!loggedIn) { if (typeof window.showCheckAPIMessage === 'function') window.showCheckAPIMessage(); return false; }

    var modal = document.querySelector('.js-modal');
    var blocks = document.querySelectorAll('.js-modal-block');
    var block = getById('data-modal-block');
    if (!modal || !block) return false;

    blocks.forEach(function (b) { b.classList.remove('is-selected'); });
    modal.classList.add('is-visible');
    block.classList.add('is-selected');

    switchTab('browse');
    loadAllHolons();
    return false;
  }

  function closeDataModal() {
    var modal = document.querySelector('.js-modal');
    var block = getById('data-modal-block');
    if (modal) modal.classList.remove('is-visible');
    if (block) block.classList.remove('is-selected');
  }

  // ── Bind ──────────────────────────────────────────────────────────────────────

  function bind() {
    var block = getById('data-modal-block');
    if (!block || block.dataset.dataBound === 'true') {
      window.openDataModal = openDataModal;
      window.closeDataModal = closeDataModal;
      return;
    }

    var closeBtn = getById('data-modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); closeDataModal(); });

    // Tabs
    var tabBar = block.querySelector('.data-tabs');
    if (tabBar) {
      tabBar.addEventListener('click', function (e) {
        var tab = e.target.closest('.data-tab');
        if (tab) switchTab(tab.dataset.tab);
      });
    }

    // Provider pills
    var pills = getById('data-provider-pills');
    if (pills) {
      pills.addEventListener('click', function (e) {
        var pill = e.target.closest('.data-provider-pill');
        if (!pill) return;
        pills.querySelectorAll('.data-provider-pill').forEach(function (p) { p.classList.remove('is-active'); });
        pill.classList.add('is-active');
        currentProvider = pill.dataset.provider;
        loadAllHolons();
      });
    }

    // Refresh
    var refreshBtn = getById('data-refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAllHolons);

    // Load by ID form
    var loadForm = getById('data-load-form');
    if (loadForm) {
      loadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var id = (getById('data-load-id') || {}).value.trim();
        var provider = ((getById('data-load-provider') || {}).value || '').trim();
        if (!id) return;
        loadHolonById(id, provider);
      });
    }

    // Save holon form
    var saveForm = getById('data-save-form');
    if (saveForm) {
      saveForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = (getById('data-save-name') || {}).value.trim();
        var desc = (getById('data-save-desc') || {}).value.trim();
        var type = (getById('data-save-type') || {}).value || '0';
        var provider = (getById('data-save-provider') || {}).value || '';
        var offchain = !!(getById('data-save-offchain') || {}).checked;
        if (!name) { showStatus('error', 'Please enter a holon name.'); return; }
        saveHolon(name, desc, type, provider, offchain);
      });
    }

    // Off-chain form
    var offchainForm = getById('data-offchain-form');
    if (offchainForm) {
      offchainForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = (getById('data-offchain-name') || {}).value.trim();
        var desc = (getById('data-offchain-desc') || {}).value.trim();
        var provider = (getById('data-offchain-provider') || {}).value || '';
        if (!name) { showStatus('error', 'Please enter a holon name.'); return; }
        saveHolon(name, desc, '0', provider, true);
      });
    }

    block.dataset.dataBound = 'true';
    window.openDataModal = openDataModal;
    window.closeDataModal = closeDataModal;
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bind); }
  else { bind(); }
  window.addEventListener('portal-components-ready', bind);
})();
