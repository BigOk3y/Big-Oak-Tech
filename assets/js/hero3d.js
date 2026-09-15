/* ==========================================================================
   BIG OAK TECHNOLOGIES — "The Shopfront"  (readable source)
   --------------------------------------------------------------------------
   A small shop standing on the layered podium, orbited by tiles carrying the
   channels a local business actually sells through: social, messaging,
   search, video, web, checkout and AI.

   The two wide base discs turn; the top plate stays still, so the shop has
   something solid to stand on rather than appearing to slide.

   NOTE ON THE TILES. The glyphs are generic category marks, not replicas of
   Instagram, Facebook or any other platform logo — those are trademarks with
   their own brand rules, so they are not reproduced here. To use official
   artwork instead, download it from the platform's brand centre and map it
   onto a tile face as a texture:

     const tex = new THREE.TextureLoader().load('assets/img/icon-x.png');
     tex.colorSpace = THREE.SRGBColorSpace;
     face.material = new THREE.MeshStandardMaterial({ map: tex, transparent: true });

   Palette: petrol slate, Qatar maroon, polished steel.

   This file is the source. The page loads hero3d.bundle.js. After editing:

     npm i three esbuild
     npx esbuild assets/js/hero3d.js --bundle --format=esm --minify \
       --target=es2019 --outfile=assets/js/hero3d.bundle.js

   Guards: pixel ratio capped, shadows desktop-only, rendering paused when
   the hero is off-screen, a single static frame under prefers-reduced-motion,
   and a fallback if WebGL is unavailable.
   ========================================================================== */

import * as THREE from 'three';

const mount = document.getElementById('heroCanvas');
if (mount) init(mount);

function init(mount) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 820px)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !isMobile, alpha: true, powerPreference: 'high-performance'
    });
  } catch (err) { document.body.classList.add('no-webgl'); return; }
  if (!renderer.getContext()) { document.body.classList.add('no-webgl'); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  if (!isMobile) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  mount.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, mount.clientWidth / mount.clientHeight, 0.1, 140);

  const root = new THREE.Group();   // framing offset
  const lean = new THREE.Group();   // pointer lean + scroll
  const rig  = new THREE.Group();   // everything in the scene
  root.add(lean); lean.add(rig); scene.add(root);

  function frame() {
    const w = mount.clientWidth, h = mount.clientHeight;
    const wide = w / h > 1.05;
    camera.aspect = w / h;
    if (wide) {
      camera.position.set(0, 5.8, 20.5);
      root.position.set(w > 1280 ? 4.2 : 3.3, -1.7, 0);
      root.scale.setScalar(0.72);
    } else {
      camera.position.set(0, 6.4, 23.5);
      root.position.set(0, -3.4, 0);
      root.scale.setScalar(0.64);
    }
    camera.lookAt(0, 2.4, 0);
    camera.updateProjectionMatrix();
  }

  /* ---- materials -------------------------------------------------------- */
  const mat = {
    maroon:  new THREE.MeshStandardMaterial({ color: '#A6244B', roughness: 0.24, metalness: 0.45 }),
    maroonD: new THREE.MeshStandardMaterial({ color: '#6B0F2B', roughness: 0.38, metalness: 0.40 }),
    steel:   new THREE.MeshStandardMaterial({ color: '#A9BFBD', roughness: 0.18, metalness: 0.95 }),
    steelL:  new THREE.MeshStandardMaterial({ color: '#D6E5E2', roughness: 0.22, metalness: 0.85 }),
    slate:   new THREE.MeshStandardMaterial({ color: '#3E5C63', roughness: 0.34, metalness: 0.45 }),
    slateD:  new THREE.MeshStandardMaterial({ color: '#294248', roughness: 0.42, metalness: 0.38 }),
    stone:   new THREE.MeshStandardMaterial({ color: '#8FA3A3', roughness: 0.34, metalness: 0.45 }),
    wall:    new THREE.MeshStandardMaterial({ color: '#C6D4D1', roughness: 0.45, metalness: 0.2  }),
    chalk:   new THREE.MeshStandardMaterial({ color: '#EFF4F1', roughness: 0.38, metalness: 0.18 }),
    glass:   new THREE.MeshStandardMaterial({
      color: '#CFE2DF', roughness: 0.06, metalness: 0.55, transparent: true, opacity: 0.8 })
  };

  const cast = (m) => { if (!isMobile) { m.castShadow = true; m.receiveShadow = true; } return m; };
  const box  = (w, h, d, m) => cast(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m));
  const cyl  = (rt, rb, h, seg, m) => cast(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m));
  const ring = (r, t, m) => cast(new THREE.Mesh(new THREE.TorusGeometry(r, t, 10, 30), m));
  const ball = (r, m) => cast(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m));

  /* ---- podium ----------------------------------------------------------- */
  const baseSpin = new THREE.Group();   // the discs that turn
  const deck     = new THREE.Group();   // the plate the shop sits on
  rig.add(baseSpin, deck);

  const discA = cyl(5.5, 5.5, 0.42, 72, mat.slate);  discA.position.y = -0.21;
  const discB = cyl(5.0, 5.0, 0.30, 72, mat.steel);  discB.position.y = 0.15;
  baseSpin.add(discA, discB);

  const plate = cyl(4.5, 4.5, 0.55, 72, mat.slateD); plate.position.y = 0.575;
  const inlay = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.05, 12, 80), mat.steelL);
  inlay.rotation.x = -Math.PI / 2; inlay.position.y = 0.855;
  deck.add(plate, inlay);

  const DECK = 0.85;

  /* ---- the shop ---------------------------------------------------------- */
  const shop = new THREE.Group();
  const W = 3.6, D = 2.6, G = 2.0, U = 1.7;
  const F = D / 2;                        // front face plane

  /* Object3D.position is read-only, so set .y rather than replacing it. */
  const shell = box(W, G, D, mat.wall);                     shell.position.y = G / 2;
  const band  = box(W + 0.14, 0.22, D + 0.14, mat.slateD);  band.position.y  = G + 0.11;
  const upper = box(W - 0.3, U, D - 0.24, mat.wall);        upper.position.y = G + 0.22 + U / 2;
  const roof  = box(W - 0.1, 0.2, D - 0.04, mat.slateD);    roof.position.y  = G + 0.22 + U + 0.1;
  shop.add(shell, band, upper, roof);

  // door
  const door = box(0.8, 1.4, 0.1, mat.maroon);
  door.position.set(0, 0.7, F);
  const handle = cyl(0.03, 0.03, 0.18, 10, mat.steelL);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.28, 0.74, F + 0.06);
  shop.add(door, handle);

  // shop windows either side
  [-1.16, 1.16].forEach((x) => {
    const fr = box(1.3, 1.4, 0.09, mat.slateD);  fr.position.set(x, 0.88, F - 0.02);
    const pn = box(1.12, 1.2, 0.06, mat.glass);  pn.position.set(x, 0.88, F + 0.04);
    shop.add(fr, pn);
  });

  // striped awning
  const awning = new THREE.Group();
  const N = 9, SW = W / N;
  for (let i = 0; i < N; i++) {
    const st = box(SW, 0.08, 1.05, i % 2 ? mat.chalk : mat.maroon);
    st.position.x = -W / 2 + SW / 2 + i * SW;
    awning.add(st);
  }
  awning.rotation.x = -0.44;
  awning.position.set(0, G - 0.3, F + 0.46);
  shop.add(awning);

  // sign board
  const sign = box(2.6, 0.5, 0.14, mat.slateD);      sign.position.set(0, G + 0.14, F + 0.02);
  const face = box(2.3, 0.32, 0.06, mat.steelL);     face.position.set(0, G + 0.14, F + 0.1);
  shop.add(sign, face);

  // upper windows
  [-0.95, 0, 0.95].forEach((x) => {
    const fr = box(0.64, 0.84, 0.09, mat.slateD);
    fr.position.set(x, G + 0.22 + U / 2, D / 2 - 0.14);
    const pn = box(0.5, 0.68, 0.06, mat.glass);
    pn.position.set(x, G + 0.22 + U / 2, D / 2 - 0.09);
    shop.add(fr, pn);
  });

  // step + planters
  const step = box(1.6, 0.14, 0.55, mat.stone);
  step.position.set(0, 0.07, F + 0.3);
  shop.add(step);
  [-1.55, 1.55].forEach((x) => {
    const pot = cyl(0.17, 0.21, 0.3, 16, mat.maroonD); pot.position.set(x, 0.15, F + 0.28);
    const bush = cast(new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), mat.slate));
    bush.position.set(x, 0.46, F + 0.28);
    shop.add(pot, bush);
  });

  shop.position.y = DECK;
  deck.add(shop);

  /* ---- orbiting channel tiles -------------------------------------------- */
  function starShape(outer, inner, points) {
    const sh = new THREE.Shape();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? inner : outer;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? sh.lineTo(x, y) : sh.moveTo(x, y);
    }
    sh.closePath();
    return sh;
  }
  const flat = (shape, m) => cast(new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 10 }), m));

  const GLYPH = {
    ai(m) {                                   // spark — AI content
      const g = new THREE.Group();
      g.add(flat(starShape(0.23, 0.065, 4), m));
      const s = flat(starShape(0.09, 0.026, 4), m);
      s.position.set(0.21, 0.19, 0);
      g.add(s);
      return g;
    },
    social(m) {                               // lens in a frame — social feed
      const g = new THREE.Group();
      const fr = box(0.42, 0.42, 0.05, m);
      g.add(fr, ring(0.12, 0.03, m));
      const dot = ball(0.035, m);
      dot.position.set(0.14, 0.14, 0.03);
      g.add(dot);
      return g;
    },
    chat(m) {                                 // bubble — messaging
      const g = new THREE.Group();
      g.add(box(0.42, 0.3, 0.05, m));
      const tail = cyl(0.001, 0.09, 0.17, 3, m);
      tail.rotation.set(0, 0, Math.PI);
      tail.position.set(-0.09, -0.22, 0);
      g.add(tail);
      return g;
    },
    search(m) {                               // magnifier — SEO
      const g = new THREE.Group();
      g.add(ring(0.15, 0.035, m));
      const h = cyl(0.033, 0.033, 0.19, 10, m);
      h.rotation.z = -Math.PI / 4;
      h.position.set(0.16, -0.16, 0);
      g.add(h);
      return g;
    },
    video(m) {                                // play triangle — video
      const t = cyl(0.19, 0.19, 0.05, 3, m);
      t.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
      return t;
    },
    web(m) {                                  // globe — website
      const g = new THREE.Group();
      g.add(ball(0.16, mat.slateD), ring(0.17, 0.022, m));
      const r2 = ring(0.17, 0.022, m);
      r2.rotation.y = Math.PI / 2; r2.scale.x = 0.42;
      g.add(r2);
      const r3 = ring(0.17, 0.02, m);
      r3.rotation.x = Math.PI / 2; r3.scale.z = 0.02;
      g.add(r3);
      return g;
    },
    cart(m) {                                 // trolley — online checkout
      const g = new THREE.Group();
      const b = box(0.34, 0.23, 0.05, m); b.position.y = 0.05;
      const w1 = ring(0.05, 0.022, m);      w1.position.set(-0.1, -0.16, 0);
      const w2 = ring(0.05, 0.022, m);      w2.position.set(0.1, -0.16, 0);
      const hd = cyl(0.022, 0.022, 0.17, 8, m);
      hd.rotation.z = -0.55; hd.position.set(-0.24, 0.21, 0);
      g.add(b, w1, w2, hd);
      return g;
    }
  };

  const CHANNELS = ['ai', 'social', 'chat', 'search', 'video', 'web', 'cart'];

  const orbit = new THREE.Group();
  deck.add(orbit);
  const tiles = [];

  CHANNELS.forEach((name, i) => {
    const a = (i / CHANNELS.length) * Math.PI * 2;
    const light = i % 2 === 0;
    const tile = new THREE.Group();

    const disc = cyl(0.62, 0.62, 0.14, 36, light ? mat.steelL : mat.stone);
    disc.rotation.x = Math.PI / 2;            // disc faces the viewer
    tile.add(disc);

    const g = GLYPH[name](light ? mat.maroon : mat.slateD);
    g.position.z = 0.08;
    tile.add(g);

    const radius = 4.2 + (i % 3) * 0.36;
    tile.userData = { angle: a, radius, y: 5.0 + (i % 4) * 0.62, phase: i * 0.9, delay: 0.55 + i * 0.1 };
    orbit.add(tile);
    tiles.push(tile);
  });

  frame();

  /* ---- ground + light ---------------------------------------------------- */
  if (!isMobile) {
    const gnd = new THREE.Mesh(new THREE.CircleGeometry(18, 60), new THREE.ShadowMaterial({ opacity: 0.4 }));
    gnd.rotation.x = -Math.PI / 2; gnd.position.y = -0.45; gnd.receiveShadow = true;
    rig.add(gnd);
  }

  scene.add(new THREE.HemisphereLight('#F1F4F0', '#16262A', 1.1));

  const key = new THREE.DirectionalLight('#F7FBF9', 3.2);
  key.position.set(6.5, 13, 8);
  if (!isMobile) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;   key.shadow.camera.far = 44;
    key.shadow.camera.left = -13; key.shadow.camera.right = 13;
    key.shadow.camera.top = 13;   key.shadow.camera.bottom = -13;
    key.shadow.bias = -0.0015;    key.shadow.normalBias = 0.02;
  }
  scene.add(key);

  const rim = new THREE.PointLight('#8A1538', 90, 34, 2);
  rim.position.set(-8, 5.5, -6); scene.add(rim);

  const cool = new THREE.PointLight('#C4D6D3', 70, 30, 2);
  cool.position.set(6, 3.2, 8); scene.add(cool);

  const fill = new THREE.DirectionalLight('#F1F4F0', 0.9);
  fill.position.set(-3, 4, 12); scene.add(fill);

  /* ---- interaction -------------------------------------------------------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  let scrollRatio = 0;
  const onScroll = () => {
    scrollRatio = Math.min(Math.max(window.scrollY / (mount.clientHeight || 1), 0), 1);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(mount);
  }
  new ResizeObserver(() => {
    if (!mount.clientWidth || !mount.clientHeight) return;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    frame();
  }).observe(mount);

  /* ---- loop --------------------------------------------------------------- */
  const clock = new THREE.Clock();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function place(tile, t, scale) {
    const d = tile.userData;
    const a = d.angle + t * 0.16;
    tile.position.set(Math.cos(a) * d.radius, d.y + Math.sin(t * 0.6 + d.phase) * 0.26, Math.sin(a) * d.radius);
    tile.rotation.y = 0;                       // glyphs stay square to the viewer
    tile.scale.setScalar(scale);
  }

  if (reduceMotion) {
    shop.scale.setScalar(1);
    tiles.forEach(tile => place(tile, 0, 1));
    renderer.render(scene, camera);
    mount.classList.add('is-ready');
    return;
  }

  shop.scale.setScalar(0.001);
  tiles.forEach(tile => tile.scale.setScalar(0.001));

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();

    // podium settles, the shop rises, then the tiles arrive one by one
    const s = 0.6 + easeOut(Math.min(t / 0.7, 1)) * 0.4;
    baseSpin.scale.setScalar(s); deck.scale.setScalar(s);
    shop.scale.setScalar(Math.max(easeOut(Math.min(Math.max((t - 0.35) / 0.9, 0), 1)), 0.001));

    tiles.forEach((tile) => {
      const e = easeOut(Math.min(Math.max((t - tile.userData.delay) / 0.8, 0), 1));
      place(tile, t, Math.max(e, 0.001));
    });

    baseSpin.rotation.y += 0.0042;             // the discs keep turning
    inlay.rotation.z -= 0.0016;

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;
    lean.rotation.z = pointer.x * 0.045;
    lean.rotation.x = pointer.y * 0.07 + Math.sin(t * 0.35) * 0.01;

    lean.position.y = -scrollRatio * 2.8;
    lean.rotation.x += scrollRatio * 0.3;

    renderer.render(scene, camera);
    if (t > 0.35) mount.classList.add('is-ready');
  }
  tick();
}
