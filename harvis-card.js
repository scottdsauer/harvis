/**
 * HARVIS Card — Animated arc reactor for Home Assistant
 * Inspired by J.A.R.V.I.S. from Iron Man
 */
class HarvisCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._interval = null;
  }

  static get properties() {
    return {
      hass: {},
      config: {},
    };
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
      glow_color: 'rgba(0, 212, 255, 0.6)',
      show_time: true,
      rings: 4,
      speed: 1,
      title: 'HARVIS',
      ...config,
    };
    this._render();
  }

  getCardSize() {
    return Math.ceil(this._config.size / 80);
  }

  connectedCallback() {
    if (this._config?.show_time) {
      this._interval = setInterval(() => this._updateDisplay(), 1000);
    }
  }

  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _buildTicks(count, innerR, outerR, color, majorEvery = 6) {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * (360 / count)) * (Math.PI / 180);
      const isMajor = i % majorEvery === 0;
      const r1 = isMajor ? innerR - 4 : innerR;
      return `<line
        x1="${Math.cos(angle) * r1}" y1="${Math.sin(angle) * r1}"
        x2="${Math.cos(angle) * outerR}" y2="${Math.sin(angle) * outerR}"
        stroke="${color}" stroke-width="${isMajor ? 1.5 : 0.5}"
        stroke-opacity="${isMajor ? 0.9 : 0.4}"/>`;
    }).join('');
  }

  _buildArcs(count, r, gap, color, width, opacity) {
    return Array.from({ length: count }, (_, i) => {
      const step = 360 / count;
      const startAngle = (i * step + gap / 2) * (Math.PI / 180);
      const endAngle = ((i + 1) * step - gap / 2) * (Math.PI / 180);
      const x1 = Math.cos(startAngle) * r;
      const y1 = Math.sin(startAngle) * r;
      const x2 = Math.cos(endAngle) * r;
      const y2 = Math.sin(endAngle) * r;
      const large = (step - gap) > 180 ? 1 : 0;
      return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}"
        fill="none" stroke="${color}" stroke-width="${width}"
        stroke-opacity="${opacity}" filter="url(#harvis-glow)"/>`;
    }).join('');
  }

  _buildHexMarkers(count, r, color, markerR = 4) {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * (360 / count)) * (Math.PI / 180);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      return `<circle cx="${x}" cy="${y}" r="${markerR}"
        fill="none" stroke="${color}" stroke-width="1"
        stroke-opacity="0.9" filter="url(#harvis-glow)"/>`;
    }).join('');
  }

  _render() {
    const { size, color, glow_color, speed } = this._config;
    const s = (v) => v * (size / 300);
    const dur = (base) => `${(base / speed).toFixed(1)}s`;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }

        ha-card {
          background: var(--card-background-color, #0d1626);
          border: 1px solid rgba(0, 212, 255, 0.2);
          overflow: hidden;
        }

        .harvis-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 8px 12px;
          gap: 8px;
        }

        .harvis-title {
          color: ${color};
          font-family: 'Orbitron', 'Share Tech Mono', 'Courier New', monospace;
          font-size: ${s(11)}px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          opacity: 0.7;
          text-shadow: 0 0 8px ${color};
        }

        .harvis-stage {
          position: relative;
          width: ${size}px;
          height: ${size}px;
        }

        .center-info {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: ${color};
          font-family: 'Orbitron', 'Share Tech Mono', 'Courier New', monospace;
          line-height: 1.2;
          text-shadow: 0 0 10px ${color};
          pointer-events: none;
        }

        .center-time {
          font-size: ${s(28)}px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .center-entity-state {
          font-size: ${s(24)}px;
          font-weight: 700;
        }

        .center-entity-unit {
          font-size: ${s(11)}px;
          opacity: 0.6;
          letter-spacing: 0.2em;
        }

        .center-label {
          font-size: ${s(9)}px;
          opacity: 0.5;
          letter-spacing: 0.25em;
          margin-top: 2px;
        }

        /* ── Ring animations ─────────────────────────── */
        @keyframes harvis-cw  { to { transform: rotate(360deg);  } }
        @keyframes harvis-ccw { to { transform: rotate(-360deg); } }
        @keyframes harvis-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1;   }
        }
        @keyframes harvis-scan {
          to { transform: rotate(360deg); }
        }
        @keyframes harvis-flicker {
          0%, 95%, 100% { opacity: 1; }
          96%           { opacity: 0.4; }
          97%           { opacity: 0.9; }
          98%           { opacity: 0.3; }
        }

        .ring-outer   { animation: harvis-cw  ${dur(16)} linear infinite; transform-origin: 150px 150px; }
        .ring-mid     { animation: harvis-ccw ${dur(10)} linear infinite; transform-origin: 150px 150px; }
        .ring-inner   { animation: harvis-cw  ${dur(22)} linear infinite; transform-origin: 150px 150px; }
        .ring-fast    { animation: harvis-ccw  ${dur(5)} linear infinite; transform-origin: 150px 150px; }
        .scanner-arm  { animation: harvis-scan ${dur(4)} linear infinite; transform-origin: 150px 150px; }
        .core-glow    { animation: harvis-pulse 2.5s ease-in-out infinite; }
        .arc-reactor  { animation: harvis-flicker 8s ease-in-out infinite; }
      </style>

      <ha-card>
        <div class="harvis-wrapper">
          ${this._config.title ? `<div class="harvis-title">${this._config.title}</div>` : ''}

          <div class="harvis-stage">
            <svg width="${size}" height="${size}" viewBox="0 0 300 300"
                 xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="harvis-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="harvis-glow-strong" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <radialGradient id="harvis-core-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stop-color="${color}" stop-opacity="0.5"/>
                  <stop offset="60%"  stop-color="${color}" stop-opacity="0.15"/>
                  <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="harvis-bg-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stop-color="${color}" stop-opacity="0.04"/>
                  <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </radialGradient>
                <linearGradient id="harvis-scan-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stop-color="${color}" stop-opacity="0.5"/>
                  <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </linearGradient>
              </defs>

              <!-- Background ambient glow -->
              <circle cx="150" cy="150" r="145" fill="url(#harvis-bg-grad)"/>

              <!-- ── Outermost tick ring ────────────────── -->
              <g class="ring-outer">
                <circle cx="150" cy="150" r="140"
                  fill="none" stroke="${color}" stroke-width="0.5" stroke-opacity="0.25"/>
                <g transform="translate(150,150)">
                  ${this._buildTicks(72, 130, 140, color, 6)}
                </g>
              </g>

              <!-- ── Segmented mid ring ────────────────── -->
              <g class="ring-mid" transform="translate(150,150)">
                ${this._buildArcs(8, 118, 4, color, 2.5, 0.85)}
                ${this._buildHexMarkers(8, 118, color, 3)}
              </g>

              <!-- ── Dashed inner ring with dot markers ── -->
              <g class="ring-inner" transform="translate(150,150)">
                <circle r="92" fill="none" stroke="${color}"
                  stroke-width="0.5" stroke-opacity="0.35" stroke-dasharray="4 3"/>
                ${this._buildHexMarkers(6, 92, color, 4)}
              </g>

              <!-- ── Fast inner arcs ───────────────────── -->
              <g class="ring-fast" transform="translate(150,150)">
                ${this._buildArcs(12, 72, 3, color, 1.5, 0.65)}
              </g>

              <!-- ── Scanner sweep ─────────────────────── -->
              <g class="scanner-arm" transform="translate(150,150)">
                <line x1="0" y1="0" x2="0" y2="-115"
                  stroke="${color}" stroke-width="1" stroke-opacity="0.7"
                  filter="url(#harvis-glow)"/>
                <!-- Sweep cone -->
                <path d="M 0 0 L -8 -115 A 115 115 0 0 1 8 -115 Z"
                  fill="url(#harvis-scan-grad)" opacity="0.15"/>
              </g>

              <!-- ── Core ambient glow ─────────────────── -->
              <circle cx="150" cy="150" r="55"
                fill="url(#harvis-core-grad)" class="core-glow"/>

              <!-- ── Arc reactor center ────────────────── -->
              <g transform="translate(150,150)" class="arc-reactor">
                <!-- Outer ring -->
                <circle r="32" fill="none" stroke="${color}"
                  stroke-width="1.5" stroke-opacity="0.95"
                  filter="url(#harvis-glow)"/>
                <!-- Mid ring -->
                <circle r="22" fill="none" stroke="${color}"
                  stroke-width="0.75" stroke-opacity="0.5"/>
                <!-- Inner hexagon -->
                <polygon points="0,-16 13.9,-8 13.9,8 0,16 -13.9,8 -13.9,-8"
                  fill="none" stroke="${color}" stroke-width="1.2"
                  stroke-opacity="0.9" filter="url(#harvis-glow)"/>
                <!-- Triangle inside hex -->
                <polygon points="0,-10 8.7,5 -8.7,5"
                  fill="none" stroke="${color}" stroke-width="0.8"
                  stroke-opacity="0.6"/>
                <!-- Center dot -->
                <circle r="5" fill="${color}" fill-opacity="1"
                  filter="url(#harvis-glow-strong)"/>
                <circle r="2.5" fill="#ffffff" fill-opacity="0.9"/>
              </g>
            </svg>

            <div class="center-info" id="harvis-center"></div>
          </div>
        </div>
      </ha-card>
    `;

    this._updateDisplay();
  }

  _updateDisplay() {
    const el = this.shadowRoot?.querySelector('#harvis-center');
    if (!el) return;

    if (this._config?.entity && this._hass) {
      const stateObj = this._hass.states[this._config.entity];
      if (stateObj) {
        const unit = stateObj.attributes.unit_of_measurement || '';
        const friendly = stateObj.attributes.friendly_name || this._config.entity;
        el.innerHTML = `
          <div class="center-entity-state">${stateObj.state}</div>
          ${unit ? `<div class="center-entity-unit">${unit}</div>` : ''}
          <div class="center-label">${friendly.toUpperCase()}</div>
        `;
        return;
      }
    }

    if (this._config?.show_time !== false) {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const ss = now.getSeconds().toString().padStart(2, '0');
      el.innerHTML = `
        <div class="center-time">${hh}:${mm}</div>
        <div class="center-label">${ss}</div>
      `;
    }
  }
}

customElements.define('harvis-card', HarvisCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'harvis-card',
  name: 'HARVIS Arc Reactor',
  description: 'Animated JARVIS-inspired arc reactor card. Displays time or a sensor entity.',
  preview: true,
  documentationURL: 'https://github.com/scottdsauer/harvis',

});
