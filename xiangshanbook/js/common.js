/* XiangShanBook 공통 스크립트 — 전역 객체 MB
   - 레이아웃(상단바, 장 목록 서랍, 오른쪽 목차, 이전/다음, 테마) 자동 생성
   - 그림 헬퍼: 고해상도 canvas, 테마 색, 세그먼트 버튼, 슬라이더, 애니메이션 루프, 꺾은선 그래프
   이 파일은 <head>에서 defer 없이 읽는다. 각 장의 스크립트는 </body> 직전에 둔다. */
(function () {
  "use strict";

  const CHAPTERS = [
    { slug: "overview",   num: "01", part: "코어 전체",  title: "XiangShan 한눈에",          desc: "RISC-V 고성능 오픈소스 코어 XiangShan 곤명호(Kunminghu) v3. 프런트엔드·백엔드·메모리 블록·캐시를 지도 위에서 하나씩 짚어 본다.", tags: ["sim", "개요"] },
    { slug: "pipeline",   num: "02", part: "코어 전체",  title: "명령어의 여정",             desc: "인출에서 커밋까지. 디코드·리네임·디스패치·이슈·실행·커밋을 사이클 단위로 흘려 보내며 폭과 큐 크기가 성능을 어떻게 정하는지 본다.", tags: ["sim"] },
    { slug: "bpu",        num: "03", part: "프런트엔드", title: "분기 예측 유닛",            desc: "uBTB·aBTB·mBTB와 TAGE·SC·ITTAGE·RAS가 s1~s3에 나눠 답하는 다단 예측. 덮어쓰기 거품과 FTQ를 직접 굴려 본다.", tags: ["sim", "RTL"] },
    { slug: "predictors", num: "04", part: "프런트엔드", title: "방향과 목적지 예측기",       desc: "TAGE의 기하급수 히스토리, SC의 통계 보정, ITTAGE의 간접 분기 목적지, RAS의 복귀 주소. 예측기 하나하나를 해부한다.", tags: ["sim", "RTL"] },
    { slug: "fetch",      num: "05", part: "프런트엔드", title: "명령어 인출",               desc: "FTQ가 넘긴 페치 블록을 ICache에서 읽어 명령어로 자르고 미리 디코드해 IBuffer에 쌓기까지. 프리페치와 압축 명령어 경계.", tags: ["sim", "RTL"] },
    { slug: "rename",     num: "06", part: "백엔드",     title: "디코드와 리네임",            desc: "명령어를 마이크로 연산으로 쪼개고, 아키텍처 레지스터를 물리 레지스터로 바꿔 거짓 의존을 지운다. 이동 제거와 스냅샷 복구까지.", tags: ["sim", "RTL"] },
    { slug: "issue",      num: "07", part: "백엔드",     title: "디스패치·이슈·실행",         desc: "이슈 큐에서 피연산자가 준비된 명령을 깨워 실행 유닛으로 보낸다. 웨이크업, 정수·부동소수·벡터 실행 유닛, 레지스터 파일 읽기 포트.", tags: ["sim", "RTL"] },
    { slug: "rob",        num: "08", part: "백엔드",     title: "ROB와 커밋, 리다이렉트",     desc: "순서 없이 실행한 결과를 순서대로 확정하는 재정렬 버퍼. 예외·분기 오예측이 일어났을 때 무엇을 버리고 어디서 다시 시작하는가.", tags: ["sim", "RTL"] },
    { slug: "lsu",        num: "09", part: "메모리",     title: "로드·스토어 유닛",           desc: "로드 파이프라인, 로드·스토어 큐, 스토어 포워딩, 메모리 순서 위반과 의존 예측, 스토어 버퍼. 메모리 명령이 비순차로 안전하게 도는 법.", tags: ["sim", "RTL"] },
    { slug: "dcache",     num: "10", part: "메모리",     title: "L1 데이터 캐시와 프리페처",   desc: "L1 DCache의 뱅크와 웨이, 미스 처리 레지스터(MSHR), 그리고 스트라이드·공간 프리페처가 다음 주소를 짐작하는 방법.", tags: ["sim", "RTL"] },
    { slug: "mmu",        num: "11", part: "메모리",     title: "가상 메모리: TLB와 PTW",     desc: "가상 주소를 물리 주소로. L1 TLB, L2 TLB, 페이지 테이블 워커, Sv39/Sv48과 하이퍼바이저의 2단계 변환을 따라간다.", tags: ["sim", "RTL"] },
    { slug: "cache",      num: "12", part: "메모리",     title: "L2·L3 캐시와 일관성",        desc: "CoupledL2와 OpenLLC, TileLink와 CHI. 여러 코어가 같은 데이터를 볼 때 디렉터리와 스누프로 일관성을 지키는 방법.", tags: ["sim", "RTL"] },
    { slug: "system",     num: "13", part: "시스템",     title: "특권 구조와 인터럽트",        desc: "M·S·U 모드와 하이퍼바이저 확장, CSR, 예외와 인터럽트 전달(AIA), 디버그와 트리거. 운영체제가 코어를 다루는 손잡이들.", tags: ["sim", "RTL"] },
    { slug: "perf",       num: "14", part: "시스템",     title: "성능 카운터와 Top-down",     desc: "하드웨어 성능 카운터(HPM)로 사건을 세고, 슬롯을 원인별로 나누는 Top-down 분석으로 병목을 찾는다.", tags: ["sim", "RTL"] },
    { slug: "method",     num: "15", part: "시스템",     title: "검증과 시뮬레이션",          desc: "Chisel에서 Verilog, Verilator emu까지. DiffTest로 NEMU와 한 걸음씩 맞추며 코어가 맞게 도는지 확인하는 방법.", tags: ["sim"] },
    { slug: "glossary",   num: "16", part: "시스템",     title: "용어집 & 종합 퀴즈",          desc: "XiangShan 핵심 용어를 검색하고 종합 퀴즈로 점검한다.", tags: ["퀴즈"] },
  ];

  const MB = (window.MB = {});
  MB.CHAPTERS = CHAPTERS;

  /* ------------------------------------------------------------ 수학 · 포맷 */
  MB.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  MB.lerp = (a, b, t) => a + (b - a) * t;
  MB.pct = (x, d = 1) => (isFinite(x) ? (100 * x).toFixed(d) + "%" : "—");
  MB.fmt = (x, d = 2) => (isFinite(x) ? Number(x.toFixed(d)).toLocaleString("en-US") : "—");
  /** 시드 고정 난수: 같은 실험을 다시 돌려도 같은 결과가 나오게 한다. */
  MB.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  };

  /* ------------------------------------------------------------ 테마 색 */
  const colorCache = {};
  MB.css = function (name) {
    if (colorCache[name]) return colorCache[name];
    const value = getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim();
    colorCache[name] = value || "#888";
    return colorCache[name];
  };
  const themeListeners = [];
  MB.onTheme = (fn) => themeListeners.push(fn);
  function themeChanged() {
    for (const key in colorCache) delete colorCache[key];
    themeListeners.forEach((fn) => fn());
  }
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeChanged);
  /** 색에 투명도를 입힌다. 테마 변수의 #hex 값만 받는다. */
  MB.alpha = function (color, a) {
    if (color.startsWith("#") && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
    return color;
  };

  /* ------------------------------------------------------------ canvas */
  /**
   * 고해상도 canvas. draw(ctx, width, height)는 크기나 테마가 바뀔 때마다 다시 불린다.
   * aspect: 높이/너비 비율, maxHeight: 높이 상한(px).
   */
  MB.canvas = function (selector, options) {
    const canvas = typeof selector === "string" ? document.querySelector(selector) : selector;
    const settings = Object.assign({ aspect: 0.5, maxHeight: 520, minHeight: 160, draw: null }, options || {});
    const context = canvas.getContext("2d");
    const state = { canvas, context, width: 0, height: 0, draw: settings.draw };
    function resize() {
      const width = canvas.parentElement.clientWidth || 600;
      const height = MB.clamp(Math.round(width * settings.aspect), settings.minHeight, settings.maxHeight);
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.height = height + "px";
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      state.width = width; state.height = height;
      state.redraw();
    }
    state.redraw = function () {
      if (!state.draw || !state.width) return;
      context.save();
      context.clearRect(0, 0, state.width, state.height);
      state.draw(context, state.width, state.height);
      context.restore();
    };
    state.resize = resize;
    /** 마우스/터치 좌표를 canvas 좌표로 바꿔 콜백에 넘긴다. */
    state.onPointer = function (type, handler) {
      canvas.addEventListener(type, function (event) {
        const rect = canvas.getBoundingClientRect();
        const point = event.touches ? event.touches[0] : event;
        handler(point.clientX - rect.left, point.clientY - rect.top, event);
      });
    };
    new ResizeObserver(resize).observe(canvas.parentElement);
    MB.onTheme(state.redraw);
    resize();
    return state;
  };

  /** 둥근 사각형 경로 */
  MB.roundRect = function (ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };
  MB.text = function (ctx, string, x, y, options) {
    const o = Object.assign({ size: 12, color: MB.css("text"), align: "left", baseline: "middle", weight: 400, mono: false }, options || {});
    ctx.font = `${o.weight} ${o.size}px ${o.mono ? MB.css("mono") : MB.css("font")}`;
    ctx.fillStyle = o.color;
    ctx.textAlign = o.align;
    ctx.textBaseline = o.baseline;
    ctx.fillText(string, x, y);
  };
  MB.arrow = function (ctx, x1, y1, x2, y2, color, width = 1.5, head = 7) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(angle) * head * 0.6, y2 - Math.sin(angle) * head * 0.6); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - 0.4), y2 - head * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - head * Math.cos(angle + 0.4), y2 - head * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fill();
  };

  /**
   * 꺾은선 그래프. series: [{name, color, data:[y...] 또는 [[x,y]...], dash}]
   * options: {xLabel, yLabel, yMin, yMax, xMin, xMax, yFormat, pad, marks:[{x,label}]}
   */
  MB.lineChart = function (ctx, width, height, series, options) {
    const o = Object.assign({ pad: { l: 52, r: 16, t: 16, b: 34 }, yFormat: (v) => MB.fmt(v, 1), xFormat: (v) => MB.fmt(v, 0) }, options || {});
    const points = series.map((s) => s.data.map((d, i) => (Array.isArray(d) ? d : [i, d])));
    let xMin = o.xMin, xMax = o.xMax, yMin = o.yMin, yMax = o.yMax;
    const all = points.flat();
    if (xMin === undefined) xMin = Math.min(...all.map((p) => p[0]), 0);
    if (xMax === undefined) xMax = Math.max(...all.map((p) => p[0]), 1);
    if (yMin === undefined) yMin = Math.min(...all.map((p) => p[1]));
    if (yMax === undefined) yMax = Math.max(...all.map((p) => p[1]));
    if (yMax === yMin) { yMax += 1; yMin -= 1; }
    const left = o.pad.l, right = width - o.pad.r, top = o.pad.t, bottom = height - o.pad.b;
    const sx = (x) => left + ((x - xMin) / (xMax - xMin || 1)) * (right - left);
    const sy = (y) => bottom - ((y - yMin) / (yMax - yMin)) * (bottom - top);
    ctx.strokeStyle = MB.css("grid"); ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const y = yMin + ((yMax - yMin) * k) / 4;
      ctx.beginPath(); ctx.moveTo(left, sy(y)); ctx.lineTo(right, sy(y)); ctx.stroke();
      MB.text(ctx, o.yFormat(y), left - 6, sy(y), { align: "right", size: 11, color: MB.css("text-faint"), mono: true });
    }
    for (let k = 0; k <= 4; k++) {
      const x = xMin + ((xMax - xMin) * k) / 4;
      MB.text(ctx, o.xFormat(x), sx(x), bottom + 12, { align: "center", size: 11, color: MB.css("text-faint"), mono: true });
    }
    if (o.xLabel) MB.text(ctx, o.xLabel, right, bottom + 26, { align: "right", size: 11.5, color: MB.css("text-dim") });
    if (o.yLabel) MB.text(ctx, o.yLabel, left, top - 6, { align: "left", size: 11.5, color: MB.css("text-dim"), baseline: "bottom" });
    (o.marks || []).forEach((m) => {
      ctx.strokeStyle = MB.css("axis"); ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(sx(m.x), top); ctx.lineTo(sx(m.x), bottom); ctx.stroke(); ctx.setLineDash([]);
      if (m.label) MB.text(ctx, m.label, sx(m.x) + 4, top + 8, { size: 11, color: MB.css("text-dim") });
    });
    series.forEach((s, index) => {
      const list = points[index];
      if (!list.length) return;
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2; ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      list.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(MB.clamp(p[1], yMin, yMax))) : ctx.moveTo(sx(p[0]), sy(MB.clamp(p[1], yMin, yMax)))));
      ctx.stroke(); ctx.setLineDash([]);
    });
    return { sx, sy, left, right, top, bottom };
  };

  /** 가로 막대 그래프. items: [{label, value, color}] */
  MB.barChart = function (ctx, width, height, items, options) {
    const o = Object.assign({ pad: { l: 120, r: 60, t: 10, b: 10 }, format: (v) => MB.fmt(v, 2), min: undefined, max: undefined }, options || {});
    const values = items.map((i) => i.value);
    const min = o.min !== undefined ? o.min : Math.min(0, ...values);
    const max = o.max !== undefined ? o.max : Math.max(0, ...values);
    const left = o.pad.l, right = width - o.pad.r;
    const rowHeight = (height - o.pad.t - o.pad.b) / items.length;
    const sx = (v) => left + ((v - min) / (max - min || 1)) * (right - left);
    ctx.strokeStyle = MB.css("axis"); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx(0), o.pad.t); ctx.lineTo(sx(0), height - o.pad.b); ctx.stroke();
    items.forEach((item, i) => {
      const y = o.pad.t + i * rowHeight;
      const barHeight = Math.min(22, rowHeight * 0.66);
      const x0 = sx(Math.min(0, item.value)), x1 = sx(Math.max(0, item.value));
      ctx.fillStyle = item.color || MB.css("accent");
      MB.roundRect(ctx, x0, y + (rowHeight - barHeight) / 2, Math.max(1, x1 - x0), barHeight, 4); ctx.fill();
      MB.text(ctx, item.label, left - 8, y + rowHeight / 2, { align: "right", size: 12.5, color: MB.css("text") });
      const positive = item.value >= 0;
      MB.text(ctx, o.format(item.value), positive ? x1 + 6 : x0 - 6, y + rowHeight / 2, { align: positive ? "left" : "right", size: 12, mono: true, color: MB.css("text-dim") });
    });
  };

  /* ------------------------------------------------------------ 입력 위젯 */
  /** 세그먼트 버튼 묶음. 누르면 onChange(value)를 부르고, 초기값을 돌려준다. */
  MB.seg = function (selector, onChange) {
    const root = document.querySelector(selector);
    const buttons = Array.from(root.querySelectorAll("button"));
    function select(value) {
      buttons.forEach((b) => b.classList.toggle("on", b.dataset.value === value));
    }
    root.addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button) return;
      select(button.dataset.value);
      onChange(button.dataset.value);
    });
    const initial = (buttons.find((b) => b.classList.contains("on")) || buttons[0]).dataset.value;
    select(initial);
    return { value: initial, set: (v) => { select(v); onChange(v); } };
  };
  /** 슬라이더 + 옆의 <output id="{id}-out"> 표시. format(v)로 표시 문자열을 정한다. */
  MB.range = function (id, onChange, format) {
    const input = document.getElementById(id);
    const output = document.getElementById(id + "-out");
    const show = format || ((v) => v);
    function update() {
      const value = parseFloat(input.value);
      if (output) output.textContent = show(value);
      onChange(value);
    }
    input.addEventListener("input", update);
    if (output) output.textContent = show(parseFloat(input.value));
    return { get value() { return parseFloat(input.value); }, set(v) { input.value = v; update(); }, element: input };
  };
  MB.set = function (id, html, cls) {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = html;
    if (cls !== undefined) element.className = "v " + cls;
  };

  /**
   * 화면에 보일 때만 도는 애니메이션 루프. step(dt초)를 매 프레임 부른다.
   * 반환된 객체의 running 값을 바꿔 일시정지할 수 있다.
   */
  MB.loop = function (element, step) {
    let visible = false, last = 0;
    const handle = { running: true };
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(element);
    function frame(time) {
      const dt = Math.min(0.1, (time - last) / 1000 || 0);
      last = time;
      if (visible && handle.running) step(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return handle;
  };
  /** 재생/정지 토글 버튼 */
  MB.playButton = function (id, handle, labels) {
    const button = document.getElementById(id);
    const text = labels || ["⏸ 멈춤", "▶ 재생"];
    function paint() { button.textContent = handle.running ? text[0] : text[1]; }
    button.addEventListener("click", () => { handle.running = !handle.running; paint(); });
    paint();
    return paint;
  };

  /* ------------------------------------------------------------ 레이아웃 */
  const LOGO = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/></linearGradient></defs><rect x="2" y="2" width="28" height="28" rx="8" fill="url(#lg)"/><rect x="10" y="10" width="12" height="12" rx="2" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M13 6v4M19 6v4M13 22v4M19 22v4M6 13h4M6 19h4M22 13h4M22 19h4" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;

  function root() { return document.body.dataset.root !== undefined ? document.body.dataset.root : "../"; }

  function buildChrome() {
    const base = root();
    const current = document.body.dataset.chapter;
    const bar = document.createElement("header");
    bar.className = "pb-topbar";
    bar.innerHTML =
      `<button class="pb-btn icon" id="pb-menu" aria-label="장 목록">☰</button>` +
      `<a class="pb-logo" href="${base}index.html">${LOGO}<span>XiangShanBook <small>RISC-V 고성능 코어 곤명호 v3 해부</small></span></a>` +
      `<span class="spacer"></span>` +
      `<button class="pb-btn icon" id="pb-theme" aria-label="밝기 전환"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg></button>` +
      `<div class="pb-progress" id="pb-progress"></div>`;
    document.body.prepend(bar);

    const drawer = document.createElement("nav");
    drawer.className = "pb-drawer";
    let list = "", part = null;
    CHAPTERS.forEach((c) => {
      if (c.part !== part) { part = c.part; list += `<li class="part">${part}</li>`; }
      list += `<li><a href="${base}chapters/${c.slug}.html" class="${c.slug === current ? "active" : ""}"><span class="num">${c.num}</span><span>${c.title}</span></a></li>`;
    });
    drawer.innerHTML = `<h4>XiangShanBook</h4><ul class="pb-chlist"><li><a href="${base}index.html"><span class="num">⌂</span><span>처음으로</span></a></li>${list}</ul>`;
    const backdrop = document.createElement("div");
    backdrop.className = "pb-drawer-backdrop";
    document.body.append(drawer, backdrop);
    document.getElementById("pb-menu").onclick = () => document.body.classList.toggle("drawer-open");
    backdrop.onclick = () => document.body.classList.remove("drawer-open");

    document.getElementById("pb-theme").onclick = function () {
      const html = document.documentElement;
      const isDark = html.dataset.theme ? html.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      html.dataset.theme = isDark ? "light" : "dark";
      try { localStorage.setItem("xb-theme", html.dataset.theme); } catch (error) { /* 저장 불가 환경 */ }
      themeChanged();
    };

    const progress = document.getElementById("pb-progress");
    window.addEventListener("scroll", () => {
      const scrollable = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = (scrollable > 0 ? (100 * scrollY) / scrollable : 0) + "%";
    }, { passive: true });

    const main = document.querySelector("main.chapter");
    if (main) {
      const layout = document.createElement("div");
      layout.className = "pb-layout";
      main.parentNode.insertBefore(layout, main);
      layout.appendChild(main);
      const toc = document.createElement("aside");
      toc.className = "pb-toc";
      const sections = Array.from(main.querySelectorAll("section[id] > h2"));
      toc.innerHTML = "<h4>이 장의 차례</h4>" + sections.map((h) => `<a href="#${h.parentNode.id}">${h.textContent}</a>`).join("");
      layout.appendChild(toc);
      const links = Array.from(toc.querySelectorAll("a"));
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + entry.target.id));
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      sections.forEach((h) => spy.observe(h.parentNode));

      const index = CHAPTERS.findIndex((c) => c.slug === current);
      if (index >= 0) {
        const pager = document.createElement("nav");
        pager.className = "pb-pager";
        const previous = CHAPTERS[index - 1], next = CHAPTERS[index + 1];
        pager.innerHTML =
          (previous ? `<a href="${previous.slug}.html"><small>← 이전 장 ${previous.num}</small>${previous.title}</a>` : `<a href="${base}index.html"><small>← 처음으로</small>XiangShanBook</a>`) +
          (next ? `<a class="next" href="${next.slug}.html"><small>다음 장 ${next.num} →</small>${next.title}</a>` : "");
        main.appendChild(pager);
      }
      numberFigures(main);
    }
    const foot = document.createElement("footer");
    foot.className = "pb-foot";
    foot.innerHTML = `XiangShanBook · OpenXiangShan <a href="https://github.com/OpenXiangShan/XiangShan/tree/kunminghu-v3">kunminghu-v3</a> 브랜치(a13efc877, 2026-09-28) 기준 인터랙티브 해설서 · 형식은 <a href="https://socbook.euiyun.com/">SoCBook</a>을 본떴습니다.<br>본문의 코드와 파라미터는 해당 커밋의 소스에서 가져왔습니다. 웹 시뮬레이터는 개념을 보여 주기 위한 축소 모델입니다.`;
    document.body.appendChild(foot);
  }

  /** figure 안의 "그림 N-k." 접두사를 장 번호로 자동 생성한다(직접 적은 경우는 그대로 둔다). */
  function numberFigures(main) {
    const chapter = CHAPTERS.find((c) => c.slug === document.body.dataset.chapter);
    if (!chapter) return;
    let count = 0;
    main.querySelectorAll("figure > figcaption, .sim > figcaption").forEach((caption) => {
      count++;
      if (caption.querySelector("b.fig-n")) return;
      const label = document.createElement("b");
      label.className = "fig-n";
      label.textContent = `그림 ${parseInt(chapter.num, 10)}-${count}. `;
      caption.prepend(label);
    });
  }

  /* ------------------------------------------------------------ 퀴즈 */
  function buildQuiz() {
    document.querySelectorAll(".quiz-q").forEach((question) => {
      const answer = question.dataset.answer;
      question.querySelectorAll("button.opt").forEach((button, index) => {
        button.addEventListener("click", () => {
          if (question.classList.contains("done")) return;
          question.classList.add("done");
          const correct = String(index) === answer;
          button.classList.add(correct ? "right" : "wrong");
          if (!correct) question.querySelectorAll("button.opt")[answer].classList.add("right");
          question.querySelectorAll("button.opt").forEach((b) => (b.disabled = true));
        });
      });
    });
  }

  /* ------------------------------------------------------------ 수식(KaTeX) */
  function loadKatex() {
    if (!document.querySelector(".formula, .math")) return;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
    script.onload = function () {
      const auto = document.createElement("script");
      auto.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js";
      auto.onload = () => window.renderMathInElement(document.body, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }],
        throwOnError: false,
      });
      document.head.appendChild(auto);
    };
    document.head.appendChild(script);
  }

  try {
    const saved = localStorage.getItem("xb-theme");
    if (saved) document.documentElement.dataset.theme = saved;
  } catch (error) { /* 저장 불가 환경 */ }

  document.addEventListener("DOMContentLoaded", function () {
    buildChrome();
    buildQuiz();
    loadKatex();
  });
})();
