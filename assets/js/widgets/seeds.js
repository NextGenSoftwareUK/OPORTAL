/**
 * OasisSeeds — standalone Seeds widget
 * Usage: new OasisSeeds({ container: document.getElementById('seeds') })
 */
(function () {
  const SEEDS = [
    { id: '1', name: 'Wisdom Seed', type: 'Spiritual', rarity: 'rare', karma: 50, planted: false },
    { id: '2', name: 'Healing Seed', type: 'Health', rarity: 'common', karma: 20, planted: false },
    { id: '3', name: 'Unity Seed', type: 'Community', rarity: 'epic', karma: 150, planted: false },
    { id: '4', name: 'Truth Seed', type: 'Knowledge', rarity: 'legendary', karma: 500, planted: false },
    { id: '5', name: 'Love Seed', type: 'Spiritual', rarity: 'common', karma: 30, planted: false },
    { id: '6', name: 'Peace Seed', type: 'Community', rarity: 'rare', karma: 75, planted: false },
  ];
  const ICONS = { Spiritual: '✨', Health: '💚', Community: '🤝', Knowledge: '📖' };
  const RARITY_COLORS = { common: '#7a9bbf', rare: '#5ba8ff', epic: '#b87fff', legendary: '#ffb43c' };

  const CSS = `
.oasis-seeds-shell{font-family:'Rajdhani',sans-serif;display:flex;flex-direction:column;gap:20px}
.oasis-seeds-header{text-align:center}
.oasis-seeds-title{font-family:'Orbitron',sans-serif;font-size:20px;color:#fff;margin:0 0 6px}
.oasis-seeds-sub{font-size:13px;color:#7a9bbf;margin:0}
.oasis-seeds-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px}
.oasis-seed-card{background:rgba(255,255,255,.04);border:1px solid rgba(0,200,255,.15);border-radius:12px;padding:18px 14px;display:flex;flex-direction:column;align-items:center;gap:10px;transition:border-color .2s;cursor:default}
.oasis-seed-card:hover{border-color:rgba(0,200,255,.35)}
.oasis-seed-card.planted{border-color:rgba(72,220,130,.3);background:rgba(72,220,130,.04)}
.oasis-seed-rarity{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;padding:3px 10px;border:1px solid currentColor}
.oasis-seed-icon{font-size:36px}
.oasis-seed-name{font-family:'Orbitron',sans-serif;font-size:13px;color:#fff;text-align:center}
.oasis-seed-type{font-size:11px;color:#7a9bbf}
.oasis-seed-karma{font-size:12px;color:#48dc82;font-weight:600}
.oasis-seed-btn{width:100%;background:linear-gradient(135deg,#00c8ff,#0080ff);border:none;border-radius:7px;color:#fff;font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;padding:8px;cursor:pointer;transition:opacity .2s}
.oasis-seed-btn:hover{opacity:.85}
.oasis-seed-planted{font-size:12px;color:#48dc82;font-weight:600}
`;

  class OasisSeeds {
    constructor({ container } = {}) {
      this._container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this._container) throw new Error('OasisSeeds: container not found');
      if (!document.getElementById('oasis-seeds-styles')) {
        const s = document.createElement('style'); s.id = 'oasis-seeds-styles'; s.textContent = CSS;
        document.head.appendChild(s);
      }
      this._seeds = SEEDS.map(s => ({ ...s }));
      this._render();
    }

    _render() {
      this._container.innerHTML = `
        <div class="oasis-seeds-shell">
          <div class="oasis-seeds-header">
            <h2 class="oasis-seeds-title">🌱 Seeds</h2>
            <p class="oasis-seeds-sub">Plant seeds to grow your OASIS avatar and earn karma.</p>
          </div>
          <div class="oasis-seeds-grid">
            ${this._seeds.map(s => `
              <div class="oasis-seed-card${s.planted ? ' planted' : ''}" data-id="${s.id}">
                <div class="oasis-seed-rarity" style="color:${RARITY_COLORS[s.rarity]};border-color:${RARITY_COLORS[s.rarity]}44">${s.rarity}</div>
                <div class="oasis-seed-icon">${ICONS[s.type] || '🌱'}</div>
                <div class="oasis-seed-name">${s.name}</div>
                <div class="oasis-seed-type">${s.type}</div>
                <div class="oasis-seed-karma">+${s.karma} Karma</div>
                ${s.planted
                  ? '<div class="oasis-seed-planted">🌿 Growing…</div>'
                  : `<button class="oasis-seed-btn" data-plant="${s.id}">Plant Seed</button>`}
              </div>`).join('')}
          </div>
        </div>`;
      this._container.querySelectorAll('[data-plant]').forEach(btn => {
        btn.addEventListener('click', () => { this._plant(btn.dataset.plant); });
      });
    }

    _plant(id) {
      const s = this._seeds.find(x => x.id === id);
      if (s) { s.planted = true; this._render(); }
    }

    destroy() { this._container.innerHTML = ''; }
  }

  window.OasisSeeds = OasisSeeds;
})();
