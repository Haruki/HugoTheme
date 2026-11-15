# AGENTS.md — HugoTheme (single-page wiki theme)

## What this is
A Hugo **theme** (not a full site). It renders an entire wiki as **one HTML page**: every article on the homepage, so everything is searchable via Ctrl+F. The menu/sidebar links jump to articles by URL fragment (`#slug`).

- Live instance: `http://192.168.0.39/` (LAN root, no baseURL prefix — see git log for the stylesheet fallback fix).
- Content lives in a separate Hugo site repo (e.g. `/mnt/d/data/coding/hugowiki`, which has an **older copy** of this theme as `themes/lugo` — do not confuse it with this repo; the live page matches *this* repo's `index.html`).

## Key files
- `layouts/index.html` — THE important file. Renders all site pages into one page:
  - sidebar `.article_nav` links: `<a href="#{{ .Title | urlize }}">`
  - each article wrapped in `<div class="article" id="{{ .Title | urlize }}">`
  - per-article TOC (`.TableOfContents`, post-processed with `replaceRE`) + WordCount
  - mermaid loader included only if any article contains a mermaid block
- `layouts/_default/baseof.html` — used for non-home pages (`h1 id="tag_{{ .Title }}"`); mostly unused since everything is on the homepage.
- `static/js/search.js` — filters sidebar entries by title/tags (min 3 chars).
- `static/js/scroll.js` — scroll-to-top button.
- `config.toml` — TOC levels 2–4, favicon; `baseURL = 'https://example.org'` is a placeholder (site served at LAN root).

## Known problem under work: duplicate anchor ids
Hugo's goldmark auto-generates heading ids from slugified heading text **per article**, and the theme adds one more id per article (`div.article`). On one page this produces many duplicates. Verified on the live page (2026-11-14):

- `#openwrt` matches 3 elements: `<h2 id="openwrt">` inside the **GeoIP-Shell** article (~line 4313), then the OpenWrt article's `<div class="article" id="openwrt">` and its own `<h1 id="openwrt">`. Browsers jump to the **first** match → sidebar link lands in the wrong article.
- Page-wide: `id="docker-setup"` ×32, `TableOfContents` ×24, `setup` ×20, `install`/`config` ×10 each; ~1729 ids total with many collisions.
- Fragment links exist in three places: sidebar (`.article_nav`), per-article TOC navs, and **in-content** links (manual "Contents" lists + inline `[x](#y)` markdown) — all suffer the same first-match problem across articles.

### Fix implemented in `layouts/index.html` (2026-11-14)
For each article with slug `S`:
1. Prefix every heading id in `.Content`: `<hN id="X"` → `<hN id="S-X"` (`replaceRE` with `$1`/`2` capture groups).
2. Rewrite **all** fragment links in the content (TOC nav, manual "Contents" lists, inline `[x](#y)` links): `href="#X"` → `href="#S-X"`.
3. Prefix the container + sidebar anchor: `id="article-S"` / `href="#article-S"`.
4. Rename each TOC `<nav id="TableOfContents">` to `<nav id="S-toc">` (was ×24 duplicates).

Verified by building the real content (`/mnt/d/data/coding/wiki`) with this theme: 1729 ids, **zero duplicates**, all 947 fragment links resolve, every link resolves within its own article. Ctrl+F unaffected, no JS needed.

**Pitfalls hit while implementing (do not repeat):**
- `replaceRE` returns a plain `string`; outputting it via `{{ $content }}` HTML-escapes the whole rendered article (`<h2>` → `&lt;h2&gt;`). Must end with `{{ $content | safeHTML }}`. (`.TableOfContents` already had this handled.)
- Go html/template escapes values differently per attribute context: in `href` a `+` becomes `%2B`, in other attributes `&#43;`; goldmark strips `+` from heading slugs entirely. Browsers decode all of these before fragment matching, so titles with `+`/`/` still work — don't "fix" this by hand-encoding.
- Content links are per-article only: a link inside article A to a heading in article B is not supported (was never reliable due to first-match behavior).

Also fixed (content repo, one char): `/mnt/d/data/coding/wiki/Projects/logAnalyzer.md` line 120 anchor typo `#anomalie-erkennnung--auto-ban-alertpy` → `#anomalie-erkennung--auto-ban-alertpy`.

Rejected alternatives: runtime JS renaming of duplicates (fragile — can't tell which element a link intends), authoring convention "use unique heading names" (not enforceable).

## Conventions
- Edits to `index.html` must keep the per-article loop structure; TOC post-processing regexes are order-sensitive.
- Site is served at LAN root **and** under `/wiki/` subpath — asset paths need both fallbacks (see git log).
- Mermaid: only load `mermaid.min.js` when needed (`findRE "language-mermaid"`), for render performance.
