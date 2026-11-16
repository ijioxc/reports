gsap.registerPlugin(ScrollTrigger);

// ───── 講者模式：按 N 或網址加 ?notes，顯示每一步的旁白
const root = document.documentElement;
if (/[?&]notes\b/.test(location.search)) root.classList.add('notes');

// ───── 每一幕釘住畫面，滾動位置對應動畫進度（引擎照 tesla-spacex/scroll/app.js）
// data-s="k" 第 k 步出現、data-out="k" 第 k 步消失；.cap 是第 k 步的旁白。
// data-g="k"：長條在第 k 步長出來（第 1 步的就直接畫好）；data-d 延遲；data-o="b" 由下往上長。
const STEP_VH = 0.6;
const FADE = 0.5;
const SCENE_FX = {};
const BLUE = '#1F5FE0', BLUE3 = '#B7CBF7';

function growBars(el, tl, at) {
  el.querySelectorAll('[data-g]').forEach(b => {
    const k = +b.dataset.g, d = +(b.dataset.d || 0), up = b.dataset.o === 'b';
    const from = up ? {scaleY: 0, transformOrigin: '50% 100%'} : {scaleX: 0, transformOrigin: '0% 50%'};
    if (k <= 1) return;   // 第 1 步的長條直接畫好
    gsap.set(b, from);
    // 要在下一個停靠點（at(k) + 0.75）之前長完：0.1 + d + 0.35 ≤ 0.75
    tl.to(b, {[up ? 'scaleY' : 'scaleX']: 1, duration: 0.35, ease: 'power2.out'}, at(k) + 0.1 + d);
  });
}

// ───── 第 4 幕：台灣充電樁圓餅（快充 4,188／慢充 12,092），第 ③ 步轉出來
const TW = {a: {a: 1}};   // 一進來就畫滿
function drawTwPie() {
  if (!window.d3) return;
  const end = 2 * Math.PI * TW.a.a, f = 4188 / 16280;
  const arc = d3.arc().innerRadius(100).outerRadius(160);
  d3.select('#twpie').selectAll('path').data([[0, f], [f, 1]]).join('path')
    .attr('d', ([s, e]) => arc({startAngle: Math.min(end, 2 * Math.PI * s), endAngle: Math.min(end, 2 * Math.PI * e)}))
    .attr('fill', (d, i) => i ? BLUE3 : BLUE);
}
drawTwPie();

// ───── 第 6 幕：列線圖。三個軸 x：MG1 620、引擎 836（＝78/108 的位置）、輪子 920；轉速 1 ＝ 55 px
// 太陽 30 齒、環 78 齒：30·Ns + 78·Nr = 108·Nc。三個頂點永遠在一直線上。
const NOMO = {Z0: 270, K: 55, st: {c: 0, r: 0}};
function drawNomo() {
  const {c, r} = NOMO.st, s = (108 * c - 78 * r) / 30;
  const y = v => NOMO.Z0 - v * NOMO.K;
  [['nb-s', s], ['nb-c', c], ['nb-r', r]].forEach(([id, v]) => {
    const b = document.getElementById(id); if (!b) return;
    b.setAttribute('y', Math.min(y(v), NOMO.Z0)); b.setAttribute('height', Math.abs(v * NOMO.K));
  });
  const ln = document.getElementById('nline');
  if (ln) { ln.setAttribute('y1', y(s)); ln.setAttribute('y2', y(r)); }
  const lab = document.getElementById('nlab');
  if (lab) lab.textContent = c < 0.05 && r < 0.05 ? '停車：三個都是 0' : c < 0.05 ? '純電起步：引擎 0，MG1 反轉' : '引擎加入：調 MG1，引擎停在最省油轉速';
}
drawNomo();
SCENE_FX.s6 = (tl, at) => {
  tl.to(NOMO.st, {r: 1, c: 0, duration: 0.55, ease: 'power2.inOut', onUpdate: drawNomo}, at(2));
  tl.to(NOMO.st, {r: 1.2, c: 1.5, duration: 0.55, ease: 'power2.inOut', onUpdate: drawNomo}, at(3));
};

const scenes = [...document.querySelectorAll('.scene')].map((el, si) => {
  const n = +el.dataset.steps || 1;
  const tl = gsap.timeline({
    defaults: {ease: 'power1.inOut', duration: FADE},
    scrollTrigger: {
      trigger: el, pin: true, scrub: true, start: 'top top',
      end: () => '+=' + innerHeight * STEP_VH * Math.max(1, n - 1),
    },
  });
  const at = k => k - 2 + (1 - FADE) / 2;   // 第 k 步的動畫放在第 k-1 段的中間
  for (let k = 1; k <= n; k++) tl.addLabel('p' + k, k - 1);
  tl.to({}, {duration: Math.max(0.001, n - 1)}, 0);   // 讓時間軸長度剛好是 n-1

  // SVG 的 <g transform> 會被 y 動畫蓋掉：把 transform 移到外層包一層
  el.querySelectorAll('svg [data-s][transform]').forEach(e => {
    const w = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    w.setAttribute('transform', e.getAttribute('transform')); e.removeAttribute('transform');
    e.parentNode.insertBefore(w, e); w.appendChild(e);
  });
  el.querySelectorAll('[data-s]').forEach(e => {
    const s = +e.dataset.s;
    if (s > 1) { gsap.set(e, {autoAlpha: 0}); tl.fromTo(e, {autoAlpha: 0, y: 12}, {autoAlpha: 1, y: 0}, at(s)); }
  });
  el.querySelectorAll('[data-out]').forEach(e => tl.to(e, {autoAlpha: 0}, at(+e.dataset.out)));

  const caps = [...el.querySelectorAll('.cap')];
  caps.forEach((c, i) => {
    if (i === 0) gsap.set(c, {autoAlpha: 1});
    else { tl.to(caps[i - 1], {autoAlpha: 0, duration: 0.15}, at(i + 1)); tl.to(c, {autoAlpha: 1, duration: 0.25}, at(i + 1) + 0.15); }
  });

  growBars(el, tl, at);
  if (SCENE_FX[el.id]) SCENE_FX[el.id](tl, at);
  return {el, tl, n, si, theme: el.dataset.theme, part: el.dataset.part};
});

ScrollTrigger.refresh();

// ───── 所有「停靠點」：每一幕的每一步，加上最後的參考資料
let STOPS = [], idx = 0, busy = false;
const TOTAL = scenes.reduce((a, s) => a + s.n, 0);
function computeStops() {
  const pts = [];
  let count = 0;
  scenes.forEach(s => {
    const st = s.tl.scrollTrigger, d = Math.max(1, s.n - 1);
    for (let k = 1; k <= s.n; k++) {
      count++;
      pts.push({y: Math.round(st.start + (st.end - st.start) * (k - 1) / d), theme: s.theme, part: s.part, no: count});
    }
  });
  const refs = document.querySelector('.refs');
  if (refs) pts.push({y: Math.round(refs.getBoundingClientRect().top + scrollY), theme: 'ev', part: '5', no: TOTAL});
  STOPS = pts;
}
const nearest = y => STOPS.reduce((b, p, i) => Math.abs(p.y - y) < Math.abs(STOPS[b].y - y) ? i : b, 0);

// ───── 背景、右上角、進度條：跟著目標停靠點換
function applyStop(p) {
  if (root.dataset.theme !== p.theme) root.dataset.theme = p.theme;
  if (root.dataset.part !== p.part) {
    root.dataset.part = p.part;
    document.querySelectorAll('#progress li').forEach(li => li.classList.toggle('on', li.dataset.part === p.part));
  }
  document.getElementById('pageno').textContent = `${p.no} / ${TOTAL}`;
}

const scrollPos = {y: 0};
function goTo(i) {
  idx = Math.max(0, Math.min(STOPS.length - 1, i));
  const target = STOPS[idx];
  applyStop(target);
  if (Math.abs(target.y - scrollY) < 2) return;
  const dist = Math.abs(target.y - scrollY) / innerHeight;
  busy = true;
  scrollPos.y = scrollY;
  gsap.killTweensOf(scrollPos);
  gsap.to(scrollPos, {
    y: target.y, duration: Math.min(0.95, 0.42 + dist * 0.32), ease: 'power2.out',
    onUpdate: () => scrollTo(0, scrollPos.y),
    onComplete: () => { busy = false; },
  });
}
const move = (dir, queue) => {
  if (busy && !queue) return;
  goTo((busy ? idx : nearest(scrollY)) + dir);
};

// ───── 滾輪與觸控板：一次滑動 = 一步（做法同軍工報告 triangle-doc/app.js）
// ① 停 0.15 秒以上再來的事件是新的一次滑動；② 換方向立刻算一步；③ 慣性中又用力推一次也算一步
const WHEEL = {quiet: 150, minGap: 280, surge: 1.6};
const wheelState = {last: -1e9, lastStep: -1e9, dir: 0, hist: []};
function wheelDecide(d, now) {
  const w = wheelState, a = Math.abs(d), dir = d > 0 ? 1 : -1;
  const fresh = now - w.last > WHEEL.quiet, turned = dir !== w.dir;
  const prev = w.hist.slice(-3), base = prev.length ? prev.reduce((x, y) => x + y, 0) / prev.length : 0;
  const surge = !fresh && !turned && prev.length >= 3 && a > Math.max(6, base * WHEEL.surge) && now - w.lastStep > WHEEL.minGap;
  w.last = now;
  if (fresh || turned) w.hist = [];
  w.hist.push(a); if (w.hist.length > 6) w.hist.shift();
  if (fresh || turned || surge) { w.lastStep = now; w.dir = dir; return dir; }
  return 0;
}
addEventListener('wheel', e => {
  if (e.ctrlKey) return;
  e.preventDefault();
  const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  const d = raw * (e.deltaMode === 1 ? 40 : 1);
  if (Math.abs(d) < 1) return;
  const dir = wheelDecide(d, performance.now());
  if (dir) move(dir, true);
}, {passive: false});

let touchY = null;
addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, {passive: true});
addEventListener('touchmove', e => e.preventDefault(), {passive: false});
addEventListener('touchend', e => {
  if (touchY === null) return;
  const dy = touchY - e.changedTouches[0].clientY;
  touchY = null;
  if (Math.abs(dy) > 30) move(dy > 0 ? 1 : -1, true);
});

// ───── 鍵盤：→ ↓ 空白 Enter PageDown 前進；← ↑ PageUp 退回；Home、End；N 切換講者模式
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const fwd = ['ArrowRight', 'ArrowDown', 'PageDown', 'Enter'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
  const back = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
  if (fwd || back) { e.preventDefault(); move(fwd ? 1 : -1, true); }
  else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
  else if (e.key === 'End') { e.preventDefault(); goTo(STOPS.length - 1); }
  else if (e.key === 'n' || e.key === 'N') root.classList.toggle('notes');
});

// 拖捲軸或改視窗大小後，停手時對齊最近的一步
let settle;
addEventListener('scroll', () => {
  if (busy) return;
  clearTimeout(settle);
  settle = setTimeout(() => { if (!busy) goTo(nearest(scrollY)); }, 180);
}, {passive: true});
ScrollTrigger.addEventListener('refresh', () => { computeStops(); goTo(busy ? idx : nearest(scrollY)); });
computeStops();
goTo(nearest(scrollY));
