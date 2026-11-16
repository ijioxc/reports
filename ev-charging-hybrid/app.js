// ───── 簡報引擎：不捲動頁面。每一幕是一張固定的全螢幕圖層，
// 幕內每一步播放時間軸，換幕用淡入淡出。這樣換頁不會因為捲動和釘選交接而抖動。

// ───── 講者模式：按 N 或網址加 ?notes，顯示每一步的旁白
const root = document.documentElement;
if (/[?&]notes\b/.test(location.search)) root.classList.add('notes');

// data-s="k" 第 k 步出現、data-out="k" 第 k 步消失；.cap 是第 k 步的旁白。
// data-g="k"：長條在第 k 步長出來（第 1 步的就直接畫好）；data-d 延遲；data-o="b" 由下往上長。
const FADE = 0.5;        // 幕內元素淡入的時間（時間軸單位，1 ＝ 一步）
const STEP_SEC = 0.6;    // 幕內前進一步實際花幾秒
const SCENE_SEC = 0.35;  // 換幕淡入淡出幾秒
const SCENE_FX = {};

function growBars(el, tl, at) {
  el.querySelectorAll('[data-g]').forEach(b => {
    const k = +b.dataset.g, d = +(b.dataset.d || 0), up = b.dataset.o === 'b';
    const from = up ? {scaleY: 0, transformOrigin: '50% 100%'} : {scaleX: 0, transformOrigin: '0% 50%'};
    if (k <= 1) return;   // 第 1 步的長條直接畫好
    gsap.set(b, from);
    tl.to(b, {[up ? 'scaleY' : 'scaleX']: 1, duration: 0.35, ease: 'power2.out'}, at(k) + 0.1 + d);
  });
}

// ───── 豐田 THS 列線圖。三個軸 x：MG1 620、引擎 836（＝78/108 的位置）、輪子 920；轉速 1 ＝ 55 px
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
  if (lab) lab.textContent = c < 0.05 && r < 0.05 ? '停車：三個都是 0' : c < 0.05 ? '純電起步：引擎 0，MG1 反轉' : '引擎加入：調 MG1，引擎維持在最省油轉速';
}
drawNomo();
SCENE_FX.s6 = (tl, at) => {
  tl.to(NOMO.st, {r: 1, c: 0, duration: 0.55, ease: 'power2.inOut', onUpdate: drawNomo}, at(2));
  tl.to(NOMO.st, {r: 1.2, c: 1.5, duration: 0.55, ease: 'power2.inOut', onUpdate: drawNomo}, at(3));
};

// ───── 每一幕建一條暫停的時間軸：第 k 步＝時間 k-1
const scenes = [...document.querySelectorAll('.scene')].map(el => {
  const n = +el.dataset.steps || 1;
  const tl = gsap.timeline({paused: true, defaults: {ease: 'power1.inOut', duration: FADE}});
  const at = k => k - 2 + (1 - FADE) / 2;   // 第 k 步的動畫放在第 k-1 段的中間
  tl.to({}, {duration: Math.max(0.001, n - 1)}, 0);   // 讓時間軸長度剛好是 n-1

  // SVG 的 <g transform> 會被 y 動畫蓋掉：把 transform 移到外層包一層
  el.querySelectorAll('svg [data-s][transform]').forEach(e => {
    const w = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    w.setAttribute('transform', e.getAttribute('transform')); e.removeAttribute('transform');
    e.parentNode.insertBefore(w, e); w.appendChild(e);
  });
  el.querySelectorAll('[data-s]').forEach(e => {
    const s = +e.dataset.s;
    if (s > 1) { gsap.set(e, {autoAlpha: 0}); tl.fromTo(e, {autoAlpha: 0, y: 12}, {autoAlpha: 1, y: 0, immediateRender: false}, at(s)); }
  });
  el.querySelectorAll('[data-out]').forEach(e => tl.to(e, {autoAlpha: 0}, at(+e.dataset.out)));

  const caps = [...el.querySelectorAll('.cap')];
  caps.forEach((c, i) => {
    if (i === 0) gsap.set(c, {autoAlpha: 1});
    else { tl.to(caps[i - 1], {autoAlpha: 0, duration: 0.15}, at(i + 1)); tl.to(c, {autoAlpha: 1, duration: 0.25}, at(i + 1) + 0.15); }
  });

  growBars(el, tl, at);
  if (SCENE_FX[el.id]) SCENE_FX[el.id](tl, at);
  tl.time(0);
  return {el, tl, n, theme: el.dataset.theme, part: el.dataset.part};
});

// ───── 所有停靠點：每一幕的每一步，最後是參考資料
const refsEl = document.querySelector('.refs');
const STOPS = [];
scenes.forEach((s, si) => { for (let k = 1; k <= s.n; k++) STOPS.push({si, k, theme: s.theme, part: s.part}); });
if (refsEl) STOPS.push({refs: true, theme: 'ev', part: scenes.at(-1).part});

const layers = [...scenes.map(s => s.el), refsEl].filter(Boolean);
gsap.set(layers, {autoAlpha: 0});
let shown = null;
function fadeTo(el) {
  if (shown === el) return;
  if (!shown) { gsap.set(el, {autoAlpha: 1}); shown = el; return; }   // 第一次直接顯示，不淡入
  layers.forEach(x => { if (x !== el && x !== shown) { gsap.killTweensOf(x); gsap.set(x, {autoAlpha: 0}); } });
  if (shown) gsap.to(shown, {autoAlpha: 0, duration: SCENE_SEC, ease: 'power1.inOut', overwrite: true});
  gsap.to(el, {autoAlpha: 1, duration: SCENE_SEC, ease: 'power1.inOut', overwrite: true});
  shown = el;
}

function applyStop(p) {
  if (root.dataset.theme !== p.theme) root.dataset.theme = p.theme;
  if (root.dataset.part !== p.part) {
    root.dataset.part = p.part;
    document.querySelectorAll('#progress li').forEach(li => li.classList.toggle('on', li.dataset.part === p.part));
  }
}

let cur = -1;
function goTo(i) {
  i = Math.max(0, Math.min(STOPS.length - 1, i));
  if (i === cur) return;
  const prev = STOPS[cur], next = STOPS[i];
  cur = i;
  applyStop(next);
  history.replaceState(null, '', '#' + (i + 1));
  if (next.refs) { refsEl.scrollTop = 0; fadeTo(refsEl); return; }
  const S = scenes[next.si];
  gsap.killTweensOf(S.tl);
  if (prev && !prev.refs && prev.si === next.si) {
    // 同一幕：播放到下一步（往回就倒著播）
    S.tl.tweenTo(next.k - 1, {duration: Math.min(1, STEP_SEC * Math.abs(next.k - prev.k)), ease: 'none'});
  } else {
    // 換幕：舊的一幕停止播放；新的一幕直接停在目標那一步，再淡入
    if (prev && !prev.refs) gsap.killTweensOf(scenes[prev.si].tl);
    S.tl.time(next.k - 1);
    fadeTo(S.el);
  }
}
const move = dir => goTo(cur + dir);

// ───── 全螢幕：按 F
function toggleFull() {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
}

// ───── 滾輪與觸控板：一次滑動 = 一步
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
const onRefs = () => STOPS[cur] && STOPS[cur].refs;
addEventListener('wheel', e => {
  if (e.ctrlKey) return;
  const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  const d = raw * (e.deltaMode === 1 ? 40 : 1);
  // 參考資料頁可以正常捲動；捲到最上面再往上，才回到上一頁
  if (onRefs() && !(d < 0 && refsEl.scrollTop <= 0)) return;
  e.preventDefault();
  if (Math.abs(d) < 1) return;
  const dir = wheelDecide(d, performance.now());
  if (dir) move(dir);
}, {passive: false});

let touchY = null;
addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, {passive: true});
addEventListener('touchmove', e => { if (!onRefs()) e.preventDefault(); }, {passive: false});
addEventListener('touchend', e => {
  if (touchY === null) return;
  const dy = touchY - e.changedTouches[0].clientY;
  touchY = null;
  if (onRefs() && !(dy < 0 && refsEl.scrollTop <= 0)) return;
  if (Math.abs(dy) > 30) move(dy > 0 ? 1 : -1);
});

// ───── 鍵盤：→ ↓ 空白 Enter PageDown 前進；← ↑ PageUp 退回；Home、End；F 全螢幕；N 講者模式
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const fwd = ['ArrowRight', 'ArrowDown', 'PageDown', 'Enter'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
  const back = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
  if (onRefs() && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key) && !(back && refsEl.scrollTop <= 0)) return;
  if (fwd || back) { e.preventDefault(); move(fwd ? 1 : -1); }
  else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
  else if (e.key === 'End') { e.preventDefault(); goTo(STOPS.length - 1); }
  else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFull(); }
  else if (e.key === 'n' || e.key === 'N') root.classList.toggle('notes');
});

// ───── 重新整理時留在同一頁（網址 #頁數）
const start = parseInt(location.hash.slice(1), 10);
goTo(Number.isFinite(start) ? start - 1 : 0);
