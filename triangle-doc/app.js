gsap.registerPlugin(ScrollTrigger);

// ───── 共用：每一幕釘住畫面，滾動位置對應動畫進度；每一步結束處放一個標記，頁面只會停在這些標記上
const STEP_VH = 0.6;  // 每一步在捲軸上佔的距離（幾個畫面高）；只影響捲軸長度，不影響手感
const timelines = [];
function makeScene(id) {
  const el = document.getElementById(id);
  const cfg = {steps: 1};
  const tl = gsap.timeline({
    defaults: {ease: 'none', duration: 1},
    scrollTrigger: {
      trigger: el, pin: true, scrub: true, start: 'top top',
      end: () => '+=' + innerHeight * STEP_VH * cfg.steps,
    },
  });
  const caps = [...el.querySelectorAll('.cap')];
  let k = -1;
  tl.addLabel('p0');
  // step(fn)：換下一句旁白，fn(pos) 把這一步的動畫加在時間點 pos；每一步至少佔 1 個單位
  const step = fn => {
    const pos = tl.duration();
    if (k >= 0 && caps[k]) tl.to(caps[k], {autoAlpha: 0, duration: 0.15}, pos);
    k++;
    if (caps[k]) tl.to(caps[k], {autoAlpha: 1, duration: 0.3}, pos + 0.15);
    if (fn) fn(pos);
    if (tl.duration() < pos + 1) tl.to({}, {duration: pos + 1 - tl.duration()}, tl.duration());
    cfg.steps++;
    tl.addLabel('p' + (k + 1));
  };
  timelines.push(tl);
  return {el, tl, step};
}

// ───── 共用：進度鏈與右上角小三角形
const CHAIN = ['產品', '訂單', '市場', '產業'];
document.querySelectorAll('.scene[data-chain]').forEach(el => {
  const on = +el.dataset.chain;
  el.insertAdjacentHTML('beforeend',
    `<ol class="chain">${CHAIN.map((t, i) => `<li class="${i <= on ? 'on' : ''}">${t}</li>`).join('')}</ol>`);
  const c = el.dataset.corner;
  if (c) el.insertAdjacentHTML('beforeend', `<svg class="mini" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${[['red', 600, 190, '#B3261E'], ['blk', 409, 506, '#5E5B56'], ['amb', 791, 506, '#C8962E']].map(([k, x, y, f]) =>
      `<circle class="${c === k ? 'on' : ''}" cx="${x}" cy="${y}" r="180" fill="${f}"/>`).join('')}</svg>`);
});

// ───── 開場與收尾共用：三個圓，重疊位置與分開位置
const APART = {red: [0, -100], blk: [-100, 58], amb: [100, 58]};
// 分開之後，標籤從「不重疊的那一瓣」移到各自圓的正中央
const LABEL_MID = {red: [0, 96], blk: [84, -82], amb: [-84, -82]};
document.querySelectorAll('.vc').forEach(c => gsap.set(c, {svgOrigin: c.getAttribute('cx') + ' ' + c.getAttribute('cy')}));
function showCircle(tl, g, p, o0 = 0) {
  tl.fromTo(g + ' .vc', {opacity: o0, scale: o0 ? 1 : 0.6}, {opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out', immediateRender: false}, p);
  tl.to(g + ' .cname', {opacity: 1, duration: 0.4}, p + 0.3);
  tl.to(g + ' .cdet', {opacity: 1, duration: 0.4}, p + 0.45);
}

// ───── S0 開場：三個圓疊出 VOC，再分開；分開後的樣子就是之後每一幕右上角的導覽圖示
{
  const {tl, step} = makeScene('s0');
  gsap.set('#voc', {scale: 1.7, svgOrigin: '600 420'});
  step(p => tl.to('#voc', {opacity: 1, duration: 0.6}, p));
  step(p => {
    tl.to('#voc', {scale: 1, duration: 0.6, ease: 'power2.inOut'}, p);
    tl.to('#voc .sub', {opacity: 0, duration: 0.3}, p);
    showCircle(tl, '#g-red', p + 0.2);
  });
  step(p => showCircle(tl, '#g-blk', p));
  step(p => {
    showCircle(tl, '#g-amb', p);
    tl.to('#voc .big', {fill: '#161616', duration: 0.4}, p + 0.4);
  });
  // 今天：三樣東西分開了
  step(p => {
    tl.to('#voc', {opacity: 0, duration: 0.3}, p);
    Object.entries(APART).forEach(([k, [x, y]]) => tl.to('#g-' + k, {x, y, duration: 0.8, ease: 'power2.inOut'}, p + 0.1));
    Object.entries(LABEL_MID).forEach(([k, [x, y]]) => tl.to(`#g-${k} .cname, #g-${k} .cdet`, {x, y, duration: 0.8, ease: 'power2.inOut'}, p + 0.1));
  });
}

// ───── S1 + S2 成本對比
{
  const {el, tl, step} = makeScene('s12');
  const grid = document.getElementById('dgrid');
  for (let i = 0; i < 205; i++) grid.appendChild(document.createElement('i'));
  const cells = [...grid.children], dcount = document.getElementById('dcount'), dnote = document.getElementById('dnote');
  const mnum = document.getElementById('msl-num');
  const st = {n: 1, price: 0};
  const drawCount = () => {
    const n = Math.round(st.n);
    cells.forEach((c, i) => c.classList.toggle('on', i < n));
    dcount.textContent = n;
    dnote.textContent = n >= 205 ? '以最便宜的 64 萬元計' : n >= 82 ? '以最貴的 159 萬元計' : '';
  };
  const drawPrice = () => { mnum.textContent = `約 ${st.price.toFixed(1)} 億元`; };
  drawCount(); drawPrice();
  const chain = el.querySelectorAll('.chain li');

  step(p => tl.fromTo('#msl', {autoAlpha: 0, x: -140}, {autoAlpha: 1, x: 0, duration: 0.9}, p));
  step(p => tl.to('#msl-name', {autoAlpha: 1, duration: 0.5}, p));
  step(p => {
    tl.to('#msl-price', {autoAlpha: 1, duration: 0.2}, p);
    tl.to(st, {price: 1.3, duration: 0.8, onUpdate: drawPrice}, p + 0.1);
  });
  step(p => tl.fromTo('#drn', {autoAlpha: 0, x: 140}, {autoAlpha: 1, x: 0, duration: 0.9}, p));
  step(p => {
    tl.to('#bars', {autoAlpha: 1, duration: 0.2}, p);
    tl.to('#bar-m', {scaleX: 1, duration: 0.6}, p + 0.1);
    tl.to('#bar-d', {opacity: 1, duration: 0.2}, p + 0.7);
    tl.to('#count', {autoAlpha: 1, duration: 0.2}, p + 0.8);
  });
  step(p => tl.to(st, {n: 82, duration: 0.9, onUpdate: drawCount}, p));
  step(p => tl.to(st, {n: 205, duration: 0.9, onUpdate: drawCount}, p));
  // 攔截彈的價錢條少掉一格，跳出一張訂單；進度鏈從「產品」走到「訂單」
  step(p => {
    tl.to('#plate', {autoAlpha: 1, duration: 0.6}, p);
    tl.fromTo('#plate img', {scale: 1.08}, {scale: 1, duration: 1}, p);
    tl.fromTo('#plate-h', {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.4}, p + 0.5);
  });
  step(p => {
    tl.to('#plate-h', {opacity: 0, duration: 0.3}, p);
    tl.to('#plate img', {opacity: 0.22, duration: 0.5}, p);
    tl.fromTo('#order', {autoAlpha: 0, y: 40}, {autoAlpha: 1, y: 0, duration: 0.5}, p + 0.3);
    tl.to(chain[1], {opacity: 1, duration: 0.3}, p + 0.5);
  });
}

// ───── S3 誰需要它：訂單翻面 → 斯密的兩句話 → 一般市場與軍工市場對照
{
  const {el, tl, step} = makeScene('s3');
  const chain = el.querySelectorAll('.chain li');
  const rows = [...el.querySelectorAll('.cmp tbody tr')];
  step(p => {
    tl.to('#order3', {rotationY: 90, duration: 0.3}, p);
    tl.set('#q3', {display: 'none'}, p + 0.3);
    tl.set('#a3', {display: 'inline'}, p + 0.3);
    tl.to('#order3', {rotationY: 0, duration: 0.3}, p + 0.3);
  });
  step(p => {
    tl.to('#order3', {autoAlpha: 0, scale: 0.85, duration: 0.3}, p);
    tl.to('#s3main', {autoAlpha: 1, duration: 0.2}, p + 0.2);
    tl.fromTo('#q-a', {autoAlpha: 0, y: 24}, {autoAlpha: 1, y: 0, duration: 0.5}, p + 0.3);
  });
  step(p => {
    tl.to('#q-mid', {autoAlpha: 1, duration: 0.3}, p);
    tl.fromTo('#q-b', {autoAlpha: 0, y: 24}, {autoAlpha: 1, y: 0, duration: 0.5}, p + 0.3);
  });
  rows.forEach((r, i) => step(p => {
    if (!i) tl.to('#cmp thead', {autoAlpha: 1, duration: 0.2}, p);
    tl.to(r, {autoAlpha: 1, duration: 0.4}, p + 0.15);
    if (i === 3) tl.to(chain[2], {opacity: 1, duration: 0.3}, p + 0.5);
  }));
}

// ───── S4 沒被攻擊為什麼還要買：天平。相等 → 一邊加重而傾斜 → 另一邊提前補上
{
  const {tl, step} = makeScene('s4');
  const why = document.querySelectorAll('#why li');
  gsap.set('#beam', {svgOrigin: '300 130'});
  step(p => tl.fromTo('#s4num', {autoAlpha: 0, y: 20}, {autoAlpha: 1, y: 0, duration: 0.5}, p));
  step(p => { tl.to('#scale', {autoAlpha: 1, duration: 0.5}, p); tl.to(why[0], {opacity: 1, duration: 0.3}, p + 0.3); });
  step(p => {
    tl.to('#wl', {opacity: 1, duration: 0.3}, p);
    tl.to('#beam', {rotation: -9, duration: 0.6, ease: 'power1.inOut'}, p + 0.2);
    tl.to(why[1], {opacity: 1, duration: 0.3}, p + 0.3);
  });
  step(p => {
    tl.to('#wr', {opacity: 1, duration: 0.3}, p);
    tl.to('#beam', {rotation: 0, duration: 0.6, ease: 'power1.inOut'}, p + 0.2);
    tl.to(why[2], {opacity: 1, duration: 0.3}, p + 0.3);
  });
}

// ───── S5 為什麼不是想生產就能生產：233 格，每格 10 枚。用掉 → 圈出一年產量 → 一年一年補回來
{
  const {tl, step} = makeScene('s5');
  const grid = document.getElementById('sgrid');
  for (let i = 0; i < 233; i++) grid.appendChild(document.createElement('i'));
  const cells = [...grid.children], num = document.getElementById('s5num'), lab = document.getElementById('s5lab');
  const st = {left: 233, frame: 0, back: 0};
  const draw = () => {
    const left = Math.round(st.left), back = Math.round(st.back);
    cells.forEach((c, i) => {
      c.className = i < left ? '' : i < left + back ? 'back' : 'used';
      if (st.frame > 0.5 && i >= left && i < left + 60) c.classList.add('prod');
    });
    if (back > 0) { num.textContent = `第 ${(Math.floor(back / 30) / 2).toFixed(1)} 年`; lab.textContent = `一年補 600 枚，已補回 ${(back * 10).toLocaleString()} 枚，還差 ${((233 - left - back) * 10).toLocaleString()} 枚`; }
    else if (st.frame > 0.5) { num.textContent = '約 600 枚'; lab.textContent = '洛克希德馬丁一年的產量（金框）'; }
    else if (left < 233) { num.textContent = `約 ${(left * 10).toLocaleString()} 枚`; lab.textContent = left <= 80 ? '開戰不到半年後，剩下的數量' : '庫存正在減少'; }
    else { num.textContent = '約 2,330 枚'; lab.textContent = '開戰前，美國的愛國者攔截彈庫存'; }
  };
  draw();
  gsap.set(cells, {opacity: 0});
  step(p => tl.to(cells, {opacity: 1, duration: 0.02, stagger: 0.003}, p));
  step(p => tl.to(st, {left: 80, duration: 0.9, onUpdate: draw}, p));
  step(p => tl.to(st, {frame: 1, duration: 0.4, onUpdate: draw}, p + 0.2));
  step(p => tl.to(st, {back: 153, duration: 0.9, onUpdate: draw}, p));
  // 不只飛彈：三種裝備放在同一個比例尺上
  step(p => {
    tl.to('#s5 .s5-main', {autoAlpha: 0, duration: 0.3}, p);
    tl.to('#scalefig', {autoAlpha: 1, duration: 0.3}, p + 0.25);
    tl.fromTo('#scalefig figure', {opacity: 0, y: 24}, {opacity: 1, y: 0, duration: 0.4, stagger: 0.15}, p + 0.3);
  });
}

// ───── S6 為什麼只有少數幾家：51 個點合併成 5 個圓
{
  const NS = 'http://www.w3.org/2000/svg', svg = document.getElementById('s6svg');
  const mk = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; svg.appendChild(e); return e; };
  const FIVE = ['洛克希德馬丁', 'RTX（雷神）', '諾斯洛普格魯曼', '通用動力', '波音'];
  const TX = k => 200 + k * 200, TY = 250;
  const num = mk('text', {class: 's6num', x: 600, y: 70, 'text-anchor': 'middle'}, '51 家');
  const sub = mk('text', {class: 's6sub', x: 600, y: 440, 'text-anchor': 'middle'}, '同一時期，戰術飛彈的供應商從 13 家減為 3 家');
  const ike = mk('text', {class: 's6ike', x: 600, y: 440, 'text-anchor': 'middle'}, '軍工複合體　military-industrial complex　艾森豪，1961 年卸任演說');
  const bigs = FIVE.map((n, k) => mk('circle', {class: 'big5', cx: TX(k), cy: TY, r: 0}));
  const names = FIVE.map((n, k) => mk('text', {class: 'n5', x: TX(k), y: TY + 92, 'text-anchor': 'middle'}, n));
  // 每一家的代表武器：去背照片，盡量正面朝向觀眾
  // [圖, 名稱, 寬高比]；五張圖的面積大致相同，視覺上大小相近，底部對齊同一條線
  const WEAPONS = [['img/w-f35.png', 'F-35 閃電 II 戰機', 720 / 284], ['img/w-radar.png', '愛國者系統雷達', 720 / 473], ['img/w-b21.png', 'B-21 突襲者轟炸機', 720 / 156], ['img/w-abrams.png', 'M1 艾布蘭戰車', 603 / 520], ['img/w-f15ex.png', 'F-15EX 戰機', 720 / 478]];
  const AREA = 13000, MAXW = 236, BASE = TY + 36;
  const wimgs = WEAPONS.map(([src, , ar], k) => {
    const w = Math.min(MAXW, Math.sqrt(AREA * ar)), h = w / ar;
    const im = mk('image', {class: 'w5', href: src, x: TX(k) - w / 2, y: BASE - h, width: w, height: h, preserveAspectRatio: 'xMidYMax meet', opacity: 0});
    gsap.set(im, {svgOrigin: `${TX(k)} ${BASE}`});
    return im;
  });
  const wlabs = WEAPONS.map(([, n], k) => mk('text', {class: 'wlab', x: TX(k), y: TY + 122, 'text-anchor': 'middle', opacity: 0}, n));
  const dots = Array.from({length: 51}, (_, i) => mk('circle', {class: 'd51', cx: 120 + (i % 17) * 60, cy: 170 + Math.floor(i / 17) * 70, r: 13, opacity: 0}));
  const st = {n: 51};
  const draw = () => { num.textContent = Math.round(st.n) + ' 家'; };
  const {tl, step} = makeScene('s6');
  step(p => tl.to(dots, {attr: {opacity: 1}, duration: 0.3, stagger: 0.012}, p));
  step(p => {
    dots.forEach((d, i) => tl.to(d, {attr: {cx: TX(i % 17 % 5), cy: TY}, duration: 0.8, ease: 'power1.inOut'}, p + (i % 7) * 0.02));
    tl.to(st, {n: 5, duration: 0.8, onUpdate: draw}, p + 0.1);
  });
  step(p => {
    tl.to(dots, {attr: {opacity: 0}, duration: 0.2}, p + 0.2);
    tl.to(bigs, {attr: {r: 54}, duration: 0.5}, p);
    tl.to(names, {opacity: 1, duration: 0.3}, p + 0.4);
    tl.to(sub, {opacity: 1, duration: 0.3}, p + 0.6);
  });
  // 五個圓散開，換成各家的代表武器
  step(p => {
    tl.to(sub, {opacity: 0, duration: 0.3}, p);
    tl.to(bigs, {attr: {r: 96}, opacity: 0, duration: 0.4, ease: 'power2.out'}, p);
    // 五張圖同時開始、很快到位，就算一口氣滾過這一步也看得到
    tl.fromTo(wimgs, {opacity: 0, scale: 0.85}, {opacity: 1, scale: 1, duration: 0.45, stagger: 0.04, ease: 'power2.out'}, p + 0.05);
    tl.to(wlabs, {opacity: 1, duration: 0.3}, p + 0.3);
  });
  step(p => tl.to(ike, {opacity: 1, duration: 0.5}, p));
  // 三個名詞：企業、軍工企業、軍工產業
  step(p => {
    tl.to('#s6main', {opacity: 0.08, duration: 0.3}, p);
    tl.to('#defs', {autoAlpha: 1, duration: 0.3}, p + 0.2);
    tl.fromTo('#defs dt, #defs dd', {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: 0.3, stagger: 0.08}, p + 0.25);
  });
  // 其中一家亮成琥珀金，帶進下一個角
  step(p => {
    tl.to('#defs', {autoAlpha: 0, duration: 0.3}, p);
    tl.to('#s6main', {opacity: 1, duration: 0.3}, p + 0.1);
    tl.to([...wimgs.slice(1), ...wlabs.slice(1), ...names.slice(1)], {opacity: 0.4, duration: 0.4}, p);
    tl.to(wimgs[0], {scale: 1.15, duration: 0.5}, p + 0.2);
    tl.to(names[0], {fill: '#9A6A12', duration: 0.3}, p + 0.2);
  });
}

// ───── S7 資金流動：八站。有金額的站畫一個圓，面積依金額比例；不是金額的站畫虛線框
{
  const STATIONS = [
    {nm: '國防預算', amt: 30, lab: '30 兆', num: '約 30 兆元', unit: '美國，2025 年軍事支出', t: '國家一年能花多少', d: '因為買家只有國家，所以這個數字就是整個產業訂單的上限。'},
    {nm: '政府採購', amt: 1.8, lab: '1.8 兆', num: '上限約 1.8 兆元', unit: 'PAC-3 七年期生產合約', t: '國家決定買什麼', d: '因為攔截彈打掉了要補，所以美國陸軍把一年期合約擴大成七年期。'},
    {nm: '在手訂單', amt: 7.3, lab: '7.3 兆', num: '約 6.2 → 7.3 兆元', unit: '洛克希德馬丁，2025 年底 → 2026 年第二季', t: '簽了約、還沒交貨', d: '因為一張合約要做好幾年，所以訂單會先堆在這一站。', ind: 1},
    {nm: '交付', amt: 0, lab: '600 枚／年', num: '一年約 600 枚', unit: 'PAC-3 MSE 年產量', t: '工廠做得出多少', d: '因為產能固定，所以訂單再多，每年能交的貨就是這麼多。'},
    {nm: '營收', amt: 2.4, lab: '2.4 兆', num: '約 2.4 兆元', unit: '洛克希德馬丁，2025 年，年增 6%', t: '交了貨才入帳', d: '因為要交貨才算收入，所以營收只能跟著產能慢慢增加。', ind: 1},
    {nm: '毛利', amt: 0.239, lab: '2,390 億', num: '約 2,390 億元', unit: '毛利率約 10%', t: '每收 100 元，剩下約 10 元', d: '因為飛彈的材料和人工貴，價格又要經政府審核，所以留下的比例不高。', ind: 1},
    {nm: 'EPS', amt: 0.159, lab: '1,590 億', num: '每股約 685 元', unit: '獲利約 1,590 億元 ÷ 約 2.3 億股（21.49 美元）', t: '平分給每一股的獲利', d: '因為還要再扣研發、管理費用和稅，所以毛利到這一站又少了一截。', ind: 1},
    {nm: '市場估值', amt: 0, lab: '19 倍', num: '本益比約 19 倍', unit: '股價 ÷ 每股獲利', t: '市場願意出多少', d: '因為市場買的是未來，所以這個倍數代表投資人願意為每 1 元獲利付多少錢。', ind: 1},
  ];
  const NS = 'http://www.w3.org/2000/svg', svg = document.getElementById('flowsvg'), panels = document.getElementById('panels');
  const Y = 215, X = i => 90 + i * (1020 / 7), R = a => 62 * Math.sqrt(a / 30);
  const mk = (tag, attrs, parent = svg, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    parent.appendChild(e);
    return e;
  };
  mk('line', {class: 'f-base', x1: X(0), y1: Y, x2: X(7), y2: Y});
  const prog = mk('line', {class: 'f-prog', x1: X(0), y1: Y, x2: X(0), y2: Y});
  const groups = STATIONS.map((s, i) => {
    const g = mk('g', {class: 'st'}), x = X(i), r = s.amt ? R(s.amt) : 0;
    const shape = s.amt
      ? mk('circle', {class: 'blob', cx: x, cy: Y - 22 - r, r: 0}, g)
      : mk('rect', {class: 'tick', x: x - 16, y: Y - 54, width: 32, height: 32}, g);
    const amt = mk('text', {class: 'amt', x, y: Y - 22 - (s.amt ? 2 * r : 32) - 10, 'text-anchor': 'middle'}, g, s.lab);
    mk('circle', {class: 'node', cx: x, cy: Y, r: 9}, g);
    mk('text', {class: 'no', x, y: Y + 32, 'text-anchor': 'middle'}, g, '第 ' + (i + 1) + ' 站');
    mk('text', {class: 'nm', x, y: Y + 60, 'text-anchor': 'middle'}, g, s.nm);
    return {g, shape, amt, r};
  });
  const dot = mk('circle', {class: 'f-dot', cx: X(0), cy: Y, r: 7});

  panels.insertAdjacentHTML('beforeend', '<div class="panel intro">現在跟著一筆錢走。它要過八站，而且每過一站，不是變慢，就是變少。</div>');
  STATIONS.forEach(s => panels.insertAdjacentHTML('beforeend',
    `<div class="panel"><div class="num">${s.num}<small>${s.unit}</small></div><div class="txt"><b>${s.nm}：${s.t}</b><span>${s.d}</span></div></div>`));
  panels.insertAdjacentHTML('beforeend', '<div class="panel outro">八站裡留下五個數字：在手訂單、營收、毛利、EPS、估值。它們就是看一家軍工公司的五個指標。</div>');
  const ps = [...panels.children];
  gsap.set(ps[0], {autoAlpha: 1});

  const {el, tl, step} = makeScene('s7');
  const chain = el.querySelectorAll('.chain li');
  STATIONS.forEach((s, i) => step(p => {
    const {g, shape, amt, r} = groups[i];
    tl.to(ps[i], {autoAlpha: 0, duration: 0.15}, p);
    if (i) { tl.to(dot, {attr: {cx: X(i)}, duration: 0.5}, p); tl.to(prog, {attr: {x2: X(i)}, duration: 0.5}, p); }
    tl.to(g, {opacity: 1, duration: 0.2}, p + 0.4);
    tl.to(g.querySelector('.node'), {fill: '#C8962E', stroke: '#C8962E', duration: 0.2}, p + 0.4);
    tl.to(shape, s.amt ? {attr: {r}, duration: 0.4} : {opacity: 1, duration: 0.3}, p + 0.5);
    tl.to(amt, {opacity: 1, duration: 0.2}, p + 0.7);
    tl.to(ps[i + 1], {autoAlpha: 1, duration: 0.3}, p + 0.5);
  }));
  step(p => {
    tl.to(ps[8], {autoAlpha: 0, duration: 0.15}, p);
    groups.forEach(({g}, i) => { if (!STATIONS[i].ind) tl.to(g, {opacity: 0.22, duration: 0.4}, p + 0.1); });
    tl.to(dot, {opacity: 0, duration: 0.2}, p + 0.1);
    tl.to(ps[9], {autoAlpha: 1, duration: 0.3}, p + 0.4);
    tl.to(chain[3], {opacity: 1, duration: 0.3}, p + 0.5);
  });
}

// ───── S8 五個指標：每個指標一步，先說是什麼、有什麼用，再用格子圖和別家公司對照
{
  // rows：[名稱, 格數, 其中紅色的格數, 數值文字, 是否為主角]
  const IND = [
    {nm: '在手訂單', what: '已經簽約、還沒交貨的金額。', use: '看未來幾年的工作排到哪裡。軍工公司最先看它。',
      key: '每一格是新台幣 1,000 億元。紅色是 2025 年底到 2026 年第二季新增的',
      rows: [['洛克希德馬丁', 73, 11, '6.2 → 7.3 兆元', 1], ['RTX（含民用航太）', 92, 7, '8.5 → 9.2 兆元'], ['漢翔', 1, 0, '逾 0.1 兆元']]},
    {nm: '營收成長率', what: '今年的營收比去年多了幾 %。營收要交了貨才入帳。', use: '看交貨的速度有沒有變快。硬體受產能限制，只能慢慢增加。',
      key: '每一格是 1%（2025 年）。空心格代表衰退',
      rows: [['Palantir（軟體）', 56, 0, '＋56%'], ['台積電（對照）', 32, 0, '＋32%'], ['RTX', 10, 0, '＋10%'], ['洛克希德馬丁', 6, 0, '＋6%', 1], ['漢翔', -10, 0, '−10%']]},
    {nm: '毛利率', what: '每收 100 元，扣掉製造成本後剩下幾元。', use: '看這門生意留不留得住錢。飛彈成本高，價格又要政府審核。',
      key: '每家 100 格，代表收進來的 100 元；紅色是剩下的毛利（2025 年）', full: 100,
      rows: [['Palantir（軟體）', 100, 82, '82 元'], ['台積電（對照）', 100, 60, '60 元'], ['RTX', 100, 20, '20 元'], ['洛克希德馬丁', 100, 10, '10 元', 1], ['漢翔', 100, 7, '7 元']]},
    {nm: 'EPS　每股盈餘', what: '公司一年的獲利，平分給每一股。', use: '看每一股實際賺到多少。各家股數不同，不能直接比高低，要和股價一起看。',
      key: '每一格是新台幣 10 元（2025 年）。不到 1 格的畫成細線',
      rows: [['洛克希德馬丁', 69, 0, '約 685 元', 1], ['RTX', 16, 0, '約 158 元'], ['台積電（對照）', 7, 0, '約 66 元'], ['Palantir', 2, 0, '約 20 元'], ['漢翔', 0, 0, '0.78 元'], ['雷虎', 0, 0, '0.58 元']]},
    {nm: '本益比', what: '股價 ÷ EPS。照現在的賺法，要幾年才賺回股價。', use: '看市場出價多高。倍數愈高，代表愈多價錢付給還沒發生的獲利。',
      key: '每一格是 1 年（2026/10/8、10/9 收盤，近四季 EPS）',
      rows: [['洛克希德馬丁', 19, 0, '19 倍', 1], ['台積電（對照）', 30, 0, '30 倍'], ['漢翔', 31, 0, '31 倍'], ['RTX', 33, 0, '33 倍'], ['Palantir', 179, 0, '179 倍'], ['雷虎（概念股）', 355, 0, '355 倍']]},
  ];
  const cellsHtml = (n, red, full) => {
    if (n === 0) return '<i class="tiny"></i>';
    if (n < 0) return '<i class="neg"></i>'.repeat(-n);
    // 毛利率：紅色在前；其他：紅色（新增的）在後
    return Array.from({length: n}, (_, i) => `<i class="${(full ? i < red : i >= n - red) ? 'red' : ''}"></i>`).join('');
  };
  const ind = document.getElementById('ind'), tabs = document.getElementById('indtabs');
  tabs.innerHTML = IND.map(d => `<li>${d.nm.split('　')[0]}</li>`).join('');
  ind.innerHTML = IND.map((d, k) => `<div class="ind-pane h">
    <div class="ind-l"><p class="ind-no">指標 ${k + 1}</p><h3>${d.nm}</h3>
      <dl><dt>是什麼</dt><dd>${d.what}</dd><dt>有什麼用</dt><dd>${d.use}</dd></dl></div>
    <div class="ind-r"><p class="ind-key">${d.key}</p>${d.rows.map(([nm, n, red, val, main]) =>
      `<div class="wrow${main ? ' main' : ''}"><label>${nm}</label><div class="wf">${cellsHtml(n, red, d.full)}</div><em>${val}</em></div>`).join('')}</div>
  </div>`).join('');
  const panes = [...ind.children], tabEls = [...tabs.children];
  const {tl, step} = makeScene('s8');
  panes.forEach((pane, k) => step(p => {
    if (k) { tl.to(panes[k - 1], {autoAlpha: 0, duration: 0.2}, p); tl.to(tabEls[k - 1], {opacity: 0.35, duration: 0.2}, p); }
    tl.to(tabEls[k], {opacity: 1, duration: 0.2}, p + 0.15);
    tl.to(pane, {autoAlpha: 1, duration: 0.3}, p + 0.2);
    tl.fromTo(pane.querySelectorAll('.wrow'), {opacity: 0, x: -16}, {opacity: 1, x: 0, duration: 0.3, stagger: 0.08}, p + 0.3);
  }));
  // 「概念」：只留雷虎那一列
  const peRows = [...panes[4].querySelectorAll('.wrow')];
  step(p => {
    tl.to(peRows.slice(0, -1), {opacity: 0.25, duration: 0.4}, p);
    tl.to(peRows[5].querySelectorAll('.wf i'), {backgroundColor: '#C8482B', duration: 0.4}, p + 0.1);
    tl.to(peRows[5].querySelector('em'), {color: '#C8482B', duration: 0.3}, p + 0.1);
  });
  // 收尾：洛克希德馬丁的五個數字排成一列
  step(p => {
    tl.to(panes[4], {autoAlpha: 0, duration: 0.25}, p);
    tl.to(tabs, {autoAlpha: 0, duration: 0.25}, p);
    tl.to('#cards', {autoAlpha: 1, duration: 0.3}, p + 0.2);
    tl.fromTo('#cards .card', {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: 0.3, stagger: 0.08}, p + 0.25);
  });
}

// ───── S8W 用五個數字看美伊戰爭：帳本一列一列出現，最後只留下「訂單」和「股價」兩個數字
{
  const {tl, step} = makeScene('s8w');
  const rows = [...document.querySelectorAll('#ledger tbody tr')];
  gsap.set(rows, {opacity: 0});
  rows.forEach((r, i) => step(p => {
    if (i) tl.to(rows[i - 1], {opacity: 0.4, duration: 0.3}, p);
    tl.fromTo(r, {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: 0.4}, p + 0.1);
  }));
  step(p => {
    tl.to('#ledger', {opacity: 0.1, duration: 0.3}, p);
    tl.to('#versus', {autoAlpha: 1, duration: 0.3}, p + 0.2);
    tl.fromTo('#versus > div', {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.4, stagger: 0.25}, p + 0.25);
  });
}

// ───── S9 收尾：三個圓分開出現，依序亮起，最後疊在一起成為「軍工產業」
{
  const {tl, step} = makeScene('s9');
  Object.entries(APART).forEach(([k, [x, y]]) => gsap.set('#g9-' + k, {x, y}));
  Object.entries(LABEL_MID).forEach(([k, [x, y]]) => gsap.set(`#g9-${k} .cname, #g9-${k} .cdet`, {x, y}));
  step(p => {
    tl.to('#g9-blk .vc, #g9-amb .vc', {opacity: 0.25, duration: 0.4}, p);
    showCircle(tl, '#g9-red', p + 0.1);
  });
  step(p => showCircle(tl, '#g9-blk', p, 0.25));
  step(p => showCircle(tl, '#g9-amb', p, 0.25));
  step(p => {
    Object.keys(APART).forEach(k => tl.to(`#g9-${k}, #g9-${k} .cname, #g9-${k} .cdet`, {x: 0, y: 0, duration: 0.8, ease: 'power2.inOut'}, p));
    tl.to('#ctr9', {opacity: 1, duration: 0.4}, p + 0.7);
  });
  step(p => tl.to('#s9 .tri-wrap', {opacity: 0.18, duration: 0.6}, p));
}

ScrollTrigger.refresh();

// ───── 一次一步：滾輪、觸控、方向鍵都只會讓頁面前進或後退一步，停在完整的畫面上，不會停在動畫一半
let STOPS = [0], idx = 0, busy = false;
const scrollPos = {y: 0};
function computeStops() {
  const pts = [0];
  timelines.forEach(tl => {
    const st = tl.scrollTrigger, d = tl.duration();
    Object.entries(tl.labels).forEach(([n, t]) => { if (n !== 'p0') pts.push(Math.round(st.start + (st.end - st.start) * t / d)); });
  });
  STOPS = [...new Set(pts)].sort((a, b) => a - b);
}
const nearest = y => STOPS.reduce((b, p, i) => Math.abs(p - y) < Math.abs(STOPS[b] - y) ? i : b, 0);
function goTo(i) {
  idx = Math.max(0, Math.min(STOPS.length - 1, i));
  const target = STOPS[idx];
  if (Math.abs(target - scrollY) < 2) return;
  const dist = Math.abs(target - scrollY) / innerHeight;
  busy = true;
  scrollPos.y = scrollY;
  gsap.killTweensOf(scrollPos);
  gsap.to(scrollPos, {
    y: target, duration: Math.min(0.95, 0.42 + dist * 0.32), ease: 'power2.out',
    onUpdate: () => scrollTo(0, scrollPos.y),
    onComplete: () => { busy = false; },
  });
}
// 滾輪與觸控：動畫進行中不接受；方向鍵：可以連按，往前疊加
const move = (dir, queue) => {
  if (busy && !queue) return;
  goTo((busy ? idx : nearest(scrollY)) + dir);
};

// 滾輪與觸控板：一次滑動 = 一步。
// 觸控板一次滑動會送出一長串事件：手指在板上時一直有，放手後還有一段越來越小的「慣性」。
// 規則：① 停了 0.15 秒以上再來的事件，是新的一次滑動 → 走一步；
//       ② 換方向 → 立刻走一步（才能馬上往回）；
//       ③ 同一串事件裡，滾動量突然明顯變大（慣性還沒停、手指又推了一次）→ 走一步；
//       其他事件（手指拖著不放、慣性）都不算。滑鼠一格一格慢慢滾時，每一格之間會停頓，所以每格都算一步。
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
  if (e.ctrlKey) return;  // 兩指縮放
  e.preventDefault();
  const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  const d = raw * (e.deltaMode === 1 ? 40 : 1);
  if (Math.abs(d) < 1) return;
  const dir = wheelDecide(d, performance.now());
  if (dir) move(dir, true);
}, {passive: false});

// 觸控：手指滑過 30 像素以上算一步
let touchY = null;
addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, {passive: true});
addEventListener('touchmove', e => e.preventDefault(), {passive: false});
addEventListener('touchend', e => {
  if (touchY === null) return;
  const dy = touchY - e.changedTouches[0].clientY;
  touchY = null;
  if (Math.abs(dy) > 30) move(dy > 0 ? 1 : -1, true);
});

// 鍵盤：→ ↓ 空白鍵 Enter PageDown 前進；← ↑ PageUp 退回；Home 回到開頭；End 跳到結尾
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const fwd = ['ArrowRight', 'ArrowDown', 'PageDown', 'Enter'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
  const back = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
  if (fwd || back) { e.preventDefault(); move(fwd ? 1 : -1, true); }
  else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
  else if (e.key === 'End') { e.preventDefault(); goTo(STOPS.length - 1); }
});

// 拖曳捲軸或視窗大小改變之後，停手時對齊最近的一步
let settle;
addEventListener('scroll', () => {
  if (busy) return;
  clearTimeout(settle);
  settle = setTimeout(() => { if (!busy) goTo(nearest(scrollY)); }, 180);
}, {passive: true});
// 字型載入或視窗改變時，各步的位置會重算；正在前進的話，繼續前往同一步的新位置
ScrollTrigger.addEventListener('refresh', () => { computeStops(); goTo(busy ? idx : nearest(scrollY)); });
computeStops();
goTo(nearest(scrollY));
