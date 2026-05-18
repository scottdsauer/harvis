/**
 * HARVIS Hub — Full-screen navigation hub
 * Ring → hover shows floors → click floor shows room grid
 */

const _HUB_DEFAULTS = [
  {
    name: 'First Floor', code: '01',
    rooms: [
      { name: 'Family Room',    icon: '🛋', navigate: '/lovelace/family-room',    entity: 'sensor.family_room_temperature' },
      { name: 'Kitchen',        icon: '🍳', navigate: '/lovelace/kitchen',         entity: 'sensor.kitchen_temperature' },
      { name: 'Master Bedroom', icon: '🛏', navigate: '/lovelace/master-bedroom',  entity: 'sensor.master_bedroom_temperature' },
      { name: 'Master Bath',    icon: '🚿', navigate: '/lovelace/master-bath',     entity: 'sensor.master_bath_temperature' },
      { name: 'Foyer',          icon: '🚪', navigate: '/lovelace/foyer',           entity: null },
      { name: "Scott's Office", icon: '💻', navigate: '/lovelace/office',          entity: 'sensor.office_temperature' },
      { name: 'Dining Room',    icon: '🍽', navigate: '/lovelace/dining-room',     entity: null },
      { name: 'Back Deck',      icon: '🌿', navigate: '/lovelace/back-deck',       entity: 'sensor.back_deck_temperature' },
    ],
  },
  {
    name: 'Second Floor', code: '02',
    rooms: [
      { name: 'Bedroom 2', icon: '🛏', navigate: '/lovelace/bedroom-2', entity: null },
      { name: 'Bedroom 3', icon: '🛏', navigate: '/lovelace/bedroom-3', entity: null },
      { name: 'Bathroom',  icon: '🚿', navigate: '/lovelace/bathroom',  entity: null },
    ],
  },
  {
    name: 'Basement', code: 'B',
    rooms: [
      { name: 'Laundry',   icon: '🧺', navigate: '/lovelace/laundry',   entity: null },
      { name: 'Storage',   icon: '📦', navigate: '/lovelace/storage',   entity: null },
    ],
  },
];

class HarvisHub extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._state = 'idle';
    this._c = '#00d4ff';
    this._interval = null;
    this._leaveTimer = null;
  }

  set hass(h) {
    this._hass = h;
    this._refreshSensors();
  }

  getCardSize() { return 10; }

  setConfig(config) {
    this._config = { color: '#00d4ff', title: 'HARVIS', floors: _HUB_DEFAULTS, ...config };
    this._c = this._config.color;
    this._render();
  }

  connectedCallback()    { this._interval = setInterval(() => this._tick(), 1000); }
  disconnectedCallback() { clearInterval(this._interval); clearTimeout(this._leaveTimer); }

  // ── SVG ring helpers (300×300 viewBox) ──────────────────────────

  _rt(a, r, w, h, op = 0.8, fill = null) {
    const rad = (a - 90) * Math.PI / 180;
    const x = 150 + Math.cos(rad) * r, y = 150 + Math.sin(rad) * r;
    return `<rect x="${(x-w/2).toFixed(2)}" y="${(y-h/2).toFixed(2)}" width="${w}" height="${h}"
      fill="${fill||this._c}" opacity="${op}" transform="rotate(${a},${x.toFixed(2)},${y.toFixed(2)})"/>`;
  }

  _tk(s, e, r, h, n, op = 0.5) {
    const full = (e-s) >= 360, den = full ? n : (n-1||1);
    return Array.from({length:n}, (_,i) => {
      const a = (s+(e-s)*i/den-90)*Math.PI/180;
      return `<line x1="${(150+Math.cos(a)*(r-h/2)).toFixed(2)}" y1="${(150+Math.sin(a)*(r-h/2)).toFixed(2)}"
        x2="${(150+Math.cos(a)*(r+h/2)).toFixed(2)}" y2="${(150+Math.sin(a)*(r+h/2)).toFixed(2)}"
        stroke="${this._c}" stroke-width="0.7" stroke-opacity="${op}"/>`;
    }).join('');
  }

  _ac(s, e, r, w, op) {
    const sa=(s-90)*Math.PI/180, ea=(e-90)*Math.PI/180;
    const x1=(150+Math.cos(sa)*r).toFixed(2), y1=(150+Math.sin(sa)*r).toFixed(2);
    const x2=(150+Math.cos(ea)*r).toFixed(2), y2=(150+Math.sin(ea)*r).toFixed(2);
    const lg = ((e-s)+360)%360 > 180 ? 1 : 0;
    return `<path d="M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}"
      fill="none" stroke="${this._c}" stroke-width="${w}" stroke-opacity="${op}" filter="url(#hg)"/>`;
  }

  _ringSVG() {
    const c = this._c;
    const R5=141,R4=120,R3=100,R2=80,RH=58;
    const tp3t = `M ${150-R3},150 A ${R3},${R3} 0 0,0 ${150+R3},150`;
    const tp4b = `M ${150+R4},150 A ${R4},${R4} 0 0,1 ${150-R4},150`;
    const tp5t = `M ${150-R5},150 A ${R5},${R5} 0 0,0 ${150+R5},150`;
    return `
    <svg width="100%" height="100%" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="hg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="hgs" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="hbg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="${c}" stop-opacity=".07"/>
          <stop offset="55%"  stop-color="${c}" stop-opacity=".015"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <path id="tp3t" d="${tp3t}"/>
        <path id="tp4b" d="${tp4b}"/>
        <path id="tp5t" d="${tp5t}"/>
      </defs>
      <circle cx="150" cy="150" r="149" fill="#050a14"/>
      <circle cx="150" cy="150" r="149" fill="url(#hbg)"/>
      <g class="r5">
        <circle cx="150" cy="150" r="${R5}" fill="none" stroke="${c}" stroke-width=".5" stroke-opacity=".18"/>
        ${this._tk(340,58,R5,5,12,.36)}${this._tk(78,125,R5,4,7,.30)}
        ${this._tk(192,248,R5,5,10,.36)}${this._tk(268,308,R5,4,6,.28)}
        ${this._rt(15,R5,16,3,.92)}${this._rt(95,R5,20,3,.95)}
        ${this._rt(198,R5,16,3,.90)}${this._rt(332,R5,18,3,.92)}
        <text fill="${c}" font-size="5.5" opacity=".32"
          font-family="'Share Tech Mono','Courier New',monospace" letter-spacing="2.5">
          <textPath href="#tp5t" startOffset="10%">· · · 0 0 · · · 0 0 0 · · 0 · · · 0 0 0 · · · 0</textPath>
        </text>
      </g>
      <g class="r4">
        ${this._ac(4,86,R4,1,.45)}${this._ac(94,176,R4,1,.42)}
        ${this._ac(184,266,R4,1,.45)}${this._ac(274,356,R4,1,.42)}
        ${this._ac(338,86,R4,2,.88)}
        ${this._tk(6,84,R4,6,24,.55)}${this._tk(186,264,R4,6,22,.50)}
        ${this._rt(0,R4,3,12,.95)}${this._rt(90,R4,3,12,.92)}
        ${this._rt(180,R4,3,12,.95)}${this._rt(270,R4,3,12,.92)}
        <text fill="${c}" font-size="6" opacity=".62"
          font-family="'Share Tech Mono','Courier New',monospace" letter-spacing="2">
          <textPath href="#tp4b" startOffset="8%">0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0</textPath>
        </text>
      </g>
      <g class="r3">
        <circle cx="150" cy="150" r="${R3}" fill="none" stroke="${c}"
          stroke-width=".6" stroke-opacity=".26" stroke-dasharray="3.5 4.5"/>
        ${this._tk(148,336,R3,5,36,.40)}
        ${this._rt(142,R3,3,10,.82)}${this._rt(205,R3,3,10,.82)}
        ${this._rt(268,R3,3,10,.82)}${this._rt(332,R3,3,10,.75)}
        <text fill="${c}" font-size="7" opacity=".75"
          font-family="'Share Tech Mono','Courier New',monospace" letter-spacing="2.5">
          <textPath href="#tp3t" startOffset="5%">0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0</textPath>
        </text>
      </g>
      <g class="r2">
        ${this._ac(2,88,R2,1,.50)}${this._ac(92,178,R2,1,.50)}
        ${this._ac(182,268,R2,1,.50)}${this._ac(272,358,R2,1,.50)}
        ${this._tk(0,360,R2,4,88,.36)}
        ${this._rt(0,R2,2.5,9,.90)}${this._rt(90,R2,2.5,9,.90)}
        ${this._rt(180,R2,2.5,9,.90)}${this._rt(270,R2,2.5,9,.90)}
      </g>
      <circle cx="150" cy="150" r="${RH}" fill="none" stroke="${c}"
        stroke-width="6" stroke-opacity=".28" filter="url(#hgs)" class="rh"/>
      <circle cx="150" cy="150" r="${RH}" fill="none" stroke="${c}"
        stroke-width="2.2" stroke-opacity=".98" filter="url(#hg)" class="rf"/>
      ${[0,90,180,270].map(a=>this._rt(a,RH,5,6,1,'#050a14')).join('')}
    </svg>`;
  }

  _render() {
    const { title, floors } = this._config;
    const c = this._c;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card { background:#050a14; border:none; overflow:hidden; }

        .hub {
          position:relative; width:100%; min-height:100vh;
          background:radial-gradient(ellipse 55% 55% at center,#07111f 0%,#020810 100%);
          overflow:hidden;
        }
        .hub::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
          background:repeating-linear-gradient(to bottom,
            transparent 0,transparent 3px,rgba(0,212,255,.012) 3px,rgba(0,212,255,.012) 4px);
        }

        /* ── Ring layer (always present) ── */
        .ring-layer {
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          pointer-events:none; z-index:10;
          transition:opacity .5s;
        }
        .hub[data-state="rooms"] .ring-layer { pointer-events:none; }

        .ring-wrap {
          position:relative; flex-shrink:0; cursor:pointer;
          width:clamp(260px,44vmin,480px); height:clamp(260px,44vmin,480px);
          transition:transform .55s cubic-bezier(.4,0,.2,1);
          pointer-events:all;
        }
        .hub[data-state="floors"] .ring-wrap { transform:scale(.82); }
        .hub[data-state="rooms"]  .ring-wrap {
          transform:scale(.22) translateY(-185%);
          pointer-events:none;
        }

        .ring-label {
          position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%);
          text-align:center; pointer-events:none;
          font-family:'Orbitron','Share Tech Mono','Courier New',monospace; color:${c};
        }
        .rl-title {
          font-size:clamp(14px,3.2vmin,26px); font-weight:700; letter-spacing:.3em;
          text-shadow:0 0 20px ${c},0 0 40px rgba(0,212,255,.25);
          transition:opacity .3s;
        }
        .rl-clock { font-size:clamp(8px,1.5vmin,12px); opacity:.38; letter-spacing:.3em; margin-top:4px; }

        /* Ring animations */
        @keyframes hcw   { to { transform:rotate( 360deg); } }
        @keyframes hccw  { to { transform:rotate(-360deg); } }
        @keyframes hpulse { 0%,100%{opacity:.72} 50%{opacity:1} }
        @keyframes hflick {
          0%,90%,100%{opacity:1} 91%{opacity:.18} 92%{opacity:.82} 93%{opacity:.08} 94%{opacity:1}
        }
        .r5{animation:hcw  38s linear infinite;transform-origin:150px 150px;transform-box:view-box;}
        .r4{animation:hccw 22s linear infinite;transform-origin:150px 150px;transform-box:view-box;}
        .r3{animation:hcw  28s linear infinite;transform-origin:150px 150px;transform-box:view-box;}
        .r2{animation:hccw 14s linear infinite;transform-origin:150px 150px;transform-box:view-box;}
        .rh{animation:hpulse 3.2s ease-in-out infinite;}
        .rf{animation:hflick 10s  ease-in-out infinite;}

        /* ── Floor panels ── */
        .fp {
          position:absolute; left:50%; top:50%;
          width:162px; padding:14px 18px 12px;
          background:rgba(0,212,255,.04);
          border:1px solid rgba(0,212,255,.28);
          box-shadow:0 0 16px rgba(0,212,255,.06);
          cursor:pointer; pointer-events:none;
          opacity:0; z-index:20;
          transition:opacity .4s, transform .45s cubic-bezier(.4,0,.2,1),
                     border-color .2s, box-shadow .2s;
        }
        .hub[data-state="floors"] .fp { opacity:1; pointer-events:all; }

        .fp-0 { transform:translate(-50%,-50%) scale(.2); }
        .fp-1 { transform:translate(-50%,-50%) scale(.2); transition-delay:75ms; }
        .fp-2 { transform:translate(-50%,-50%) scale(.2); transition-delay:150ms; }

        .hub[data-state="floors"] .fp-0 {
          transform:translate(-50%, calc(-50% - clamp(185px,25vmin,275px))) scale(1);
        }
        .hub[data-state="floors"] .fp-1 {
          transform:translate(calc(-50% + clamp(145px,20vmin,220px)),calc(-50% + clamp(95px,13vmin,155px))) scale(1);
        }
        .hub[data-state="floors"] .fp-2 {
          transform:translate(calc(-50% - clamp(145px,20vmin,220px)),calc(-50% + clamp(95px,13vmin,155px))) scale(1);
        }

        .fp:hover {
          border-color:rgba(0,212,255,.75);
          box-shadow:0 0 28px rgba(0,212,255,.18),inset 0 0 12px rgba(0,212,255,.05);
        }
        .br{position:absolute;width:9px;height:9px;border-color:${c};border-style:solid;opacity:.85;}
        .br-tl{top:-1px;left:-1px;    border-width:2px 0 0 2px;}
        .br-tr{top:-1px;right:-1px;   border-width:2px 2px 0 0;}
        .br-bl{bottom:-1px;left:-1px; border-width:0 0 2px 2px;}
        .br-br{bottom:-1px;right:-1px;border-width:0 2px 2px 0;}
        .fp-lvl  {font-size:9px;letter-spacing:.35em;color:${c};opacity:.4;margin-bottom:5px;
                  font-family:'Orbitron','Share Tech Mono','Courier New',monospace;}
        .fp-name {font-size:13px;font-weight:700;letter-spacing:.15em;color:${c};margin-bottom:5px;
                  font-family:'Orbitron','Share Tech Mono','Courier New',monospace;text-shadow:0 0 10px ${c};}
        .fp-cnt  {font-size:9px;letter-spacing:.25em;color:${c};opacity:.38;
                  font-family:'Orbitron','Share Tech Mono','Courier New',monospace;}

        /* ── Room grid layer ── */
        .rooms-layer {
          position:absolute; inset:0;
          display:flex; flex-direction:column;
          padding:clamp(12px,2vw,28px);
          opacity:0; pointer-events:none;
          transition:opacity .45s .1s;
          z-index:15; overflow-y:auto;
        }
        .hub[data-state="rooms"] .rooms-layer { opacity:1; pointer-events:all; }

        .rooms-header {
          display:flex; align-items:center; gap:16px;
          padding:clamp(48px,8vmin,80px) 0 clamp(16px,2vmin,28px);
          border-bottom:1px solid rgba(0,212,255,.15);
          margin-bottom:clamp(16px,2.5vmin,28px);
        }
        .rooms-header-title {
          font-size:clamp(18px,3.5vmin,32px); font-weight:700;
          letter-spacing:.2em; color:${c};
          font-family:'Orbitron','Share Tech Mono','Courier New',monospace;
          text-shadow:0 0 16px ${c};
        }
        .rooms-header-sub {
          font-size:clamp(8px,1.2vmin,10px); letter-spacing:.3em;
          color:${c}; opacity:.35;
          font-family:'Orbitron','Share Tech Mono','Courier New',monospace;
          margin-top:2px;
        }

        .rooms-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(clamp(160px,22vw,240px), 1fr));
          gap:clamp(10px,1.5vw,18px);
        }

        /* Room card */
        .rc {
          position:relative;
          background:rgba(5,10,20,.9);
          border:1px solid rgba(0,212,255,.25);
          border-radius:4px; overflow:hidden; cursor:pointer;
          transition:border-color .2s, box-shadow .2s, transform .2s;
        }
        .rc:hover {
          border-color:rgba(0,212,255,.7);
          box-shadow:0 0 22px rgba(0,212,255,.15),inset 0 0 10px rgba(0,212,255,.04);
          transform:translateY(-2px);
        }
        .rc .br { z-index:2; }

        /* Image area */
        .rc-img {
          width:100%; aspect-ratio:16/9;
          background-size:cover; background-position:center;
          position:relative; overflow:hidden;
        }
        .rc-img-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to bottom,transparent 40%,rgba(5,10,20,.85) 100%);
        }
        /* Placeholder gradient when no image */
        .rc-img.no-img {
          background:linear-gradient(135deg,
            rgba(0,212,255,.08) 0%, rgba(0,102,255,.05) 50%, rgba(0,212,255,.03) 100%);
          display:flex; align-items:center; justify-content:center;
        }
        .rc-img-icon { font-size:clamp(24px,4vmin,36px); opacity:.4; }

        /* Info bar */
        .rc-info {
          padding:10px 14px 12px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .rc-name {
          font-size:clamp(10px,1.4vmin,13px); font-weight:700;
          letter-spacing:.15em; color:${c};
          font-family:'Orbitron','Share Tech Mono','Courier New',monospace;
          text-shadow:0 0 8px rgba(0,212,255,.4);
        }
        .rc-sensor {
          font-size:clamp(9px,1.2vmin,11px); letter-spacing:.1em;
          color:${c}; opacity:.5;
          font-family:'Share Tech Mono','Courier New',monospace;
        }

        /* Hover accent line at bottom of card */
        .rc::after {
          content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
          background:linear-gradient(to right,transparent,${c},transparent);
          opacity:0; transition:opacity .2s;
        }
        .rc:hover::after { opacity:.6; }

        /* ── Back button ── */
        .back-btn {
          position:absolute; top:clamp(12px,2vh,20px); left:clamp(12px,2vw,20px);
          padding:7px 18px; background:transparent;
          border:1px solid rgba(0,212,255,.22); color:${c};
          opacity:0; pointer-events:none;
          font-family:'Orbitron','Share Tech Mono','Courier New',monospace;
          font-size:9px; letter-spacing:.3em; cursor:pointer;
          transition:opacity .3s, border-color .2s, box-shadow .2s; z-index:30;
        }
        .hub[data-state="floors"] .back-btn,
        .hub[data-state="rooms"]  .back-btn { opacity:1; pointer-events:all; }
        .back-btn:hover { border-color:${c}; box-shadow:0 0 10px rgba(0,212,255,.2); }
      </style>

      <ha-card>
        <div class="hub" id="hub" data-state="idle">

          <!-- Central ring (always visible, scales on state change) -->
          <div class="ring-layer">
            <div class="ring-wrap" id="ring-wrap">
              ${this._ringSVG()}
              <div class="ring-label">
                <div class="rl-title">${title}</div>
                <div class="rl-clock" id="h-clock"></div>
              </div>
            </div>
          </div>

          <!-- Floor panels (visible in floors state) -->
          ${floors.map((f,i) => `
            <div class="fp fp-${i}" data-floor="${i}">
              <div class="br br-tl"></div><div class="br br-tr"></div>
              <div class="br br-bl"></div><div class="br br-br"></div>
              <div class="fp-lvl">FLOOR ${f.code}</div>
              <div class="fp-name">${f.name.toUpperCase()}</div>
              <div class="fp-cnt">${f.rooms.length} ROOMS</div>
            </div>
          `).join('')}

          <!-- Room grid (visible in rooms state) -->
          <div class="rooms-layer" id="rooms-layer">
            <div class="rooms-header" id="rooms-header">
              <div>
                <div class="rooms-header-title" id="rooms-title">—</div>
                <div class="rooms-header-sub">SELECT A ROOM</div>
              </div>
            </div>
            <div class="rooms-grid" id="rooms-grid"></div>
          </div>

          <button class="back-btn" id="back-btn">◀ BACK</button>
        </div>
      </ha-card>
    `;

    this._tick();
    this._bind();
  }

  _bind() {
    const hub  = this.shadowRoot.getElementById('hub');
    const ring = this.shadowRoot.getElementById('ring-wrap');
    const back = this.shadowRoot.getElementById('back-btn');

    ring.addEventListener('mouseenter', () => {
      if (this._state === 'idle') this._go('floors');
    });

    hub.addEventListener('mouseleave', () => {
      clearTimeout(this._leaveTimer);
      this._leaveTimer = setTimeout(() => {
        if (this._state === 'floors') this._go('idle');
      }, 220);
    });
    hub.addEventListener('mouseenter', () => clearTimeout(this._leaveTimer));

    this.shadowRoot.querySelectorAll('.fp').forEach(p =>
      p.addEventListener('click', () => this._openFloor(+p.dataset.floor))
    );

    back.addEventListener('click', () => {
      if (this._state === 'rooms') {
        this._go('floors');
      } else {
        this._go('idle');
      }
    });
  }

  _go(state) {
    this._state = state;
    this.shadowRoot.getElementById('hub').dataset.state = state;
  }

  _openFloor(idx) {
    const floor = this._config.floors[idx];
    this.shadowRoot.getElementById('rooms-title').textContent = floor.name.toUpperCase();
    this._buildRoomGrid(floor.rooms);
    this._go('rooms');
  }

  _buildRoomGrid(rooms) {
    const grid = this.shadowRoot.getElementById('rooms-grid');
    grid.innerHTML = rooms.map(room => {
      const hasImg = !!room.image;
      const imgStyle = hasImg ? `background-image:url('${room.image}')` : '';
      return `
        <div class="rc" data-nav="${room.navigate||''}">
          <div class="br br-tl"></div><div class="br br-tr"></div>
          <div class="br br-bl"></div><div class="br br-br"></div>
          <div class="rc-img ${hasImg?'':'no-img'}" style="${imgStyle}">
            ${hasImg ? '<div class="rc-img-overlay"></div>' : `<div class="rc-img-icon">${room.icon||'◈'}</div>`}
          </div>
          <div class="rc-info">
            <div class="rc-name">${room.name.toUpperCase()}</div>
            <div class="rc-sensor" id="sens-${room.navigate?.replace(/\//g,'_')||room.name.replace(/\s/g,'_')}">${this._getSensor(room)}</div>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.rc').forEach(card => {
      card.addEventListener('click', () => {
        const nav = card.dataset.nav;
        if (!nav) return;
        this.dispatchEvent(new CustomEvent('hass-action', {
          bubbles: true, composed: true,
          detail: { action: 'navigate', navigation_path: nav },
        }));
      });
    });
  }

  _getSensor(room) {
    if (!room.entity || !this._hass) return '';
    const s = this._hass.states[room.entity];
    if (!s) return '';
    return `${s.state}${s.attributes.unit_of_measurement || ''}`;
  }

  _refreshSensors() {
    if (this._state !== 'rooms') return;
    const grid = this.shadowRoot.getElementById('rooms-grid');
    if (!grid) return;
    const floor = this._config.floors.find((_, i) =>
      this.shadowRoot.getElementById('rooms-title').textContent === _.name.toUpperCase()
    );
    if (!floor) return;
    floor.rooms.forEach(room => {
      const val = this._getSensor(room);
      const key = `sens-${(room.navigate||room.name).replace(/\//g,'_').replace(/\s/g,'_')}`;
      const el = this.shadowRoot.getElementById(key);
      if (el && val) el.textContent = val;
    });
  }

  _tick() {
    const el = this.shadowRoot?.getElementById('h-clock');
    if (!el) return;
    const n = new Date();
    el.textContent = `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`;
  }
}

customElements.define('harvis-hub', HarvisHub);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'harvis-hub',
  name: 'HARVIS Hub',
  description: 'Full-screen navigation hub with floor and room grid',
  preview: false,
  documentationURL: 'https://github.com/scottdsauer/harvis',
});
