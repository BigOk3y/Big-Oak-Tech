# Big Oak Technologies — redesigned site

Static HTML, CSS and vanilla JavaScript. No build step, no framework, no
third-party requests. Upload the folder and it runs.

**One requirement:** serve it over HTTP(S), not by double-clicking the files.
The hero sculpture loads as an ES module, and browsers block modules on
`file://`. Any host works — Netlify, Cloudflare Pages, cPanel, nginx. To
preview locally: `python3 -m http.server` in this folder, then open
`http://localhost:8000`.

---

## What changed

**Copy is untouched.** Every headline, paragraph, label, button, form option,
meta description and structured-data block is carried over word for word. The
calculator's maths and benchmark rates are unchanged too. What changed is the
design, the structure, and the performance.

### The drag, and what caused it

Measured, not guessed:

| Cause | Before | After |
|---|---|---|
| Live cross-origin iframes | 9, all loading at once, each laid out at 16x its box | 0 on load; one at a time, only when in view |
| `process-image.jpg` | 2.79 MB, 3648x5472 | 167 KB + a 94 KB WebP |
| `logo-white.png` | 161 KB at 1477px, shown 30px tall | 36 KB at 440px |
| `logo-black.png` | 243 KB | 45 KB |
| `favicon.png` | 205 KB at 640x640 | 6 KB |
| Total image weight | 3.79 MB | 457 KB (**88% smaller**) |

The iframes were the main problem. Each preview was sized `400% x 400%` and
then scaled to `0.25`, so every one laid out at sixteen times its own box while
downloading a whole third-party website — its fonts, its scripts, everything —
and all nine fired on page load.

Now each preview starts as a cheap drawn facade that costs nothing. The real
iframe mounts only when the card is near the viewport, only one at a time, and
at a fixed 1280x800 desktop viewport scaled to fit — a constant cost instead of
one that grows with the card. On mobile, or when Data Saver is on, previews
wait for an explicit tap on **Load live preview**, which is always available.

### Also removed

- **Google Fonts.** Fonts are self-hosted woff2 in `assets/fonts/` (216 KB).
  No external stylesheet blocking the render, nothing to break if Google is
  slow or blocked in a visitor's network.
- **The Three.js CDN.** Bundled and minified into `assets/js/hero3d.bundle.js`
  (126 KB gzipped) and loaded only on the home page.

The site now makes **zero third-party requests**.

---

## The design

Deep petrol slate as the dominant surface, with Qatar's national maroon
(`#8A1538`) as the accent and a pale polished steel (`#8FA9A9`) as the second — a colour that means something in the market you actually serve.
Rokkitt, a squared slab serif that reads as carved timber and trade signage,
over Instrument Sans. JetBrains Mono appears only where digits genuinely need
to align: the calculator readout and the preview address bars.

The old site leaned on violet ring-glows over near-black in every hero, which
is close to the house style of most AI product pages. That was the first thing
to go. There is no glassmorphism, no particle field, no mesh gradient, no bento
grid, and no glowing orb anywhere in this build.

### The hero sculpture

A small shop on a layered circular podium, orbited by tiles carrying the
channels a local business sells through: AI content, social, messaging,
search, video, web and checkout. The two wide base discs turn continuously;
the top plate stays still, so the shop has something solid to stand on rather
than appearing to slide. The podium settles first, the shop rises out of it,
then the tiles arrive one at a time and ring the roofline. The whole piece
leans toward the cursor and sinks as you scroll past.

**On the tile glyphs.** These are generic category marks, not replicas of the
Instagram, Facebook or other platform logos. Those are registered trademarks
with their own brand rules, and modelling them here would be reproducing
someone else's IP. If you want the official artwork, download it from each
platform's brand centre and map it onto a tile face as a texture — the code
comment at the top of `assets/js/hero3d.js` shows exactly how.

Guards are built in: pixel ratio capped, shadows desktop-only, tower count
reduced on mobile, rendering paused entirely when the hero leaves the viewport,
a single static frame under `prefers-reduced-motion`, and a graceful fall-back
if WebGL is unavailable.

The readable source is `assets/js/hero3d.js`; the page loads the bundled
`hero3d.bundle.js`. Rebuild instructions are in the comment at the top of the
source file. The values worth touching are the ring count, the `OUTER` radius,
and the material colours. Tower count and placement are set by the `layout`
array; brightness by `toneMappingExposure` and the light intensities.

### Each page has its own structure

They share one system — tokens, floating nav, footer — but no two pages are
laid out the same way.

| Page | Structure |
|---|---|
| **Home** | Full-bleed sculpture behind left-aligned type; services as a ledger of ruled rows, not a card grid; a horizontal scroll-snap filmstrip for portfolio |
| **Portfolio** | A sticky project index beside plates that alternate left and right, so the page never settles into a grid |
| **Calculator** | A machined control panel beside a sticky instrument readout, with a live comparison gauge driven by your numbers |
| **Academy** | A prospectus: narrow rail beside an expandable syllabus |
| **Blog** | A shelf — coloured spines, wide rows, filter as a segmented control |
| **Post** | A reading room: 68ch measure, drop cap, full-panel pull quotes, reading-progress rule |

### Navigation

The nav collapses below 1080px to the logo, the **Schedule a Call** button, and
a hamburger — the call-to-action stays reachable at every width, including on
the floating nav. The hamburger is three bars of stepped width with a pale steel
middle rule that square up on hover.

Labels no longer carry the small rule mark that used to sit before them; the
eyebrow text now stands on its own. The same mark was removed from the four
capability labels along the base of the hero, since it was the same device.

### Motion

Deliberately restrained. The old build faded and slid every section up on
scroll; that is gone. Motion is now only ever the sculpture, one orchestrated
hero entrance, or a direct response to something the visitor did — opening a
syllabus entry, submitting the calculator, loading a preview. The `.reveal`
class still exists so nothing breaks, but it is inert.

---

## Files

```
index.html  portfolio.html  calculator.html  academy.html
blog/index.html  blog/posts-data.js  blog/posts/*.html
assets/css/style.css      one stylesheet, sectioned and commented
assets/js/main.js         nav, menu, forms, preview loader, accordion
assets/js/calculator.js   unchanged maths, plus the gauge
assets/js/hero3d.bundle.js  sculpture + Three.js (home page only)
assets/fonts/  assets/img/  robots.txt  sitemap.xml
```

## Publishing a blog post

Unchanged from before:

1. Duplicate `blog/posts/_template.html`, rename it, write the post.
2. Add one entry to the `POSTS` array in `blog/posts-data.js` (newest first).
3. It appears on `blog/index.html` automatically.

## Swapping in your own photography

Two image slots use crops of your existing studio photograph, so the zip is
self-contained: `assets/img/photo-presence.jpg` (Oak Presence, home) and
`assets/img/photo-academy.jpg` (Academy rail).

Replace either file with your own photo at the same aspect ratio and it will
pick up the house treatment automatically — every photo sits inside a `.duo`
wrapper that desaturates it slightly and lays a light maroon wash over the top, so any
image reads as part of the brand rather than as a stock plate. Adjust the
strength in the `DUOTONE` section of `style.css`; `.duo--quiet` is a lighter
variant if a particular photo needs it.

## Two things worth knowing

**Framing refusals.** Some sites send `X-Frame-Options: DENY` and cannot be
embedded by anyone. If a preview stays blank, that is the target site's policy,
not a bug here — the loader waits 12 seconds and then moves on so one stubborn
site never blocks the rest. Those cards still link out correctly.

**"AI" in the copy.** You asked for nothing that reads as an AI website, which
this build follows visually. The word itself still appears in several places —
"Oak Presence (AI)", "AI-Generated Video & Images", "AI Automation", "AI Prompt
Engineering" — because copy was frozen. Say the word if you want those revised.

## Checked before handoff

Calculator maths verified against the original (4,000 visits at QR 350 → QR
453,600/yr gap, using the unchanged 1.8% and 4.5% benchmarks); currency
relabelling without resubmit; WhatsApp handoff carrying the figures; mobile menu
open and Escape-to-close; floating nav appearing only past the hero; syllabus
accordion; blog category filter; at most one preview mounted on load; no broken
internal links across all pages; keyboard focus visible throughout; and
`prefers-reduced-motion` honoured.
