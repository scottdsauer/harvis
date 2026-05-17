// ============================================================
//  H.A.R.V.I.S. HUD Navigation — Sauer Residence
//
//  CUSTOMIZATION:
//    1. Edit FLOORS array below to change floors/rooms
//    2. Edit onRoomSelected() to wire room clicks to HA views
//
//  FLOOR ANGLES (degrees, clockwise from right):
//    -90 = top   |   0 = right   |   90 = bottom
//    180 = left  |   210 = lower-left  |  330 = lower-right
// ============================================================

const FLOORS = [
  {
    id: 'basement',
    label: 'BASEMENT',
    angle: 210,
    color: '#f59e0b',
    rgb: '245,158,11',
    rooms: [
      'Basement Family Room',
      'Basement Workout Room',
      'Basement Unfinished Area'
    ]
  },
  {
    id: 'first',
    label: 'FIRST FLOOR',
    angle: -90,
    color: '#00c4ff',
    rgb: '0,196,255',
    rooms: [
      'Family Room',
      'Kitchen',
      'Master Bedroom',
      'Master Bathroom',
      'Foyer',
      "Scott's Office",
      'Dining Room',
      'Back Deck'
    ]
  },
  {
    id: 'second',
    label: 'SECOND FLOOR',
    angle: 330,
    color: '#a855f7',
    rgb: '168,85,247',
    rooms: [
      "Alison's Office",
      '2nd Floor Hallway',
      '2nd Floor Bathroom',
      "Jake's Bedroom",
      "Amara's Bedroom"
    ]
  }
];

// -------------------------------------------------------
//  Room navigation handler
//  Called when a room tile is clicked.
//  Uncomment one of the options below or add your own.
// -------------------------------------------------------
function onRoomSelected(room, floor) {
  // Option 1 — navigate to a Lovelace view by slug
  // const slug = room.toLowerCase().replace(/[\s']+/g, '-');
  // window.top.location.href = '/lovelace/' + slug;

  // Option 2 — fire browser-mod popup (requires browser-mod)
  // window.top.dispatchEvent(new CustomEvent('hass-more-info', {
  //   detail: { entityId: 'light.' + slug }, bubbles: true, composed: true
  // }));

  // Default: update status bar only (replace once wired)
  document.getElementById('status').textContent = '✦ SELECTED: ' + room.toUpperCase();
  document.getElementById('status').style.color = floor.color;
}

// ============================================================
//  HUD Engine — no edits needed below this line
// ============================================================

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 640, H = 640, cx = 320, cy = 320;
const linesSVG = document.getElementById('lines');

let rot = [0, 0, 0, 0, 0];
let uiState = 'idle';
let activeFloor = null;
let nodes = [];
let pulseColor = '#0088cc';
let pulseRgb = '0,136,204';

function polar(deg, r) {
  const a = deg * Math.PI / 180;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

function drawRings() {
  ctx.clearRect(0, 0, W, H);
  const t = Date.now() / 1000;
  const pulse = 0.5 + 0.35 * Math.sin(t * 1.8);

  function glowArc(r, sa, ea, col, alpha, lw) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.strokeStyle = col; ctx.lineWidth = (lw || 2) * 3.5;
    ctx.setLineDash([]); ctx.lineCap = 'round';
    ctx.globalAlpha = alpha * 0.18;
    ctx.beginPath(); ctx.arc(0, 0, r, sa, ea); ctx.stroke();
    ctx.lineWidth = lw || 2; ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(0, 0, r, sa, ea); ctx.stroke();
    ctx.restore();
  }
  function ring(r, col, alpha, lw) {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = col;
    ctx.lineWidth = lw || 1; ctx.globalAlpha = alpha; ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  function ticks(r, n, len, ro, col, alpha) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ro);
    ctx.strokeStyle = col; ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n;
      const l = i % 4 === 0 ? len * 2.2 : i % 2 === 0 ? len * 1.3 : len * .6;
      ctx.lineWidth = i % 4 === 0 ? 1.2 : .5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - l * .5), Math.sin(a) * (r - l * .5));
      ctx.lineTo(Math.cos(a) * (r + l * .5), Math.sin(a) * (r + l * .5));
      ctx.stroke();
    }
    ctx.restore();
  }
  function dots(r, n, ro, col, alpha, sz) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ro);
    ctx.fillStyle = col; ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n;
      ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, sz || 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Radial background glow
  const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 300);
  grad.addColorStop(0, `rgba(${pulseRgb},.06)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Rings (outer to inner)
  ring(295, '#0d3a5e', .45, .8);
  ticks(295, 180, 4, rot[0], '#0d5a8e', .45);
  dots(295, 24, rot[0] * 1.4, pulseColor, .35, 2.5);
  glowArc(295, rot[1], rot[1] + Math.PI * .6, pulseColor, .5, 2);
  glowArc(295, rot[1] + Math.PI * .8, rot[1] + Math.PI * 1.1, pulseColor, .3, 1.5);

  ring(262, '#0a2a40', .35, .7);
  ticks(262, 120, 3, -rot[1], '#0d4a7a', .4);
  glowArc(262, -rot[1], -rot[1] + Math.PI * .38, pulseColor, .38, 1.8);

  ring(228, '#0d3a5e', .5, 1.2);
  ticks(228, 96, 3.5, rot[2], '#0d5a8e', .5);
  glowArc(228, rot[2], rot[2] + Math.PI * .5, pulseColor, .6, 2.2);
  glowArc(228, rot[2] + Math.PI * .8, rot[2] + Math.PI * 1.1, pulseColor, .38, 1.8);

  ring(194, '#081e30', .38, .7);
  ticks(194, 72, 3, rot[3], '#0d4a7a', .38);
  glowArc(194, rot[3], rot[3] + Math.PI * .4, pulseColor, .48, 2);

  ring(160, '#0d4a7a', .52, 1.3);
  ticks(160, 60, 3.5, -rot[2], '#1a6090', .52);
  glowArc(160, -rot[2], -rot[2] + Math.PI * .45, pulseColor, .68, 2.5);

  ring(122, '#0d4a7a', .58, 1.5);
  ticks(122, 48, 3, rot[4], '#1a6090', .58);
  glowArc(122, rot[4], rot[4] + Math.PI * .55, pulseColor, .72, 2.8);

  // Floor direction beams
  if (uiState !== 'idle') {
    FLOORS.forEach(f => {
      const isActive = activeFloor && activeFloor.id === f.id;
      const fa = f.angle * Math.PI / 180;
      ctx.save(); ctx.translate(cx, cy);
      ctx.strokeStyle = f.color;
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.setLineDash([3, 5]);
      ctx.globalAlpha = isActive ? .75 : .22;
      ctx.beginPath();
      ctx.moveTo(Math.cos(fa) * 80, Math.sin(fa) * 80);
      ctx.lineTo(Math.cos(fa) * 210, Math.sin(fa) * 210);
      ctx.stroke();
      if (isActive) {
        ctx.globalAlpha = .7; ctx.fillStyle = f.color; ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(Math.cos(fa) * 200, Math.sin(fa) * 200);
        ctx.lineTo(Math.cos(fa + .12) * 185, Math.sin(fa + .12) * 185);
        ctx.lineTo(Math.cos(fa - .12) * 185, Math.sin(fa - .12) * 185);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    });
  }

  // Center circle
  ctx.save(); ctx.translate(cx, cy);
  ctx.globalAlpha = pulse * .22; ctx.fillStyle = pulseColor;
  ctx.beginPath(); ctx.arc(0, 0, 78, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = pulse * .35; ctx.strokeStyle = pulseColor;
  ctx.lineWidth = 12; ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(0, 0, 72, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = .92; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0, 0, 72, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = .07 + pulse * .05; ctx.fillStyle = pulseColor;
  ctx.beginPath(); ctx.arc(0, 0, 72, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Center text
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (uiState === 'idle') {
    ctx.fillStyle = pulseColor; ctx.globalAlpha = .92;
    ctx.font = 'bold 13px Courier New'; ctx.fillText('H.A.R.V.I.S.', cx, cy - 9);
    ctx.font = '8px Courier New'; ctx.globalAlpha = .5; ctx.fillStyle = '#4a8fa8';
    ctx.fillText('CLICK TO START', cx, cy + 8);
  } else if (uiState === 'floors') {
    ctx.fillStyle = pulseColor; ctx.globalAlpha = .9;
    ctx.font = 'bold 11px Courier New'; ctx.fillText('SELECT', cx, cy - 7);
    ctx.font = '8px Courier New'; ctx.fillStyle = '#4a8fa8'; ctx.globalAlpha = .65;
    ctx.fillText('FLOOR', cx, cy + 8);
  } else if (uiState === 'rooms' && activeFloor) {
    ctx.fillStyle = activeFloor.color; ctx.globalAlpha = .95;
    ctx.font = 'bold 10px Courier New';
    const words = activeFloor.label.split(' ');
    if (words.length === 1) {
      ctx.fillText(words[0], cx, cy - 4);
    } else {
      ctx.fillText(words[0], cx, cy - 10);
      ctx.fillText(words.slice(1).join(' '), cx, cy + 4);
    }
    ctx.font = '7px Courier New'; ctx.globalAlpha = .5;
    ctx.fillText('SELECT ROOM', cx, cy + 18);
  }
  ctx.restore();

  // Outer notch marks
  for (let i = 0; i < 16; i++) {
    const a = rot[0] * 1.5 + (i / 16) * Math.PI * 2;
    const px = cx + Math.cos(a) * 295, py = cy + Math.sin(a) * 295;
    ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
    ctx.globalAlpha = i % 4 === 0 ? .8 : i % 2 === 0 ? .4 : .2;
    ctx.fillStyle = pulseColor;
    ctx.fillRect(-(i % 4 === 0 ? 1.5 : .8), 0, i % 4 === 0 ? 3 : 1.6, i % 4 === 0 ? 10 : 6);
    ctx.restore();
  }
}

function animate() {
  rot[0] += .0015; rot[1] += .003; rot[2] -= .0025; rot[3] += .005; rot[4] -= .006;
  drawRings();
  requestAnimationFrame(animate);
}
animate();

function clearNodes() {
  nodes.forEach(n => n && n.remove && n.remove());
  nodes = [];
  linesSVG.innerHTML = '';
}

function svgLine(x1, y1, x2, y2, color, alpha) {
  const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l.setAttribute('x1', x1); l.setAttribute('y1', y1);
  l.setAttribute('x2', x2); l.setAttribute('y2', y2);
  l.setAttribute('stroke', color); l.setAttribute('stroke-width', '1');
  l.setAttribute('stroke-dasharray', '3 6');
  l.setAttribute('opacity', alpha || .3);
  linesSVG.appendChild(l);
}

function makeNode(text, pos, cls, color, rgb, delay, onClick) {
  const el = document.createElement('div');
  el.className = 'node ' + cls;
  el.textContent = text;
  el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
  el.style.color = color;
  el.style.borderColor = color + '44';
  el.style.background = `rgba(${rgb},.09)`;
  el.style.boxShadow = `0 0 10px rgba(${rgb},.15)`;
  el.style.opacity = '0';
  el.style.transition = `background .2s,border-color .2s,box-shadow .2s,transform .2s,opacity .3s ${delay}s`;

  el.addEventListener('mouseenter', () => {
    el.style.background = `rgba(${rgb},.28)`;
    el.style.borderColor = color + 'cc';
    el.style.color = '#ffffff';
    el.style.textShadow = `0 0 14px ${color}`;
    el.style.boxShadow = `0 0 26px rgba(${rgb},.6),inset 0 0 12px rgba(${rgb},.2)`;
    el.style.transform = 'translate(-50%,-50%) scale(1.1)';
    pulseColor = color; pulseRgb = rgb;
    document.getElementById('status').textContent = text.toUpperCase();
    document.getElementById('status').style.color = color;
  });
  el.addEventListener('mouseleave', () => {
    el.style.background = `rgba(${rgb},.09)`;
    el.style.borderColor = color + '44';
    el.style.color = color;
    el.style.textShadow = 'none';
    el.style.boxShadow = `0 0 10px rgba(${rgb},.15)`;
    el.style.transform = 'translate(-50%,-50%) scale(1)';
    pulseColor = activeFloor ? activeFloor.color : '#00c4ff';
    pulseRgb = activeFloor ? activeFloor.rgb : '0,196,255';
  });
  el.addEventListener('click', e => { e.stopPropagation(); onClick(el); });

  document.getElementById('wrap').appendChild(el);
  setTimeout(() => el.style.opacity = '1', 20);
  nodes.push(el);
  return el;
}

function showFloors() {
  clearNodes();
  uiState = 'floors'; activeFloor = null;
  pulseColor = '#00c4ff'; pulseRgb = '0,196,255';

  FLOORS.forEach((f, i) => {
    const pos = polar(f.angle, 222);
    makeNode(f.label, pos, 'fnode', f.color, f.rgb, i * .08, () => showRooms(f));
    svgLine(cx, cy, pos.x, pos.y, f.color, .2);
  });

  document.getElementById('hint').textContent = 'CLICK A FLOOR · CLICK CENTER TO GO BACK';
  document.getElementById('status').textContent = 'AWAITING FLOOR SELECTION';
  document.getElementById('status').style.color = '#1a5a7a';
}

function showRooms(floor) {
  clearNodes();
  uiState = 'rooms'; activeFloor = floor;
  pulseColor = floor.color; pulseRgb = floor.rgb;

  const n = floor.rooms.length;
  const spread = n <= 4 ? 65 : n <= 6 ? 80 : 100;

  floor.rooms.forEach((room, i) => {
    const offset = (i - (n - 1) / 2) * (spread / (n - 1 || 1));
    const angle = floor.angle + offset;
    const r = n > 6 ? 305 : 295;
    const pos = polar(angle, r);
    makeNode(room.toUpperCase(), pos, 'rnode', floor.color, floor.rgb, i * .055, (btn) => {
      nodes.forEach(b => {
        if (b.classList && b.classList.contains('rnode')) {
          b.style.borderColor = floor.color + '44';
          b.style.background = `rgba(${floor.rgb},.09)`;
          b.style.boxShadow = `0 0 10px rgba(${floor.rgb},.15)`;
        }
      });
      btn.style.borderColor = floor.color;
      btn.style.background = `rgba(${floor.rgb},.32)`;
      btn.style.boxShadow = `0 0 30px rgba(${floor.rgb},.75)`;
      onRoomSelected(room, floor);
    });
    svgLine(cx, cy, pos.x, pos.y, floor.color, .15);
  });

  // Back button at floor position
  const fpos = polar(floor.angle, 222);
  const back = document.createElement('div');
  back.className = 'node fnode';
  back.textContent = '← ' + floor.label;
  back.style.left = fpos.x + 'px'; back.style.top = fpos.y + 'px';
  back.style.color = floor.color;
  back.style.borderColor = floor.color + '88';
  back.style.background = `rgba(${floor.rgb},.2)`;
  back.style.boxShadow = `0 0 18px rgba(${floor.rgb},.35)`;
  back.addEventListener('mouseenter', () => {
    back.style.background = `rgba(${floor.rgb},.32)`;
    back.style.boxShadow = `0 0 26px rgba(${floor.rgb},.55)`;
    back.style.transform = 'translate(-50%,-50%) scale(1.07)';
  });
  back.addEventListener('mouseleave', () => {
    back.style.background = `rgba(${floor.rgb},.2)`;
    back.style.boxShadow = `0 0 18px rgba(${floor.rgb},.35)`;
    back.style.transform = 'translate(-50%,-50%) scale(1)';
  });
  back.addEventListener('click', e => { e.stopPropagation(); showFloors(); });
  document.getElementById('wrap').appendChild(back);
  nodes.push(back);

  document.getElementById('hint').textContent = 'CLICK ROOM TO SELECT · CLICK ← TO GO BACK';
  document.getElementById('status').textContent = floor.label + ' · SELECT A ROOM';
  document.getElementById('status').style.color = floor.color + '99';
}

function goIdle() {
  clearNodes();
  uiState = 'idle'; activeFloor = null;
  pulseColor = '#0088cc'; pulseRgb = '0,136,204';
  document.getElementById('status').textContent = 'SYSTEM NOMINAL · ALL SECTORS ONLINE';
  document.getElementById('status').style.color = '#1a5a7a';
  document.getElementById('hint').textContent = 'CLICK CENTER TO NAVIGATE';
}

canvas.addEventListener('click', e => {
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (W / r.width);
  const my = (e.clientY - r.top) * (H / r.height);
  const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
  if (dist <= 72) {
    if (uiState === 'idle') showFloors();
    else goIdle();
  }
});

function tickClock() {
  const n = new Date();
  const h = String(n.getHours()).padStart(2, '0');
  const m = String(n.getMinutes()).padStart(2, '0');
  const s = String(n.getSeconds()).padStart(2, '0');
  document.getElementById('clock').textContent = h + ':' + m + ':' + s + ' · SAUER RESIDENCE';
}
setInterval(tickClock, 1000);
tickClock();
