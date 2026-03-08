/*!
 * Kardio.js — Interactive Card & Relation Diagram Library
 * Version 1.0.0
 * 
 * Usage:
 *   <div class="kardio" data-src="diagram.kardio"></div>
 *   <script src="kardio.js"></script>
 *
 *   Or programmatically:
 *   Kardio.render('#myDiv', `
 *     card A "Title" "Body" #tag blue
 *     card B "Other"
 *     A --> B : "label" dashed
 *   `);
 */

(function (global) {
  'use strict';

  // ═══════════════════════════════════════════════════════
  //  CONSTANTS
  // ═══════════════════════════════════════════════════════

  const COLORS = {
    blue:   '#4f8fff',
    purple: '#a78bfa',
    green:  '#34d399',
    orange: '#fb923c',
    red:    '#f87171',
    grey:   '#6b7280',
    cyan:   '#22d3ee',
    pink:   '#f472b6',
    yellow: '#fbbf24',
    white:  '#e8eaf0',
  };

  const CARD_W = 200;
  const CARD_H = 120;

  // ═══════════════════════════════════════════════════════
  //  DSL PARSER
  //
  //  Syntax reference:
  //
  //  card <id> "<title>" ["<body>"] [#tag] [color] [date]
  //  <fromId> <arrow> <toId> [: "<label>"] [style] [color] [<N>px]
  //
  //  Arrow types:
  //    -->    forward  solid
  //    -->-   forward  dashed
  //    -->..  forward  dotted
  //    <-->   both     solid
  //    <-->-  both     dashed
  //    ---    none     solid
  //    ---    none     dashed  (use: --->- for dashed none)
  //    <--    backward solid
  //
  //  Example:
  //    card A "Strategi" "Vision och mål" #strategi blue 2024-01
  //    card B "UX" #design purple
  //    card C "Backend" green
  //    A --> B : "styr" blue
  //    B <--> C : "kräver" dashed purple 2px
  //    A -->.. D : "inspirerar"
  // ═══════════════════════════════════════════════════════

  const ARROW_PATTERNS = [
    // [regex, direction, style]
    [/^<-->\.\./, 'both',     'dotted'],
    [/^<-->-/,    'both',     'dashed'],
    [/^<-->/,     'both',     'solid' ],
    [/^-->\.\./, 'forward',  'dotted'],
    [/^-->-/,    'forward',  'dashed'],
    [/^-->/,     'forward',  'solid' ],
    [/^<--\.\./,  'backward', 'dotted'],
    [/^<---/,    'backward', 'dashed'],
    [/^<--/,     'backward', 'solid' ],
    [/^---\.\./,  'none',     'dotted'],
    [/^----/,    'none',     'dashed'],
    [/^---/,     'none',     'solid' ],
  ];

  function parseDSL(src) {
    const cards = [];
    const connections = [];
    let nextId = 1;
    const idMap = {}; // alias -> numeric id

    const lines = src.split('\n');

    for (let raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('//') || line.startsWith('#!')) continue;

      // ── card definition ──────────────────────────────
      // card <alias> "<title>" ["<body>"] [#tag] [color] [date]
      if (/^card\s/i.test(line)) {
        const rest = line.slice(5).trim();
        const alias = rest.split(/\s+/)[0];
        const afterAlias = rest.slice(alias.length).trim();

        // Extract quoted strings
        const quotes = [];
        const quotePat = /"([^"]*)"/g;
        let m;
        while ((m = quotePat.exec(afterAlias)) !== null) quotes.push(m[1]);

        const title = quotes[0] || alias;
        const body  = quotes[1] || '';

        // Remove quoted sections, then parse remaining tokens
        const bare = afterAlias.replace(/"[^"]*"/g, '').trim();
        const tokens = bare.split(/\s+/).filter(Boolean);

        let tag = '', color = 'blue', date = '';
        for (const tok of tokens) {
          if (tok.startsWith('#')) { tag = tok.slice(1); continue; }
          if (COLORS[tok]) { color = tok; continue; }
          if (/^\d{4}(-\d{2})?(-\d{2})?$/.test(tok)) { date = tok; continue; }
        }

        const id = nextId++;
        idMap[alias] = id;
        cards.push({ id, alias, title, body, tag, color, date, x: 60, y: 60 });
        continue;
      }

      // ── connection definition ─────────────────────────
      // <fromAlias> <arrow> <toAlias> [: "<label>"] [style] [color] [<N>px]
      const connMatch = line.match(/^(\S+)\s+(\S+)\s+(\S+)(.*)/);
      if (connMatch) {
        const [, fromAlias, arrowRaw, toAlias, rest2] = connMatch;

        if (!(fromAlias in idMap) || !(toAlias in idMap)) continue;

        // Parse arrow
        let direction = 'forward', style = 'solid';
        for (const [pat, dir, sty] of ARROW_PATTERNS) {
          if (pat.test(arrowRaw)) { direction = dir; style = sty; break; }
        }

        // Parse rest: : "label" style color Npx
        let label = '', color = 'blue', weight = 1.5;
        const restStr = rest2.trim();

        // label
        const labelM = restStr.match(/"([^"]*)"/);
        if (labelM) label = labelM[1];

        const bare2 = restStr.replace(/^:\s*/, '').replace(/"[^"]*"/g, '').trim();
        const tokens2 = bare2.split(/\s+/).filter(Boolean);

        for (const tok of tokens2) {
          if (COLORS[tok]) { color = tok; continue; }
          if (/^solid|dashed|dotted$/.test(tok)) { style = tok; continue; }
          if (/^\d+(\.\d+)?px$/.test(tok)) { weight = parseFloat(tok); continue; }
        }

        connections.push({
          id: Date.now() + Math.random(),
          from: idMap[fromAlias],
          to:   idMap[toAlias],
          label, color, style, direction, weight
        });
      }
    }

    // Auto-layout: simple grid
    autoLayout(cards);

    return { cards, connections, nextId };
  }

  function autoLayout(cards) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(cards.length)));
    const padX = 80, padY = 80, gapX = 240, gapY = 170;
    cards.forEach((card, i) => {
      card.x = padX + (i % cols) * gapX;
      card.y = padY + Math.floor(i / cols) * gapY;
    });
  }

  // ═══════════════════════════════════════════════════════
  //  INJECT STYLES (once per page)
  // ═══════════════════════════════════════════════════════

  let stylesInjected = false;

  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

.kardio-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  background: #0e0f11;
  font-family: 'Syne', sans-serif;
  overflow: hidden;
  user-select: none;
  --bg: #0e0f11;
  --surface: #16181c;
  --surface2: #1e2128;
  --border: #2a2d35;
  --border-bright: #3d4150;
  --text: #e8eaf0;
  --text-muted: #7a7f8e;
  --accent: #4f8fff;
  --accent2: #a78bfa;
  --accent3: #34d399;
  --danger: #f87171;
}

.kardio-svg-layer {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}

.kardio-cards-layer {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  z-index: 2;
}

.kardio-hit-overlay {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 10;
}

/* ─── CARDS ─── */
.kardio-card {
  position: absolute;
  width: 200px;
  min-height: 110px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px 12px;
  cursor: grab;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}
.kardio-card:hover {
  border-color: var(--border-bright);
  box-shadow: 0 6px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,143,255,0.12);
}
.kardio-card.dragging {
  cursor: grabbing; transform: scale(1.03);
  border-color: var(--accent);
  box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 0 2px rgba(79,143,255,0.4);
  z-index: 1000 !important;
}
.kardio-card.connecting-source {
  border-color: var(--accent3);
  box-shadow: 0 0 0 2px rgba(52,211,153,0.4);
}
.kardio-card.connecting-target:hover {
  border-color: var(--accent3);
  box-shadow: 0 0 0 2px rgba(52,211,153,0.6);
}
.kardio-card-dot {
  width: 8px; height: 8px; border-radius: 50%;
  display: inline-block; margin-right: 6px; flex-shrink: 0;
}
.kardio-card-header {
  display: flex; align-items: center;
  font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.3;
}
.kardio-card-body {
  font-size: 11px; color: var(--text-muted);
  font-family: 'Space Mono', monospace; line-height: 1.5;
}
.kardio-card-tag {
  font-size: 9px; font-family: 'Space Mono', monospace;
  color: var(--accent); letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.8;
}
.kardio-card-date {
  font-size: 9px; font-family: 'Space Mono', monospace;
  color: var(--text-muted); opacity: 0.5; margin-top: 2px;
}
.kardio-card-actions {
  display: none; position: absolute; top: 6px; right: 6px; gap: 3px;
}
.kardio-card:hover .kardio-card-actions { display: flex; }
.kardio-card-btn {
  width: 22px; height: 22px;
  background: var(--surface2); border: 1px solid var(--border); border-radius: 5px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: var(--text-muted); transition: background 0.15s, color 0.15s;
}
.kardio-card-btn:hover { background: var(--border); color: var(--text); }
.kardio-card-btn.danger:hover {
  background: rgba(248,113,113,0.2); color: var(--danger); border-color: var(--danger);
}
.kardio-card.animating {
  transition: left 0.5s cubic-bezier(0.25,0.46,0.45,0.94),
              top 0.5s cubic-bezier(0.25,0.46,0.45,0.94),
              border-color 0.2s, box-shadow 0.2s, transform 0.15s !important;
}

/* ─── SVG / CONNECTIONS ─── */
.kardio-conn-label {
  font-size: 9px; fill: var(--text-muted);
  font-family: 'Space Mono', monospace; text-anchor: middle;
}
.kardio-temp-line {
  stroke: rgba(52,211,153,0.6); stroke-width: 1.5;
  fill: none; stroke-dasharray: 5 4; pointer-events: none;
}

/* ─── MENU ─── */
.kardio-menu {
  position: absolute; top: 16px; right: 16px; z-index: 100;
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
}
.kardio-menu-toggle {
  width: 44px; height: 44px;
  background: var(--surface); border: 1.5px solid var(--border-bright);
  border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: var(--text);
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  transition: background 0.2s, border-color 0.2s;
}
.kardio-menu-toggle:hover { background: var(--surface2); border-color: var(--accent); }
.kardio-menu-panel {
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 12px; padding: 16px; width: 260px;
  display: none; flex-direction: column; gap: 14px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
  animation: kardio-slidein 0.2s ease;
}
.kardio-menu-panel.open { display: flex; }
@keyframes kardio-slidein {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.kardio-section-title {
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-muted); font-family: 'Space Mono', monospace; margin-bottom: 4px;
}
.kardio-section { display: flex; flex-direction: column; gap: 6px; }
.kardio-view-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.kardio-mode-btn {
  background: var(--surface2); border: 1.5px solid var(--border);
  border-radius: 8px; padding: 8px 10px; cursor: pointer;
  text-align: center; font-size: 11px; font-family: 'Syne', sans-serif;
  font-weight: 600; color: var(--text-muted);
  transition: all 0.15s; display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.kardio-mode-btn .mi { font-size: 16px; }
.kardio-mode-btn:hover { border-color: var(--accent); color: var(--text); background: rgba(79,143,255,0.08); }
.kardio-mode-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(79,143,255,0.12); }
.kardio-btn-primary {
  background: var(--accent); color: #fff; border: none;
  border-radius: 8px; padding: 9px 14px;
  font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
  cursor: pointer; width: 100%; transition: background 0.15s, transform 0.1s;
}
.kardio-btn-primary:hover { background: #3a7aee; transform: translateY(-1px); }
.kardio-btn-secondary {
  background: transparent; color: var(--text-muted);
  border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 14px;
  font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
  cursor: pointer; width: 100%; transition: all 0.15s;
}
.kardio-btn-secondary:hover { border-color: var(--border-bright); color: var(--text); }
.kardio-divider { height: 1px; background: var(--border); }

/* ─── STATUS ─── */
.kardio-status {
  position: absolute; bottom: 12px; left: 12px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 5px 10px;
  font-size: 10px; font-family: 'Space Mono', monospace;
  color: var(--text-muted); z-index: 50; pointer-events: none; opacity: 0.8;
}

/* ─── CONNECT HINT ─── */
.kardio-connect-hint {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.35);
  border-radius: 8px; padding: 7px 14px;
  font-size: 11px; font-family: 'Space Mono', monospace; color: var(--accent3);
  z-index: 50; display: none; animation: kardio-pulse 2s infinite;
}
@keyframes kardio-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

/* ─── MODAL ─── */
.kardio-modal-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  z-index: 200; display: none; align-items: center; justify-content: center;
}
.kardio-modal-overlay.open { display: flex; }
.kardio-modal {
  background: var(--surface); border: 1.5px solid var(--border-bright);
  border-radius: 14px; padding: 24px; width: 340px; max-width: 90%;
  box-shadow: 0 24px 64px rgba(0,0,0,0.7); animation: kardio-slidein 0.2s ease;
}
.kardio-modal h3 { font-size: 16px; font-weight: 800; margin-bottom: 16px; color: var(--text); }
.kardio-form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.kardio-form-group label {
  font-size: 10px; font-family: 'Space Mono', monospace;
  text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);
}
.kardio-form-group input,
.kardio-form-group textarea,
.kardio-form-group select {
  background: var(--surface2); border: 1.5px solid var(--border);
  border-radius: 7px; padding: 8px 10px; color: var(--text);
  font-family: 'Syne', sans-serif; font-size: 13px; outline: none;
  transition: border-color 0.15s;
}
.kardio-form-group input:focus,
.kardio-form-group textarea:focus,
.kardio-form-group select:focus { border-color: var(--accent); }
.kardio-form-group textarea { resize: vertical; min-height: 60px; }
.kardio-modal-actions { display: flex; gap: 8px; margin-top: 16px; }
.kardio-modal-actions .kardio-btn-primary { flex: 2; }
.kardio-modal-actions .kardio-btn-secondary { flex: 1; }

/* ─── RELATION PANEL ─── */
.kardio-rel-panel {
  position: absolute; z-index: 150;
  background: var(--surface); border: 1.5px solid var(--border-bright);
  border-radius: 12px; padding: 16px; width: 280px;
  display: none; flex-direction: column; gap: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.7); animation: kardio-slidein 0.15s ease;
}
.kardio-rel-panel.open { display: flex; }
.kardio-rel-panel-header { display: flex; align-items: center; justify-content: space-between; }
.kardio-rel-panel-title { font-size: 12px; font-weight: 800; color: var(--text); }
.kardio-rel-close {
  width: 22px; height: 22px; background: var(--surface2);
  border: 1px solid var(--border); border-radius: 5px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--text-muted); transition: all 0.15s;
}
.kardio-rel-close:hover { background: rgba(248,113,113,0.2); color: var(--danger); border-color: var(--danger); }
.kardio-rel-nodes {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-family: 'Space Mono', monospace; color: var(--text-muted);
}
.kardio-rel-chip {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 5px; padding: 3px 8px; font-size: 10px; color: var(--text);
  font-family: 'Space Mono', monospace; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; max-width: 90px;
}
.kardio-rel-arrow { font-size: 14px; color: var(--accent); flex-shrink: 0; }
.kardio-style-btns { display: flex; gap: 6px; }
.kardio-style-btn {
  flex: 1; background: var(--surface2); border: 1.5px solid var(--border);
  border-radius: 7px; padding: 6px 8px; font-size: 10px;
  font-family: 'Space Mono', monospace; color: var(--text-muted);
  cursor: pointer; text-align: center; transition: all 0.15s;
}
.kardio-style-btn:hover { border-color: var(--accent); color: var(--text); }
.kardio-style-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(79,143,255,0.1); }
.kardio-color-swatches { display: flex; gap: 6px; flex-wrap: wrap; }
.kardio-swatch {
  width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
  border: 2px solid transparent; transition: border-color 0.15s, transform 0.1s;
}
.kardio-swatch:hover { transform: scale(1.15); }
.kardio-swatch.active { border-color: var(--text); }
.kardio-rel-delete {
  background: rgba(248,113,113,0.08); border: 1.5px solid rgba(248,113,113,0.3);
  border-radius: 7px; padding: 7px; font-size: 11px; font-family: 'Syne', sans-serif;
  font-weight: 600; color: var(--danger); cursor: pointer; width: 100%; transition: all 0.15s;
}
.kardio-rel-delete:hover { background: rgba(248,113,113,0.18); border-color: var(--danger); }
`;

    const el = document.createElement('style');
    el.id = 'kardio-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ═══════════════════════════════════════════════════════
  //  INSTANCE — one per mounted element
  // ═══════════════════════════════════════════════════════

  function KardioInstance(container, src) {
    const self = this;

    // Parse source → state
    const parsed = parseDSL(src || '');
    const state = {
      cards: parsed.cards,
      connections: parsed.connections,
      nextId: parsed.nextId,
      currentMode: 'free',
      connectMode: false,
      connectSource: null,
      editingId: null,
      selectedConnId: null,
      dragState: null,
    };

    // ── Build DOM ──────────────────────────────────────
    container.classList.add('kardio-root');
    container.innerHTML = `
      <svg class="kardio-svg-layer" xmlns="http://www.w3.org/2000/svg">
        <defs></defs>
        <g class="kardio-connections-layer"></g>
        <line class="kardio-temp-line" style="display:none"/>
      </svg>
      <div class="kardio-cards-layer"></div>
      <svg class="kardio-hit-overlay" xmlns="http://www.w3.org/2000/svg">
        <g class="kardio-hit-layer"></g>
      </svg>

      <div class="kardio-menu">
        <button class="kardio-menu-toggle">☰</button>
        <div class="kardio-menu-panel">
          <div class="kardio-section">
            <div class="kardio-section-title">Visningsläge</div>
            <div class="kardio-view-modes">
              <button class="kardio-mode-btn active" data-mode="free"><span class="mi">✦</span>Fritt</button>
              <button class="kardio-mode-btn" data-mode="hierarchy"><span class="mi">◈</span>Hierarki</button>
              <button class="kardio-mode-btn" data-mode="mindmap"><span class="mi">◎</span>Mindmap</button>
              <button class="kardio-mode-btn" data-mode="network"><span class="mi">⬡</span>Nätverk</button>
              <button class="kardio-mode-btn" data-mode="timeline" style="grid-column:span 2"><span class="mi">▶</span>Tidslinje</button>
            </div>
          </div>
          <div class="kardio-divider"></div>
          <div class="kardio-section">
            <div class="kardio-section-title">Åtgärder</div>
            <button class="kardio-btn-primary kardio-add-card">+ Lägg till kort</button>
            <button class="kardio-btn-secondary kardio-connect-btn">⟡ Koppla kort</button>
            <button class="kardio-btn-secondary kardio-clear-conns">✕ Ta bort kopplingar</button>
          </div>
          <div class="kardio-divider"></div>
          <div class="kardio-section">
            <div class="kardio-section-title">Data</div>
            <button class="kardio-btn-secondary kardio-export-btn">↓ Exportera JSON</button>
            <button class="kardio-btn-secondary kardio-export-dsl-btn">↓ Exportera DSL</button>
            <button class="kardio-btn-secondary kardio-import-btn">↑ Importera JSON</button>
            <input type="file" class="kardio-import-input" accept=".json" style="display:none">
          </div>
        </div>
      </div>

      <div class="kardio-status">0 kort · 0 kopplingar</div>
      <div class="kardio-connect-hint">Klicka källkort → målkort för att koppla. ESC avbryter.</div>

      <div class="kardio-rel-panel">
        <div class="kardio-rel-panel-header">
          <span class="kardio-rel-panel-title">⟡ Relation</span>
          <div class="kardio-rel-close">✕</div>
        </div>
        <div class="kardio-rel-nodes">
          <div class="kardio-rel-chip kardio-rel-from">–</div>
          <span class="kardio-rel-arrow kardio-rel-dir-arrow">→</span>
          <div class="kardio-rel-chip kardio-rel-to">–</div>
        </div>
        <div class="kardio-form-group" style="margin-bottom:0">
          <label>Etikett</label>
          <input type="text" class="kardio-rel-label" placeholder="t.ex. rapporterar till...">
        </div>
        <div class="kardio-form-group" style="margin-bottom:0">
          <label>Stil</label>
          <div class="kardio-style-btns kardio-rel-style-btns">
            <div class="kardio-style-btn active" data-style="solid">─ Solid</div>
            <div class="kardio-style-btn" data-style="dashed">– Streckad</div>
            <div class="kardio-style-btn" data-style="dotted">· Prickad</div>
          </div>
        </div>
        <div class="kardio-form-group" style="margin-bottom:0">
          <label>Riktning</label>
          <div class="kardio-style-btns kardio-rel-dir-btns">
            <div class="kardio-style-btn active" data-dir="forward">A→B</div>
            <div class="kardio-style-btn" data-dir="backward">A←B</div>
            <div class="kardio-style-btn" data-dir="both">A↔B</div>
            <div class="kardio-style-btn" data-dir="none">A—B</div>
          </div>
        </div>
        <div class="kardio-form-group" style="margin-bottom:0">
          <label>Färg</label>
          <div class="kardio-color-swatches kardio-rel-swatches">
            <div class="kardio-swatch active" data-color="blue"   style="background:#4f8fff"></div>
            <div class="kardio-swatch" data-color="purple" style="background:#a78bfa"></div>
            <div class="kardio-swatch" data-color="green"  style="background:#34d399"></div>
            <div class="kardio-swatch" data-color="orange" style="background:#fb923c"></div>
            <div class="kardio-swatch" data-color="red"    style="background:#f87171"></div>
            <div class="kardio-swatch" data-color="grey"   style="background:#6b7280"></div>
            <div class="kardio-swatch" data-color="cyan"   style="background:#22d3ee"></div>
            <div class="kardio-swatch" data-color="pink"   style="background:#f472b6"></div>
          </div>
        </div>
        <div class="kardio-form-group" style="margin-bottom:0">
          <label>Tjocklek</label>
          <input type="range" class="kardio-rel-weight" min="1" max="6" value="1.5" step="0.5"
            style="width:100%;accent-color:#4f8fff;cursor:pointer">
        </div>
        <button class="kardio-rel-delete">✕ Ta bort koppling</button>
      </div>

      <div class="kardio-modal-overlay">
        <div class="kardio-modal">
          <h3 class="kardio-modal-title">Nytt kort</h3>
          <div class="kardio-form-group">
            <label>Titel</label>
            <input type="text" class="kardio-card-title" placeholder="Kortets titel...">
          </div>
          <div class="kardio-form-group">
            <label>Beskrivning</label>
            <textarea class="kardio-card-body" placeholder="Valfri beskrivning..."></textarea>
          </div>
          <div class="kardio-form-group">
            <label>Grupp / Tagg</label>
            <input type="text" class="kardio-card-tag" placeholder="t.ex. strategi, person...">
          </div>
          <div class="kardio-form-group">
            <label>Färg</label>
            <select class="kardio-card-color">
              <option value="blue">Blå</option>
              <option value="purple">Lila</option>
              <option value="green">Grön</option>
              <option value="orange">Orange</option>
              <option value="red">Röd</option>
              <option value="cyan">Cyan</option>
              <option value="pink">Rosa</option>
              <option value="yellow">Gul</option>
            </select>
          </div>
          <div class="kardio-form-group">
            <label>Datum (tidslinje)</label>
            <input type="text" class="kardio-card-date" placeholder="t.ex. 2024-03">
          </div>
          <div class="kardio-modal-actions">
            <button class="kardio-btn-primary kardio-modal-save">Spara</button>
            <button class="kardio-btn-secondary kardio-modal-cancel">Avbryt</button>
          </div>
        </div>
      </div>
    `;

    // ── DOM refs ────────────────────────────────────────
    const $ = (sel) => container.querySelector(sel);
    const $$ = (sel) => container.querySelectorAll(sel);

    const cardsLayer      = $('.kardio-cards-layer');
    const connLayer       = $('.kardio-connections-layer');
    const hitLayer        = $('.kardio-hit-layer');
    const defs            = container.querySelector('.kardio-svg-layer defs');
    const tempLine        = $('.kardio-temp-line');
    const statusEl        = $('.kardio-status');
    const connectHint     = $('.kardio-connect-hint');
    const menuToggle      = $('.kardio-menu-toggle');
    const menuPanel       = $('.kardio-menu-panel');
    const relPanel        = $('.kardio-rel-panel');
    const modalOverlay    = $('.kardio-modal-overlay');

    // ── RENDER ──────────────────────────────────────────

    function render() {
      renderCards();
      renderConnections();
      updateStatus();
    }

    function renderCards() {
      $$('.kardio-card').forEach(el => {
        if (!state.cards.find(c => c.id === parseInt(el.dataset.id))) el.remove();
      });
      state.cards.forEach(card => {
        let el = container.querySelector(`.kardio-card[data-id="${card.id}"]`);
        if (!el) { el = createCardEl(card); cardsLayer.appendChild(el); }
        updateCardEl(el, card);
      });
    }

    function createCardEl(card) {
      const el = document.createElement('div');
      el.className = 'kardio-card';
      el.dataset.id = card.id;
      el.addEventListener('mousedown', onCardMouseDown);
      el.addEventListener('click', onCardClick);
      return el;
    }

    function updateCardEl(el, card) {
      const col = COLORS[card.color] || COLORS.blue;
      el.style.left = card.x + 'px';
      el.style.top  = card.y + 'px';
      el.innerHTML = `
        <div class="kardio-card-header">
          <span class="kardio-card-dot" style="background:${col}"></span>
          ${esc(card.title)}
        </div>
        ${card.body ? `<div class="kardio-card-body">${esc(card.body)}</div>` : ''}
        ${card.tag  ? `<div class="kardio-card-tag">#${esc(card.tag)}</div>` : ''}
        ${card.date ? `<div class="kardio-card-date">${esc(card.date)}</div>` : ''}
        <div class="kardio-card-actions">
          <div class="kardio-card-btn" data-action="edit" title="Redigera">✎</div>
          <div class="kardio-card-btn danger" data-action="delete" title="Ta bort">✕</div>
        </div>
      `;
      el.querySelector('[data-action="edit"]').addEventListener('click', e => {
        e.stopPropagation(); openEditModal(card.id);
      });
      el.querySelector('[data-action="delete"]').addEventListener('click', e => {
        e.stopPropagation(); deleteCard(card.id);
      });
    }

    function renderConnections() {
      connLayer.innerHTML = '';
      hitLayer.innerHTML  = '';

      state.connections.forEach(conn => {
        const fc = state.cards.find(c => c.id === conn.from);
        const tc = state.cards.find(c => c.id === conn.to);
        if (!fc || !tc) return;

        const baseColor = COLORS[conn.color || 'blue'];
        const isSel     = state.selectedConnId === conn.id;
        const weight    = conn.weight || 1.5;
        const dashMap   = { solid: 'none', dashed: '8 5', dotted: '2 5' };
        const dash      = dashMap[conn.style || 'solid'] || 'none';
        const dir       = conn.direction || 'forward';

        const [x1, y1] = cardCenter(fc);
        const [x2, y2] = cardCenter(tc);
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2 - 40;
        const d  = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;

        // Markers
        const mid  = `km-${conn.id}-e`;
        const mids = `km-${conn.id}-s`;
        mkMarker(mid, baseColor);
        if (dir === 'both' || dir === 'backward') mkMarker(mids, baseColor);

        // Visible path
        const vp = svgEl('path');
        vp.setAttribute('d', d);
        vp.setAttribute('fill', 'none');
        vp.setAttribute('stroke', baseColor);
        vp.setAttribute('stroke-opacity', isSel ? '0.95' : '0.45');
        vp.setAttribute('stroke-width',   isSel ? weight + 2 : weight);
        vp.setAttribute('stroke-dasharray', dash);
        vp.setAttribute('stroke-linecap', 'round');
        vp.setAttribute('pointer-events', 'none');
        if (isSel) vp.setAttribute('filter', `drop-shadow(0 0 5px ${baseColor})`);
        if (dir === 'forward'  || dir === 'both') vp.setAttribute('marker-end',   `url(#${mid})`);
        if (dir === 'backward' || dir === 'both') vp.setAttribute('marker-start', `url(#${mids})`);
        connLayer.appendChild(vp);

        // Label
        if (conn.label) {
          const mx = (x1 + cx + x2) / 3;
          const my = (y1 + cy + y2) / 3 - 6;
          const lw = conn.label.length * 5.5 + 10;
          const bg = svgEl('rect');
          bg.setAttribute('x', mx - lw / 2); bg.setAttribute('y', my - 9);
          bg.setAttribute('width', lw); bg.setAttribute('height', 14);
          bg.setAttribute('rx', 3); bg.setAttribute('fill', 'rgba(14,15,17,0.88)');
          bg.setAttribute('pointer-events', 'none');
          connLayer.appendChild(bg);
          const txt = svgEl('text');
          txt.setAttribute('x', mx); txt.setAttribute('y', my + 1);
          txt.setAttribute('class', 'kardio-conn-label');
          txt.setAttribute('fill', baseColor); txt.setAttribute('fill-opacity', '0.9');
          txt.setAttribute('pointer-events', 'none');
          txt.textContent = conn.label;
          connLayer.appendChild(txt);
        }

        // Hit area (top layer)
        const hit = svgEl('path');
        hit.setAttribute('d', d);
        hit.setAttribute('fill', 'none');
        hit.setAttribute('stroke', 'transparent');
        hit.setAttribute('stroke-width', '18');
        hit.setAttribute('pointer-events', 'stroke');
        hit.style.cursor = 'pointer';
        hit.addEventListener('mouseenter', () => {
          vp.setAttribute('stroke-opacity', '0.9');
          vp.setAttribute('stroke-width', String(weight + 2));
          hit.setAttribute('stroke', baseColor);
          hit.setAttribute('stroke-opacity', '0.12');
        });
        hit.addEventListener('mouseleave', () => {
          if (state.selectedConnId !== conn.id) {
            vp.setAttribute('stroke-opacity', '0.45');
            vp.setAttribute('stroke-width', String(weight));
          }
          hit.setAttribute('stroke', 'transparent');
        });
        hit.addEventListener('click', e => {
          e.stopPropagation();
          openRelPanel(conn.id, e.clientX, e.clientY);
        });
        hitLayer.appendChild(hit);
      });
    }

    function mkMarker(id, color) {
      document.getElementById(id)?.remove();
      const m = svgEl('marker');
      m.setAttribute('id', id);
      m.setAttribute('markerWidth', '7'); m.setAttribute('markerHeight', '7');
      m.setAttribute('refX', '5'); m.setAttribute('refY', '3');
      m.setAttribute('orient', 'auto');
      const p = svgEl('path');
      p.setAttribute('d', 'M0,0 L0,6 L6,3 z');
      p.setAttribute('fill', color);
      m.appendChild(p); defs.appendChild(m);
    }

    function cardCenter(card) {
      return [card.x + CARD_W / 2, card.y + CARD_H / 2];
    }

    function updateStatus() {
      statusEl.textContent = `${state.cards.length} kort · ${state.connections.length} kopplingar · ${state.currentMode}`;
    }

    // ── DRAG ──────────────────────────────────────────

    function onCardMouseDown(e) {
      if (e.target.closest('.kardio-card-actions')) return;
      if (state.connectMode) return;
      const card = state.cards.find(c => c.id === parseInt(e.currentTarget.dataset.id));
      if (!card) return;
      const el = e.currentTarget;
      el.classList.add('dragging');
      el.style.zIndex = 500;
      state.dragState = { card, el, sx: e.clientX - card.x, sy: e.clientY - card.y };
      e.preventDefault();
    }

    function onMouseMove(e) {
      // drag
      if (state.dragState) {
        const { card, el, sx, sy } = state.dragState;
        card.x = e.clientX - sx;
        card.y = e.clientY - sy;
        el.style.left = card.x + 'px';
        el.style.top  = card.y + 'px';
        renderConnections();
      }
      // temp line
      if (state.connectMode && state.connectSource) {
        const src = state.cards.find(c => c.id === state.connectSource);
        if (src) {
          const [x1, y1] = cardCenter(src);
          tempLine.setAttribute('x1', x1); tempLine.setAttribute('y1', y1);
          tempLine.setAttribute('x2', e.clientX); tempLine.setAttribute('y2', e.clientY);
          tempLine.style.display = '';
        }
      }
    }

    function onMouseUp() {
      if (state.dragState) {
        state.dragState.el.classList.remove('dragging');
        state.dragState.el.style.zIndex = '';
        state.dragState = null;
      }
    }

    // ── CONNECT MODE ──────────────────────────────────

    function onCardClick(e) {
      if (e.target.closest('.kardio-card-actions')) return;
      if (!state.connectMode) return;
      const id = parseInt(e.currentTarget.dataset.id);
      if (!state.connectSource) {
        state.connectSource = id;
        container.querySelector(`.kardio-card[data-id="${id}"]`).classList.add('connecting-source');
        $$('.kardio-card').forEach(el => {
          if (parseInt(el.dataset.id) !== id) el.classList.add('connecting-target');
        });
      } else {
        if (id !== state.connectSource) {
          const exists = state.connections.find(c =>
            (c.from === state.connectSource && c.to === id) ||
            (c.from === id && c.to === state.connectSource));
          if (!exists) {
            const nc = { id: Date.now(), from: state.connectSource, to: id,
              label: '', color: 'blue', style: 'solid', direction: 'forward', weight: 1.5 };
            state.connections.push(nc);
            clearConnect();
            render();
            setTimeout(() => openRelPanel(nc.id), 80);
            return;
          }
        }
        clearConnect();
        render();
      }
    }

    function clearConnect() {
      state.connectMode = false;
      state.connectSource = null;
      $$('.kardio-card').forEach(el =>
        el.classList.remove('connecting-source', 'connecting-target'));
      connectHint.style.display = 'none';
      $('.kardio-connect-btn').textContent = '⟡ Koppla kort';
      tempLine.style.display = 'none';
    }

    // ── RELATION PANEL ────────────────────────────────

    function openRelPanel(connId, mx, my) {
      const conn = state.connections.find(c => c.id === connId);
      if (!conn) return;
      state.selectedConnId = connId;

      const rect = container.getBoundingClientRect();
      if (mx !== undefined) {
        let px = (mx - rect.left) + 12;
        let py = (my - rect.top) - 20;
        if (px + 290 > rect.width)  px = (mx - rect.left) - 300;
        if (py + 480 > rect.height) py = rect.height - 490;
        relPanel.style.left = Math.max(8, px) + 'px';
        relPanel.style.top  = Math.max(8, py) + 'px';
      } else {
        relPanel.style.left = (rect.width / 2 - 140) + 'px';
        relPanel.style.top  = '80px';
      }

      const fc = state.cards.find(c => c.id === conn.from);
      const tc = state.cards.find(c => c.id === conn.to);
      $('.kardio-rel-from').textContent = fc ? fc.title : '?';
      $('.kardio-rel-to').textContent   = tc ? tc.title : '?';
      const da = { forward: '→', backward: '←', both: '↔', none: '—' };
      $('.kardio-rel-dir-arrow').textContent = da[conn.direction || 'forward'];
      $('.kardio-rel-label').value  = conn.label || '';
      $('.kardio-rel-weight').value = conn.weight || 1.5;

      $$('.kardio-rel-style-btns .kardio-style-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.style === (conn.style || 'solid')));
      $$('.kardio-rel-dir-btns .kardio-style-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.dir === (conn.direction || 'forward')));
      $$('.kardio-rel-swatches .kardio-swatch').forEach(s =>
        s.classList.toggle('active', s.dataset.color === (conn.color || 'blue')));

      relPanel.classList.add('open');
      renderConnections();
    }

    function closeRelPanel() {
      relPanel.classList.remove('open');
      state.selectedConnId = null;
      renderConnections();
    }

    function saveRelPanel() {
      const conn = state.connections.find(c => c.id === state.selectedConnId);
      if (!conn) return;
      conn.label  = $('.kardio-rel-label').value.trim();
      conn.weight = parseFloat($('.kardio-rel-weight').value);
      const as = container.querySelector('.kardio-rel-style-btns .kardio-style-btn.active');
      const ad = container.querySelector('.kardio-rel-dir-btns .kardio-style-btn.active');
      const ac = container.querySelector('.kardio-rel-swatches .kardio-swatch.active');
      if (as) conn.style     = as.dataset.style;
      if (ad) {
        conn.direction = ad.dataset.dir;
        const da = { forward: '→', backward: '←', both: '↔', none: '—' };
        $('.kardio-rel-dir-arrow').textContent = da[conn.direction];
      }
      if (ac) conn.color = ac.dataset.color;
      renderConnections();
    }

    // ── MODAL ─────────────────────────────────────────

    function openAddModal() {
      state.editingId = null;
      $('.kardio-modal-title').textContent = 'Nytt kort';
      $('.kardio-card-title').value = '';
      $('.kardio-card-body').value  = '';
      $('.kardio-card-tag').value   = '';
      $('.kardio-card-color').value = 'blue';
      $('.kardio-card-date').value  = '';
      modalOverlay.classList.add('open');
      $('.kardio-card-title').focus();
    }

    function openEditModal(id) {
      const card = state.cards.find(c => c.id === id);
      if (!card) return;
      state.editingId = id;
      $('.kardio-modal-title').textContent = 'Redigera kort';
      $('.kardio-card-title').value = card.title;
      $('.kardio-card-body').value  = card.body  || '';
      $('.kardio-card-tag').value   = card.tag   || '';
      $('.kardio-card-color').value = card.color || 'blue';
      $('.kardio-card-date').value  = card.date  || '';
      modalOverlay.classList.add('open');
    }

    function closeModal() {
      modalOverlay.classList.remove('open');
      state.editingId = null;
    }

    function saveModal() {
      const title = $('.kardio-card-title').value.trim();
      if (!title) { $('.kardio-card-title').focus(); return; }
      const data = {
        title,
        body:  $('.kardio-card-body').value.trim(),
        tag:   $('.kardio-card-tag').value.trim(),
        color: $('.kardio-card-color').value,
        date:  $('.kardio-card-date').value.trim(),
      };
      if (state.editingId) {
        Object.assign(state.cards.find(c => c.id === state.editingId), data);
      } else {
        const rect = container.getBoundingClientRect();
        data.x = rect.width  / 2 - CARD_W / 2 + (Math.random() - 0.5) * 180;
        data.y = rect.height / 2 - CARD_H / 2 + (Math.random() - 0.5) * 130;
        data.id = state.nextId++;
        state.cards.push(data);
      }
      closeModal(); render();
    }

    function deleteCard(id) {
      state.cards = state.cards.filter(c => c.id !== id);
      state.connections = state.connections.filter(c => c.from !== id && c.to !== id);
      container.querySelector(`.kardio-card[data-id="${id}"]`)?.remove();
      renderConnections(); updateStatus();
    }

    // ── LAYOUTS ───────────────────────────────────────

    function applyLayout(mode) {
      state.currentMode = mode;
      const W = container.clientWidth, H = container.clientHeight;
      $$('.kardio-card').forEach(el => el.classList.add('animating'));
      if (mode === 'hierarchy') layoutHierarchy(W, H);
      else if (mode === 'mindmap')   layoutMindmap(W, H);
      else if (mode === 'network')   layoutNetwork(W, H);
      else if (mode === 'timeline')  layoutTimeline(W, H);
      setTimeout(() => {
        render();
        setTimeout(() => $$('.kardio-card').forEach(el => el.classList.remove('animating')), 600);
      }, 30);
    }

    function layoutHierarchy(W, H) {
      const targets = new Set(state.connections.map(c => c.to));
      const roots   = state.cards.filter(c => !targets.has(c.id));
      if (!roots.length) roots.push(state.cards[0]);
      const levels = {};
      function asgn(id, lv) {
        if (levels[id] <= lv) return;
        levels[id] = lv;
        state.connections.filter(c => c.from === id).forEach(c => asgn(c.to, lv + 1));
      }
      roots.forEach(r => asgn(r.id, 0));
      state.cards.forEach(c => { if (levels[c.id] === undefined) levels[c.id] = 0; });
      const byLv = {};
      state.cards.forEach(c => { const l = levels[c.id] || 0; (byLv[l] = byLv[l] || []).push(c); });
      Object.entries(byLv).forEach(([lv, cards]) => {
        const y = 80 + lv * 170;
        const startX = W / 2 - cards.length * 110;
        cards.forEach((c, i) => { c.x = startX + i * 220; c.y = y; });
      });
    }

    function layoutMindmap(W, H) {
      if (!state.cards.length) return;
      state.cards[0].x = W / 2 - CARD_W / 2;
      state.cards[0].y = H / 2 - CARD_H / 2;
      const r = Math.min(W, H) * 0.33;
      state.cards.slice(1).forEach((c, i, arr) => {
        const a = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
        c.x = W / 2 - CARD_W / 2 + Math.cos(a) * r;
        c.y = H / 2 - CARD_H / 2 + Math.sin(a) * r;
      });
    }

    function layoutNetwork(W, H) {
      const cols = Math.ceil(Math.sqrt(state.cards.length));
      const xg = (W - 60) / (cols + 1), yg = (H - 80) / (Math.ceil(state.cards.length / cols) + 1);
      state.cards.forEach((c, i) => {
        c.x = 30 + xg * (i % cols + 1) - CARD_W / 2 + (Math.random() - 0.5) * 50;
        c.y = 40 + yg * (Math.floor(i / cols) + 1) - CARD_H / 2 + (Math.random() - 0.5) * 40;
      });
    }

    function layoutTimeline(W, H) {
      const sorted = [...state.cards].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1; if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      });
      const xg = Math.max(230, (W - 80) / sorted.length);
      sorted.forEach((c, i) => {
        const orig = state.cards.find(x => x.id === c.id);
        orig.x = 40 + i * xg;
        orig.y = H / 2 - CARD_H / 2 + (i % 2 === 0 ? -80 : 80);
      });
    }

    // ── EXPORT / IMPORT ───────────────────────────────

    function exportJSON() {
      const data = JSON.stringify({ cards: state.cards, connections: state.connections }, null, 2);
      download('kardio-export.json', data, 'application/json');
    }

    function exportDSL() {
      let out = '// Kardio DSL export\n\n';
      // Build reverse id→alias map
      const aliasMap = {};
      state.cards.forEach(c => { aliasMap[c.id] = c.alias || `c${c.id}`; });
      state.cards.forEach(c => {
        const alias = aliasMap[c.id];
        const parts = [`card ${alias} "${c.title}"`];
        if (c.body)  parts.push(`"${c.body}"`);
        if (c.tag)   parts.push(`#${c.tag}`);
        if (c.color && c.color !== 'blue') parts.push(c.color);
        if (c.date)  parts.push(c.date);
        out += parts.join(' ') + '\n';
      });
      out += '\n';
      const arrowMap = {
        'forward-solid':   '-->',  'forward-dashed':  '-->-', 'forward-dotted':  '-->.',
        'backward-solid':  '<--',  'backward-dashed': '<---', 'backward-dotted': '<--.',
        'both-solid':      '<-->', 'both-dashed':     '<-->-','both-dotted':     '<-->.',
        'none-solid':      '---',  'none-dashed':     '----', 'none-dotted':     '---.',
      };
      state.connections.forEach(conn => {
        const fa = aliasMap[conn.from], ta = aliasMap[conn.to];
        const arrow = arrowMap[`${conn.direction || 'forward'}-${conn.style || 'solid'}`] || '-->';
        const parts = [fa, arrow, ta];
        const extras = [];
        if (conn.label) extras.push(`"${conn.label}"`);
        if (conn.color && conn.color !== 'blue') extras.push(conn.color);
        if (conn.weight && conn.weight !== 1.5) extras.push(`${conn.weight}px`);
        if (extras.length) parts.push(': ' + extras.join(' '));
        out += parts.join(' ') + '\n';
      });
      download('kardio-export.kardio', out, 'text/plain');
    }

    function importJSON(jsonStr) {
      const data = JSON.parse(jsonStr);
      if (data.cards) state.cards = data.cards;
      if (data.connections) state.connections = data.connections;
      state.nextId = Math.max(...state.cards.map(c => c.id), 0) + 1;
      cardsLayer.innerHTML = '';
      render();
    }

    function download(filename, text, mime) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: mime }));
      a.download = filename; a.click();
    }

    // ── WIRE EVENTS ───────────────────────────────────

    // Menu toggle
    menuToggle.addEventListener('click', () => menuPanel.classList.toggle('open'));
    container.addEventListener('click', e => {
      if (!e.target.closest('.kardio-menu')) menuPanel.classList.remove('open');
    });

    // Mode buttons
    $$('.kardio-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.kardio-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyLayout(btn.dataset.mode);
        menuPanel.classList.remove('open');
      });
    });

    // Action buttons
    $('.kardio-add-card').addEventListener('click', () => { menuPanel.classList.remove('open'); openAddModal(); });
    $('.kardio-connect-btn').addEventListener('click', () => {
      state.connectMode = !state.connectMode;
      if (state.connectMode) {
        connectHint.style.display = 'block';
        $('.kardio-connect-btn').textContent = '✕ Avbryt koppling';
      } else { clearConnect(); }
      menuPanel.classList.remove('open');
    });
    $('.kardio-clear-conns').addEventListener('click', () => {
      if (confirm('Ta bort alla kopplingar?')) { state.connections = []; render(); }
      menuPanel.classList.remove('open');
    });
    $('.kardio-export-btn').addEventListener('click', () => { exportJSON(); menuPanel.classList.remove('open'); });
    $('.kardio-export-dsl-btn').addEventListener('click', () => { exportDSL(); menuPanel.classList.remove('open'); });
    $('.kardio-import-btn').addEventListener('click', () => {
      $('.kardio-import-input').click(); menuPanel.classList.remove('open');
    });
    $('.kardio-import-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { try { importJSON(ev.target.result); } catch { alert('Ogiltig fil.'); } };
      reader.readAsText(file);
      e.target.value = '';
    });

    // Modal
    $('.kardio-modal-save').addEventListener('click', saveModal);
    $('.kardio-modal-cancel').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    $('.kardio-card-title').addEventListener('keydown', e => { if (e.key === 'Enter') saveModal(); });

    // Relation panel
    $('.kardio-rel-close').addEventListener('click', closeRelPanel);
    $('.kardio-rel-delete').addEventListener('click', () => {
      state.connections = state.connections.filter(c => c.id !== state.selectedConnId);
      closeRelPanel(); render();
    });
    $('.kardio-rel-label').addEventListener('input', saveRelPanel);
    $('.kardio-rel-weight').addEventListener('input', saveRelPanel);
    $$('.kardio-rel-style-btns .kardio-style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.kardio-rel-style-btns .kardio-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); saveRelPanel();
      });
    });
    $$('.kardio-rel-dir-btns .kardio-style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.kardio-rel-dir-btns .kardio-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); saveRelPanel();
      });
    });
    $$('.kardio-rel-swatches .kardio-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        $$('.kardio-rel-swatches .kardio-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active'); saveRelPanel();
      });
    });
    container.addEventListener('click', e => {
      if (relPanel.classList.contains('open') &&
          !e.target.closest('.kardio-rel-panel') &&
          !e.target.closest('.kardio-card') &&
          e.target.tagName !== 'path') {
        closeRelPanel();
      }
    });

    // Global mouse/keyboard (scoped to container when possible)
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') clearConnect(); });

    // ── Public API ────────────────────────────────────
    self.load = (newSrc) => {
      const p = parseDSL(newSrc);
      state.cards = p.cards; state.connections = p.connections; state.nextId = p.nextId;
      cardsLayer.innerHTML = ''; render();
    };
    self.getJSON = () => ({ cards: state.cards, connections: state.connections });
    self.getDSL  = () => { exportDSL(); };
    self.destroy = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      container.innerHTML = '';
    };

    // ── Initial render ────────────────────────────────
    render();
  }

  // ═══════════════════════════════════════════════════════
  //  UTILS
  // ═══════════════════════════════════════════════════════

  function svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ═══════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════

  const Kardio = {
    /**
     * Render a Kardio diagram into a container element.
     * @param {string|Element} target  CSS selector or DOM element
     * @param {string} src             Kardio DSL source string
     * @returns {KardioInstance}
     */
    render(target, src) {
      injectStyles();
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) throw new Error(`Kardio: element not found — "${target}"`);
      return new KardioInstance(el, src);
    },

    /**
     * Parse a DSL string and return raw JSON data without rendering.
     */
    parse: parseDSL,

    /**
     * Auto-initialize all <div class="kardio"> elements on the page.
     * Reads inline DSL from element content, or fetches data-src attribute.
     */
    autoInit() {
      injectStyles();
      document.querySelectorAll('.kardio[data-kardio], .kardio').forEach(el => {
        const inline = el.getAttribute('data-kardio') || el.textContent.trim();
        el.textContent = '';
        new KardioInstance(el, inline);
      });
    }
  };

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Kardio.autoInit());
  } else {
    Kardio.autoInit();
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Kardio;
  } else {
    global.Kardio = Kardio;
  }

}(typeof globalThis !== 'undefined' ? globalThis : window));
