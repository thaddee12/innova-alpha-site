# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

INNOVA ALPHA's marketing site — a static, no-build HTML/CSS/JS site for a digital agency in Yaoundé, Cameroon. Deployed via GitHub Pages (`.nojekyll` disables Jekyll processing so the raw HTML is served as-is).

There is no package.json, no bundler, no framework, and no test suite. There is nothing to install, build, lint, or run — open the `.html` files directly in a browser, or serve the directory with any static file server (e.g. `python3 -m http.server`) to test relative links/fonts correctly. Editing is done directly on the `.html`/`.css`/`.js` files.

## Site structure

Each page is a **fully self-contained HTML file** — there is no templating engine, no includes, no shared header/footer component. Nav, mobile menu, preloader, and the inline logo `<svg><symbol id="ia-logo">` are copy-pasted into every page. **Any change to shared chrome (nav links, logo markup, preloader, mobile menu) must be manually repeated across every HTML file**, or pages will drift out of sync (this has been a recurring source of bugs — see commit history: "Audit complet toutes pages", "Compat v1 pages").

Pages and their EN counterparts (bilingual via **duplicate full pages**, not JS-driven i18n or query params):

| FR | EN | Purpose |
|---|---|---|
| `index.html` | `index-en.html` | Home |
| `devis.html` | `quote.html` | Quote request form |
| `services.html`, `pourquoi-nous.html`, `processus.html`, `realisations.html` | *(no EN version yet)* | Services, Why us, Process, Portfolio |

The FR/EN language switcher in the nav (`.lang-switch`) is just an `<a href>` between the matching pair of static files — adding a new translated page means duplicating the FR page, translating the copy, and rewiring the `lang-switch` links on both sides.

`index.html`/`index-en.html` are the "v2" design (canvas particle hero, custom cursor, full GSAP treatment). `devis.html`/`quote.html` and the other secondary pages are an older "v1" layout retrofitted with v2 interactions/classes — check for stray page-scoped `<style>` blocks before assuming `styles.css` is the only source of a page's look.

## Key files

- **`styles.css`** — single global stylesheet for all pages. Design tokens are CSS custom properties defined under `:root, [data-theme="dark"]` and overridden under `[data-theme="light"]` (brand violet `#5B2DE8`, near-black `#05050A`/`#0C0C18`). Always reuse existing tokens (`--bg`, `--text`, `--text-2`, `--border`, `--violet`, `--ease`, `--container`, `--gutter`, `--radius`, etc.) rather than hardcoding colors/spacing.
  - **Known inconsistency**: `devis.html` and `quote.html` reference `--text-muted`, `--line`, `--line-strong` in their inline `<style>` blocks — these tokens are *not* defined anywhere in `styles.css` (which uses `--text-2`/`--border`/`--border-strong` instead). Treat this as a bug to fix opportunistically, not a second valid token set to extend.
- **`script.js`** — single IIFE shared by every page, gated internally by `if (!el) return` checks so the same file safely no-ops features whose DOM elements aren't present on a given page (e.g. `initSpiderWeb()` only runs if `#heroCanvas` exists). When adding a new interactive behavior, follow this pattern: add an `init*()` function, guard it on the presence of its target element(s), and register it in the `initAll()` call list.
  - Theme (`data-theme` on `<html>`) is read from `localStorage["ia-theme"]` and applied at the very top of the file, before `initAll()`, specifically to avoid a flash of the wrong theme.
  - The mobile menu supports two historical ID naming schemes on purpose (`navBurger`/`mobileNav` for v2 pages, `navToggle`/`mobileMenu` for v1) — don't "clean up" one of the fallbacks without checking every page still uses it.
- **CDN dependencies** (no local copies, no lockfile — versions are pinned directly in each page's `<script src>` tag): Lenis (smooth scroll), GSAP + ScrollTrigger (animation), Lucide (icon font, `lucide.createIcons()` called at the end of `initAll()`). **Not every page includes every library** — e.g. only `index.html` loads Lenis/GSAP/ScrollTrigger; other pages load only Lucide + `script.js`. When adding an animation that depends on GSAP/Lenis to a page that doesn't currently load them, add the corresponding `<script src>` tags to that page too.

## Forms (`devis.html` / `quote.html`)

The quote-request forms have no backend. On submit, an inline `<script>` block (page-specific, not in `script.js`) does client-side `required`-field validation, builds a `mailto:contact@innovaalpha.com` link from `FormData`, and navigates to it — then reveals a `.form-success` confirmation block. There is no fetch/AJAX call and no server-side persistence; "submitting" the form just opens the visitor's email client with a pre-filled message.

## Conventions

- French is the default/primary language; EN pages are secondary translations.
- Section markers in HTML/CSS use a consistent comment banner style: `<!-- ── NAME ─────... --> ` / `/* ── NAME ─────... */` — match this when adding new sections.
- Scroll-in animations use two conventions driven by `script.js` + GSAP `ScrollTrigger`: add class `reveal` for a single fade/slide-up element, or wrap a `.stagger-group` containing `.stagger-item` children for staggered reveals. Follow the existing `initReveal`/`initStagger`/`initHero` pattern of setting the hidden initial state via `gsap.set()` in JS rather than in CSS — this keeps content visible as a fallback if GSAP fails to load.
- Buttons/links that should follow the cursor use class `magnetic`; cards with 3D hover tilt use class `tilt`. Both are inert on coarse-pointer (touch) devices via `matchMedia("(pointer: coarse)")` checks in `script.js`.
