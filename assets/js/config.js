//window.apiUrl = 'https://oasisapionode-hseudrexdvbhenhv.canadacentral-01.azurewebsites.net';
//window.apiUrl = 'https://api.web4.oasisomniverse.one';
// window.apiUrl = 'https://localhost:5002/';
window.apiUrl = 'https://api.web4.oasisomniverse.one';
window.API_BASE = window.apiUrl;
window.web5ApiUrl = 'https://api.starnet.oasisomniverse.one';
window.web6ApiUrl = 'https://api.web6.oasisomniverse.one';

// ── OASIS SDK clients (@oasisomniverse/web4-api + web5-api) ──────────────────
// OASISClient and STARClient are loaded by the SDK bundle scripts that appear
// before config.js in portal.html. We instantiate them here and expose them as
// window.oasisClient / window.starClient so every modal can use them directly.
(function initSdkClients() {
  // Bind fetch to window here, outside any module wrapper, so the SDK always
  // has a correctly-bound fetch regardless of how esbuild wraps the CommonJS code.
  var boundFetch = window.fetch.bind(window);
  if (typeof OASISClient !== 'undefined') {
    window.oasisClient = new OASISClient({ baseUrl: window.apiUrl, fetchImpl: boundFetch });
  }
  if (typeof STARClient !== 'undefined') {
    window.starClient = new STARClient({ baseUrl: window.web5ApiUrl, fetchImpl: boundFetch });
  }
  if (typeof Web6Client !== 'undefined') {
    window.aiClient = new Web6Client({ baseUrl: window.web6ApiUrl, fetchImpl: boundFetch });
  }

  // Intercept every SDK response — if a call comes back 401/Unauthorized while
  // a session is active, route the user back to the Beam In popup.
  // Guards: only fires when loggedIn=true, skips auth paths, debounces so a
  // burst of parallel failures only triggers one redirect.
  var _unauthorizedPending = false;
  function attachUnauthorizedInterceptor(client) {
    if (!client || !client.http) return;
    var orig = client.http.request.bind(client.http);
    client.http.request = async function (verb, path, options) {
      var res = await orig(verb, path, options);
      var isUnauth = res && res.isError && (
        res.statusCode === 401 ||
        (res.statusCode === 403) ||
        (res.message && /unauthori[zs]ed/i.test(res.message))
      );
      // Only act if the user is supposed to be logged in and this isn't an
      // auth endpoint itself (login / refresh / forgot-password etc.)
      var isAuthPath = /\/(authenticate|refresh-token|forgot-password|reset-password|register|signup)/i.test(path);
      if (isUnauth && !isAuthPath && !_unauthorizedPending &&
          localStorage.getItem('loggedIn') === 'true') {
        _unauthorizedPending = true;
        if (typeof window.handleUnauthorized === 'function') {
          window.handleUnauthorized().finally(function () { _unauthorizedPending = false; });
        }
      }
      return res;
    };
  }
  attachUnauthorizedInterceptor(window.oasisClient);
  attachUnauthorizedInterceptor(window.starClient);
  attachUnauthorizedInterceptor(window.aiClient);

  // If the user is already logged in (page refresh / revisit), inject their
  // stored JWT so the SDK sends authenticated requests immediately.
  try {
    var _av = JSON.parse(localStorage.getItem('avatar') || 'null');
    var _tok = _av && (_av.jwtToken || _av.JwtToken || _av.token || _av.Token || '');
    if (_tok) {
      if (window.oasisClient) window.oasisClient.setToken(_tok);
      if (window.starClient)  window.starClient.setToken(_tok);
      if (window.aiClient)    window.aiClient.setToken(_tok);
    }
  } catch (e) {}
})();

// ── Nav preferences (defaults — overridden by localStorage if user has saved a preference) ──
// OLD_SIDE_MENU   : true = old flat menu, false = new grouped sections
// NAV_CHEVRONS    : true = show chevrons, false = hide
// SUB_MENU_LOWERCASE : true = "My Avatar", false = "MY AVATAR"
function _navPref(key, def) {
  var v = localStorage.getItem(key);
  return v !== null ? v === 'true' : def;
}
window.OLD_SIDE_MENU      = _navPref('nav_old_menu',   true);
window.NAV_CHEVRONS       = _navPref('nav_chevrons',   false);
window.SUB_MENU_LOWERCASE = _navPref('nav_lowercase',  true);
