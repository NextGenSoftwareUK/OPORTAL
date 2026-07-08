/**
 * OasisProviderDropdown — blockchain provider selector widget
 * Usage: new OasisProviderDropdown({ container, onChange })
 */
(function () {
  const PROVIDERS = [
    { id: 'ethereum', name: 'Ethereum', icon: '⟠', color: '#627eea' },
    { id: 'solana', name: 'Solana', icon: '◎', color: '#9945ff' },
    { id: 'polygon', name: 'Polygon', icon: '⬡', color: '#8247e5' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', color: '#2d9cdb' },
    { id: 'eosio', name: 'EOSIO', icon: '🔮', color: '#443f54' },
    { id: 'holochain', name: 'Holochain', icon: '⬡', color: '#00e5be' },
    { id: 'thegraph', name: 'The Graph', icon: '📊', color: '#6f4cff' },
  ];

  const CSS = `
.oasis-pd-shell{position:relative;font-family:'Rajdhani',sans-serif}
.oasis-pd-trigger{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(0,200,255,.25);border-radius:10px;padding:10px 14px;cursor:pointer;transition:border-color .2s;color:#fff;width:100%;box-sizing:border-box}
.oasis-pd-trigger:hover,.oasis-pd-trigger.open{border-color:rgba(0,200,255,.5)}
.oasis-pd-icon{font-size:20px;width:28px;text-align:center}
.oasis-pd-label{flex:1;text-align:left}
.oasis-pd-name{font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700}
.oasis-pd-sub{font-size:11px;color:#7a9bbf;margin-top:2px}
.oasis-pd-arrow{font-size:10px;color:#7a9bbf;transition:transform .2s}
.oasis-pd-arrow.open{transform:rotate(180deg)}
.oasis-pd-menu{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#0d1b2e;border:1px solid rgba(0,200,255,.2);border-radius:10px;overflow:hidden;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,.5)}
.oasis-pd-option{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .15s;color:#e0f0ff}
.oasis-pd-option:hover{background:rgba(0,200,255,.1)}
.oasis-pd-option.selected{background:rgba(0,200,255,.12);border-left:3px solid #00c8ff}
.oasis-pd-opt-icon{font-size:18px;width:24px;text-align:center}
.oasis-pd-opt-name{font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700}
`;

  class OasisProviderDropdown {
    constructor({ container, onChange, defaultProvider = 'ethereum' } = {}) {
      this._container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this._container) throw new Error('OasisProviderDropdown: container not found');
      if (!document.getElementById('oasis-pd-styles')) {
        const s = document.createElement('style'); s.id = 'oasis-pd-styles'; s.textContent = CSS;
        document.head.appendChild(s);
      }
      this._selected = PROVIDERS.find(p => p.id === defaultProvider) || PROVIDERS[0];
      this._open = false;
      this._onChange = onChange || (() => {});
      this._render();
      document.addEventListener('click', this._onDocClick.bind(this));
    }

    _render() {
      const p = this._selected;
      this._container.innerHTML = `
        <div class="oasis-pd-shell">
          <div class="oasis-pd-trigger${this._open ? ' open' : ''}" id="oasis-pd-trigger">
            <div class="oasis-pd-icon" style="color:${p.color}">${p.icon}</div>
            <div class="oasis-pd-label">
              <div class="oasis-pd-name">${p.name}</div>
              <div class="oasis-pd-sub">Active Provider</div>
            </div>
            <div class="oasis-pd-arrow${this._open ? ' open' : ''}">▼</div>
          </div>
          ${this._open ? `<div class="oasis-pd-menu" id="oasis-pd-menu">
            ${PROVIDERS.map(pr => `
              <div class="oasis-pd-option${pr.id === p.id ? ' selected' : ''}" data-id="${pr.id}">
                <div class="oasis-pd-opt-icon" style="color:${pr.color}">${pr.icon}</div>
                <div class="oasis-pd-opt-name">${pr.name}</div>
              </div>`).join('')}
          </div>` : ''}
        </div>`;
      document.getElementById('oasis-pd-trigger')?.addEventListener('click', e => { e.stopPropagation(); this._toggle(); });
      this._container.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', e => { e.stopPropagation(); this._select(el.dataset.id); });
      });
    }

    _toggle() { this._open = !this._open; this._render(); }
    _select(id) {
      this._selected = PROVIDERS.find(p => p.id === id) || this._selected;
      this._open = false; this._render(); this._onChange(this._selected);
    }
    _onDocClick() { if (this._open) { this._open = false; this._render(); } }

    get value() { return this._selected; }
    destroy() { document.removeEventListener('click', this._onDocClick.bind(this)); this._container.innerHTML = ''; }
  }

  window.OasisProviderDropdown = OasisProviderDropdown;
})();
