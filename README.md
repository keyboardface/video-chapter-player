# video-chapter-player

A drop-in chaptered MP4 player. One `<div>`, one `<script>`, no build step, no dependencies.

```html
<div class="video-chapter-player" data-config="{'videoUrl': 'https://example.com/video.mp4','chapters': [{'id':'1','timestamp':0,'title':'Intro'},{'id':'2','timestamp':30,'title':'Setup'}]}"></div>
<script src="https://cdn.jsdelivr.net/gh/keyboardface/video-chapter-player@v1.0.0/embed.js"></script>
```

That's it. The script finds every `.video-chapter-player` on the page, parses
its config, and renders a player with a chapter sidebar, timeline segments,
frame-preview-on-hover, speed menu, mute, PiP, fullscreen, and mobile touch
support. Shadow-DOM-encapsulated by default; theme via CSS variables, or
disable encapsulation entirely with `'shadowDom': false`.

## Documentation

- **[AGENTS.md](AGENTS.md)** — the full integration guide. Designed for an AI
  agent (Claude, etc.) to read end-to-end and integrate the player into any
  host page without further conversation. Also useful for humans.
- **[examples/](examples/)** — runnable copies:
  - [`minimal.html`](examples/minimal.html) — smallest working embed
  - [`themed.html`](examples/themed.html) — CSS-variable theming (shadow DOM on)
  - [`shadow-off.html`](examples/shadow-off.html) — escape hatch (light DOM, direct CSS overrides)
  - [`ghl-customizer.html`](examples/ghl-customizer.html) — embedded in a real marketing page

## Quick theming

Override CSS variables on the host element. They pierce the shadow DOM via
inheritance — no JS, no shadow surgery.

```css
.video-chapter-player {
  --vcp-progress: #ff6b00;            /* orange progress bar */
  --vcp-chapter-item-active-bg: #ff6b00;
  --vcp-chapter-list-bg: #1f1f1f;     /* dark sidebar */
  --vcp-font: 'Poppins', sans-serif;
  --vcp-radius: 16px;
}
```

See [AGENTS.md](AGENTS.md) for the full variable surface.

## Hosting

Pinned via jsDelivr (recommended):

```html
<script src="https://cdn.jsdelivr.net/gh/keyboardface/video-chapter-player@v1.0.0/embed.js"></script>
```

Or self-host: copy `embed.js`, `chapterplayer.js`, and `chapterplayer.css` into
your project. All three files must live in the same directory — `embed.js`
loads the other two from its own URL.

## What's in this repo

- **Runtime** (the only files you need for embedding): `embed.js`,
  `chapterplayer.js`, `chapterplayer.css`
- **Docs**: `AGENTS.md`, `README.md`, `webbwidgetdocs.md`
- **Examples**: `examples/`
- **Builder UI** (optional, for generating chapter configs from a video URL +
  timestamps): `index.html`, `script.js`, `playerbuilder.js`,
  `transcription.js`, `styles.css`, `test-embed.html`, `backup.html`
- **Reference implementations** of the GoHighLevel Funnel Builder Custom
  Widget protocol (not required for normal use): `webwidget/`,
  `example-widget/`, `backup/`, `loom_proof/`

## License

[MIT](LICENSE)
