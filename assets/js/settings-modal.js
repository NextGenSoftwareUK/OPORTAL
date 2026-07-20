(function () {
  var currentTab = 'account';

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

  function pickValue(source, keys) {
    if (!source) return '';
    for (var i = 0; i < keys.length; i++) {
      var v = source[keys[i]];
      if (v == null || v === '') continue;
      if (typeof v === 'string' || typeof v === 'number') return String(v);
    }
    return '';
  }

  // ── Populate account tab ──────────────────────────────────────────────────────

  function populate(profile) {
    var p = profile || {};

    setText('settings-avatar-id', pickValue(p, ['id', 'Id', 'avatarId', 'AvatarId']));
    setText('settings-username', pickValue(p, ['username', 'userName', 'UserName']));
    setText('settings-email', pickValue(p, ['email', 'Email', 'emailAddress', 'EmailAddress']));

    var type = pickValue(p, ['avatarType', 'AvatarType', 'avatarTypeName', 'AvatarTypeName', 'role', 'Role']);
    if (!type || /^\d+$/.test(type)) type = 'User';
    setText('settings-avatar-type', type);

    var created = pickValue(p, ['createdDate', 'CreatedDate', 'dateCreated', 'DateCreated', 'created', 'Created']);
    if (created) {
      try { created = new Date(created).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
      catch (e) {}
    }
    setText('settings-created', created || '—');

    // Linked providers
    var providersList = getById('settings-providers-list');
    if (providersList) {
      var providers = p.providerUniqueStorageKey || p.ProviderUniqueStorageKey ||
                      p.providerPublicKey || p.ProviderPublicKey || null;
      if (providers && typeof providers === 'object' && !Array.isArray(providers)) {
        var keys = Object.keys(providers);
        if (keys.length) {
          providersList.innerHTML = keys.map(function (k) {
            return '<div class="settings-provider-chip">' + escapeHtml(k) + '</div>';
          }).join('');
        } else {
          providersList.innerHTML = '<p class="settings-dim">No linked providers found.</p>';
        }
      } else {
        providersList.innerHTML = '<p class="settings-dim">No linked providers found.</p>';
      }
    }
  }

  function setText(id, value) {
    var el = getById(id);
    if (el) el.textContent = value || '—';
  }

  // ── Nav preference toggles ────────────────────────────────────────────────────

  function updateMenuBadge(isOld) {
    var badge = getById('settings-nav-old-menu-badge');
    if (!badge) return;
    badge.textContent = isOld ? 'Old' : 'New';
    badge.className = 'settings-badge' + (isOld ? '' : ' settings-badge--new');
  }

  function loadNavPrefs() {
    var oldMenu  = getById('settings-nav-old-menu');
    var chevrons = getById('settings-nav-chevrons');
    var lower    = getById('settings-nav-lowercase');
    if (oldMenu)  { oldMenu.checked  = !!window.OLD_SIDE_MENU;      updateMenuBadge(!!window.OLD_SIDE_MENU); }
    if (chevrons) chevrons.checked = !!window.NAV_CHEVRONS;
    if (lower)    lower.checked    = !!window.SUB_MENU_LOWERCASE;
  }

  function bindNavPrefs(block) {
    var oldMenu  = getById('settings-nav-old-menu');
    var chevrons = getById('settings-nav-chevrons');
    var lower    = getById('settings-nav-lowercase');

    if (oldMenu) oldMenu.addEventListener('change', function () {
      localStorage.setItem('nav_old_menu', this.checked);
      window.OLD_SIDE_MENU = this.checked;
      updateMenuBadge(this.checked);
      location.reload();
    });

    if (chevrons) chevrons.addEventListener('change', function () {
      localStorage.setItem('nav_chevrons', this.checked);
      window.NAV_CHEVRONS = this.checked;
      document.querySelector('.side-nav').classList.toggle('no-chevrons', !this.checked);
    });

    if (lower) lower.addEventListener('change', function () {
      localStorage.setItem('nav_lowercase', this.checked);
      window.SUB_MENU_LOWERCASE = this.checked;
      document.querySelector('.side-nav').classList.toggle('submenu-lowercase', this.checked);
    });
  }

  // ── Tab switching ─────────────────────────────────────────────────────────────

  function switchTab(tab) {
    currentTab = tab;
    var block = getById('settings-modal-block');
    if (!block) return;
    block.querySelectorAll('.settings-tab').forEach(function (t) {
      t.classList.toggle('is-active', t.dataset.tab === tab);
    });
    block.querySelectorAll('.settings-panel').forEach(function (p) {
      p.hidden = p.id !== 'settings-tab-' + tab;
    });
    if (tab === 'preferences') loadNavPrefs();
  }

  // ── Open / close ─────────────────────────────────────────────────────────────

  function openSettingsModal(tab) {
    var loggedIn = localStorage.getItem('loggedIn') === 'true';
    if (!loggedIn) {
      if (typeof window.addAuthPopup === 'function') window.addAuthPopup(true, 'Please beam in to access Settings.', null);
      return false;
    }
    var modal = document.querySelector('.js-modal');
    var blocks = document.querySelectorAll('.js-modal-block');
    var block = getById('settings-modal-block');
    if (!modal || !block) return false;

    blocks.forEach(function (b) { b.classList.remove('is-selected'); });
    modal.classList.add('is-visible');
    block.classList.add('is-selected');

    var profile = readAvatar();
    populate(profile);
    switchTab(tab || 'account');
    return false;
  }

  function closeSettingsModal() {
    var modal = document.querySelector('.js-modal');
    var block = getById('settings-modal-block');
    if (modal) modal.classList.remove('is-visible');
    if (block) block.classList.remove('is-selected');
  }

  // ── Bind ─────────────────────────────────────────────────────────────────────

  function bind() {
    var block = getById('settings-modal-block');
    if (!block || block.dataset.settingsBound === 'true') {
      window.openSettingsModal = openSettingsModal;
      window.closeSettingsModal = closeSettingsModal;
      return;
    }

    var closeBtn = getById('settings-modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); closeSettingsModal(); });

    var tabNav = block.querySelector('.settings-tabs');
    if (tabNav) {
      tabNav.addEventListener('click', function (e) {
        var tab = e.target.closest('.settings-tab');
        if (tab) switchTab(tab.dataset.tab);
      });
    }

    bindNavPrefs(block);
    block.dataset.settingsBound = 'true';
    window.openSettingsModal = openSettingsModal;
    window.closeSettingsModal = closeSettingsModal;
  }

  // ── Password reset ────────────────────────────────────────────────────────────

  window.sendPasswordResetEmail = async function () {
    var btn = document.getElementById('settings-reset-btn');
    var profile = readAvatar();
    var email = profile && (profile.email || profile.Email);
    if (!email) { alert('No email address found. Please beam in first.'); return; }

    if (btn) { btn.disabled = true; btn.innerHTML = 'Sending… <span style="display:inline-block;width:11px;height:11px;border:2px solid rgba(107,208,255,.25);border-top-color:#6bd0ff;border-radius:50%;vertical-align:-1px;margin-left:4px;animation:settings-spin .75s linear infinite"></span><style>@keyframes settings-spin{to{transform:rotate(360deg)}}</style>'; }

    try {
      var returnUrl = 'https://oportal.oasisomniverse.one/reset-password.html';
      var res = await fetch('https://api.web4.oasisomniverse.one/api/avatar/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, returnUrl: returnUrl })
      });
      var data = await res.json();
      var isError = data?.result?.isError ?? !res.ok;
      if (isError) throw new Error(data?.result?.message || data?.message || 'Request failed.');
      if (btn) { btn.innerHTML = 'Email Sent ✓'; btn.style.borderColor = 'rgba(0,229,255,.5)'; btn.style.color = '#00e5ff'; }
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Send Password Reset Email'; }
      alert('Could not send reset email: ' + (e.message || 'Unknown error'));
    }
  };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bind); }
  else { bind(); }
  window.addEventListener('portal-components-ready', bind);
})();
