# video-chapter — agent integration guide

A drop-in chaptered MP4 player. One `<div>` + one `<script>`, no build step,
no dependencies. This file tells an AI agent (Claude, etc.) how to integrate
the player into a host page and make it match the site's theme.

If you're reading this because the user pointed you at this folder and asked
you to add a chaptered video to their site, you have everything you need here.

---

## 1 — Quick start

Drop these two lines wherever the video should appear:

```html
<div class="video-chapter-player" data-config="{'videoUrl': 'https://example.com/video.mp4','chapters': [{'id':'1','timestamp':0,'title':'Intro'},{'id':'2','timestamp':30,'title':'Setup'},{'id':'3','timestamp':90,'title':'Demo'}]}"></div>
<script src="https://path/to/video-chapter/embed.js"></script>
```

`embed.js` will find every `.video-chapter-player` on the page, parse its
`data-config`, and instantiate a player. `chapterplayer.js` and
`chapterplayer.css` are loaded automatically by `embed.js` from the same
directory it itself was served from — keep all three files together.

Single-quoted JSON inside `data-config` is intentional (avoids escaping double
quotes in HTML attributes). `embed.js` handles the conversion via
`fixJsonFormat()`.

See [`examples/minimal.html`](examples/minimal.html) for the smallest working
copy. See [`examples/ghl-customizer.html`](examples/ghl-customizer.html) for the
player embedded in a real marketing page.

---

## 2 — Config schema (`data-config`)

| Key | Type | Default | Notes |
|---|---|---|---|
| `videoUrl` | string | — | **Required.** MP4 URL (relative ok, resolved against `embed.js` location). |
| `posterUrl` | string | — | Thumbnail shown before play. Optional. |
| `chapters` | array | `[]` | See chapter shape below. |
| `chapterListTitle` | string | `"Chapters 📖"` | Heading above the sidebar list. |
| `hideChapterListTitle` | boolean | `false` | Hide the heading entirely. |
| `isPreviewEnabled` | boolean | `true` | Show frame-preview canvas on timeline hover. |
| `shadowDom` | boolean | `true` | Set `false` for the escape hatch (see §5). |
| `useExternalCss` | boolean | `false` | Load CSS via `<link>` instead of fetch+inline. Use for CSP-strict environments. |
| `compactModeThreshold` | number | `700` | Container width (px) below which the layout collapses chapter list to a floating panel. |

### Chapter shape

```json
{ "id": "string-or-omit", "timestamp": 0, "title": "Intro", "description": "optional" }
```

- `timestamp` is seconds (number). `0`, `90`, `515` — not `"01:30"`.
- `id` will be auto-generated if omitted; supply your own for stability.
- `description` shows in the chapter card; safe to omit.

---

## 3 — Layout & sizing (what space the player wants)

- The root `.chapter-player-instance` is **flex with two columns**: video
  (`flex: 3 1 400px`) on the left, chapter list (`flex: 1 1 250px`) on the
  right, 25px gap, wraps when there isn't room.
- Minimum sensible width: about **640 px** to keep both columns. Below
  `compactModeThreshold` (default 700px) a ResizeObserver applies
  `.compact-mode` which floats the chapter list over the video as a small
  top-right panel that expands on hover.
- The video keeps its natural aspect ratio. Don't put the player inside a
  container with a fixed height — controls are absolutely positioned over
  the bottom of the video and a fixed-height parent will clip them.
- To force **stacked** (video on top, chapter list below) at any width,
  override one variable:
  ```css
  .video-chapter-player { --vcp-video-flex: 1 1 100%; }
  ```
- Fits into containers like `.ghlc-player-mount { min-height: 360px; }`
  without any extra work.

---

## 4 — Theming (Tier 1: CSS variables, shadow DOM stays on)

This is the recommended path. Set CSS custom properties on the host element;
they pierce the shadow DOM via inheritance.

### Variable surface

**Colors**

| Variable | Default | What it controls |
|---|---|---|
| `--vcp-font` | `'Roboto', Arial, sans-serif` | All text |
| `--vcp-bg-video` | `#000` | Background behind the video |
| `--vcp-radius` | `8px` | Video wrapper + chapter list corner radius |
| `--vcp-progress` | `#FF0000` | Played-portion fill on the timeline |
| `--vcp-progress-hover` | `#FF2222` | Same, while hovered |
| `--vcp-controls-bg` | `rgba(20, 20, 20, 0.7)` | Bottom controls bar background |
| `--vcp-controls-text` | `#e0e0e0` | Buttons & time display |
| `--vcp-controls-text-hover` | `#ffffff` | Buttons on hover |
| `--vcp-speed-active` | `#00aeff` | Active row in the speed menu |
| `--vcp-chapter-list-bg` | `#f8f9fa` | Chapter sidebar background |
| `--vcp-chapter-item-bg` | `#ffffff` | Per-chapter card background |
| `--vcp-chapter-item-border` | `#e9ecef` | Per-chapter card border |
| `--vcp-chapter-item-hover-bg` | `#f1f3f5` | Per-chapter card background on hover |
| `--vcp-chapter-item-text-title` | `#212529` | Chapter title text (inactive) |
| `--vcp-chapter-item-text-desc` | `#495057` | Chapter description text (inactive) |
| `--vcp-chapter-item-active-bg` | `#4a4a4a` | Current chapter highlight |
| `--vcp-chapter-item-active-text` | `#ffffff` | Text inside the highlighted chapter |
| `--vcp-chapter-title` | `#1c2938` | Chapter list heading |

**Spacing / layout**

| Variable | Default |
|---|---|
| `--vcp-gap` | `25px` |
| `--vcp-margin-bottom` | `35px` |
| `--vcp-video-flex` | `3 1 400px` |
| `--vcp-chapter-list-flex` | `1 1 250px` |
| `--vcp-video-min-width` | `300px` |
| `--vcp-controls-height` | `50px` |
| `--vcp-timeline-height` | `30px` |
| `--vcp-big-play-size` | `80px` |

### Worked example — match a brand palette

Host page has its own brand vars:

```css
:root { --gp: #ff6b00; --gpr: #7c3aed; --gbg: #FAF7F2; }
```

Theme the player to match:

```css
.video-chapter-player {
  --vcp-progress: var(--gp);
  --vcp-progress-hover: #ff8a2e;
  --vcp-chapter-item-active-bg: var(--gp);
  --vcp-speed-active: var(--gpr);
  --vcp-chapter-list-bg: #1f1f1f;
  --vcp-chapter-item-bg: #2a2a2a;
  --vcp-chapter-title: #ffa659;
  --vcp-font: 'Poppins', system-ui, sans-serif;
  --vcp-radius: 16px;
}
```

That's the full theming workflow. No JS, no shadow DOM gymnastics. See
[`examples/themed.html`](examples/themed.html) for a runnable copy.

### How to pick colors for an unfamiliar host page

1. Find the host page's primary accent (`--accent`, `--brand`, the most
   prominent CTA color). Use it for `--vcp-progress`,
   `--vcp-chapter-item-active-bg`.
2. Match `--vcp-chapter-list-bg` to whichever surface the player sits on —
   light page → `#f8f9fa`-ish; dark page → `#1f1f1f`-ish.
3. Match `--vcp-font` to `body { font-family: ... }`.
4. If the page has its own `border-radius` convention, set `--vcp-radius`
   to match.

---

## 5 — Theming (Tier 2: escape hatch, `shadowDom: false`)

When CSS variables aren't enough — usually because you need to change spacing,
add a custom font-face, override icon SVGs, or integrate with a host design
system that bleeds styles into descendants — set `shadowDom: false` in the
config. The player renders into light DOM; every internal selector is
reachable from the host page's stylesheet.

```html
<div class="video-chapter-player" data-config="{'shadowDom': false, 'videoUrl': '...', 'chapters': [...]}"></div>
```

```css
/* Now you can reach inside. Player CSS is injected late and has
   class-level specificity (0,1,0 / 0,2,0). Two ways to win the cascade: */

/* (a) Match the player's own specificity, then add !important: */
.video-chapter-player .chapter-item.active { background: #7c3aed !important; }

/* (b) Add a hair more specificity by chaining the class the player adds: */
.video-chapter-player.chapter-player-instance .chapter-list {
  background: linear-gradient(180deg, #ede9fe 0%, #ddd6fe 100%);
}
```

CSS variables still work in this mode too. See
[`examples/shadow-off.html`](examples/shadow-off.html) for a runnable copy.

### Trade-offs

- **Pro:** full structural control.
- **Con:** host-page CSS can collide with player CSS. The player's selectors
  are all scoped under `.chapter-player-instance` and use `cp-`-prefixed IDs,
  so collisions are rare but possible.
- **Con:** multiple instances on the same page share one injected `<style
  id="vcp-styles">` block on `<head>`. That's fine, just be aware.

---

## 6 — Internal DOM contract

Stable selectors generated by `_renderPlayerDOM()` in `chapterplayer.js`. Use
these when writing escape-hatch CSS (§5) or when reading the source.

```
.chapter-player-instance                 (root; also gets .mobile-device, .compact-mode, etc.)
├── .video-wrapper
│   ├── #cp-mainVideo                    (the <video>)
│   ├── #cp-bigPlayButtonOverlay
│   │   └── #cp-bigPlayPauseBtn
│   ├── #cp-timelineContainer
│   │   ├── #cp-timelinePreviewContainer
│   │   │   ├── #cp-previewCanvas        (320×180, hover preview)
│   │   │   ├── #cp-previewChapterTitle
│   │   │   └── #cp-previewTimeNoPreview
│   │   └── #cp-seekBarWrapper
│   │       └── #cp-seekBarCustom        (the <input type=range>)
│   └── #cp-videoControlsCustom
│       ├── #cp-playPauseBtnCustom
│       ├── #cp-nextChapterBtnCustom
│       ├── #cp-currentChapterTitleDisplay
│       ├── #cp-timeDisplayCustom        (.time-display)
│       ├── #cp-speedBtnCustom           (.playback-speed-button)
│       ├── #cp-speedMenuCustom          (.speed-menu)
│       │   └── button[data-speed]       (.active-speed on current)
│       ├── .volume-controls
│       │   ├── #cp-muteBtnCustom
│       │   └── #cp-volumeBarCustom      (.volume-bar)
│       ├── #cp-pipBtnCustom
│       └── #cp-fullscreenBtnCustom
└── #cp-chapterList                       (.chapter-list)
    ├── #cp-chapterListTitle              (<h2>)
    └── .chapter-item × N                 (.active on current)
        ├── .chapter-timestamp
        ├── strong                        (title)
        └── p                             (description)
```

### State classes worth knowing

- `.chapter-player-instance.mobile-device` — touch device detected.
- `.chapter-player-instance.compact-mode` — container width <
  `compactModeThreshold`; chapter list floats over video.
- `.video-controls-custom.visible`, `.timeline-container.visible` — forced
  visible (else they show on `:hover`).
- `.timeline-chapter-segment.active` / `.hovered` — current and hovered
  chapter segments on the timeline.
- `.chapter-item.active` — the currently playing chapter.
- `.chapter-item.touch-active` — brief flash during tap on mobile.

---

## 7 — Loom transcript → chapters recipe

Loom exports timestamped transcripts like:

```
0:00 Introduction to GHL Customizer
0:39 Craft your own menu with folders
1:34 Menu folder style options
...
```

To convert this into a `chapters` array, split lines, parse `mm:ss` (or
`h:mm:ss`) into seconds, and pair with the rest of the line as the title:

```js
function loomToChapters(text) {
  return text.trim().split(/\r?\n/).map((line, i) => {
    const m = line.match(/^(\d+)(?::(\d+))?(?::(\d+))?\s+(.+)$/);
    if (!m) return null;
    const parts = [m[1], m[2], m[3]].filter(Boolean).map(Number);
    let seconds;
    if (parts.length === 3) seconds = parts[0]*3600 + parts[1]*60 + parts[2];
    else if (parts.length === 2) seconds = parts[0]*60 + parts[1];
    else seconds = parts[0];
    return { id: `ch-${i}`, timestamp: seconds, title: m[4].trim(), description: '' };
  }).filter(Boolean);
}
```

No AI required. Just paste the Loom timestamp list into a variable and run
this. Then JSON-stringify the result with single quotes (replace `"` → `'`)
to drop it into `data-config`.

---

## 8 — Hosting the runtime files

Three files must travel together: `embed.js`, `chapterplayer.js`,
`chapterplayer.css`. `embed.js` infers its own URL and loads the other two
from the same directory.

Recommended (production): **jsDelivr against this repo's pinned tag**

```html
<script src="https://cdn.jsdelivr.net/gh/keyboardface/video-chapter-player@v1.1.0/embed.js"></script>
```

Free, global CDN, versioned, cached forever at the tag. Bump the version in
the URL to upgrade.

Alternatives:

- **Local / same-origin:** copy the three files into the host project (e.g.
  `/assets/video-chapter/`). Point the `<script src>` at the local copy.
- **GitHub raw:** `https://raw.githubusercontent.com/keyboardface/video-chapter-player/main/embed.js`
  — works for development; rate-limited and not CDN-cached, don't use it for
  production traffic.
- **Self-hosted:** any static host (S3, Netlify, your own server). Keep all
  three files in one directory.

---

## 9 — Gotchas

- **Single-quoted JSON in `data-config` is intentional.** `embed.js` swaps
  `'` → `"` before parsing. Don't try to escape double quotes inside the
  attribute — use single quotes and let the embed handle it.
- **Three files are required.** Loading only `embed.js` will fail silently
  because the relative fetches for `chapterplayer.js` / `chapterplayer.css`
  won't find anything.
- **`baseUrl` is auto-derived** from `embed.js`'s `<script src>`. Relative
  `videoUrl` / `posterUrl` values resolve against that, not the host page.
- **Multiple players on one page work.** Each `.video-chapter-player` gets
  an auto-generated ID (`video-chapter-player-1`, `-2`, …). Don't write CSS
  that targets these IDs — target the class or scope under it.
- **Don't fix a height on `.video-wrapper`** — controls are absolutely
  positioned over the bottom and rely on the video's intrinsic height.
- **`useExternalCss: true`** swaps fetch-and-inline for a `<link>` element.
  Use it if your CSP blocks inline styles. Slightly slower first paint.
- **`shadowDom: false` injects one `<style id="vcp-styles">`** into
  `<head>`. Idempotent if multiple players use it. Removing the style by
  hand will break players that share it.
