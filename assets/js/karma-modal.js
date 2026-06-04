(function () {
  var API_BASE = window.apiUrl || window.API_BASE;

  // Karma weightings — these are the default OASIS values
  var KARMA_WEIGHTINGS = [
    { action: 'Create Avatar',         points: 50,   type: 'positive' },
    { action: 'Complete Profile',      points: 100,  type: 'positive' },
    { action: 'Create OApp',           points: 500,  type: 'positive' },
    { action: 'Deploy OApp',           points: 1000, type: 'positive' },
    { action: 'Create Quest',          points: 200,  type: 'positive' },
    { action: 'Complete Quest',        points: 300,  type: 'positive' },
    { action: 'Create Holon',          points: 100,  type: 'positive' },
    { action: 'Gift SEEDS',            points: 150,  type: 'positive' },
    { action: 'Donate SEEDS',          points: 250,  type: 'positive' },
    { action: 'Place Geo-NFT',         points: 75,   type: 'positive' },
    { action: 'Collect Geo-NFT',       points: 50,   type: 'positive' },
    { action: 'Spam / Abuse',          points: -500, type: 'negative' },
    { action: 'Delete Avatar',         points: -100, type: 'negative' },
  ];

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

  function pickValue(src, keys) {
    if (!src) return '';
    for (var i = 0; i < keys.length; i++) {
      var v = src[keys[i]];
      if (v == null || v === '') continue;
      if (typeof v === 'string' || typeof v === 'number') return String(v);
    }
    return '';
  }

  function getToken(p) { return p && (p.jwtToken || p.token || ''); }
  function getAvatarId(p) { return p && (p.id || p.Id || p.avatarId || p.AvatarId || ''); }

  // ── Status ───────────────────────────────────────────────────────────────────

  function showStatus(type, msg) {
    var el = getById('karma-modal-status');
    if (!el) return;
    el.className = 'karma-status karma-status--' + type;
    el.textContent = msg;
    el.hidden = false;
  }

  function hideStatus() {
    var el = getById('karma-modal-status');
    if (el) el.hidden = true;
  }

  // ── Score banner ─────────────────────────────────────────────────────────────

  function populateBanner(profile, karmaData) {
    var p = profile || {};

    // Prefer fresh API karma data, fall back to stored profile
    var karma = karmaData != null ? karmaData
      : pickValue(p, ['karma', 'Karma', 'karmaPoints', 'KarmaPoints', 'karmaWeighting', 'KarmaWeighting']);
    var xp = pickValue(p, ['xp', 'XP', 'experiencePoints', 'ExperiencePoints', 'experience', 'Experience']);
    var level = pickValue(p, ['level', 'Level', 'rank', 'Rank', 'avatarLevel', 'AvatarLevel']);
    var type = pickValue(p, ['avatarType', 'AvatarType', 'avatarTypeName', 'AvatarTypeName']);
    if (!type || /^\d+$/.test(type)) type = 'User';

    setText('karma-score-value', karma || '—');
    setText('karma-xp-value', xp || '—');
    setText('karma-level-value', level || '—');
    setText('karma-type-value', type);
  }

  function setText(id, val) {
    var el = getById(id);
    if (el) el.textContent = val;
  }

  // ── Akashic records ───────────────────────────────────────────────────────────

  function buildRecordRow(record) {
    var action = escapeHtml(record.karmaSourceType || record.KarmaSourceType || record.action || record.Action || record.description || record.Description || 'Action');
    var points = record.karmaAmount || record.KarmaAmount || record.points || record.Points || record.karma || record.Karma || 0;
    var date = record.date || record.Date || record.createdDate || record.CreatedDate || '';
    var isPositive = Number(points) >= 0;
    var dateStr = '';
    if (date) {
      try { dateStr = new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
      catch (e) { dateStr = escapeHtml(String(date)); }
    }

    return '<div class="karma-record-row">' +
      '<div class="karma-record-action">' + action + (dateStr ? '<span class="karma-record-date">' + dateStr + '</span>' : '') + '</div>' +
      '<div class="karma-record-points ' + (isPositive ? 'karma-positive' : 'karma-negative') + '">' +
        (isPositive ? '+' : '') + escapeHtml(String(points)) +
      '</div>' +
    '</div>';
  }

  function renderRecords(records) {
    var list = getById('karma-records-list');
    if (!list) return;

    if (!records || !records.length) {
      list.innerHTML = '<div class="karma-empty"><div class="karma-empty-icon">📜</div><p>No karma records found.<br>Complete actions in the OASIS ecosystem to build your Akashic Record.</p></div>';
      return;
    }

    list.innerHTML = records.map(buildRecordRow).join('');
  }

  // ── Weightings ────────────────────────────────────────────────────────────────

  function renderWeightings() {
    var grid = getById('karma-weightings-grid');
    if (!grid) return;
    grid.innerHTML = KARMA_WEIGHTINGS.map(function (w) {
      var isPositive = w.points >= 0;
      return '<div class="karma-weighting-card">' +
        '<div class="karma-weighting-action">' + escapeHtml(w.action) + '</div>' +
        '<div class="karma-weighting-points ' + (isPositive ? 'karma-positive' : 'karma-negative') + '">' +
          (isPositive ? '+' : '') + w.points +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── API ───────────────────────────────────────────────────────────────────────

  async function fetchKarmaScore(profile) {
    var id = getAvatarId(profile);
    var token = getToken(profile);
    if (!id || !token) return null;
    try {
      var res = await fetch(API_BASE + '/api/karma/GetKarmaForAvatar/' + encodeURIComponent(id), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return null;
      var data = await res.json();
      return data && (data.result != null ? data.result : data.karma != null ? data.karma : data.Karma != null ? data.Karma : data);
    } catch (e) { return null; }
  }

  async function fetchAkashicRecords(profile) {
    var id = getAvatarId(profile);
    var token = getToken(profile);
    if (!id || !token) return null;
    try {
      var res = await fetch(API_BASE + '/api/karma/GetKarmaAkashicRecordsForAvatar/' + encodeURIComponent(id), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return null;
      var data = await res.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.result)) return data.result;
      if (data.result && Array.isArray(data.result.result)) return data.result.result;
      if (Array.isArray(data.data)) return data.data;
      return null;
    } catch (e) { return null; }
  }

  async function loadAll() {
    var profile = readAvatar();
    showStatus('loading', 'Loading karma data…');

    var [score, records] = await Promise.all([
      fetchKarmaScore(profile),
      fetchAkashicRecords(profile),
    ]);

    hideStatus();
    populateBanner(profile, score);
    renderRecords(records);

    if (score == null && !records) {
      showStatus('warn', 'Could not load karma data from the API — showing cached profile data.');
      setTimeout(hideStatus, 4000);
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────────

  function switchTab(tab) {
    var block = getById('karma-modal-block');
    if (!block) return;
    block.querySelectorAll('.karma-tab').forEach(function (t) {
      t.classList.toggle('is-active', t.dataset.tab === tab);
    });
    block.querySelectorAll('.karma-tab-panel').forEach(function (p) {
      p.hidden = p.id !== 'karma-tab-' + tab;
    });
  }

  // ── Open / close ─────────────────────────────────────────────────────────────

  function openKarmaModal() {
    var loggedIn = localStorage.getItem('loggedIn') === 'true';
    if (!loggedIn) { if (typeof window.showCheckAPIMessage === 'function') window.showCheckAPIMessage(); return false; }

    var modal = document.querySelector('.js-modal');
    var blocks = document.querySelectorAll('.js-modal-block');
    var block = getById('karma-modal-block');
    if (!modal || !block) return false;

    blocks.forEach(function (b) { b.classList.remove('is-selected'); });
    modal.classList.add('is-visible');
    block.classList.add('is-selected');

    switchTab('records');
    var profile = readAvatar();
    populateBanner(profile, null);
    renderWeightings();
    loadAll();
    return false;
  }

  function closeKarmaModal() {
    var modal = document.querySelector('.js-modal');
    var block = getById('karma-modal-block');
    if (modal) modal.classList.remove('is-visible');
    if (block) block.classList.remove('is-selected');
  }

  // ── Bind ──────────────────────────────────────────────────────────────────────

  function bind() {
    var block = getById('karma-modal-block');
    if (!block || block.dataset.karmaBound === 'true') {
      window.openKarmaModal = openKarmaModal;
      window.closeKarmaModal = closeKarmaModal;
      return;
    }

    var closeBtn = getById('karma-modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); closeKarmaModal(); });

    var tabBar = block.querySelector('.karma-tabs');
    if (tabBar) {
      tabBar.addEventListener('click', function (e) {
        var tab = e.target.closest('.karma-tab');
        if (tab) switchTab(tab.dataset.tab);
      });
    }

    block.dataset.karmaBound = 'true';
    window.openKarmaModal = openKarmaModal;
    window.closeKarmaModal = closeKarmaModal;
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bind); }
  else { bind(); }
  window.addEventListener('portal-components-ready', bind);
})();
