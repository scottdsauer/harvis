/**
 * HARVIS Card — Animated HARVIS HUD for Home Assistant
 * Inspired by HARVIS — Home Assistant Real-time Visual Intelligence System
 */
class HarvisCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._interval = null;
    this._c = '#00d4ff';
  }

  set hass(hass) {
    this._hass = hass;
    this._updateDisplay();
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._config = {
      size: 300,
      color: '#00d4ff',
      show_time: true,
      speed: 1,
      title: 'HARVIS',
      ...config,
    };
    this._c = this._config.color;
    this._render();
  }

  getCardSize() {
    return Math.ceil((this._config.size + 60) / 80);
  }

  connectedCallback() {
    this._interval = setInterval(() => this._updateDisplay(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this._interval);
    this._interval = null;
  }

  // Rectangular tick at clock-angle `a` (0=top, CW), radius `r` from SVG center 150,150
  // w=tangential size, h=radial size. fillColor defaults to theme color.
  _rt(a, r, w, h, op = 0.8, fill = null) {
    const rad = (a - 90) * Math.PI / 180;
    const x = 150 + Math.cos(rad) * r;
    const y = 150 + Math.sin(rad) * r;
    const fc = fill || this._c;
    return `<rect x="${(x - w / 2).toFixed(2)}" y="${(y - h / 2).toFixed(2)}"
      width="${w}" height="${h}" fill="${fc}" opacity="${op}"
      transform="rotate(${a},${x.toFixed(2)},${y.toFixed(2)})"/>`;
  }

  // Radial tick lines spanning `startDeg`→`endDeg` at radius `r`
  _ticks(s, e, r, h, n, op = 0.5) {
    const fullCircle = (e - s) >= 360;
    const denom = fullCircle ? n : (n - 1 || 1);
    return Array.from({ length: n }, (_, i) => {
      const a = (s + (e - s) * i / denom - 90) * Math.PI / 180;
      const x1 = (150 + Math.cos(a) * (r - h / 2)).toFixed(2);
      const y1 = (150 + Math.sin(a) * (r - h / 2)).toFixed(2);
      const x2 = (150 + Math.cos(a) * (r + h / 2)).toFixed(2);
      const y2 = (150 + Math.sin(a) * (r + h / 2)).toFixed(2);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
        stroke="${this._c}" stroke-width="0.7" stroke-opacity="${op}"/>`;
    }).join('');
  }

  // Arc segment from `s` to `e` degrees (0=top, CW) at radius `r`
  _arc(s, e, r, w, op) {
    const sa = (s - 90) * Math.PI / 180;
    const ea = (e - 90) * Math.PI / 180;
    const x1 = (150 + Math.cos(sa) * r).toFixed(2);
    const y1 = (150 + Math.sin(sa) * r).toFixed(2);
    const x2 = (150 + Math.cos(ea) * r).toFixed(2);
    const y2 = (150 + Math.sin(ea) * r).toFixed(2);
    const span = ((e - s) + 360) % 360;
    const lg = span > 180 ? 1 : 0;
    return `<path d="M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}"
      fill="none" stroke="${this._c}" stroke-width="${w}" stroke-opacity="${op}"
      filter="url(#hg)"/>`;
  }

  _render() {
    const { size, color, speed } = this._config;
    this._c = color;
    const sc = size / 300;
    const dur = b => `${(b / speed).toFixed(1)}s`;

    // Ring radii (in 300×300 viewBox)
    const R5 = 141, R4 = 120, R3 = 100, R2 = 80, RH = 58;

    // textPath arcs (absolute SVG coords, centered at 150,150)
    const tp3top  = `M ${150 - R3},150 A ${R3},${R3} 0 0,0 ${150 + R3},150`; // top half of R3
    const tp4bot  = `M ${150 + R4},150 A ${R4},${R4} 0 0,1 ${150 - R4},150`; // bottom half of R4
    const tp5top  = `M ${150 - R5},150 A ${R5},${R5} 0 0,0 ${150 + R5},150`; // top half of R5

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          background: var(--card-background-color, #050a14);
          border: 1px solid rgba(0,212,255,0.15);
          overflow: hidden;
        }
        .hw { display:flex; flex-direction:column; align-items:center; padding:12px 8px 8px; }
        .ht {
          color: ${color};
          font-family: 'Orbitron','Share Tech Mono','Courier New',monospace;
          font-size: ${(11 * sc).toFixed(1)}px;
          letter-spacing: .38em;
          text-transform: uppercase;
          opacity: .55;
          text-shadow: 0 0 10px ${color};
          margin-bottom: 4px;
        }
        .hs { position:relative; width:${size}px; height:${size}px; }
        .ci {
          position: absolute; top:50%; left:50%;
          transform: translate(-50%,-50%);
          text-align: center;
          color: ${color};
          font-family: 'Orbitron','Share Tech Mono','Courier New',monospace;
          text-shadow: 0 0 14px ${color}, 0 0 30px rgba(0,212,255,.3);
          pointer-events: none;
          white-space: nowrap;
        }
        .ct { font-size:${(30 * sc).toFixed(1)}px; font-weight:700; letter-spacing:.05em; }
        .cs { font-size:${(10 * sc).toFixed(1)}px; opacity:.4; letter-spacing:.3em; margin-top:2px; }
        .cv { font-size:${(26 * sc).toFixed(1)}px; font-weight:700; }
        .cu { font-size:${(10 * sc).toFixed(1)}px; opacity:.5; letter-spacing:.2em; }
        .cl { font-size:${(9  * sc).toFixed(1)}px; opacity:.38; letter-spacing:.25em; margin-top:3px; }

        @keyframes hcw   { to { transform: rotate( 360deg); } }
        @keyframes hccw  { to { transform: rotate(-360deg); } }
        @keyframes hpulse { 0%,100%{opacity:.72} 50%{opacity:1} }
        @keyframes hflick {
          0%,90%,100%{opacity:1} 91%{opacity:.2} 92%{opacity:.85} 93%{opacity:.1} 94%{opacity:1}
        }

        .r5 { animation:hcw  ${dur(38)} linear infinite; transform-origin:150px 150px; transform-box:view-box; }
        .r4 { animation:hccw ${dur(22)} linear infinite; transform-origin:150px 150px; transform-box:view-box; }
        .r3 { animation:hcw  ${dur(28)} linear infinite; transform-origin:150px 150px; transform-box:view-box; }
        .r2 { animation:hccw ${dur(14)} linear infinite; transform-origin:150px 150px; transform-box:view-box; }
        .rh { animation:hpulse 3.2s ease-in-out infinite; }
        .rf { animation:hflick 10s ease-in-out infinite; }
      </style>

      <ha-card>
        <div class="hw">
          ${this._config.title ? `<div class="ht">${this._config.title}</div>` : ''}
          <div class="hs">
            <svg width="${size}" height="${size}" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
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
                  <stop offset="0%"   stop-color="${color}" stop-opacity=".06"/>
                  <stop offset="50%"  stop-color="${color}" stop-opacity=".015"/>
                  <stop offset="100%" stop-color="#000"     stop-opacity="0"/>
                </radialGradient>
                <!-- Paths for textPath (absolute SVG coords) -->
                <path id="htp3t" d="${tp3top}"/>
                <path id="htp4b" d="${tp4bot}"/>
                <path id="htp5t" d="${tp5top}"/>
              </defs>

              <!-- Dark canvas + subtle ambient glow -->
              <circle cx="150" cy="150" r="149" fill="#050a14"/>
              <circle cx="150" cy="150" r="149" fill="url(#hbg)"/>

              <!-- ══════════════════════════════════════════════
                   RING 5  — outermost, slow CW
              ══════════════════════════════════════════════ -->
              <g class="r5">
                <!-- base ring -->
                <circle cx="150" cy="150" r="${R5}"
                  fill="none" stroke="${color}" stroke-width=".4" stroke-opacity=".18"/>
                <!-- tick clusters at 4 asymmetric zones -->
                ${this._ticks(340, 58,  R5, 5, 12, .36)}
                ${this._ticks( 78, 125, R5, 4,  7, .30)}
                ${this._ticks(192, 248, R5, 5, 10, .36)}
                ${this._ticks(268, 308, R5, 4,  6, .28)}
                <!-- tangential bar highlights — the "bracket" accents -->
                ${this._rt( 15, R5, 16,  3, .92)}
                ${this._rt( 28, R5,  8,  3, .68)}
                ${this._rt( 95, R5, 20,  3, .95)}
                ${this._rt(107, R5,  8,  3, .60)}
                ${this._rt(198, R5, 16,  3, .90)}
                ${this._rt(316, R5, 12,  3, .78)}
                ${this._rt(332, R5, 18,  3, .92)}
                <!-- data text on top arc -->
                <text fill="${color}" font-size="5.5" opacity=".35"
                  font-family="'Share Tech Mono','Courier New',monospace" letter-spacing="2.5">
                  <textPath href="#htp5t" startOffset="10%">· · · 0 0 · · · 0 0 0 · · 0 · · · 0 0 0 · · · 0</textPath>
                </text>
              </g>

              <!-- ══════════════════════════════════════════════
                   RING 4  — outer-mid, CCW
              ══════════════════════════════════════════════ -->
              <g class="r4">
                <!-- four arc segments with gaps at cardinal pts -->
                ${this._arc(  4,  86, R4, 1.0, .45)}
                ${this._arc( 94, 176, R4, 1.0, .42)}
                ${this._arc(184, 266, R4, 1.0, .45)}
                ${this._arc(274, 356, R4, 1.0, .42)}
                <!-- bright highlighted arc (upper-right quadrant) -->
                ${this._arc(338,  86, R4, 2.0, .88)}
                <!-- dense tick zones -->
                ${this._ticks(  6,  84, R4, 6, 24, .55)}
                ${this._ticks(186, 264, R4, 6, 22, .50)}
                <!-- cardinal radial ticks -->
                ${this._rt(  0, R4, 3, 12, .95)}
                ${this._rt( 90, R4, 3, 12, .92)}
                ${this._rt(180, R4, 3, 12, .95)}
                ${this._rt(270, R4, 3, 12, .92)}
                ${this._rt( 45, R4, 2.5, 7, .68)}
                ${this._rt(135, R4, 2.5, 7, .65)}
                ${this._rt(225, R4, 2.5, 7, .68)}
                ${this._rt(315, R4, 2.5, 7, .65)}
                <!-- "0 0 0…" data on bottom arc -->
                <text fill="${color}" font-size="6" opacity=".65"
                  font-family="'Share Tech Mono','Courier New',monospace" letter-spacing="2">
                  <textPath href="#htp4b" startOffset="8%">0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0</textPath>
                </text>
              </g>

              <!-- ══════════════════════════════════════════════
                   RING 3  — mid, slow CW  (top "0000" text)
              ══════════════════════════════════════════════ -->
              <g class="r3">
                <!-- dashed base ring -->
                <circle cx="150" cy="150" r="${R3}"
                  fill="none" stroke="${color}"
                  stroke-width=".5" stroke-opacity=".26" stroke-dasharray="3.5 4.5"/>
                <!-- dense ticks: lower ¾ of ring -->
                ${this._ticks(148, 336, R3, 5, 36, .40)}
                <!-- accent rect ticks -->
                ${this._rt(142, R3, 3, 10, .82)}
                ${this._rt(205, R3, 3, 10, .82)}
                ${this._rt(268, R3, 3, 10, .82)}
                ${this._rt(332, R3, 3, 10, .75)}
                <!-- "0 0 0…" data on TOP arc — the hero text element -->
                <text fill="${color}" font-size="7" opacity=".78"
                  font-family="'Share Tech Mono','Courier New',monospace" letter-spacing="2.5">
                  <textPath href="#htp3t" startOffset="5%">0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0</textPath>
                </text>
              </g>

              <!-- ══════════════════════════════════════════════
                   RING 2  — inner detail, fast CCW
              ══════════════════════════════════════════════ -->
              <g class="r2">
                <!-- 4 arc segments, thin gaps -->
                ${this._arc(  2,  88, R2, 1.0, .50)}
                ${this._arc( 92, 178, R2, 1.0, .50)}
                ${this._arc(182, 268, R2, 1.0, .50)}
                ${this._arc(272, 358, R2, 1.0, .50)}
                <!-- dense all-round ticks -->
                ${this._ticks(0, 360, R2, 4, 88, .36)}
                <!-- accent blocks -->
                ${this._rt(  0, R2, 2.5, 9, .90)}
                ${this._rt( 45, R2, 2.0, 6, .68)}
                ${this._rt( 90, R2, 2.5, 9, .90)}
                ${this._rt(135, R2, 2.0, 6, .68)}
                ${this._rt(180, R2, 2.5, 9, .90)}
                ${this._rt(225, R2, 2.0, 6, .68)}
                ${this._rt(270, R2, 2.5, 9, .90)}
                ${this._rt(315, R2, 2.0, 6, .68)}
              </g>

              <!-- ══════════════════════════════════════════════
                   HERO RING  — the dominant center circle
              ══════════════════════════════════════════════ -->
              <!-- soft glow bloom behind the ring -->
              <circle cx="150" cy="150" r="${RH}"
                fill="none" stroke="${color}" stroke-width="6" stroke-opacity=".28"
                filter="url(#hgs)" class="rh"/>
              <!-- crisp bright ring on top, occasional flicker -->
              <circle cx="150" cy="150" r="${RH}"
                fill="none" stroke="${color}" stroke-width="2.2" stroke-opacity=".98"
                filter="url(#hg)" class="rf"/>
              <!-- 4 tiny dark rectangles to cut micro-gaps in the ring -->
              ${[0, 90, 180, 270].map(a => this._rt(a, RH, 5, 6, 1, '#050a14')).join('')}

            </svg>

            <!-- Center display: clock or entity value -->
            <div class="ci" id="hc"></div>
          </div>
        </div>
      </ha-card>
    `;

    this._updateDisplay();
  }

  _updateDisplay() {
    const el = this.shadowRoot?.querySelector('#hc');
    if (!el) return;

    if (this._config?.entity && this._hass) {
      const s = this._hass.states[this._config.entity];
      if (s) {
        const unit = s.attributes.unit_of_measurement || '';
        const name = (s.attributes.friendly_name || this._config.entity).toUpperCase();
        el.innerHTML =
          `<div class="cv">${s.state}</div>` +
          (unit ? `<div class="cu">${unit}</div>` : '') +
          `<div class="cl">${name}</div>`;
        return;
      }
    }

    if (this._config?.show_time !== false) {
      const n = new Date();
      const hh = n.getHours().toString().padStart(2, '0');
      const mm = n.getMinutes().toString().padStart(2, '0');
      const ss = n.getSeconds().toString().padStart(2, '0');
      el.innerHTML =
        `<div class="ct">${hh}:${mm}</div>` +
        `<div class="cs">${ss}</div>`;
    }
  }
}

customElements.define('harvis-card', HarvisCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'harvis-card',
  name: 'HARVIS',
  description: 'HARVIS — animated HUD ring card for Home Assistant',
  preview: true,
  documentationURL: 'https://github.com/scottdsauer/harvis',
});
