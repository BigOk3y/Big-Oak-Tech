/* =========================================================
   BIG OAK REEL: motion homepage behaviour
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
  const lenis = new Lenis({ duration: 1.25, smoothWheel: !reduceMotion, easing: t => 1 - Math.pow(1 - t, 3.2) });
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
     PARTICLE OAK
     The oak is always drawn inside a "slot" element on the page
     (.r-hero-slot in the hero, .r-cta-slot in the finale), so it
     follows the layout and never sits on top of text.
     ========================================================= */
  const GL = (() => {
    const canvas = document.getElementById("r-gl");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    const DPR = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const bin = atob(window.TREE_POINTS);
    const u16 = new Uint16Array(bin.length / 2);
    for (let i = 0; i < u16.length; i++) u16[i] = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
    const N = u16.length / 2;

    const tree = new Float32Array(N * 3), sphere = new Float32Array(N * 3), scatter = new Float32Array(N * 3), grid = new Float32Array(N * 2);
    const golden = Math.PI * (3 - Math.sqrt(5)), cols = 110, rows = Math.ceil(N / cols);
    for (let i = 0; i < N; i++) {
      tree[i * 3] = u16[i * 2] / 65535 * 3 - 1.5;
      tree[i * 3 + 1] = u16[i * 2 + 1] / 65535 * 3 - 1.5;
      tree[i * 3 + 2] = (Math.random() - .5) * .1;
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      sphere[i * 3] = Math.cos(th) * r; sphere[i * 3 + 1] = y; sphere[i * 3 + 2] = Math.sin(th) * r;
      scatter[i * 3] = (Math.random() - .5) * 11;
      scatter[i * 3 + 1] = (Math.random() - .5) * 7;
      scatter[i * 3 + 2] = (Math.random() - .5) * 5;
      grid[i * 2] = ((i % cols) / (cols - 1)) * 2 - 1;
      grid[i * 2 + 1] = (Math.floor(i / cols) / (rows - 1)) * 2 - 1;
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
      mat.uniforms.uSize.value = (innerHeight / 900) * 22 * (camera.aspect < .8 ? 1.1 : 1);
    }
    // fit the tree (2 units tall, about 2.3 wide) inside a slot's on-screen box
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
      const order = ["tree", "sphere", "wave"], hold = { tree: 6500, sphere: 4200, wave: 4500 };
      let i = 0; setShape("tree");
      const next = () => { i = (i + 1) % order.length; setShape(order[i]); S.cycle = setTimeout(next, hold[order[i]]); };
      S.cycle = setTimeout(next, hold.tree);
    }
    function setContext(c) {
      if (S.context === c) return;
      S.context = c;
      if (c === "footer") { stopCycle(); setShape("tree"); } else startCycle();
    }

    addEventListener("pointermove", e => { S.mouse.tx = (e.clientX / innerWidth) * 2 - 1; S.mouse.ty = -(e.clientY / innerHeight) * 2 + 1; });
    document.addEventListener("pointerleave", () => { S.mouse.tx = 9; S.mouse.ty = 9; });

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
      const cs = Math.cos(t * .35), sn = Math.sin(t * .35);
      for (let i = 0; i < N; i++) {
        const k = i * 3; let tx, ty, tz;
        if (shape === "tree") { tx = tree[k] * sc; ty = tree[k + 1] * sc; tz = tree[k + 2] * sc; }
        else if (shape === "sphere") {
          const x = sphere[k], z = sphere[k + 2], br = (1 + Math.sin(t * 1.6 + sphere[k + 1] * 4) * .04) * .95;
          tx = (x * cs - z * sn) * sc * br; ty = sphere[k + 1] * sc * br; tz = (x * sn + z * cs) * sc * br;
        } else if (shape === "wave") {
          const gx = grid[i * 2], gz = grid[i * 2 + 1];
          tx = gx * 1.15 * sc; const zz0 = gz * .9 * sc;
          const yy = (Math.sin(gx * 3.2 + t * 1.4) * .22 + Math.cos(gz * 4 + t * 1.1) * .16) * sc;
          ty = yy * .8 - zz0 * .45; tz = yy * .45 + zz0 * .8;
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

  /* ---------------- cursor + magnetic buttons ---------------- */
  if (finePointer) {
    const dot = document.querySelector(".r-cursor"), ring = document.querySelector(".r-ring");
    if (dot && ring) {
      const dx = gsap.quickTo(dot, "x", { duration: .08 }), dy = gsap.quickTo(dot, "y", { duration: .08 });
      const rx = gsap.quickTo(ring, "x", { duration: .45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: .45, ease: "power3" });
      addEventListener("pointermove", e => { document.body.classList.add("r-cursor-on"); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
      document.addEventListener("pointerover", e => { if (e.target.closest && e.target.closest("a, button, [data-hover], .r-panel, input, select")) document.body.classList.add("r-hovering"); });
      document.addEventListener("pointerout", e => { if (e.target.closest && e.target.closest("a, button, [data-hover], .r-panel, input, select")) document.body.classList.remove("r-hovering"); });
    }
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
    const dur = quick ? .45 : 2.3;
    const heads = document.querySelectorAll(C.introSelector);
    gsap.set(".r-hero h1 .r-mask > span", { yPercent: 110 });
    if (heads.length) gsap.set(heads, { autoAlpha: 0, y: -16 });

    gsap.timeline()
      .to(counter, { v: 100, duration: dur, ease: "power2.inOut", onUpdate: () => { if (countEl) countEl.textContent = Math.round(counter.v); } })
      .to(".r-loader-bar", { scaleX: 1, duration: dur, ease: "power2.inOut" }, 0)
      .to([".r-loader-count", ".r-loader-mark", ".r-loader-bar"], { autoAlpha: 0, duration: .3 }, ">-.05")
      .add(() => { GL.S.heroVis = 1; GL.startCycle(); }, "<")
      .to(".r-loader-half.top", { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "<.1")
      .to(".r-loader-half.bottom", { yPercent: 100, duration: 1.2, ease: "expo.inOut" }, "<")
      .to(".r-hero h1 .r-mask > span", { yPercent: 0, duration: 1.2, stagger: .08, ease: "expo.out" }, "<.55")
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

    gsap.to(".r-statement .r-w", { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: ".r-statement .r-big", start: "top 78%", end: "bottom 42%", scrub: .6 } });

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
  document.querySelectorAll(".reel video").forEach(v => { v.muted = true; v.play().catch(() => {}); });
  scenes();
  intro();
  let rT; const refresh = () => { clearTimeout(rT); rT = setTimeout(() => ScrollTrigger.refresh(), 200); };
  addEventListener("load", refresh);
  document.querySelectorAll("img").forEach(img => { if (!img.complete) img.addEventListener("load", refresh, { once: true }); });
})();
