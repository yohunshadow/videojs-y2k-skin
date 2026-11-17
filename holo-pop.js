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
