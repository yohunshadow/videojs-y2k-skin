// HOLO POP 2000: tiny progressive enhancement (state class + sparkle burst). Apache-2.0
const root = document.querySelector('.holo');
const video = root?.querySelector('video');
const sparkles = root?.querySelector('.holo-sparkles');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const colors = ['#fff', '#ffe36e', '#ff9ad5', '#a9dcff', '#c9b6ff', '#b8ffe4'];
const glyphs = ['✦', '✧', '★', '♡', '·'];

function sync() { root.toggleAttribute('data-holo-playing', !video.paused && !video.ended); }

function burst(x, y) {
  if (reduce.matches || !sparkles) return;
  for (let i = 0; i < 12; i++) {
    const b = document.createElement('b');
    const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
    const r = 50 + Math.random() * 70;
    b.textContent = glyphs[i % glyphs.length];
    b.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px;--c:${colors[i % colors.length]};--s:${12 + Math.random() * 14}px`;
    sparkles.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  }
}

if (root && video) {
  ['play', 'pause', 'ended', 'playing'].forEach((e) => video.addEventListener(e, sync));
  video.addEventListener('play', () => {
    const btn = root.querySelector('.holo-play');
    const rb = root.getBoundingClientRect(), bb = btn.getBoundingClientRect();
    burst(bb.left - rb.left + bb.width / 2, bb.top - rb.top + bb.height / 2);
  });
  sync();
}

// ================= v2: Bloop the mascot =================
const bloop = root?.querySelector('.bloop');
const moodText = document.querySelector('.mc-text');
const moodFace = document.querySelector('.mc-face');
const pupils = bloop ? [...bloop.querySelectorAll('.bl-eye')].map((eye) => ({ eye, pupil: eye.querySelector('.bl-pupil') })) : [];
const faces = { idle: '◕‿◕', happy: '^‿^', sleepy: '–‿–', dizzy: '@_@', shh: '>_<', excited: '★o★', wow: 'O_O' };
const texts = { idle: 'hi bestie ✦ press play', happy: 'vibing ♡ enjoy the show', sleepy: 'zzz… paused, take a break', dizzy: 'wheee~ seeking around', shh: 'shh 🤫 sound is off', excited: 'LOUDER!! ★ volume up', wow: 'woah, big screen mode!' };

let target = null;       // {x,y} in client coords
let hoverEl = null;
let lastInput = 0;
let transient = null, transientTimer = 0;
let seeking = false, lastVol = video?.volume ?? 1;

function baseMood() {
  if (seeking) return 'dizzy';
  if (video.muted || video.volume === 0) return 'shh';
  if (!video.paused && !video.ended) return 'happy';
  if (video.currentTime > 0) return 'sleepy';
  return 'idle';
}
function setMood() {
  const m = seeking ? 'dizzy' : (transient || baseMood());
  if (bloop.dataset.mood !== m) {
    bloop.dataset.mood = m;
    if (moodText) moodText.textContent = texts[m];
    if (moodFace) moodFace.textContent = faces[m];
  }
}
function flash(m, ms) { transient = m; clearTimeout(transientTimer); transientTimer = setTimeout(() => { transient = null; setMood(); }, ms); setMood(); }

function look() {
  let t = target;
  if (hoverEl) { const r = hoverEl.getBoundingClientRect(); t = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  const max = reduce.matches ? 4 : 7;
  for (const { eye, pupil } of pupils) {
    if (!t) { pupil.setAttribute('transform', ''); continue; }
    const r = eye.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = t.x - cx, dy = t.y - cy;
    const ang = Math.atan2(dy, dx);
    const dist = Math.min(max, Math.hypot(dx, dy) / 18);
    pupil.setAttribute('transform', `translate(${(Math.cos(ang) * dist).toFixed(2)} ${(Math.sin(ang) * dist).toFixed(2)})`);
  }
}
let raf = 0;
function queue() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; look(); }); }
function onPoint(x, y) { target = { x, y }; lastInput = performance.now(); queue(); }

if (bloop && video) {
  addEventListener('pointermove', (e) => onPoint(e.clientX, e.clientY), { passive: true });
  addEventListener('pointerdown', (e) => onPoint(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onPoint(t.clientX, t.clientY); }, { passive: true });
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  const interactive = '.holo-btn, .holo-time, .holo-volume';
  root.addEventListener('pointerover', (e) => { const el = e.target.closest?.(interactive); if (el) { hoverEl = el; queue(); } });
  root.addEventListener('pointerout', (e) => { if (e.target.closest?.(interactive) && !e.relatedTarget?.closest?.(interactive)) { hoverEl = null; queue(); } });
  root.addEventListener('focusin', (e) => { const el = e.target.closest?.(interactive); if (el) { hoverEl = el; lastInput = performance.now(); queue(); } });
  root.addEventListener('focusout', () => { hoverEl = null; queue(); });

  // idle wander
  setInterval(() => {
    if (performance.now() - lastInput < 2500 || hoverEl) return;
    const r = root.getBoundingClientRect();
    target = { x: r.left + Math.random() * r.width, y: r.top + Math.random() * r.height };
    queue();
  }, 1600);
  // blink
  (function blink() {
    setTimeout(() => { bloop.classList.add('blink'); setTimeout(() => { bloop.classList.remove('blink'); blink(); }, 130); }, 2200 + Math.random() * 3000);
  })();

  ['play', 'playing', 'pause', 'ended', 'loadedmetadata'].forEach((e) => video.addEventListener(e, setMood));
  video.addEventListener('seeking', () => { seeking = true; setMood(); });
  video.addEventListener('seeked', () => { setTimeout(() => { seeking = false; setMood(); }, 700); });
  video.addEventListener('volumechange', () => {
    if (!video.muted && video.volume > lastVol + 0.01) flash('excited', 1400);
    lastVol = video.volume; setMood();
  });
  document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) flash('wow', 2200); else setMood(); queue(); });
  setMood();
}
