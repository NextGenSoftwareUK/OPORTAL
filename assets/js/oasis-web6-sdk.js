/* @oasisomniverse/web6-api browser bundle — auto-generated, do not edit */
var _OASIS_WEB6_UNUSED_ = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/@oasisomniverse/web6-api/src/core/httpClient.js
  var require_httpClient = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/core/httpClient.js"(exports, module) {
      "use strict";
      var DEFAULT_BASE_URL = "https://api.web6.oasisomniverse.one";
      function buildQueryString(query) {
        const entries = Object.entries(query || {}).filter(([, v]) => v !== void 0 && v !== null);
        if (!entries.length) return "";
        const params = new URLSearchParams();
        for (const [key, value] of entries) {
          params.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
        }
        return `?${params.toString()}`;
      }
      var HttpClient = class {
        constructor({ baseUrl = DEFAULT_BASE_URL, tokenStore, fetchImpl = globalThis.fetch } = {}) {
          if (!fetchImpl) {
            throw new Error(
              "No global fetch implementation found. Use Node 18+, a modern browser, or pass { fetchImpl } explicitly."
            );
          }
          this.baseUrl = baseUrl.replace(/\/+$/, "");
          this.tokenStore = tokenStore;
          this.fetchImpl = fetchImpl;
        }
        setBaseUrl(baseUrl) {
          this.baseUrl = baseUrl.replace(/\/+$/, "");
        }
        /**
         * @param {string} verb GET | POST | PUT | DELETE
         * @param {string} path e.g. "v1/complete"
         * @param {object} [options]
         * @param {object} [options.query] query string params (GET/DELETE)
         * @param {object} [options.body] JSON body (POST/PUT/DELETE)
         * @param {boolean} [options.auth] attach Authorization: Bearer <token> (default true)
         * @param {string} [options.token] override token for this single request
         */
        async request(verb, path, { query, body, auth = true, token } = {}) {
          var _a, _b;
          const url = `${this.baseUrl}/${path.replace(/^\/+/, "")}${buildQueryString(query)}`;
          const headers = {
            "Content-Type": "application/json",
            Accept: "application/json"
          };
          const bearer = token || (auth ? (_a = this.tokenStore) == null ? void 0 : _a.getToken() : null);
          if (bearer) headers.Authorization = `Bearer ${bearer}`;
          const init = { method: verb, headers };
          if (body !== void 0 && verb !== "GET") init.body = JSON.stringify(body);
          let res;
          try {
            res = await this.fetchImpl(url, init);
          } catch (err) {
            return { isError: true, message: `Network error calling ${url}: ${err.message}`, exception: err };
          }
          const text = await res.text();
          let json;
          try {
            json = text ? JSON.parse(text) : null;
          } catch (e) {
            json = null;
          }
          if (!res.ok) {
            const message = ((_b = json == null ? void 0 : json.result) == null ? void 0 : _b.message) || (json == null ? void 0 : json.message) || (json == null ? void 0 : json.title) || `Request failed with status ${res.status}`;
            return { isError: true, message, statusCode: res.status, raw: json };
          }
          const inner = (json == null ? void 0 : json.result) !== void 0 ? json.result : json;
          const payload = (inner == null ? void 0 : inner.result) !== void 0 ? inner.result : inner;
          return {
            isError: Boolean((inner == null ? void 0 : inner.isError) || (json == null ? void 0 : json.isError)),
            message: (inner == null ? void 0 : inner.message) || (json == null ? void 0 : json.message) || null,
            result: payload,
            raw: json,
            statusCode: res.status
          };
        }
        get(path, options) {
          return this.request("GET", path, options);
        }
        post(path, options) {
          return this.request("POST", path, options);
        }
        put(path, options) {
          return this.request("PUT", path, options);
        }
        delete(path, options) {
          return this.request("DELETE", path, options);
        }
      };
      module.exports = { HttpClient, DEFAULT_BASE_URL };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/core/tokenStore.js
  var require_tokenStore = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/core/tokenStore.js"(exports, module) {
      "use strict";
      var hasLocalStorage = typeof globalThis.localStorage !== "undefined";
      var STORAGE_KEY = "oasis_session";
      var TokenStore = class {
        constructor({ persist = hasLocalStorage } = {}) {
          this.persist = persist;
          this._session = null;
          if (this.persist) {
            try {
              const raw = globalThis.localStorage.getItem(STORAGE_KEY);
              if (raw) this._session = JSON.parse(raw);
            } catch (e) {
              this._session = null;
            }
          }
        }
        getSession() {
          return this._session;
        }
        getToken() {
          var _a, _b;
          return ((_a = this._session) == null ? void 0 : _a.jwtToken) || ((_b = this._session) == null ? void 0 : _b.token) || null;
        }
        setSession(session) {
          this._session = session || null;
          if (this.persist) {
            try {
              if (session) globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              else globalThis.localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
            }
          }
        }
        clear() {
          this.setSession(null);
        }
      };
      module.exports = { TokenStore };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/core/routeHelper.js
  var require_routeHelper = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/core/routeHelper.js"(exports, module) {
      "use strict";
      var TOKEN_PATTERN = /\{(\w+)(?::\w+)?\}/g;
      function resolveRoute(routeTemplate, args = {}) {
        const consumed = /* @__PURE__ */ new Set();
        const path = routeTemplate.replace(TOKEN_PATTERN, (match, name) => {
          const key = Object.keys(args).find((k) => k.toLowerCase() === name.toLowerCase());
          consumed.add(key);
          const value = key !== void 0 ? args[key] : void 0;
          if (value === void 0) {
            throw new Error(`Missing required route parameter "${name}" for route "${routeTemplate}"`);
          }
          return encodeURIComponent(value);
        });
        const rest = {};
        for (const [key, value] of Object.entries(args)) {
          if (!consumed.has(key)) rest[key] = value;
        }
        return { path, rest };
      }
      function takeKey(obj, name) {
        const matchKey = Object.keys(obj).find((k) => k.toLowerCase() === name.toLowerCase());
        if (matchKey === void 0) return { found: false, value: void 0 };
        const value = obj[matchKey];
        delete obj[matchKey];
        return { found: true, value };
      }
      function makeOperation(http, routePrefix, verb, route, opts = {}) {
        const declaredQueryKeys = opts.query || [];
        const bodyParam = opts.bodyParam;
        return async function operation(args = {}) {
          const { path, rest } = resolveRoute(route, args);
          const fullPath = path ? `${routePrefix}/${path}` : routePrefix;
          const query = {};
          for (const key of declaredQueryKeys) {
            const { found, value } = takeKey(rest, key);
            if (found) query[key] = value;
          }
          let body;
          if (bodyParam) {
            const { found, value } = takeKey(rest, bodyParam);
            if (found) body = value;
            Object.assign(query, rest);
          } else if (verb === "GET" || verb === "DELETE") {
            Object.assign(query, rest);
          } else {
            body = Object.keys(rest).length ? rest : void 0;
          }
          const hasQuery = Object.keys(query).length > 0;
          return http.request(verb, fullPath, { query: hasQuery ? query : void 0, body });
        };
      }
      module.exports = { resolveRoute, makeOperation };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/modules/Completion.js
  var require_Completion = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/modules/Completion.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var CompletionModule = class {
        constructor(http) {
          this._http = http;
          this.complete = makeOperation(http, "v1", "POST", "complete");
          this.openServModels = makeOperation(http, "v1", "GET", "openserv/models");
        }
      };
      module.exports = { CompletionModule };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/modules/HolonicBraid.js
  var require_HolonicBraid = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/modules/HolonicBraid.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var HolonicBraidModule = class {
        constructor(http) {
          this._http = http;
          this.getGraph = makeOperation(http, "v1/holonic-braid", "GET", "graph/{taskType}");
          this.saveGraph = makeOperation(http, "v1/holonic-braid", "POST", "graph/{taskType}");
        }
      };
      module.exports = { HolonicBraidModule };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/modules/HolonicMemory.js
  var require_HolonicMemory = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/modules/HolonicMemory.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var HolonicMemoryModule = class {
        constructor(http) {
          this._http = http;
          this.getEarthHolon = makeOperation(http, "v1/holonic-memory", "GET", "earth");
          this.getOrCreateHolon = makeOperation(http, "v1/holonic-memory", "POST", "holons", { "query": ["level", "name", "parentHolonId"] });
          this.propagate = makeOperation(http, "v1/holonic-memory", "POST", "holons/{childHolonId}/propagate");
          this.recordMemory = makeOperation(http, "v1/holonic-memory", "POST", "holons/{holonId}/memory");
          this.setMembraneRule = makeOperation(http, "v1/holonic-memory", "PUT", "holons/{holonId}/membrane-rule");
        }
      };
      module.exports = { HolonicMemoryModule };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/modules/Images.js
  var require_Images = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/modules/Images.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var ImagesModule = class {
        constructor(http) {
          this._http = http;
          this.generate = makeOperation(http, "v1/images", "POST", "generate");
        }
      };
      module.exports = { ImagesModule };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/modules/Orchestrator.js
  var require_Orchestrator = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/modules/Orchestrator.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var OrchestratorModule = class {
        constructor(http) {
          this._http = http;
          this.getAdapters = makeOperation(http, "v1/orchestrators", "GET", "");
          this.invoke = makeOperation(http, "v1/orchestrators", "POST", "invoke");
          this.registerAdapter = makeOperation(http, "v1/orchestrators", "POST", "");
        }
      };
      module.exports = { OrchestratorModule };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/modules/ReasoningNetwork.js
  var require_ReasoningNetwork = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/modules/ReasoningNetwork.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var ReasoningNetworkModule = class {
        constructor(http) {
          this._http = http;
          this.dispatch = makeOperation(http, "v1/reasoning-network", "POST", "dispatch");
          this.getAgents = makeOperation(http, "v1/reasoning-network", "GET", "agents");
          this.registerAgent = makeOperation(http, "v1/reasoning-network", "POST", "agents");
          this.seedOpenServAgents = makeOperation(http, "v1/reasoning-network", "POST", "agents/seed-openserv");
        }
      };
      module.exports = { ReasoningNetworkModule };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/modules/index.js
  var require_modules = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/modules/index.js"(exports, module) {
      "use strict";
      var { CompletionModule } = require_Completion();
      var { HolonicBraidModule } = require_HolonicBraid();
      var { HolonicMemoryModule } = require_HolonicMemory();
      var { ImagesModule } = require_Images();
      var { OrchestratorModule } = require_Orchestrator();
      var { ReasoningNetworkModule } = require_ReasoningNetwork();
      function attachGeneratedModules(client, http) {
        client.completion = client.completion || new CompletionModule(http);
        client.holonicBraid = client.holonicBraid || new HolonicBraidModule(http);
        client.holonicMemory = client.holonicMemory || new HolonicMemoryModule(http);
        client.images = client.images || new ImagesModule(http);
        client.orchestrator = client.orchestrator || new OrchestratorModule(http);
        client.reasoningNetwork = client.reasoningNetwork || new ReasoningNetworkModule(http);
        return client;
      }
      module.exports = { attachGeneratedModules };
    }
  });

  // node_modules/@oasisomniverse/web6-api/src/index.js
  var require_src = __commonJS({
    "node_modules/@oasisomniverse/web6-api/src/index.js"(exports, module) {
      "use strict";
      var { HttpClient, DEFAULT_BASE_URL } = require_httpClient();
      var { TokenStore } = require_tokenStore();
      var { attachGeneratedModules } = require_modules();
      var Web6Client2 = class {
        constructor({ baseUrl = DEFAULT_BASE_URL, persistSession, fetchImpl } = {}) {
          this.tokenStore = new TokenStore({ persist: persistSession });
          this.http = new HttpClient({ baseUrl, tokenStore: this.tokenStore, fetchImpl });
          attachGeneratedModules(this, this.http);
        }
        setBaseUrl(baseUrl) {
          this.http.setBaseUrl(baseUrl);
        }
        /**
         * WEB6 is an internal AI layer sitting behind the same OASIS identity as
         * WEB4/WEB5 - it has no avatar/auth endpoints of its own. Reuse a JWT you
         * already obtained from the WEB4 OASIS API (or your own backend) here.
         */
        setToken(jwtToken, sessionExtras = {}) {
          this.tokenStore.setSession({ ...sessionExtras, jwtToken });
        }
      };
      module.exports = { Web6Client: Web6Client2, HttpClient, TokenStore, DEFAULT_BASE_URL };
      module.exports.default = Web6Client2;
    }
  });

  // node_modules/@oasisomniverse/web6-api/index.js
  var require_web6_api = __commonJS({
    "node_modules/@oasisomniverse/web6-api/index.js"(exports, module) {
      "use strict";
      module.exports = require_src();
    }
  });

  // build/web6-entry.js
  var { Web6Client } = require_web6_api();
  if (typeof window !== "undefined") window.Web6Client = Web6Client;
})();
