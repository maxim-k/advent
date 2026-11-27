// 9:00 in New York is 14:00 UTC for all of December (EST, no clock change).
const openAt = (n) => Date.UTC(2026, 11, n, 14);

const $ = (id) => document.getElementById(id);
const seen = new Set(JSON.parse(localStorage.getItem('seen') || '[]'));
let days = {};
let preview = false;

const isOpen = (n) => Boolean(days[n]) && (preview || Date.now() >= openAt(n));

// The window of each day, 1 to 25: [x, y, width, height] in pixels of the 2000x1116 pictures.
// Day 25 is her window. It is dark in on.jpg too, so four more numbers say where to borrow
// the light from: the window one floor up.
const WINDOWS = [[1287, 560, 38, 43], [1015, 432, 57, 48], [1219, 415, 47, 46], [895, 380, 29, 31], [1159, 265, 32, 42], [1345, 395, 31, 40], [1216, 287, 37, 46], [827, 257, 32, 44], [1335, 281, 29, 34], [1299, 264, 34, 42], [813, 214, 27, 38], [1312, 383, 28, 40], [1371, 404, 33, 39], [1012, 353, 58, 53], [1228, 546, 51, 50], [876, 578, 71, 67], [799, 279, 34, 42], [1230, 481, 41, 48], [1279, 493, 43, 45], [1320, 501, 32, 43], [1066, 159, 38, 43], [1009, 132, 53, 54], [1171, 467, 41, 47], [1071, 367, 38, 49], [1009, 194, 57, 74, 1009, 130, 55, 64]];
const W = 2000, H = 1116;

const wins = WINDOWS.map(([x, y, w, h, sx = x, sy = y, sw = w, sh = h], i) => {
  const b = document.createElement('button');
  b.className = 'win';
  b.setAttribute('aria-label', `${i + 1} декабря`);
  Object.assign(b.style, {
    left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%`,
    backgroundSize: `${(W / sw) * 100}% ${(H / sh) * 100}%`,
    backgroundPosition: `${(sx / (W - sw)) * 100}% ${(sy / (H - sh)) * 100}%`,
    // its own flicker rhythm, so several unopened windows don't pulse in step
    animationDuration: `${3 + ((i * 0.37) % 2)}s`, animationDelay: `${-i * 1.3}s`,
  });
  b.addEventListener('click', () => show(i + 1));
  $('wins').append(b);
  return b;
});

// Her mom at the window of day 25, seen only when that window is lit: a bob, neck, shoulders,
// down to the waist. One character is one small square. Each column to the right is drawn
// a little lower, so the figure follows the slant of the wall.
const MOM = [
  '...##...', '..####..', '.######.', '.######.', '.######.', '.######.', '..####..', // bob
  '..####..', // neck
  '.######.', '########', '########', '########', '########', // shoulders
  '.######.', '.######.', '.######.', '.######.', '.######.', // waist
];
wins[24].innerHTML =
  '<svg class="mom" viewBox="0 0 8 21" shape-rendering="crispEdges"><path d="' +
  MOM.map((row, y) => [...row].map((c, x) => (c === '#' ? `M${x} ${y + Math.floor(x * 0.4)}h1v1h-1z` : '')).join('')).join('') +
  '"/></svg>';

// Dark before its day, flickering once it can be opened, steady after she opened it.
function render() {
  wins.forEach((b, i) => {
    const n = i + 1;
    b.disabled = !isOpen(n);
    b.classList.toggle('ready', isOpen(n) && !seen.has(n));
    b.classList.toggle('lit', isOpen(n) && seen.has(n));
  });
  $('scene').classList.toggle('done', wins.every((_, i) => seen.has(i + 1)));
}

// Text in hard-edged squares, half the size of the picture's: full-size squares were hard to read.
function pix(el, text) {
  if (el.dataset.text === text) return;
  el.dataset.text = text;
  el.setAttribute('aria-label', text);
  const c = el.firstChild || el.appendChild(document.createElement('canvas'));
  const g = c.getContext('2d', { willReadFrequently: true });
  const font = '20px Verdana, Geneva, sans-serif';
  g.font = font;
  c.width = Math.ceil(g.measureText(text).width) + 2; // resizing clears the canvas and its font
  c.height = 26;
  g.font = font;
  g.fillStyle = getComputedStyle(el).color;
  g.fillText(text, 1, 20);
  const d = g.getImageData(0, 0, c.width, c.height);
  for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0;
  g.putImageData(d, 0, 0);
  c.style.width = `calc(var(--px) * ${c.width / 2})`;
  c.style.height = `calc(var(--px) * ${c.height / 2})`;
}
pix($('title'), 'Калядны каляндар');

function youtubeId(url) {
  const u = new URL(url);
  return u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
}

function show(n) {
  const day = days[n];
  const dir = `days/${String(n).padStart(2, '0')}/`;
  const gift = day.gift || {};
  $('d-title').textContent = `${n} декабря`;
  $('d-photo').hidden = !day.photo;
  if (day.photo) $('d-photo').src = dir + day.photo;
  $('d-song').hidden = !day.song;
  if (day.song) {
    $('d-video').src = `https://www.youtube-nocookie.com/embed/${youtubeId(day.song)}`;
    $('d-songlink').href = day.song;
  }
  $('d-gift').hidden = !(gift.text || gift.image || gift.link);
  $('d-text').textContent = gift.text || '';
  $('d-giftimg').hidden = !gift.image;
  if (gift.image) $('d-giftimg').src = dir + gift.image;
  $('d-link').hidden = !gift.link;
  if (gift.link) $('d-link').href = gift.link;
  seen.add(n);
  localStorage.setItem('seen', JSON.stringify([...seen]));
  render();
  $('day').showModal();
  $('day').scrollTop = 0;
}
$('day').addEventListener('close', () => $('d-video').removeAttribute('src')); // stops the music

async function load() {
  const data = await (await fetch('days.json', { cache: 'no-store' })).json();
  days = data.days;
  preview = data.preview;
  render();
}

let next = 0;
function tick() {
  const now = Date.now();
  let upcoming = 1;
  while (upcoming <= 25 && now >= openAt(upcoming)) upcoming++;
  if (upcoming !== next) {
    // A window just came due: fetch the list again, the page may have been open since yesterday.
    if (next) load().catch(() => {});
    next = upcoming;
  }
  if (upcoming > 25) return pix($('countdown'), '');
  const s = Math.floor((openAt(upcoming) - now) / 1000);
  const two = (v) => String(v).padStart(2, '0');
  const d = Math.floor(s / 86400);
  pix($('countdown'), `${d ? d + ' д ' : ''}${two(Math.floor(s / 3600) % 24)}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`);
}

const view = $('view');
view.scrollLeft = $('scene').offsetWidth * 0.545 - view.clientWidth / 2; // start on the house
const start = view.scrollLeft;
let mouse = 0;
addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') mouse = (e.clientX / innerWidth - 0.5) * 120;
});

// How bright the air is over the picture, 0 (dark) to 9 (right under the lamp):
// 12 columns across, 7 rows down. Open the page with ?light to see it over the picture.
const LIGHT = [
  '111111112211', // sky above the lamps
  '111111138621', // the lamp head
  '111111259731', // the cone, brightest just below the lamp
  '113111257632', // left: the two far lamps
  '134211245532',
  '123212234432', // near the ground the light is spread thin
  '122112233332',
];
// u, v: 0 to 1 across and down the picture. Blends the four nearest cells.
function light(u, v) {
  const x = Math.min(Math.max(u * 12 - 0.5, 0), 11);
  const y = Math.min(Math.max(v * 7 - 0.5, 0), 6);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, 11), y1 = Math.min(y0 + 1, 6);
  const row = (r) => LIGHT[r][x0] / 9 + ((LIGHT[r][x1] - LIGHT[r][x0]) / 9) * (x - x0);
  return row(y0) + (row(y1) - row(y0)) * (y - y0);
}

// Snow: every flake has its own brightness, speed and sway. x and y are fractions of the
// picture; x runs past both edges so the parallax never uncovers an empty strip.
const rnd = (a, b) => a + Math.random() * (b - a);
const flakes = Array.from({ length: 480 }, (_, i) => {
  const near = i % 4 === 0;
  return {
    near, x: rnd(-0.3, 1.3), y: Math.random(), base: rnd(0.45, 1),
    speed: near ? rnd(0.07, 0.11) : rnd(0.04, 0.065), // picture heights a second
    amp: rnd(1, 5), freq: rnd(0.4, 1.3), phase: rnd(0, 7),
  };
});
const snow = $('snow');
const ctx = snow.getContext('2d');
let last = 0;
function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.1);
  last = t;
  const dpr = devicePixelRatio;
  if (snow.width !== innerWidth * dpr || snow.height !== innerHeight * dpr) {
    snow.width = innerWidth * dpr;
    snow.height = innerHeight * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const box = $('scene').getBoundingClientRect();
  const px = box.height / 268; // one square of the pixel art
  const pan = view.scrollLeft - start + mouse;
  const wind = Math.sin(t / 7000) + Math.sin(t / 3100 + 1); // rises and dies down
  if (location.search.includes('light')) {
    ctx.fillStyle = '#ff0';
    for (let i = 0; i < 60; i++) for (let j = 0; j < 35; j++) {
      ctx.globalAlpha = light((i + 0.5) / 60, (j + 0.5) / 35) * 0.6;
      ctx.fillRect(box.left + (i / 60) * box.width, (j / 35) * box.height, box.width / 60 + 1, box.height / 35 + 1);
    }
  }
  ctx.fillStyle = '#f3dcb8';
  for (const f of flakes) {
    f.y += f.speed * dt;
    f.x += (wind * (f.near ? 5 : 2) * px * dt) / box.width;
    if (f.y > 1) { f.y -= 1.02; f.x = rnd(-0.3, 1.3); }
    if (f.x > 1.3) f.x -= 1.6;
    if (f.x < -0.3) f.x += 1.6;
    const sway = Math.sin((t / 1000) * f.freq + f.phase) * f.amp * px;
    const u = f.x + (sway - pan * (f.near ? 0.5 : 0.15)) / box.width; // where it shows over the picture
    ctx.globalAlpha = f.base * (0.25 + 0.75 * light(u, f.y));
    ctx.fillRect(box.left + u * box.width, f.y * box.height, px * (f.near ? 2 : 1), px * (f.near ? 2 : 1));
  }
  requestAnimationFrame(frame);
}
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(frame);

tick();
setInterval(tick, 1000);
load().catch(() => {});
