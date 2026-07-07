/* @oasisomniverse/web5-api browser bundle — auto-generated, do not edit */
var _OASIS_WEB5_UNUSED_ = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/@oasisomniverse/web5-api/src/core/httpClient.js
  var require_httpClient = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/core/httpClient.js"(exports, module) {
      "use strict";
      var DEFAULT_BASE_URL = "https://api.star.oasisweb5.one";
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
          this._customFetch = fetchImpl !== globalThis.fetch ? fetchImpl : null;
        }
        setBaseUrl(baseUrl) {
          this.baseUrl = baseUrl.replace(/\/+$/, "");
        }
        /**
         * @param {string} verb GET | POST | PUT | DELETE
         * @param {string} path e.g. "api/avatar/authenticate"
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
            res = await (this._customFetch ? this._customFetch(url, init) : globalThis.fetch(url, init));
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

  // node_modules/@oasisomniverse/web5-api/src/core/tokenStore.js
  var require_tokenStore = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/core/tokenStore.js"(exports, module) {
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

  // node_modules/@oasisomniverse/web5-api/src/core/routeHelper.js
  var require_routeHelper = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/core/routeHelper.js"(exports, module) {
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

  // node_modules/@oasisomniverse/web5-api/src/modules/Avatar.js
  var require_Avatar = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Avatar.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var AvatarModule = class {
        constructor(http) {
          this._http = http;
          this.addItemToInventory = makeOperation(http, "api/avatar", "POST", "inventory");
          this.addXp = makeOperation(http, "api/avatar", "POST", "add-xp");
          this.authenticate = makeOperation(http, "api/avatar", "POST", "authenticate");
          this.getCurrentAvatar = makeOperation(http, "api/avatar", "GET", "current");
          this.getInventory = makeOperation(http, "api/avatar", "GET", "inventory");
          this.getInventoryItem = makeOperation(http, "api/avatar", "GET", "inventory/{itemId}");
          this.hasItem = makeOperation(http, "api/avatar", "GET", "inventory/{itemId}/has");
          this.hasItemByName = makeOperation(http, "api/avatar", "GET", "inventory/has-by-name", { "query": ["itemName"] });
          this.removeItemFromInventory = makeOperation(http, "api/avatar", "DELETE", "inventory/{itemId}");
          this.searchInventory = makeOperation(http, "api/avatar", "GET", "inventory/search", { "query": ["searchTerm"] });
          this.sendItemToAvatar = makeOperation(http, "api/avatar", "POST", "inventory/send-to-avatar");
          this.sendItemToClan = makeOperation(http, "api/avatar", "POST", "inventory/send-to-clan");
          this.setActiveQuest = makeOperation(http, "api/avatar", "POST", "set-active-quest");
        }
      };
      module.exports = { AvatarModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/CelestialBodies.js
  var require_CelestialBodies = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/CelestialBodies.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var CelestialBodiesModule = class {
        constructor(http) {
          this._http = http;
          this.activateCelestialBody = makeOperation(http, "api/celestialBodies", "POST", "{id}/activate", { "query": ["version"] });
          this.createCelestialBody = makeOperation(http, "api/celestialBodies", "POST", "");
          this.createCelestialBodyWithOptions = makeOperation(http, "api/celestialBodies", "POST", "create");
          this.deactivateCelestialBody = makeOperation(http, "api/celestialBodies", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteCelestialBody = makeOperation(http, "api/celestialBodies", "DELETE", "{id}");
          this.downloadCelestialBody = makeOperation(http, "api/celestialBodies", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editCelestialBody = makeOperation(http, "api/celestialBodies", "POST", "{id}/edit");
          this.getAllCelestialBodies = makeOperation(http, "api/celestialBodies", "GET", "");
          this.getCelestialBodiesByType = makeOperation(http, "api/celestialBodies", "GET", "by-type/{type}");
          this.getCelestialBodiesInSpace = makeOperation(http, "api/celestialBodies", "GET", "in-space/{spaceId}");
          this.getCelestialBody = makeOperation(http, "api/celestialBodies", "GET", "{id}");
          this.getCelestialBodyVersions = makeOperation(http, "api/celestialBodies", "GET", "{id}/versions");
          this.loadAllCelestialBodiesForAvatar = makeOperation(http, "api/celestialBodies", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadCelestialBody = makeOperation(http, "api/celestialBodies", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadCelestialBodyFromPath = makeOperation(http, "api/celestialBodies", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadCelestialBodyFromPublished = makeOperation(http, "api/celestialBodies", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadCelestialBodyVersion = makeOperation(http, "api/celestialBodies", "GET", "{id}/version/{version}");
          this.publishCelestialBody = makeOperation(http, "api/celestialBodies", "POST", "{id}/publish");
          this.republishCelestialBody = makeOperation(http, "api/celestialBodies", "POST", "{id}/republish", { "query": ["version"] });
          this.searchCelestialBodies = makeOperation(http, "api/celestialBodies", "GET", "search", { "query": ["query"] });
          this.unpublishCelestialBody = makeOperation(http, "api/celestialBodies", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateCelestialBody = makeOperation(http, "api/celestialBodies", "PUT", "{id}");
        }
      };
      module.exports = { CelestialBodiesModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/CelestialBodiesMetaData.js
  var require_CelestialBodiesMetaData = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/CelestialBodiesMetaData.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var CelestialBodiesMetaDataModule = class {
        constructor(http) {
          this._http = http;
          this.activateCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "{id}/activate", { "query": ["version"] });
          this.cloneCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "{id}/clone");
          this.createCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "");
          this.createCelestialBodyMetaDataWithOptions = makeOperation(http, "api/celestialBodiesMetaData", "POST", "create");
          this.deactivateCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "DELETE", "{id}");
          this.downloadCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "{id}/download");
          this.editCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "PUT", "{id}/edit");
          this.getAllCelestialBodiesMetaData = makeOperation(http, "api/celestialBodiesMetaData", "GET", "");
          this.getCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "GET", "{id}");
          this.getCelestialBodyMetaDataVersions = makeOperation(http, "api/celestialBodiesMetaData", "GET", "{id}/versions");
          this.loadAllCelestialBodyMetaDataForAvatar = makeOperation(http, "api/celestialBodiesMetaData", "GET", "load-all-for-avatar");
          this.loadCelestialBodyMetaDataFromPath = makeOperation(http, "api/celestialBodiesMetaData", "GET", "load-from-path", { "query": ["path"] });
          this.loadCelestialBodyMetaDataFromPublished = makeOperation(http, "api/celestialBodiesMetaData", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadCelestialBodyMetaDataVersion = makeOperation(http, "api/celestialBodiesMetaData", "GET", "{id}/versions/{version}");
          this.publishCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "{id}/publish");
          this.republishCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "{id}/republish", { "query": ["version"] });
          this.searchCelestialBodiesMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "search");
          this.unpublishCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateCelestialBodyMetaData = makeOperation(http, "api/celestialBodiesMetaData", "PUT", "{id}");
        }
      };
      module.exports = { CelestialBodiesMetaDataModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/CelestialSpaces.js
  var require_CelestialSpaces = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/CelestialSpaces.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var CelestialSpacesModule = class {
        constructor(http) {
          this._http = http;
          this.activateCelestialSpace = makeOperation(http, "api/celestialSpaces", "POST", "{id}/activate", { "query": ["version"] });
          this.createCelestialSpace = makeOperation(http, "api/celestialSpaces", "POST", "");
          this.createCelestialSpaceWithOptions = makeOperation(http, "api/celestialSpaces", "POST", "create");
          this.deactivateCelestialSpace = makeOperation(http, "api/celestialSpaces", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteCelestialSpace = makeOperation(http, "api/celestialSpaces", "DELETE", "{id}");
          this.downloadCelestialSpace = makeOperation(http, "api/celestialSpaces", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editCelestialSpace = makeOperation(http, "api/celestialSpaces", "POST", "{id}/edit");
          this.getAllCelestialSpaces = makeOperation(http, "api/celestialSpaces", "GET", "");
          this.getCelestialSpace = makeOperation(http, "api/celestialSpaces", "GET", "{id}");
          this.getCelestialSpaceVersions = makeOperation(http, "api/celestialSpaces", "GET", "{id}/versions");
          this.getCelestialSpacesByType = makeOperation(http, "api/celestialSpaces", "GET", "by-type/{type}");
          this.getCelestialSpacesInSpace = makeOperation(http, "api/celestialSpaces", "GET", "in-space/{parentSpaceId}");
          this.loadAllCelestialSpacesForAvatar = makeOperation(http, "api/celestialSpaces", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadCelestialSpace = makeOperation(http, "api/celestialSpaces", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadCelestialSpaceFromPath = makeOperation(http, "api/celestialSpaces", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadCelestialSpaceFromPublished = makeOperation(http, "api/celestialSpaces", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadCelestialSpaceVersion = makeOperation(http, "api/celestialSpaces", "GET", "{id}/version/{version}");
          this.publishCelestialSpace = makeOperation(http, "api/celestialSpaces", "POST", "{id}/publish");
          this.republishCelestialSpace = makeOperation(http, "api/celestialSpaces", "POST", "{id}/republish", { "query": ["version"] });
          this.searchCelestialSpaces = makeOperation(http, "api/celestialSpaces", "GET", "search", { "query": ["query"] });
          this.unpublishCelestialSpace = makeOperation(http, "api/celestialSpaces", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateCelestialSpace = makeOperation(http, "api/celestialSpaces", "PUT", "{id}");
        }
      };
      module.exports = { CelestialSpacesModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Chapters.js
  var require_Chapters = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Chapters.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var ChaptersModule = class {
        constructor(http) {
          this._http = http;
          this.activateChapter = makeOperation(http, "api/chapters", "POST", "{id}/activate", { "query": ["version"] });
          this.createChapter = makeOperation(http, "api/chapters", "POST", "");
          this.createChapterWithOptions = makeOperation(http, "api/chapters", "POST", "create");
          this.deactivateChapter = makeOperation(http, "api/chapters", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteChapter = makeOperation(http, "api/chapters", "DELETE", "{id}");
          this.downloadChapter = makeOperation(http, "api/chapters", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editChapter = makeOperation(http, "api/chapters", "POST", "{id}/edit");
          this.getAllChapters = makeOperation(http, "api/chapters", "GET", "");
          this.getChapter = makeOperation(http, "api/chapters", "GET", "{id}");
          this.getChapterVersions = makeOperation(http, "api/chapters", "GET", "{id}/versions");
          this.loadAllChaptersForAvatar = makeOperation(http, "api/chapters", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadChapter = makeOperation(http, "api/chapters", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadChapterFromPath = makeOperation(http, "api/chapters", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadChapterFromPublished = makeOperation(http, "api/chapters", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadChapterVersion = makeOperation(http, "api/chapters", "GET", "{id}/version/{version}");
          this.publishChapter = makeOperation(http, "api/chapters", "POST", "{id}/publish");
          this.republishChapter = makeOperation(http, "api/chapters", "POST", "{id}/republish", { "query": ["version"] });
          this.searchChapters = makeOperation(http, "api/chapters", "GET", "search", { "query": ["query"] });
          this.unpublishChapter = makeOperation(http, "api/chapters", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateChapter = makeOperation(http, "api/chapters", "PUT", "{id}");
        }
      };
      module.exports = { ChaptersModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Competition.js
  var require_Competition = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Competition.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var CompetitionModule = class {
        constructor(http) {
          this._http = http;
          this.getActiveTournaments = makeOperation(http, "api/competition", "GET", "tournaments", { "query": ["competitionType"] });
          this.getAvailableLeagues = makeOperation(http, "api/competition", "GET", "leagues/{competitionType}/{seasonType}");
          this.getAvatarLeague = makeOperation(http, "api/competition", "GET", "league/{avatarId}/{competitionType}/{seasonType}");
          this.getAvatarRank = makeOperation(http, "api/competition", "GET", "rank/{avatarId}/{competitionType}/{seasonType}");
          this.getLeaderboard = makeOperation(http, "api/competition", "GET", "leaderboard/{competitionType}/{seasonType}", { "query": ["limit", "offset"] });
          this.getMyLeague = makeOperation(http, "api/competition", "GET", "my-league/{competitionType}/{seasonType}");
          this.getMyRank = makeOperation(http, "api/competition", "GET", "my-rank/{competitionType}/{seasonType}");
          this.getMyStats = makeOperation(http, "api/competition", "GET", "stats/{competitionType}/{seasonType}");
          this.joinTournament = makeOperation(http, "api/competition", "POST", "tournaments/{tournamentId}/join");
        }
      };
      module.exports = { CompetitionModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Cosmic.js
  var require_Cosmic = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Cosmic.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var CosmicModule = class {
        constructor(http) {
          this._http = http;
          this.addAsteroid = makeOperation(http, "api/cosmic", "POST", "galaxy/{parentGalaxyId}/asteroid");
          this.addComet = makeOperation(http, "api/cosmic", "POST", "galaxy/{parentGalaxyId}/comet");
          this.addGalaxy = makeOperation(http, "api/cosmic", "POST", "galaxy-cluster/{parentGalaxyClusterId}/galaxy");
          this.addGalaxyCluster = makeOperation(http, "api/cosmic", "POST", "universe/{parentUniverseId}/galaxy-cluster");
          this.addMeteroid = makeOperation(http, "api/cosmic", "POST", "galaxy/{parentGalaxyId}/meteroid");
          this.addMoon = makeOperation(http, "api/cosmic", "POST", "planet/{parentPlanetId}/moon");
          this.addMultiverse = makeOperation(http, "api/cosmic", "POST", "omniverse/{parentOmniverseId}/multiverse");
          this.addPlanet = makeOperation(http, "api/cosmic", "POST", "solar-system/{parentSolarSystemId}/planet");
          this.addSolarSystem = makeOperation(http, "api/cosmic", "POST", "galaxy/{parentGalaxyId}/solar-system");
          this.addStar = makeOperation(http, "api/cosmic", "POST", "galaxy/{parentGalaxyId}/star");
          this.addUniverse = makeOperation(http, "api/cosmic", "POST", "multiverse/{parentMultiverseId}/universe");
          this.deleteAsteroid = makeOperation(http, "api/cosmic", "DELETE", "asteroid/{asteroidId}", { "query": ["softDelete", "providerType"] });
          this.deleteBlackHole = makeOperation(http, "api/cosmic", "DELETE", "blackhole/{blackHoleId}", { "query": ["softDelete", "providerType"] });
          this.deleteComet = makeOperation(http, "api/cosmic", "DELETE", "comet/{cometId}", { "query": ["softDelete", "providerType"] });
          this.deleteCosmicRay = makeOperation(http, "api/cosmic", "DELETE", "cosmic-ray/{rayId}", { "query": ["softDelete", "providerType"] });
          this.deleteCosmicWave = makeOperation(http, "api/cosmic", "DELETE", "cosmic-wave/{waveId}", { "query": ["softDelete", "providerType"] });
          this.deleteGalaxy = makeOperation(http, "api/cosmic", "DELETE", "galaxy/{galaxyId}", { "query": ["softDelete", "providerType"] });
          this.deleteGalaxyCluster = makeOperation(http, "api/cosmic", "DELETE", "galaxy-cluster/{galaxyClusterId}", { "query": ["softDelete", "providerType"] });
          this.deleteGravitationalWave = makeOperation(http, "api/cosmic", "DELETE", "gravitational-wave/{waveId}", { "query": ["softDelete", "providerType"] });
          this.deleteMeteroid = makeOperation(http, "api/cosmic", "DELETE", "meteroid/{meteroidId}", { "query": ["softDelete", "providerType"] });
          this.deleteMoon = makeOperation(http, "api/cosmic", "DELETE", "moon/{moonId}", { "query": ["softDelete", "providerType"] });
          this.deleteMultiverse = makeOperation(http, "api/cosmic", "DELETE", "multiverse/{multiverseId}", { "query": ["softDelete", "providerType"] });
          this.deleteNebula = makeOperation(http, "api/cosmic", "DELETE", "nebula/{nebulaId}", { "query": ["softDelete", "providerType"] });
          this.deleteOmniverse = makeOperation(http, "api/cosmic", "DELETE", "omniverse/{omniverseId}", { "query": ["softDelete", "providerType"] });
          this.deletePlanet = makeOperation(http, "api/cosmic", "DELETE", "planet/{planetId}", { "query": ["softDelete", "providerType"] });
          this.deletePortal = makeOperation(http, "api/cosmic", "DELETE", "portal/{portalId}", { "query": ["softDelete", "providerType"] });
          this.deleteSolarSystem = makeOperation(http, "api/cosmic", "DELETE", "solar-system/{solarSystemId}", { "query": ["softDelete", "providerType"] });
          this.deleteSpaceTimeAbnormally = makeOperation(http, "api/cosmic", "DELETE", "spacetime-abnormally/{abnormallyId}", { "query": ["softDelete", "providerType"] });
          this.deleteSpaceTimeDistortion = makeOperation(http, "api/cosmic", "DELETE", "spacetime-distortion/{distortionId}", { "query": ["softDelete", "providerType"] });
          this.deleteStar = makeOperation(http, "api/cosmic", "DELETE", "star/{starId}", { "query": ["softDelete", "providerType"] });
          this.deleteStarDust = makeOperation(http, "api/cosmic", "DELETE", "stardust/{starDustId}", { "query": ["softDelete", "providerType"] });
          this.deleteStarGate = makeOperation(http, "api/cosmic", "DELETE", "stargate/{starGateId}", { "query": ["softDelete", "providerType"] });
          this.deleteSuperVerse = makeOperation(http, "api/cosmic", "DELETE", "superverse/{superVerseId}", { "query": ["softDelete", "providerType"] });
          this.deleteTemporalRift = makeOperation(http, "api/cosmic", "DELETE", "temporal-rift/{riftId}", { "query": ["softDelete", "providerType"] });
          this.deleteUniverse = makeOperation(http, "api/cosmic", "DELETE", "universe/{universeId}", { "query": ["softDelete", "providerType"] });
          this.deleteWormHole = makeOperation(http, "api/cosmic", "DELETE", "wormhole/{wormHoleId}", { "query": ["softDelete", "providerType"] });
          this.getChildrenForParent = makeOperation(http, "api/cosmic", "GET", "children/{parentId}", { "query": ["parentHolonType", "childHolonType"] });
          this.getMoonsForGalaxy = makeOperation(http, "api/cosmic", "GET", "galaxy/{galaxyId}/moons");
          this.getOmniverse = makeOperation(http, "api/cosmic", "GET", "omniverse");
          this.getPlanetsForGalaxy = makeOperation(http, "api/cosmic", "GET", "galaxy/{galaxyId}/planets");
          this.getPlanetsForSolarSystem = makeOperation(http, "api/cosmic", "GET", "solar-system/{solarSystemId}/planets");
          this.getSolarSystemsForGalaxy = makeOperation(http, "api/cosmic", "GET", "galaxy/{galaxyId}/solar-systems");
          this.getStarsForGalaxy = makeOperation(http, "api/cosmic", "GET", "galaxy/{galaxyId}/stars");
          this.saveOmniverse = makeOperation(http, "api/cosmic", "POST", "omniverse");
          this.searchChildrenForParent = makeOperation(http, "api/cosmic", "GET", "search-children", { "query": ["searchTerm", "parentId", "parentHolonType", "childHolonType"] });
          this.searchHolonsForParent = makeOperation(http, "api/cosmic", "GET", "search-holons", { "query": ["searchTerm", "parentId", "parentHolonType", "childHolonType"] });
          this.searchHolonsForParentSync = makeOperation(http, "api/cosmic", "GET", "search-holons-sync", { "query": ["searchTerm", "parentId", "parentHolonType", "childHolonType", "searchOnlyForCurrentAvatar", "providerType"] });
          this.updateAsteroid = makeOperation(http, "api/cosmic", "PUT", "asteroid", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateBlackHole = makeOperation(http, "api/cosmic", "PUT", "blackhole", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateComet = makeOperation(http, "api/cosmic", "PUT", "comet", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateCosmicRay = makeOperation(http, "api/cosmic", "PUT", "cosmic-ray", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateCosmicWave = makeOperation(http, "api/cosmic", "PUT", "cosmic-wave", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateGalaxy = makeOperation(http, "api/cosmic", "PUT", "galaxy", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateGalaxyCluster = makeOperation(http, "api/cosmic", "PUT", "galaxy-cluster", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateGravitationalWave = makeOperation(http, "api/cosmic", "PUT", "gravitational-wave", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateMeteroid = makeOperation(http, "api/cosmic", "PUT", "meteroid", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateMoon = makeOperation(http, "api/cosmic", "PUT", "moon", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateMultiverse = makeOperation(http, "api/cosmic", "PUT", "multiverse", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateNebula = makeOperation(http, "api/cosmic", "PUT", "nebula", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateOmniverse = makeOperation(http, "api/cosmic", "PUT", "omniverse", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updatePlanet = makeOperation(http, "api/cosmic", "PUT", "planet", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updatePortal = makeOperation(http, "api/cosmic", "PUT", "portal", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateSolarSystem = makeOperation(http, "api/cosmic", "PUT", "solar-system", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateSpaceTimeAbnormally = makeOperation(http, "api/cosmic", "PUT", "spacetime-abnormally", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateSpaceTimeDistortion = makeOperation(http, "api/cosmic", "PUT", "spacetime-distortion", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateStar = makeOperation(http, "api/cosmic", "PUT", "star", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateStarDust = makeOperation(http, "api/cosmic", "PUT", "stardust", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateStarGate = makeOperation(http, "api/cosmic", "PUT", "stargate", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateSuperVerse = makeOperation(http, "api/cosmic", "PUT", "superverse", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateTemporalRift = makeOperation(http, "api/cosmic", "PUT", "temporal-rift", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateUniverse = makeOperation(http, "api/cosmic", "PUT", "universe", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
          this.updateWormHole = makeOperation(http, "api/cosmic", "PUT", "wormhole", { "query": ["saveChildren", "recursive", "maxChildDepth", "continueOnError", "saveChildrenOnProvider", "providerType"] });
        }
      };
      module.exports = { CosmicModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Games.js
  var require_Games = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Games.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var GamesModule = class {
        constructor(http) {
          this._http = http;
          this.activateGame = makeOperation(http, "api/games", "POST", "{id}/activate", { "query": ["version"] });
          this.addItemToInventory = makeOperation(http, "api/games", "POST", "shared-inventory/add");
          this.bindKeys = makeOperation(http, "api/games", "POST", "{gameId}/input/bind-keys");
          this.cloneGame = makeOperation(http, "api/games", "POST", "{id}/clone");
          this.createGame = makeOperation(http, "api/games", "POST", "");
          this.createGameWithOptions = makeOperation(http, "api/games", "POST", "create");
          this.deactivateGame = makeOperation(http, "api/games", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteGame = makeOperation(http, "api/games", "DELETE", "{id}");
          this.downloadGame = makeOperation(http, "api/games", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editGame = makeOperation(http, "api/games", "POST", "{id}/edit");
          this.endGame = makeOperation(http, "api/games", "POST", "{gameId}/end");
          this.getAllGames = makeOperation(http, "api/games", "GET", "");
          this.getAvatarKarma = makeOperation(http, "api/games", "GET", "karma");
          this.getCrossGameQuests = makeOperation(http, "api/games", "GET", "cross-game-quests");
          this.getGame = makeOperation(http, "api/games", "GET", "{id}");
          this.getGameVersions = makeOperation(http, "api/games", "GET", "{id}/versions");
          this.getGamesByType = makeOperation(http, "api/games", "GET", "by-type/{type}");
          this.getKeyBindings = makeOperation(http, "api/games", "GET", "{gameId}/input/bind-keys");
          this.getMasterVolume = makeOperation(http, "api/games", "GET", "{gameId}/audio/master-volume");
          this.getSharedInventory = makeOperation(http, "api/games", "GET", "shared-inventory");
          this.getSoundVolume = makeOperation(http, "api/games", "GET", "{gameId}/audio/sound-volume");
          this.getVideoSetting = makeOperation(http, "api/games", "GET", "{gameId}/video/setting");
          this.getVoiceVolume = makeOperation(http, "api/games", "GET", "{gameId}/audio/voice-volume");
          this.hasItem = makeOperation(http, "api/games", "GET", "shared-inventory/{itemId}/has");
          this.hasItemByName = makeOperation(http, "api/games", "GET", "shared-inventory/has-by-name", { "query": ["itemName"] });
          this.installGame = makeOperation(http, "api/games", "POST", "{id}/install", { "query": ["version", "installPath"] });
          this.jumpToArea = makeOperation(http, "api/games", "POST", "{gameId}/areas/jump");
          this.jumpToLevel = makeOperation(http, "api/games", "POST", "{gameId}/levels/{level}/jump");
          this.jumpToPointInLevel = makeOperation(http, "api/games", "POST", "{gameId}/levels/{level}/jump-to-point");
          this.loadAllGamesForAvatar = makeOperation(http, "api/games", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadArea = makeOperation(http, "api/games", "POST", "{gameId}/areas/load");
          this.loadGame = makeOperation(http, "api/games", "POST", "{gameId}/load");
          this.loadGameById = makeOperation(http, "api/games", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadGameFromPath = makeOperation(http, "api/games", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadGameFromPublished = makeOperation(http, "api/games", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadGameVersion = makeOperation(http, "api/games", "GET", "{id}/version/{version}");
          this.loadLevel = makeOperation(http, "api/games", "POST", "{gameId}/levels/{level}/load");
          this.publishGame = makeOperation(http, "api/games", "POST", "{id}/publish");
          this.removeItemFromInventory = makeOperation(http, "api/games", "DELETE", "shared-inventory/{itemId}");
          this.republishGame = makeOperation(http, "api/games", "POST", "{id}/republish");
          this.searchGames = makeOperation(http, "api/games", "GET", "search", { "query": ["query"] });
          this.setMasterVolume = makeOperation(http, "api/games", "POST", "{gameId}/audio/master-volume");
          this.setSoundVolume = makeOperation(http, "api/games", "POST", "{gameId}/audio/sound-volume");
          this.setVideoSetting = makeOperation(http, "api/games", "POST", "{gameId}/video/setting");
          this.setVoiceVolume = makeOperation(http, "api/games", "POST", "{gameId}/audio/voice-volume");
          this.showCredits = makeOperation(http, "api/games", "POST", "{gameId}/ui/credits");
          this.showMainMenu = makeOperation(http, "api/games", "POST", "{gameId}/ui/main-menu");
          this.showOptions = makeOperation(http, "api/games", "POST", "{gameId}/ui/options");
          this.showTitleScreen = makeOperation(http, "api/games", "POST", "{gameId}/ui/title-screen");
          this.startGame = makeOperation(http, "api/games", "POST", "{gameId}/start");
          this.unloadArea = makeOperation(http, "api/games", "POST", "{gameId}/areas/{areaId}/unload");
          this.unloadGame = makeOperation(http, "api/games", "POST", "{gameId}/unload");
          this.unloadLevel = makeOperation(http, "api/games", "POST", "{gameId}/levels/{level}/unload");
          this.unpublishGame = makeOperation(http, "api/games", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateGame = makeOperation(http, "api/games", "PUT", "{id}");
        }
      };
      module.exports = { GamesModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/GeoHotSpots.js
  var require_GeoHotSpots = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/GeoHotSpots.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var GeoHotSpotsModule = class {
        constructor(http) {
          this._http = http;
          this.activateGeoHotSpot = makeOperation(http, "api/geoHotSpots", "POST", "{id}/activate", { "query": ["version"] });
          this.createGeoHotSpot = makeOperation(http, "api/geoHotSpots", "POST", "");
          this.createGeoHotSpotWithOptions = makeOperation(http, "api/geoHotSpots", "POST", "create");
          this.deactivateGeoHotSpot = makeOperation(http, "api/geoHotSpots", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteGeoHotSpot = makeOperation(http, "api/geoHotSpots", "DELETE", "{id}");
          this.downloadGeoHotSpot = makeOperation(http, "api/geoHotSpots", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editGeoHotSpot = makeOperation(http, "api/geoHotSpots", "POST", "{id}/edit");
          this.getAllGeoHotSpots = makeOperation(http, "api/geoHotSpots", "GET", "");
          this.getGeoHotSpot = makeOperation(http, "api/geoHotSpots", "GET", "{id}");
          this.getGeoHotSpotVersions = makeOperation(http, "api/geoHotSpots", "GET", "{id}/versions");
          this.getNearbyGeoHotSpots = makeOperation(http, "api/geoHotSpots", "GET", "nearby", { "query": ["latitude", "longitude", "radiusKm"] });
          this.loadAllGeoHotSpotsForAvatar = makeOperation(http, "api/geoHotSpots", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadGeoHotSpot = makeOperation(http, "api/geoHotSpots", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadGeoHotSpotFromPath = makeOperation(http, "api/geoHotSpots", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadGeoHotSpotFromPublished = makeOperation(http, "api/geoHotSpots", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadGeoHotSpotVersion = makeOperation(http, "api/geoHotSpots", "GET", "{id}/version/{version}");
          this.publishGeoHotSpot = makeOperation(http, "api/geoHotSpots", "POST", "{id}/publish");
          this.republishGeoHotSpot = makeOperation(http, "api/geoHotSpots", "POST", "{id}/republish", { "query": ["version"] });
          this.unpublishGeoHotSpot = makeOperation(http, "api/geoHotSpots", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateGeoHotSpot = makeOperation(http, "api/geoHotSpots", "PUT", "{id}");
        }
      };
      module.exports = { GeoHotSpotsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/GeoNFTs.js
  var require_GeoNFTs = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/GeoNFTs.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var GeoNFTsModule = class {
        constructor(http) {
          this._http = http;
          this.activateGeoNFT = makeOperation(http, "api/geoNFTs", "POST", "{id}/activate", { "query": ["version"] });
          this.createGeoNFT = makeOperation(http, "api/geoNFTs", "POST", "");
          this.createGeoNFTWithOptions = makeOperation(http, "api/geoNFTs", "POST", "create");
          this.deactivateGeoNFT = makeOperation(http, "api/geoNFTs", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteGeoNFT = makeOperation(http, "api/geoNFTs", "DELETE", "{id}");
          this.downloadGeoNFT = makeOperation(http, "api/geoNFTs", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editGeoNFT = makeOperation(http, "api/geoNFTs", "POST", "{id}/edit");
          this.getAllGeoNFTs = makeOperation(http, "api/geoNFTs", "GET", "");
          this.getGeoNFT = makeOperation(http, "api/geoNFTs", "GET", "{id}");
          this.getGeoNFTVersions = makeOperation(http, "api/geoNFTs", "GET", "{id}/versions");
          this.getGeoNFTsByAvatar = makeOperation(http, "api/geoNFTs", "GET", "by-avatar/{avatarId}");
          this.getNearbyGeoNFTs = makeOperation(http, "api/geoNFTs", "GET", "nearby", { "query": ["latitude", "longitude", "radiusKm"] });
          this.loadAllGeoNFTsForAvatar = makeOperation(http, "api/geoNFTs", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadGeoNFT = makeOperation(http, "api/geoNFTs", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadGeoNFTFromPath = makeOperation(http, "api/geoNFTs", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadGeoNFTFromPublished = makeOperation(http, "api/geoNFTs", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadGeoNFTVersion = makeOperation(http, "api/geoNFTs", "GET", "{id}/version/{version}");
          this.publishGeoNFT = makeOperation(http, "api/geoNFTs", "POST", "{id}/publish");
          this.republishGeoNFT = makeOperation(http, "api/geoNFTs", "POST", "{id}/republish", { "query": ["version"] });
          this.searchGeoNFTs = makeOperation(http, "api/geoNFTs", "GET", "search", { "query": ["query"] });
          this.unpublishGeoNFT = makeOperation(http, "api/geoNFTs", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateGeoNFT = makeOperation(http, "api/geoNFTs", "PUT", "{id}");
        }
      };
      module.exports = { GeoNFTsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Health.js
  var require_Health = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Health.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var HealthModule = class {
        constructor(http) {
          this._http = http;
          this.get = makeOperation(http, "api/health", "GET", "");
          this.health = makeOperation(http, "api/health", "GET", "health");
        }
      };
      module.exports = { HealthModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Holons.js
  var require_Holons = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Holons.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var HolonsModule = class {
        constructor(http) {
          this._http = http;
          this.activateHolon = makeOperation(http, "api/holons", "POST", "{id}/activate", { "query": ["version"] });
          this.createHolon = makeOperation(http, "api/holons", "POST", "");
          this.createHolonWithOptions = makeOperation(http, "api/holons", "POST", "create");
          this.deactivateHolon = makeOperation(http, "api/holons", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteHolon = makeOperation(http, "api/holons", "DELETE", "{id}");
          this.downloadHolon = makeOperation(http, "api/holons", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editHolon = makeOperation(http, "api/holons", "POST", "{id}/edit");
          this.getAllHolons = makeOperation(http, "api/holons", "GET", "");
          this.getHolon = makeOperation(http, "api/holons", "GET", "{id}");
          this.getHolonVersions = makeOperation(http, "api/holons", "GET", "{id}/versions");
          this.getHolonsByMetadata = makeOperation(http, "api/holons", "GET", "by-metadata", { "query": ["key", "value"] });
          this.getHolonsByParent = makeOperation(http, "api/holons", "GET", "by-parent/{parentId}");
          this.getHolonsByStatus = makeOperation(http, "api/holons", "GET", "by-status/{status}");
          this.getHolonsByType = makeOperation(http, "api/holons", "GET", "by-type/{type}");
          this.loadAllHolonsForAvatar = makeOperation(http, "api/holons", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadHolon = makeOperation(http, "api/holons", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadHolonFromPath = makeOperation(http, "api/holons", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadHolonFromPublished = makeOperation(http, "api/holons", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadHolonVersion = makeOperation(http, "api/holons", "GET", "{id}/version/{version}");
          this.publishHolon = makeOperation(http, "api/holons", "POST", "{id}/publish");
          this.republishHolon = makeOperation(http, "api/holons", "POST", "{id}/republish", { "query": ["version"] });
          this.searchHolons = makeOperation(http, "api/holons", "GET", "search", { "query": ["query"] });
          this.unpublishHolon = makeOperation(http, "api/holons", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateHolon = makeOperation(http, "api/holons", "PUT", "{id}");
        }
      };
      module.exports = { HolonsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/HolonsMetaData.js
  var require_HolonsMetaData = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/HolonsMetaData.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var HolonsMetaDataModule = class {
        constructor(http) {
          this._http = http;
          this.activateHolonMetaData = makeOperation(http, "api/holonsMetaData", "POST", "{id}/activate", { "query": ["version"] });
          this.cloneHolonMetaData = makeOperation(http, "api/holonsMetaData", "POST", "{id}/clone");
          this.createHolonMetaData = makeOperation(http, "api/holonsMetaData", "POST", "");
          this.createHolonMetaDataWithOptions = makeOperation(http, "api/holonsMetaData", "POST", "create");
          this.deactivateHolonMetaData = makeOperation(http, "api/holonsMetaData", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteHolonMetaData = makeOperation(http, "api/holonsMetaData", "DELETE", "{id}");
          this.downloadHolonMetaData = makeOperation(http, "api/holonsMetaData", "POST", "{id}/download");
          this.editHolonMetaData = makeOperation(http, "api/holonsMetaData", "PUT", "{id}/edit");
          this.getAllHolonsMetaData = makeOperation(http, "api/holonsMetaData", "GET", "");
          this.getHolonMetaData = makeOperation(http, "api/holonsMetaData", "GET", "{id}");
          this.getHolonMetaDataVersions = makeOperation(http, "api/holonsMetaData", "GET", "{id}/versions");
          this.loadAllHolonMetaDataForAvatar = makeOperation(http, "api/holonsMetaData", "GET", "load-all-for-avatar");
          this.loadHolonMetaDataFromPath = makeOperation(http, "api/holonsMetaData", "GET", "load-from-path", { "query": ["path"] });
          this.loadHolonMetaDataFromPublished = makeOperation(http, "api/holonsMetaData", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadHolonMetaDataVersion = makeOperation(http, "api/holonsMetaData", "GET", "{id}/versions/{version}");
          this.publishHolonMetaData = makeOperation(http, "api/holonsMetaData", "POST", "{id}/publish");
          this.republishHolonMetaData = makeOperation(http, "api/holonsMetaData", "POST", "{id}/republish", { "query": ["version"] });
          this.searchHolonsMetaData = makeOperation(http, "api/holonsMetaData", "POST", "search");
          this.unpublishHolonMetaData = makeOperation(http, "api/holonsMetaData", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateHolonMetaData = makeOperation(http, "api/holonsMetaData", "PUT", "{id}");
        }
      };
      module.exports = { HolonsMetaDataModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/InventoryItems.js
  var require_InventoryItems = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/InventoryItems.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var InventoryItemsModule = class {
        constructor(http) {
          this._http = http;
          this.activateInventoryItem = makeOperation(http, "api/inventoryItems", "POST", "{id}/activate", { "query": ["version"] });
          this.createInventoryItem = makeOperation(http, "api/inventoryItems", "POST", "");
          this.createInventoryItemWithOptions = makeOperation(http, "api/inventoryItems", "POST", "create");
          this.deactivateInventoryItem = makeOperation(http, "api/inventoryItems", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteInventoryItem = makeOperation(http, "api/inventoryItems", "DELETE", "{id}");
          this.downloadInventoryItem = makeOperation(http, "api/inventoryItems", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editInventoryItem = makeOperation(http, "api/inventoryItems", "POST", "{id}/edit");
          this.getAllInventoryItems = makeOperation(http, "api/inventoryItems", "GET", "");
          this.getInventoryItem = makeOperation(http, "api/inventoryItems", "GET", "{id}");
          this.getInventoryItemVersions = makeOperation(http, "api/inventoryItems", "GET", "{id}/versions");
          this.getInventoryItemsByAvatar = makeOperation(http, "api/inventoryItems", "GET", "by-avatar/{avatarId}");
          this.loadAllInventoryItemsForAvatar = makeOperation(http, "api/inventoryItems", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadInventoryItem = makeOperation(http, "api/inventoryItems", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadInventoryItemFromPath = makeOperation(http, "api/inventoryItems", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadInventoryItemFromPublished = makeOperation(http, "api/inventoryItems", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadInventoryItemVersion = makeOperation(http, "api/inventoryItems", "GET", "{id}/version/{version}");
          this.publishInventoryItem = makeOperation(http, "api/inventoryItems", "POST", "{id}/publish");
          this.republishInventoryItem = makeOperation(http, "api/inventoryItems", "POST", "{id}/republish", { "query": ["version"] });
          this.searchInventoryItems = makeOperation(http, "api/inventoryItems", "POST", "search");
          this.unpublishInventoryItem = makeOperation(http, "api/inventoryItems", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateInventoryItem = makeOperation(http, "api/inventoryItems", "PUT", "{id}");
        }
      };
      module.exports = { InventoryItemsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Libraries.js
  var require_Libraries = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Libraries.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var LibrariesModule = class {
        constructor(http) {
          this._http = http;
          this.activateLibrary = makeOperation(http, "api/libraries", "POST", "{id}/activate", { "query": ["version"] });
          this.cloneLibrary = makeOperation(http, "api/libraries", "POST", "{id}/clone");
          this.createLibrary = makeOperation(http, "api/libraries", "POST", "");
          this.createLibraryWithOptions = makeOperation(http, "api/libraries", "POST", "create");
          this.deactivateLibrary = makeOperation(http, "api/libraries", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteLibrary = makeOperation(http, "api/libraries", "DELETE", "{id}");
          this.downloadLibrary = makeOperation(http, "api/libraries", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editLibrary = makeOperation(http, "api/libraries", "POST", "{id}/edit");
          this.getAllLibraries = makeOperation(http, "api/libraries", "GET", "");
          this.getLibrariesByCategory = makeOperation(http, "api/libraries", "GET", "by-category/{category}");
          this.getLibrary = makeOperation(http, "api/libraries", "GET", "{id}");
          this.getLibraryVersions = makeOperation(http, "api/libraries", "GET", "{id}/versions");
          this.loadAllLibrariesForAvatar = makeOperation(http, "api/libraries", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadLibrary = makeOperation(http, "api/libraries", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadLibraryFromPath = makeOperation(http, "api/libraries", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadLibraryFromPublished = makeOperation(http, "api/libraries", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadLibraryVersion = makeOperation(http, "api/libraries", "GET", "{id}/version/{version}");
          this.publishLibrary = makeOperation(http, "api/libraries", "POST", "{id}/publish");
          this.republishLibrary = makeOperation(http, "api/libraries", "POST", "{id}/republish", { "query": ["version"] });
          this.searchLibraries = makeOperation(http, "api/libraries", "GET", "search", { "query": ["searchTerm"] });
          this.unpublishLibrary = makeOperation(http, "api/libraries", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateLibrary = makeOperation(http, "api/libraries", "PUT", "{id}");
        }
      };
      module.exports = { LibrariesModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Missions.js
  var require_Missions = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Missions.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var MissionsModule = class {
        constructor(http) {
          this._http = http;
          this.activateMission = makeOperation(http, "api/missions", "POST", "{id}/activate", { "query": ["version"] });
          this.cloneMission = makeOperation(http, "api/missions", "POST", "{id}/clone");
          this.completeMission = makeOperation(http, "api/missions", "POST", "{id}/complete", { "bodyParam": "completionNotes" });
          this.createMission = makeOperation(http, "api/missions", "POST", "");
          this.createMissionWithOptions = makeOperation(http, "api/missions", "POST", "create");
          this.deactivateMission = makeOperation(http, "api/missions", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteMission = makeOperation(http, "api/missions", "DELETE", "{id}");
          this.downloadMission = makeOperation(http, "api/missions", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editMission = makeOperation(http, "api/missions", "POST", "{id}/edit");
          this.getAllMissions = makeOperation(http, "api/missions", "GET", "");
          this.getMission = makeOperation(http, "api/missions", "GET", "{id}");
          this.getMissionLeaderboard = makeOperation(http, "api/missions", "GET", "{id}/leaderboard", { "query": ["limit"] });
          this.getMissionRewards = makeOperation(http, "api/missions", "GET", "{id}/rewards");
          this.getMissionStats = makeOperation(http, "api/missions", "GET", "stats");
          this.getMissionVersions = makeOperation(http, "api/missions", "GET", "{id}/versions");
          this.getMissionsByStatus = makeOperation(http, "api/missions", "GET", "by-status/{status}");
          this.getMissionsByType = makeOperation(http, "api/missions", "GET", "by-type/{type}");
          this.loadAllMissionsForAvatar = makeOperation(http, "api/missions", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadMission = makeOperation(http, "api/missions", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadMissionFromPath = makeOperation(http, "api/missions", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadMissionFromPublished = makeOperation(http, "api/missions", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadMissionVersion = makeOperation(http, "api/missions", "GET", "{id}/version/{version}");
          this.publishMission = makeOperation(http, "api/missions", "POST", "{id}/publish");
          this.republishMission = makeOperation(http, "api/missions", "POST", "{id}/republish", { "query": ["version"] });
          this.searchMissions = makeOperation(http, "api/missions", "GET", "search", { "query": ["query"] });
          this.unpublishMission = makeOperation(http, "api/missions", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateMission = makeOperation(http, "api/missions", "PUT", "{id}");
        }
      };
      module.exports = { MissionsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/NFTs.js
  var require_NFTs = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/NFTs.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var NFTsModule = class {
        constructor(http) {
          this._http = http;
          this.activateNFT = makeOperation(http, "api/nFTs", "POST", "{id}/activate", { "query": ["version"] });
          this.cloneNFT = makeOperation(http, "api/nFTs", "POST", "{id}/clone");
          this.createNFT = makeOperation(http, "api/nFTs", "POST", "");
          this.createNFTWithOptions = makeOperation(http, "api/nFTs", "POST", "create");
          this.deactivateNFT = makeOperation(http, "api/nFTs", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteNFT = makeOperation(http, "api/nFTs", "DELETE", "{id}");
          this.downloadNFT = makeOperation(http, "api/nFTs", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editNFT = makeOperation(http, "api/nFTs", "POST", "{id}/edit");
          this.getAllNFTs = makeOperation(http, "api/nFTs", "GET", "");
          this.getNFT = makeOperation(http, "api/nFTs", "GET", "{id}");
          this.getNFTVersions = makeOperation(http, "api/nFTs", "GET", "{id}/versions");
          this.loadAllNFTsForAvatar = makeOperation(http, "api/nFTs", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadNFT = makeOperation(http, "api/nFTs", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadNFTFromPath = makeOperation(http, "api/nFTs", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadNFTFromPublished = makeOperation(http, "api/nFTs", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadNFTVersion = makeOperation(http, "api/nFTs", "GET", "{id}/version/{version}");
          this.publishNFT = makeOperation(http, "api/nFTs", "POST", "{id}/publish");
          this.republishNFT = makeOperation(http, "api/nFTs", "POST", "{id}/republish", { "query": ["version"] });
          this.searchNFTs = makeOperation(http, "api/nFTs", "GET", "search", { "query": ["searchTerm", "searchOnlyForCurrentAvatar", "showAllVersions", "version"] });
          this.unpublishNFT = makeOperation(http, "api/nFTs", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateNFT = makeOperation(http, "api/nFTs", "PUT", "{id}");
        }
      };
      module.exports = { NFTsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/OAPPs.js
  var require_OAPPs = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/OAPPs.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var OAPPsModule = class {
        constructor(http) {
          this._http = http;
          this.activateOAPP = makeOperation(http, "api/oAPPs", "POST", "{id}/activate", { "query": ["version"] });
          this.cloneOAPP = makeOperation(http, "api/oAPPs", "POST", "{id}/clone");
          this.createOAPP = makeOperation(http, "api/oAPPs", "POST", "");
          this.createOAPPWithOptions = makeOperation(http, "api/oAPPs", "POST", "create");
          this.deactivateOAPP = makeOperation(http, "api/oAPPs", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteOAPP = makeOperation(http, "api/oAPPs", "DELETE", "{id}");
          this.downloadOAPP = makeOperation(http, "api/oAPPs", "POST", "{id}/download");
          this.editOAPP = makeOperation(http, "api/oAPPs", "PUT", "{id}/edit");
          this.getAllOAPPs = makeOperation(http, "api/oAPPs", "GET", "");
          this.getOAPP = makeOperation(http, "api/oAPPs", "GET", "{id}");
          this.getOAPPVersions = makeOperation(http, "api/oAPPs", "GET", "{id}/versions");
          this.loadAllOAPPsForAvatar = makeOperation(http, "api/oAPPs", "GET", "load-all-for-avatar");
          this.loadOAPPFromPath = makeOperation(http, "api/oAPPs", "GET", "load-from-path", { "query": ["path"] });
          this.loadOAPPFromPublished = makeOperation(http, "api/oAPPs", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadOAPPVersion = makeOperation(http, "api/oAPPs", "GET", "{id}/versions/{version}");
          this.publishOAPP = makeOperation(http, "api/oAPPs", "POST", "{id}/publish");
          this.republishOAPP = makeOperation(http, "api/oAPPs", "POST", "{id}/republish", { "query": ["version"] });
          this.searchOAPPs = makeOperation(http, "api/oAPPs", "POST", "search");
          this.unpublishOAPP = makeOperation(http, "api/oAPPs", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateOAPP = makeOperation(http, "api/oAPPs", "PUT", "{id}");
        }
      };
      module.exports = { OAPPsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Parks.js
  var require_Parks = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Parks.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var ParksModule = class {
        constructor(http) {
          this._http = http;
          this.activatePark = makeOperation(http, "api/parks", "POST", "{id}/activate", { "query": ["version"] });
          this.createPark = makeOperation(http, "api/parks", "POST", "");
          this.createParkWithOptions = makeOperation(http, "api/parks", "POST", "create");
          this.deactivatePark = makeOperation(http, "api/parks", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deletePark = makeOperation(http, "api/parks", "DELETE", "{id}");
          this.downloadPark = makeOperation(http, "api/parks", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editPark = makeOperation(http, "api/parks", "POST", "{id}/edit");
          this.getAllParks = makeOperation(http, "api/parks", "GET", "");
          this.getNearbyParks = makeOperation(http, "api/parks", "GET", "nearby", { "query": ["latitude", "longitude", "radiusKm"] });
          this.getPark = makeOperation(http, "api/parks", "GET", "{id}");
          this.getParkVersions = makeOperation(http, "api/parks", "GET", "{id}/versions");
          this.getParksByType = makeOperation(http, "api/parks", "GET", "by-type/{type}");
          this.loadAllParksForAvatar = makeOperation(http, "api/parks", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadPark = makeOperation(http, "api/parks", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadParkFromPath = makeOperation(http, "api/parks", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadParkFromPublished = makeOperation(http, "api/parks", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadParkVersion = makeOperation(http, "api/parks", "GET", "{id}/version/{version}");
          this.publishPark = makeOperation(http, "api/parks", "POST", "{id}/publish");
          this.republishPark = makeOperation(http, "api/parks", "POST", "{id}/republish", { "query": ["version"] });
          this.searchParks = makeOperation(http, "api/parks", "POST", "search");
          this.unpublishPark = makeOperation(http, "api/parks", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updatePark = makeOperation(http, "api/parks", "PUT", "{id}");
        }
      };
      module.exports = { ParksModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Plugins.js
  var require_Plugins = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Plugins.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var PluginsModule = class {
        constructor(http) {
          this._http = http;
          this.activatePlugin = makeOperation(http, "api/plugins", "POST", "{id}/activate", { "query": ["version"] });
          this.clonePlugin = makeOperation(http, "api/plugins", "POST", "{id}/clone");
          this.createPlugin = makeOperation(http, "api/plugins", "POST", "");
          this.createPluginWithOptions = makeOperation(http, "api/plugins", "POST", "create");
          this.deactivatePlugin = makeOperation(http, "api/plugins", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deletePlugin = makeOperation(http, "api/plugins", "DELETE", "{id}");
          this.downloadPlugin = makeOperation(http, "api/plugins", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editPlugin = makeOperation(http, "api/plugins", "POST", "{id}/edit");
          this.getAllPlugins = makeOperation(http, "api/plugins", "GET", "");
          this.getPlugin = makeOperation(http, "api/plugins", "GET", "{id}");
          this.getPluginVersions = makeOperation(http, "api/plugins", "GET", "{id}/versions");
          this.getPluginsByType = makeOperation(http, "api/plugins", "GET", "by-type/{type}");
          this.installPlugin = makeOperation(http, "api/plugins", "POST", "{id}/install");
          this.loadAllPluginsForAvatar = makeOperation(http, "api/plugins", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadPlugin = makeOperation(http, "api/plugins", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadPluginFromPath = makeOperation(http, "api/plugins", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadPluginFromPublished = makeOperation(http, "api/plugins", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadPluginVersion = makeOperation(http, "api/plugins", "GET", "{id}/version/{version}");
          this.publishPlugin = makeOperation(http, "api/plugins", "POST", "{id}/publish");
          this.republishPlugin = makeOperation(http, "api/plugins", "POST", "{id}/republish", { "query": ["version"] });
          this.searchPlugins = makeOperation(http, "api/plugins", "GET", "search", { "query": ["searchTerm"] });
          this.uninstallPlugin = makeOperation(http, "api/plugins", "POST", "{id}/uninstall");
          this.unpublishPlugin = makeOperation(http, "api/plugins", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updatePlugin = makeOperation(http, "api/plugins", "PUT", "{id}");
        }
      };
      module.exports = { PluginsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Quests.js
  var require_Quests = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Quests.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var QuestsModule = class {
        constructor(http) {
          this._http = http;
          this.activateQuest = makeOperation(http, "api/quests", "POST", "{id}/activate", { "query": ["version"] });
          this.addQuestObjective = makeOperation(http, "api/quests", "POST", "{id}/objectives");
          this.addSubQuest = makeOperation(http, "api/quests", "POST", "{id}/subquests");
          this.applyQuestProgress = makeOperation(http, "api/quests", "POST", "{id}/progress");
          this.canStartQuest = makeOperation(http, "api/quests", "GET", "{id}/can-start");
          this.cloneQuest = makeOperation(http, "api/quests", "POST", "{id}/clone");
          this.completeQuest = makeOperation(http, "api/quests", "POST", "{id}/complete", { "bodyParam": "completionNotes" });
          this.completeQuestObjective = makeOperation(http, "api/quests", "POST", "{id}/objectives/{objectiveId}/complete");
          this.completeQuestObjectiveByIdentifiers = makeOperation(http, "api/quests", "POST", "objectives/complete");
          this.createIQuest = makeOperation(http, "api/quests", "POST", "");
          this.createQuestWithOptions = makeOperation(http, "api/quests", "POST", "create");
          this.deactivateQuest = makeOperation(http, "api/quests", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteIQuest = makeOperation(http, "api/quests", "DELETE", "{id}");
          this.downloadQuest = makeOperation(http, "api/quests", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editQuest = makeOperation(http, "api/quests", "POST", "{id}/edit");
          this.getAllIQuests = makeOperation(http, "api/quests", "GET", "");
          this.getAllQuestsForAvatar = makeOperation(http, "api/quests", "GET", "all-for-avatar");
          this.getAllQuestsForAvatarGame = makeOperation(http, "api/quests", "GET", "all-for-avatar/game");
          this.getIQuest = makeOperation(http, "api/quests", "GET", "{id}");
          this.getIQuestsByAvatar = makeOperation(http, "api/quests", "GET", "by-avatar/{avatarId}");
          this.getQuestLeaderboard = makeOperation(http, "api/quests", "GET", "{id}/leaderboard", { "query": ["limit"] });
          this.getQuestRewards = makeOperation(http, "api/quests", "GET", "{id}/rewards");
          this.getQuestStats = makeOperation(http, "api/quests", "GET", "stats");
          this.getQuestVersions = makeOperation(http, "api/quests", "GET", "{id}/versions");
          this.getQuestsByStatus = makeOperation(http, "api/quests", "GET", "by-status/{status}");
          this.getQuestsByStatusGame = makeOperation(http, "api/quests", "GET", "by-status/{status}/game");
          this.getQuestsByType = makeOperation(http, "api/quests", "GET", "by-type/{type}");
          this.loadAllQuestsForAvatar = makeOperation(http, "api/quests", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadQuest = makeOperation(http, "api/quests", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadQuestFromPath = makeOperation(http, "api/quests", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadQuestFromPublished = makeOperation(http, "api/quests", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadQuestVersion = makeOperation(http, "api/quests", "GET", "{id}/version/{version}");
          this.publishQuest = makeOperation(http, "api/quests", "POST", "{id}/publish");
          this.removeQuestObjective = makeOperation(http, "api/quests", "DELETE", "{parentId}/objectives/{objectiveId}");
          this.removeSubQuest = makeOperation(http, "api/quests", "DELETE", "{parentId}/subquests/{subQuestId}");
          this.republishQuest = makeOperation(http, "api/quests", "POST", "{id}/republish", { "query": ["version"] });
          this.resetObjectiveProgress = makeOperation(http, "api/quests", "POST", "{id}/progress/reset");
          this.searchQuests = makeOperation(http, "api/quests", "GET", "search", { "query": ["query"] });
          this.unpublishQuest = makeOperation(http, "api/quests", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateIQuest = makeOperation(http, "api/quests", "PUT", "{id}");
        }
      };
      module.exports = { QuestsModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Runtimes.js
  var require_Runtimes = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Runtimes.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var RuntimesModule = class {
        constructor(http) {
          this._http = http;
          this.activateRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/activate");
          this.cloneRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/clone");
          this.createRuntime = makeOperation(http, "api/runtimes", "POST", "");
          this.createRuntimeWithOptions = makeOperation(http, "api/runtimes", "POST", "create");
          this.deactivateRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/deactivate");
          this.deleteRuntime = makeOperation(http, "api/runtimes", "DELETE", "{id}");
          this.downloadRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/download");
          this.editRuntime = makeOperation(http, "api/runtimes", "PUT", "{id}/edit");
          this.getAllRuntimes = makeOperation(http, "api/runtimes", "GET", "");
          this.getRuntime = makeOperation(http, "api/runtimes", "GET", "{id}");
          this.getRuntimeStatus = makeOperation(http, "api/runtimes", "GET", "{id}/status");
          this.getRuntimeVersions = makeOperation(http, "api/runtimes", "GET", "{id}/versions");
          this.getRuntimesByType = makeOperation(http, "api/runtimes", "GET", "by-type/{type}");
          this.loadAllRuntimesForAvatar = makeOperation(http, "api/runtimes", "GET", "load-all-for-avatar");
          this.loadRuntimeFromPath = makeOperation(http, "api/runtimes", "GET", "load-from-path", { "query": ["path"] });
          this.loadRuntimeFromPublished = makeOperation(http, "api/runtimes", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadRuntimeVersion = makeOperation(http, "api/runtimes", "GET", "{id}/versions/{version}");
          this.publishRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/publish");
          this.republishRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/republish");
          this.searchRuntimes = makeOperation(http, "api/runtimes", "GET", "search", { "query": ["searchTerm"] });
          this.startRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/start");
          this.stopRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/stop");
          this.unpublishRuntime = makeOperation(http, "api/runtimes", "POST", "{id}/unpublish");
          this.updateRuntime = makeOperation(http, "api/runtimes", "PUT", "{id}");
        }
      };
      module.exports = { RuntimesModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/STAR.js
  var require_STAR = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/STAR.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var STARModule = class {
        constructor(http) {
          this._http = http;
          this.beamIn = makeOperation(http, "api/sTAR", "POST", "beam-in");
          this.extinguishSTAR = makeOperation(http, "api/sTAR", "POST", "extinguish");
          this.getStatus = makeOperation(http, "api/sTAR", "GET", "status");
          this.igniteSTAR = makeOperation(http, "api/sTAR", "POST", "ignite");
        }
      };
      module.exports = { STARModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Templates.js
  var require_Templates = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Templates.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var TemplatesModule = class {
        constructor(http) {
          this._http = http;
          this.activateTemplate = makeOperation(http, "api/templates", "POST", "{id}/activate");
          this.cloneTemplate = makeOperation(http, "api/templates", "POST", "{id}/clone");
          this.createTemplate = makeOperation(http, "api/templates", "POST", "");
          this.createTemplateWithOptions = makeOperation(http, "api/templates", "POST", "create");
          this.deactivateTemplate = makeOperation(http, "api/templates", "POST", "{id}/deactivate");
          this.deleteTemplate = makeOperation(http, "api/templates", "DELETE", "{id}");
          this.downloadTemplate = makeOperation(http, "api/templates", "POST", "{id}/download");
          this.editTemplate = makeOperation(http, "api/templates", "PUT", "{id}/edit");
          this.getAllTemplates = makeOperation(http, "api/templates", "GET", "");
          this.getTemplate = makeOperation(http, "api/templates", "GET", "{id}");
          this.getTemplateVersions = makeOperation(http, "api/templates", "GET", "{id}/versions");
          this.getTemplatesByType = makeOperation(http, "api/templates", "GET", "by-type/{type}");
          this.loadAllTemplatesForAvatar = makeOperation(http, "api/templates", "GET", "load-all-for-avatar");
          this.loadTemplateFromPath = makeOperation(http, "api/templates", "GET", "load-from-path", { "query": ["path"] });
          this.loadTemplateFromPublished = makeOperation(http, "api/templates", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadTemplateVersion = makeOperation(http, "api/templates", "GET", "{id}/versions/{version}");
          this.publishTemplate = makeOperation(http, "api/templates", "POST", "{id}/publish");
          this.republishTemplate = makeOperation(http, "api/templates", "POST", "{id}/republish");
          this.searchTemplates = makeOperation(http, "api/templates", "GET", "search", { "query": ["searchTerm"] });
          this.unpublishTemplate = makeOperation(http, "api/templates", "POST", "{id}/unpublish");
          this.updateTemplate = makeOperation(http, "api/templates", "PUT", "{id}");
        }
      };
      module.exports = { TemplatesModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Zomes.js
  var require_Zomes = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Zomes.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var ZomesModule = class {
        constructor(http) {
          this._http = http;
          this.activateZome = makeOperation(http, "api/zomes", "POST", "{id}/activate", { "query": ["version"] });
          this.createZome = makeOperation(http, "api/zomes", "POST", "");
          this.createZomeWithOptions = makeOperation(http, "api/zomes", "POST", "create");
          this.deactivateZome = makeOperation(http, "api/zomes", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteZome = makeOperation(http, "api/zomes", "DELETE", "{id}");
          this.downloadZome = makeOperation(http, "api/zomes", "POST", "{id}/download", { "query": ["version", "downloadPath", "reInstall"] });
          this.editZome = makeOperation(http, "api/zomes", "POST", "{id}/edit");
          this.getAllZomes = makeOperation(http, "api/zomes", "GET", "");
          this.getZome = makeOperation(http, "api/zomes", "GET", "{id}");
          this.getZomeVersions = makeOperation(http, "api/zomes", "GET", "{id}/versions");
          this.getZomesByType = makeOperation(http, "api/zomes", "GET", "by-type/{type}");
          this.getZomesInSpace = makeOperation(http, "api/zomes", "GET", "in-space/{spaceId}");
          this.loadAllZomesForAvatar = makeOperation(http, "api/zomes", "GET", "load-all-for-avatar", { "query": ["showAllVersions", "version"] });
          this.loadZome = makeOperation(http, "api/zomes", "GET", "{id}/load", { "query": ["version", "holonType"] });
          this.loadZomeFromPath = makeOperation(http, "api/zomes", "GET", "load-from-path", { "query": ["path", "holonType"] });
          this.loadZomeFromPublished = makeOperation(http, "api/zomes", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadZomeVersion = makeOperation(http, "api/zomes", "GET", "{id}/version/{version}");
          this.publishZome = makeOperation(http, "api/zomes", "POST", "{id}/publish");
          this.republishZome = makeOperation(http, "api/zomes", "POST", "{id}/republish", { "query": ["version"] });
          this.searchZomes = makeOperation(http, "api/zomes", "GET", "search", { "query": ["searchTerm", "searchOnlyForCurrentAvatar", "showAllVersions", "version"] });
          this.unpublishZome = makeOperation(http, "api/zomes", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateZome = makeOperation(http, "api/zomes", "PUT", "{id}");
        }
      };
      module.exports = { ZomesModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/ZomesMetaData.js
  var require_ZomesMetaData = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/ZomesMetaData.js"(exports, module) {
      "use strict";
      var { makeOperation } = require_routeHelper();
      var ZomesMetaDataModule = class {
        constructor(http) {
          this._http = http;
          this.activateZomeMetaData = makeOperation(http, "api/zomesMetaData", "POST", "{id}/activate", { "query": ["version"] });
          this.cloneZomeMetaData = makeOperation(http, "api/zomesMetaData", "POST", "{id}/clone");
          this.createZomeMetaData = makeOperation(http, "api/zomesMetaData", "POST", "");
          this.createZomeMetaDataWithOptions = makeOperation(http, "api/zomesMetaData", "POST", "create");
          this.deactivateZomeMetaData = makeOperation(http, "api/zomesMetaData", "POST", "{id}/deactivate", { "query": ["version"] });
          this.deleteZomeMetaData = makeOperation(http, "api/zomesMetaData", "DELETE", "{id}");
          this.downloadZomeMetaData = makeOperation(http, "api/zomesMetaData", "POST", "{id}/download");
          this.editZomeMetaData = makeOperation(http, "api/zomesMetaData", "PUT", "{id}/edit");
          this.getAllZomesMetaData = makeOperation(http, "api/zomesMetaData", "GET", "");
          this.getZomeMetaData = makeOperation(http, "api/zomesMetaData", "GET", "{id}");
          this.getZomeMetaDataVersions = makeOperation(http, "api/zomesMetaData", "GET", "{id}/versions");
          this.loadAllZomeMetaDataForAvatar = makeOperation(http, "api/zomesMetaData", "GET", "load-all-for-avatar");
          this.loadZomeMetaDataFromPath = makeOperation(http, "api/zomesMetaData", "GET", "load-from-path", { "query": ["path"] });
          this.loadZomeMetaDataFromPublished = makeOperation(http, "api/zomesMetaData", "GET", "load-from-published", { "query": ["publishedFilePath"] });
          this.loadZomeMetaDataVersion = makeOperation(http, "api/zomesMetaData", "GET", "{id}/versions/{version}");
          this.publishZomeMetaData = makeOperation(http, "api/zomesMetaData", "POST", "{id}/publish");
          this.republishZomeMetaData = makeOperation(http, "api/zomesMetaData", "POST", "{id}/republish", { "query": ["version"] });
          this.searchZomesMetaData = makeOperation(http, "api/zomesMetaData", "POST", "search");
          this.unpublishZomeMetaData = makeOperation(http, "api/zomesMetaData", "POST", "{id}/unpublish", { "query": ["version"] });
          this.updateZomeMetaData = makeOperation(http, "api/zomesMetaData", "PUT", "{id}");
        }
      };
      module.exports = { ZomesMetaDataModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/index.js
  var require_modules = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/index.js"(exports, module) {
      "use strict";
      var { AvatarModule } = require_Avatar();
      var { CelestialBodiesModule } = require_CelestialBodies();
      var { CelestialBodiesMetaDataModule } = require_CelestialBodiesMetaData();
      var { CelestialSpacesModule } = require_CelestialSpaces();
      var { ChaptersModule } = require_Chapters();
      var { CompetitionModule } = require_Competition();
      var { CosmicModule } = require_Cosmic();
      var { GamesModule } = require_Games();
      var { GeoHotSpotsModule } = require_GeoHotSpots();
      var { GeoNFTsModule } = require_GeoNFTs();
      var { HealthModule } = require_Health();
      var { HolonsModule } = require_Holons();
      var { HolonsMetaDataModule } = require_HolonsMetaData();
      var { InventoryItemsModule } = require_InventoryItems();
      var { LibrariesModule } = require_Libraries();
      var { MissionsModule } = require_Missions();
      var { NFTsModule } = require_NFTs();
      var { OAPPsModule } = require_OAPPs();
      var { ParksModule } = require_Parks();
      var { PluginsModule } = require_Plugins();
      var { QuestsModule } = require_Quests();
      var { RuntimesModule } = require_Runtimes();
      var { STARModule } = require_STAR();
      var { TemplatesModule } = require_Templates();
      var { ZomesModule } = require_Zomes();
      var { ZomesMetaDataModule } = require_ZomesMetaData();
      function attachGeneratedModules(client, http) {
        client.avatar = client.avatar || new AvatarModule(http);
        client.celestialBodies = client.celestialBodies || new CelestialBodiesModule(http);
        client.celestialBodiesMetaData = client.celestialBodiesMetaData || new CelestialBodiesMetaDataModule(http);
        client.celestialSpaces = client.celestialSpaces || new CelestialSpacesModule(http);
        client.chapters = client.chapters || new ChaptersModule(http);
        client.competition = client.competition || new CompetitionModule(http);
        client.cosmic = client.cosmic || new CosmicModule(http);
        client.games = client.games || new GamesModule(http);
        client.geoHotSpots = client.geoHotSpots || new GeoHotSpotsModule(http);
        client.geoNFTs = client.geoNFTs || new GeoNFTsModule(http);
        client.health = client.health || new HealthModule(http);
        client.holons = client.holons || new HolonsModule(http);
        client.holonsMetaData = client.holonsMetaData || new HolonsMetaDataModule(http);
        client.inventoryItems = client.inventoryItems || new InventoryItemsModule(http);
        client.libraries = client.libraries || new LibrariesModule(http);
        client.missions = client.missions || new MissionsModule(http);
        client.nFTs = client.nFTs || new NFTsModule(http);
        client.oAPPs = client.oAPPs || new OAPPsModule(http);
        client.parks = client.parks || new ParksModule(http);
        client.plugins = client.plugins || new PluginsModule(http);
        client.quests = client.quests || new QuestsModule(http);
        client.runtimes = client.runtimes || new RuntimesModule(http);
        client.sTAR = client.sTAR || new STARModule(http);
        client.templates = client.templates || new TemplatesModule(http);
        client.zomes = client.zomes || new ZomesModule(http);
        client.zomesMetaData = client.zomesMetaData || new ZomesMetaDataModule(http);
        return client;
      }
      module.exports = { attachGeneratedModules };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/modules/Auth.js
  var require_Auth = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/modules/Auth.js"(exports, module) {
      "use strict";
      var AuthModule = class {
        constructor(http, tokenStore, avatarModule) {
          this._http = http;
          this._tokenStore = tokenStore;
          this._avatar = avatarModule;
        }
        /** Returns the currently stored session ({ avatarId, username, email, jwtToken, ... }) or null. */
        getSession() {
          return this._tokenStore.getSession();
        }
        isAuthenticated() {
          return Boolean(this._tokenStore.getToken());
        }
        /**
         * @param {{username: string, password: string}} credentials `username` may also be an email,
         *   OASIS' authenticate endpoint accepts either.
         */
        async login({ username, password }) {
          const res = await this._avatar.authenticate({ Username: username, Password: password });
          if (res.isError || !res.result) return res;
          const avatar = res.result;
          const session = {
            avatarId: avatar.id || avatar.Id,
            username: avatar.username || avatar.Username || username,
            email: avatar.email || avatar.Email,
            firstName: avatar.firstName || avatar.FirstName,
            lastName: avatar.lastName || avatar.LastName,
            jwtToken: avatar.jwtToken || avatar.JwtToken,
            refreshToken: avatar.refreshToken || avatar.RefreshToken
          };
          if (!session.jwtToken) {
            return { isError: true, message: "Authentication succeeded but no JWT token was returned.", raw: res.raw };
          }
          this._tokenStore.setSession(session);
          return { ...res, session };
        }
        /** Clears the local session. STAR's AvatarController has no server-side revoke endpoint to call. */
        async logout() {
          this._tokenStore.clear();
        }
      };
      module.exports = { AuthModule };
    }
  });

  // node_modules/@oasisomniverse/web5-api/src/index.js
  var require_src = __commonJS({
    "node_modules/@oasisomniverse/web5-api/src/index.js"(exports, module) {
      "use strict";
      var { HttpClient, DEFAULT_BASE_URL } = require_httpClient();
      var { TokenStore } = require_tokenStore();
      var { attachGeneratedModules } = require_modules();
      var { AuthModule } = require_Auth();
      var STARClient2 = class {
        constructor({ baseUrl = DEFAULT_BASE_URL, persistSession, fetchImpl } = {}) {
          this.tokenStore = new TokenStore({ persist: persistSession });
          this.http = new HttpClient({ baseUrl, tokenStore: this.tokenStore, fetchImpl });
          attachGeneratedModules(this, this.http);
          this.auth = new AuthModule(this.http, this.tokenStore, this.avatar);
        }
        setBaseUrl(baseUrl) {
          this.http.setBaseUrl(baseUrl);
        }
        /** Use an externally-issued JWT (e.g. one your server already obtained) for subsequent calls. */
        setToken(jwtToken, sessionExtras = {}) {
          this.tokenStore.setSession({ ...sessionExtras, jwtToken });
        }
        /** Convenience pass-throughs to the generated STAR module (star.sTAR). */
        starIgnite(args) {
          return this.sTAR.igniteSTAR(args);
        }
        starExtinguish(args) {
          return this.sTAR.extinguishSTAR(args);
        }
        starStatus(args) {
          return this.sTAR.getStatus(args);
        }
      };
      module.exports = { STARClient: STARClient2, HttpClient, TokenStore, DEFAULT_BASE_URL };
      module.exports.default = STARClient2;
    }
  });

  // node_modules/@oasisomniverse/web5-api/index.js
  var require_web5_api = __commonJS({
    "node_modules/@oasisomniverse/web5-api/index.js"(exports, module) {
      "use strict";
      module.exports = require_src();
    }
  });

  // build/web5-entry.js
  var { STARClient } = require_web5_api();
  if (typeof window !== "undefined") window.STARClient = STARClient;
})();
