/* =========================================================
   BIG OAK REEL: motion homepage behaviour
   Hero sculpture cycles: tree -> growth chart -> social sphere.
   Needs: three.min.js, gsap.min.js, ScrollTrigger.min.js,
          lenis.min.js, tree-points.js (loaded before this file)
   Settings come from window.REEL (set in the page).
   Keys:  D = auto-scroll demo for recording,  Esc = stop.
          Add ?demo to the address to start it after the loader.
   ========================================================= */
(function () {
  const C = Object.assign({
    whatsappNumber: "",            // if set, fills every .js-whatsapp link
    whatsappText: "",
    particleColors: ["#EDE7DA", "#C9A866"],
    introSelector: ".r-nav",       // header elements that fade in after the loader
    loaderOncePerSession: false,   // short loader on repeat visits
    demoSecondsPerScreen: 1.6,
    demoPause: 1.4
  }, window.REEL || {});

  if (C.whatsappNumber) {
    document.querySelectorAll(".js-whatsapp").forEach(a => {
      a.href = "https://wa.me/" + C.whatsappNumber + (C.whatsappText ? "?text=" + encodeURIComponent(C.whatsappText) : "");
    });
  }

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- smooth scroll ---------------- */
  const lenis = new Lenis({ duration: .8, smoothWheel: !reduceMotion, easing: t => 1 - Math.pow(1 - t, 3) });
  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  // in-page anchor links go through the smooth scroller
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id === "#" || id.length < 2) return;
    const target = id === "#top" ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: target === 0 ? 0 : -90, duration: 1.6 });
  });

  /* =========================================================
     PARTICLE SCULPTURE
     One cloud of particles that re-forms into three shapes:
       1. the Big Oak tree
       2. a tilted growth chart: rising bars on a grid floor, with a
          trend line and arrow climbing above them
       3. a glass sphere with social icons (like, comment, play,
          share, @, #) orbiting inside it
     It is always drawn inside a "slot" element on the page
     (.r-hero-slot in the hero, .r-cta-slot in the finale), so it
     follows the layout and never sits on top of text.
     ========================================================= */
  const GL = (() => {
    const canvas = document.getElementById("r-gl");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    const light = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
    const DPR = Math.min(devicePixelRatio || 1, light ? 1.5 : 2);
    renderer.setPixelRatio(DPR);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const bin = atob(window.TREE_POINTS);
    const all = new Uint16Array(bin.length / 2);
    for (let i = 0; i < all.length; i++) all[i] = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
    // phones draw about half the points (every other one keeps the tree's shape even)
    const step = light ? 2 : 1, N = Math.floor(all.length / 2 / step), u16 = new Uint16Array(N * 2);
    for (let i = 0; i < N; i++) { u16[i * 2] = all[i * step * 2]; u16[i * 2 + 1] = all[i * step * 2 + 1]; }

    // a fixed random order, so every shape takes particles from all over the tree
    const order = new Uint32Array(N);
    for (let i = 0; i < N; i++) order[i] = i;
    for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = order[i]; order[i] = order[j]; order[j] = t; }

    const tree = new Float32Array(N * 3), scatter = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      tree[i * 3] = u16[i * 2] / 65535 * 3 - 1.5;
      tree[i * 3 + 1] = u16[i * 2 + 1] / 65535 * 3 - 1.5;
      tree[i * 3 + 2] = (Math.random() - .5) * .1;
      scatter[i * 3] = (Math.random() - .5) * 11;
      scatter[i * 3 + 1] = (Math.random() - .5) * 7;
      scatter[i * 3 + 2] = (Math.random() - .5) * 5;
    }

    /* ---------- growth chart ---------- */
    // kind 0 = floor grid, 1 = bar surface, 2 = trend line, 3 = arrow head
    const gKind = new Uint8Array(N), gA = new Float32Array(N), gB = new Float32Array(N), gC = new Float32Array(N);
    const BARS = 8, FLOOR = -0.92, X0 = -1.05, X1 = 1.05, DEPTH = 0.42;
    const curve = s => -0.62 + 1.5 * (Math.exp(2.3 * s) - 1) / (Math.exp(2.3) - 1) + 0.055 * Math.sin(s * 21) * (1 - s * .6);
    const xAt = s => X0 + (X1 - X0) * s;
    const nGrid = Math.floor(N * .17), nBars = Math.floor(N * .5), nLine = Math.floor(N * .27);
    for (let r = 0; r < N; r++) {
      const i = order[r];
      if (r < nGrid) {
        gKind[i] = 0;
        if (Math.random() < .55) { gA[i] = X0 - .08 + Math.random() * (X1 - X0 + .16); gC[i] = -DEPTH + (Math.floor(Math.random() * 4) / 3) * DEPTH * 2; }
        else { gA[i] = X0 + (Math.floor(Math.random() * 9) / 8) * (X1 - X0); gC[i] = -DEPTH + Math.random() * DEPTH * 2; }
      } else if (r < nGrid + nBars) {
        gKind[i] = 1;
        const b = (r - nGrid) % BARS, w = .085, face = Math.random();
        let lx, lz;
        if (face < .25) { lx = -w; lz = (Math.random() * 2 - 1) * w; }
        else if (face < .5) { lx = w; lz = (Math.random() * 2 - 1) * w; }
        else if (face < .75) { lx = (Math.random() * 2 - 1) * w; lz = -w; }
        else { lx = (Math.random() * 2 - 1) * w; lz = w; }
        gA[i] = b + (lx + w) / (2 * w) * .999;             // bar index + x across the bar
        gB[i] = Math.random() < .12 ? 1 : Math.pow(Math.random(), .8); // height fraction (some on the lid)
        gC[i] = lz;
      } else if (r < nGrid + nBars + nLine) {
        gKind[i] = 2; gA[i] = Math.random(); gB[i] = (Math.random() - .5) * .025; gC[i] = (Math.random() - .5) * .025;
      } else {
        gKind[i] = 3; const u = Math.random(), v = (Math.random() - .5) * (1 - u); gA[i] = u; gB[i] = v;
      }
    }
    const tiltX = .32, tiltY = -.42;
    const cX = Math.cos(tiltX), sX = Math.sin(tiltX), cY = Math.cos(tiltY), sY = Math.sin(tiltY);

    /* ---------- sphere + social icons ---------- */
    const golden = Math.PI * (3 - Math.sqrt(5));
    const nShell = Math.floor(N * .4), nIconPts = N - nShell, ICONS = 6;
    const shell = new Float32Array(N * 3), icon = new Float32Array(N * 3); // icon: u, v, icon index
    const role = new Uint8Array(N); // 0 shell, 1 icon
    // Generic social glyphs drawn on a 24-unit grid, then sampled into points.
    const glyphs = [
      c => { c.fill(new Path2D("M12 20.5 4.2 13A5 5 0 0 1 12 6.6 5 5 0 0 1 19.8 13Z")); },              // like
      c => { c.stroke(new Path2D("M20.5 11.5a8.3 8.3 0 0 1-12.2 7.3L3.5 20.5l1.6-4.5A8.3 8.3 0 1 1 20.5 11.5Z"));
             [8, 12, 16].forEach(x => { c.beginPath(); c.arc(x, 11.5, 1.3, 0, 7); c.fill(); }); },       // comment
      c => { c.stroke(new Path2D("M5 4.5h14a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 17V7A2.5 2.5 0 0 1 5 4.5Z"));
             c.fill(new Path2D("M10 8.5v7l6-3.5Z")); },                                                   // play
      c => { c.stroke(new Path2D("M8 11 16 6.5M8 13l8 4.5"));
             [[6, 12], [18, 5.5], [18, 18.5]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 2.7, 0, 7); c.fill(); }); }, // share
      c => { c.stroke(new Path2D("M16 12a4 4 0 1 1-1.2-2.9M16 8.5V13a2.5 2.5 0 0 0 5 0v-1a9 9 0 1 0-3.5 7.1")); }, // @
      c => { c.stroke(new Path2D("M4.5 9h16M3.5 15h16M10 3.5 8 20.5M16 3.5l-2 17")); }                  // #
    ];
    function sampleGlyph(draw, count) {
      const S = 120, cv = document.createElement("canvas"); cv.width = cv.height = S;
      const c = cv.getContext("2d");
      c.fillStyle = c.strokeStyle = "#fff"; c.lineWidth = 2.1; c.lineCap = c.lineJoin = "round";
      c.scale(S / 24, S / 24); draw(c);
      const d = c.getImageData(0, 0, S, S).data, px = [];
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 110) px.push(x, y);
      const out = new Float32Array(count * 2), n = px.length / 2;
      for (let k = 0; k < count; k++) {
        const j = ((Math.random() * n) | 0) * 2;
        out[k * 2] = (px[j] + Math.random()) / S - .5; out[k * 2 + 1] = .5 - (px[j + 1] + Math.random()) / S;
      }
      return out;
    }
    const perIcon = Math.floor(nIconPts / ICONS), iconPts = glyphs.map(g => sampleGlyph(g, perIcon + ICONS));
    for (let r = 0; r < N; r++) {
      const i = order[r];
      if (r < nShell) {
        role[i] = 0;
        const y = 1 - (r / (nShell - 1)) * 2, rr = Math.sqrt(1 - y * y), th = golden * r;
        shell[i * 3] = Math.cos(th) * rr; shell[i * 3 + 1] = y; shell[i * 3 + 2] = Math.sin(th) * rr;
      } else {
        role[i] = 1;
        const k = r - nShell, ic = Math.min(ICONS - 1, Math.floor(k / perIcon)), j = k - ic * perIcon;
        icon[i * 3] = iconPts[ic][j * 2]; icon[i * 3 + 1] = iconPts[ic][j * 2 + 1]; icon[i * 3 + 2] = ic;
      }
    }

    const pos = new Float32Array(scatter), rnd = new Float32Array(N), speed = new Float32Array(N);
    for (let i = 0; i < N; i++) { rnd[i] = Math.random(); speed[i] = .028 + Math.random() * .045; }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uSize: { value: 22 }, uDpr: { value: DPR }, uOpacity: { value: 0 },
        uA: { value: new THREE.Color(C.particleColors[0]) }, uB: { value: new THREE.Color(C.particleColors[1]) } },
      vertexShader: `attribute float aRand; uniform float uSize; uniform float uDpr; varying float vRand;
        void main(){ vRand=aRand; vec4 mv=modelViewMatrix*vec4(position,1.0);
          gl_PointSize=uSize*uDpr*(0.45+aRand*0.75)/-mv.z; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform float uOpacity; uniform vec3 uA; uniform vec3 uB; varying float vRand;
        void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.05,d);
          vec3 c=mix(uA,uB,step(0.78,vRand)); gl_FragColor=vec4(c,a*uOpacity*(0.55+vRand*0.45)); }`
    });
    const group = new THREE.Group();
    group.add(new THREE.Points(geo, mat)); scene.add(group);

    const S = { shape: "scatter", context: "hero", vis: 0, heroVis: 1, footVis: 0, sway: 0, cycle: null,
      mouse: { x: 9, y: 9, tx: 9, ty: 9 }, layout: { x: 0, y: 0, s: 1 }, visW: 1, visH: 1, first: true };
    const slots = { hero: document.querySelector(".r-hero-slot"), footer: document.querySelector(".r-cta-slot") };

    function resize() {
      renderer.setSize(innerWidth, innerHeight, false);
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      S.visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      S.visW = S.visH * camera.aspect;
      mat.uniforms.uSize.value = (innerHeight / 900) * 22 * (camera.aspect < .8 ? 1.1 : 1) * (light ? 1.25 : 1);
    }
    // fit the shapes (2 units tall, about 2.3 wide) inside a slot's on-screen box
    function slotTarget() {
      const el = slots[S.context];
      if (!el) return { x: 0, y: 0, s: 1 };
      const r = el.getBoundingClientRect();
      const cx = ((r.left + r.width / 2) / innerWidth) * 2 - 1;
      const cy = -(((r.top + r.height / 2) / innerHeight) * 2 - 1);
      const hS = (r.height / innerHeight) * S.visH / 2;
      const wS = (r.width / innerWidth) * S.visW / 2.35;
      return { x: cx * S.visW / 2, y: cy * S.visH / 2, s: Math.max(.05, Math.min(hS, wS)) };
    }
    function setShape(n) { S.shape = n; }
    function stopCycle() { clearTimeout(S.cycle); S.cycle = null; }
    function startCycle() {
      stopCycle();
      if (reduceMotion) { setShape("tree"); return; }
      const seq = ["tree", "graph", "sphere"], hold = { tree: 6500, graph: 5600, sphere: 5600 };
      let i = 0; setShape("tree");
      const next = () => { i = (i + 1) % seq.length; setShape(seq[i]); S.cycle = setTimeout(next, hold[seq[i]]); };
      S.cycle = setTimeout(next, hold.tree);
    }
    function setContext(c) {
      if (S.context === c) return;
      S.context = c;
      if (c === "footer") { stopCycle(); setShape("tree"); } else startCycle();
    }

    addEventListener("pointermove", e => { S.mouse.tx = (e.clientX / innerWidth) * 2 - 1; S.mouse.ty = -(e.clientY / innerHeight) * 2 + 1; });
    document.addEventListener("pointerleave", () => { S.mouse.tx = 9; S.mouse.ty = 9; });

    const barH = new Float32Array(BARS), barTop = new Float32Array(BARS);
    const clock = new THREE.Clock();
    function tick() {
      const dt = Math.min(clock.getDelta(), .1), t = clock.elapsedTime, f60 = dt * 60;
      S.vis += (Math.max(S.heroVis, S.footVis) - S.vis) * Math.min(1, .12 * f60);
      mat.uniforms.uOpacity.value = S.vis;
      if (S.vis < .01) { S.first = true; return; }

      const T = slotTarget(), L = S.layout;
      const le = S.first ? 1 : 1 - Math.pow(1 - .22, f60);
      S.first = false;
      L.x += (T.x - L.x) * le; L.y += (T.y - L.y) * le; L.s += (T.s - L.s) * le;
      group.position.set(L.x, L.y, 0);

      S.mouse.x += (S.mouse.tx - S.mouse.x) * .15; S.mouse.y += (S.mouse.ty - S.mouse.y) * .15;
      const mOn = Math.abs(S.mouse.x) < 2 && !reduceMotion;
      S.sway += ((mOn ? S.mouse.x * .22 : Math.sin(t * .3) * .12) - S.sway) * .04;
      group.rotation.y = S.sway;
      group.rotation.x = mOn ? -S.mouse.y * .08 : 0;

      const mx = S.mouse.x * S.visW / 2 - L.x, my = S.mouse.y * S.visH / 2 - L.y;
      const R = .62 * Math.max(.6, L.s / 1.3), R2 = R * R, sc = L.s, shape = S.shape;

      // per-frame values for the chart and the sphere
      if (shape === "graph") {
        for (let b = 0; b < BARS; b++) {
          const s0 = (b + .5) / BARS, grow = .86 + .14 * Math.sin(t * 1.5 - b * .75);
          barTop[b] = curve(s0) - .16; barH[b] = (barTop[b] - FLOOR) * grow;
        }
      }
      const cs = Math.cos(t * .35), sn = Math.sin(t * .35);
      const flow = (t * .09) % 1, endS = 1, endX = xAt(endS), endY = curve(endS) + .05;
      const dS = .02, dirX = endX - xAt(endS - dS), dirY = endY - (curve(endS - dS) + .05), dl = Math.hypot(dirX, dirY);
      const ax = dirX / dl, ay = dirY / dl;

      for (let i = 0; i < N; i++) {
        const k = i * 3; let tx, ty, tz;
        if (shape === "tree") { tx = tree[k] * sc; ty = tree[k + 1] * sc; tz = tree[k + 2] * sc; }
        else if (shape === "graph") {
          let x, y, z; const kind = gKind[i];
          if (kind === 0) { x = gA[i]; y = FLOOR; z = gC[i]; }
          else if (kind === 1) {
            const b = Math.floor(gA[i]), fx = gA[i] - b, cxb = xAt((b + .5) / BARS);
            x = cxb + (fx * 2 - 1) * .085; y = FLOOR + gB[i] * barH[b]; z = gC[i];
          } else if (kind === 2) {
            const u = (gA[i] + flow) % 1 * .985;
            x = xAt(u) + gB[i]; y = curve(u) + .05 + gC[i] + Math.sin(u * 30 - t * 3) * .008; z = 0;
          } else {
            const u = gA[i] * .16, v = gB[i] * .2;
            x = endX + ax * (.1 - u) - ay * v; y = endY + ay * (.1 - u) + ax * v; z = 0;
          }
          // tilt: look slightly down on the floor and turn the chart a little
          const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
          const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
          tx = (x1 * .8 - .04) * sc; ty = (y2 * .8 + .02) * sc; tz = z2 * .8 * sc;
        } else if (shape === "sphere") {
          if (role[i] === 0) {
            const x = shell[k], z = shell[k + 2], br = (1 + Math.sin(t * 1.6 + shell[k + 1] * 4) * .03) * .98;
            tx = (x * cs - z * sn) * sc * br; ty = shell[k + 1] * sc * br; tz = (x * sn + z * cs) * sc * br;
          } else {
            // icons ride a tilted ring inside the sphere and always face the viewer
            // a tilted orbit: front icons sit low and large, back icons high and small
            const ic = icon[k + 2], th = ic / ICONS * Math.PI * 2 - t * .45;
            const ox = Math.cos(th) * .6, oz = Math.sin(th) * .5, oy = Math.sin(th) * -.4;
            const front = (Math.sin(th) + 1) / 2, sz = .3 + .22 * front;
            tx = (ox + icon[k] * sz) * sc; ty = (oy + icon[k + 1] * sz) * sc; tz = oz * sc;
          }
        } else { tx = scatter[k]; ty = scatter[k + 1]; tz = scatter[k + 2]; }
        const sp = 1 - Math.pow(1 - speed[i], f60);
        pos[k] += (tx - pos[k]) * sp; pos[k + 1] += (ty - pos[k + 1]) * sp; pos[k + 2] += (tz - pos[k + 2]) * sp;
        if (mOn) {
          const dx = pos[k] - mx, dy = pos[k + 1] - my, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 1e-5) { const d = Math.sqrt(d2), f = (1 - d / R) * .16; pos[k] += dx / d * f; pos[k + 1] += dy / d * f; pos[k + 2] += f * .6; }
        }
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    addEventListener("resize", resize); resize();
    gsap.ticker.add(tick);
    return { S, setShape, startCycle, stopCycle, setContext };
  })();
  window.REEL_GL = GL;

  /* ---------------- magnetic buttons ---------------- */
  if (finePointer) {
    document.querySelectorAll(".r-magnetic").forEach(el => {
      const xT = gsap.quickTo(el, "x", { duration: .6, ease: "power3" }), yT = gsap.quickTo(el, "y", { duration: .6, ease: "power3" });
      el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); xT((e.clientX - r.left - r.width / 2) * .35); yT((e.clientY - r.top - r.height / 2) * .45); });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1,.4)" }));
    });
  }
  const ctaBtn = document.querySelector(".r-cta-btn");
  if (ctaBtn) {
    ctaBtn.addEventListener("pointerenter", () => { if (GL.S.context === "footer") GL.setShape("scatter"); });
    ctaBtn.addEventListener("pointerleave", () => { if (GL.S.context === "footer") GL.setShape("tree"); });
  }

  /* ---------------- word splitter ---------------- */
  document.querySelectorAll(".r-split").forEach(el => {
    const txt = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", txt);
    el.innerHTML = txt.split(" ").map(w => `<span class="r-w" aria-hidden="true">${w}</span>`).join(" ");
  });

  /* ---------------- intro ---------------- */
  function intro() {
    let quick = reduceMotion;
    try { if (C.loaderOncePerSession) { quick = quick || sessionStorage.getItem("r-seen") === "1"; sessionStorage.setItem("r-seen", "1"); } } catch (e) {}
    const counter = { v: 0 }, countEl = document.querySelector(".r-loader-count");
    const dur = quick ? .35 : .9;
    const heads = document.querySelectorAll(C.introSelector);
    gsap.set(".r-hero h1 .r-mask > span", { yPercent: 110 });
    if (heads.length) gsap.set(heads, { autoAlpha: 0, y: -16 });

    gsap.timeline()
      .to(counter, { v: 100, duration: dur, ease: "power2.inOut", onUpdate: () => { if (countEl) countEl.textContent = Math.round(counter.v); } })
      .to(".r-loader-bar", { scaleX: 1, duration: dur, ease: "power2.inOut" }, 0)
      .to([".r-loader-count", ".r-loader-mark", ".r-loader-bar"], { autoAlpha: 0, duration: .3 }, ">-.05")
      .add(() => { GL.S.heroVis = 1; GL.startCycle(); }, "<")
      .to(".r-loader-half.top", { yPercent: -100, duration: .8, ease: "expo.inOut" }, "<.05")
      .to(".r-loader-half.bottom", { yPercent: 100, duration: .8, ease: "expo.inOut" }, "<")
      .to(".r-hero h1 .r-mask > span", { yPercent: 0, duration: 1, stagger: .06, ease: "expo.out" }, "<.35")
      .to(".r-hero-reveal", { autoAlpha: 1, duration: .9, ease: "power2.out" }, "<.5")
      .to(heads.length ? heads : {}, { autoAlpha: 1, y: 0, duration: .9, ease: "expo.out", clearProps: "transform" }, "<-.2")
      .add(() => {
        document.body.classList.remove("r-loading");
        const l = document.querySelector(".r-loader"); if (l) l.style.display = "none";
        lenis.start(); ScrollTrigger.refresh();
        if (new URLSearchParams(location.search).has("demo")) setTimeout(() => Demo.start(false), 900);
      });
  }

  /* ---------------- scroll scenes (page order) ---------------- */
  function scenes() {
    ScrollTrigger.create({ trigger: ".r-hero", start: "top top", end: "bottom top", onUpdate: s => { GL.S.heroVis = 1 - s.progress; } });
    gsap.to(".r-hero h1", { yPercent: -18, ease: "none", scrollTrigger: { trigger: ".r-hero", start: "top top", end: "bottom top", scrub: true } });

    const track = document.querySelector(".r-track");
    const dist = () => track.scrollWidth - innerWidth;
    const hTween = gsap.to(track, { x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".r-work", pin: true, scrub: 1, start: "top top", end: () => "+=" + dist(), invalidateOnRefresh: true } });
    document.querySelectorAll(".r-panel").forEach(p => {
      const v = p.querySelector("video");
      gsap.fromTo(v, { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: p, containerAnimation: hTween, start: "left right", end: "right left", scrub: true } });
      gsap.fromTo(p, { clipPath: "inset(0% 0% 0% 100% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "power2.out",
        scrollTrigger: { trigger: p, containerAnimation: hTween, start: "left 95%", end: "left 45%", scrub: true } });
      gsap.from(p.querySelectorAll("h3, figcaption p"), { yPercent: 40, autoAlpha: 0, stagger: .08, ease: "power3.out",
        scrollTrigger: { trigger: p, containerAnimation: hTween, start: "left 60%", end: "left 30%", scrub: true } });
    });

    const portrait = () => innerWidth / innerHeight < .8;
    gsap.timeline({ scrollTrigger: { trigger: ".r-expand", pin: true, scrub: 1, start: "top top", end: "+=170%", invalidateOnRefresh: true } })
      .fromTo(".r-expand-media", { clipPath: () => portrait() ? "inset(34% 18% 34% 18% round 22px)" : "inset(30% 34% 30% 34% round 22px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 })
      .fromTo(".r-expand-media video", { scale: 1.35 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
      .to(".r-expand-words span:first-child", { xPercent: -40, autoAlpha: 0, ease: "power2.in", duration: .6 }, 0)
      .to(".r-expand-words span:last-child", { xPercent: 40, autoAlpha: 0, ease: "power2.in", duration: .6 }, 0)
      .fromTo(".r-expand-copy > *", { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: .12, duration: .4, ease: "power3.out" }, .72)
      .to({}, { duration: .35 });

    document.querySelectorAll(".r-stat").forEach((s, i) => {
      const num = s.querySelector(".r-num"), target = +num.dataset.count, suffix = num.dataset.suffix || "";
      const o = { v: target === 0 ? 24 : 0 };
      const paint = () => { num.innerHTML = Math.round(o.v) + (suffix ? `<sup>${suffix}</sup>` : ""); };
      paint();
      ScrollTrigger.create({ trigger: ".r-stats", start: "top 70%", once: true, onEnter: () => {
        gsap.to(s, { "--draw": 1, duration: 1.4, delay: i * .15, ease: "expo.inOut" });
        gsap.to(o, { v: target, duration: 2, delay: i * .15 + .2, ease: "power3.out", onUpdate: paint });
      } });
    });
    gsap.from(".r-stat p", { autoAlpha: 0, y: 20, stagger: .12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".r-stats", start: "top 65%" } });

    const mTrack = document.querySelector(".r-mtrack");
    if (mTrack) {
      mTrack.appendChild(mTrack.querySelector(".r-mgroup").cloneNode(true)).setAttribute("aria-hidden", "true");
      const loop = gsap.to(mTrack, { xPercent: -50, duration: 26, ease: "none", repeat: -1 });
      ScrollTrigger.create({ trigger: ".r-marquee", start: "top bottom", end: "bottom top", onUpdate: s => {
        const dir = s.direction, boost = Math.min(Math.abs(s.getVelocity()) / 260, 7);
        gsap.to(loop, { timeScale: dir * (1 + boost), duration: .25, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2, ease: "power2.out" }) });
      } });
    }

    ScrollTrigger.create({ trigger: ".r-cta", start: "top bottom", end: "top 15%",
      onUpdate: s => { GL.S.footVis = s.progress; },
      onEnter: () => GL.setContext("footer"),
      onLeaveBack: () => { GL.S.footVis = 0; GL.setContext("hero"); } });
    gsap.from(".r-cta h2, .r-cta .r-pill", { y: 50, autoAlpha: 0, stagger: .12, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".r-cta-inner", start: "top 70%" } });
    gsap.from(".r-bigword span", { yPercent: 105, stagger: .05, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".r-bigword", start: "top 95%" } });

    // grain only over the reel sections
    const firstPlain = document.querySelector("[data-reel-end]");
    if (firstPlain) {
      ScrollTrigger.create({ trigger: firstPlain, start: "top 60%", endTrigger: ".r-cta", end: "top 60%",
        onToggle: s => document.body.classList.toggle("r-past-reel", s.isActive) });
    }
  }

  /* ---------------- demo mode ---------------- */
  const Demo = (() => {
    let running = false, token = 0;
    const wait = s => new Promise(r => setTimeout(r, s * 1000));
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const go = (y, d) => new Promise(r => lenis.scrollTo(y, { duration: d, easing: ease, force: true, lock: true, onComplete: r }));
    function stops() {
      const max = document.documentElement.scrollHeight - innerHeight, ys = [];
      document.querySelectorAll("[data-stop]").forEach(el => {
        const sp = el.parentElement.classList.contains("pin-spacer") ? el.parentElement : el;
        const top = sp.getBoundingClientRect().top + scrollY;
        ys.push(Math.min(top, max));
        if (sp !== el) ys.push(Math.min(top + sp.offsetHeight - innerHeight, max));
      });
      const cta = document.querySelector(".r-cta");
      if (cta) ys.push(Math.min(cta.getBoundingClientRect().top + scrollY + cta.offsetHeight - innerHeight, max));
      return [...new Set(ys.map(Math.round))].sort((a, b) => a - b);
    }
    async function start(fromTop = true) {
      if (running) return stop();
      running = true; const my = ++token;
      document.body.classList.add("r-demo");
      if (fromTop) { lenis.scrollTo(0, { immediate: true, force: true }); await wait(.6); }
      await wait(C.demoPause + 1.2);
      let cur = scrollY;
      for (const y of stops()) {
        if (my !== token) return;
        if (y <= cur + 4) continue;
        await go(y, Math.max(1.8, (y - cur) / innerHeight * C.demoSecondsPerScreen));
        cur = y;
        if (my !== token) return;
        await wait(C.demoPause);
      }
      if (my === token) { GL.setShape("scatter"); await wait(1.6); GL.setShape("tree"); await wait(3); }
      stop();
    }
    function stop() { token++; running = false; document.body.classList.remove("r-demo"); lenis.scrollTo(scrollY, { immediate: true, force: true }); }
    addEventListener("keydown", e => {
      if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "d" || e.key === "D") start(true);
      if (e.key === "Escape" && running) stop();
    });
    return { start, stop };
  })();

  /* ---------------- go ---------------- */
  const vids = document.querySelectorAll(".reel video[data-src]");
  const wake = v => { if (!v.src) { v.src = v.dataset.src; v.preload = "auto"; } };
  if (reduceMotion) { /* posters only */ }
  else if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver(entries => entries.forEach(e => {
      const v = e.target; v.muted = true;
      if (e.isIntersecting) { wake(v); v.play().catch(() => {}); } else if (!v.paused) v.pause();
    }), { rootMargin: "100px 300px" });
    vids.forEach(v => vio.observe(v));
  } else vids.forEach(v => { wake(v); v.muted = true; v.play().catch(() => {}); });
  scenes();
  intro();
  let rT; const refresh = () => { clearTimeout(rT); rT = setTimeout(() => ScrollTrigger.refresh(), 200); };
  addEventListener("load", refresh);
  document.querySelectorAll("img").forEach(img => { if (!img.complete) img.addEventListener("load", refresh, { once: true }); });
})();
