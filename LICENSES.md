# Third-party licenses

## OpenVideo (vendored timeline UI)

**OpenVideo License accepted 2026-07-27 for vendored timeline components, free
tier ≤3 employees.**

- Vendored code: `src/lib/video/vendor/openvideo-timeline/` — the timeline
  panel (canvas timeline, track/clip item renderers, drag/trim/snap
  interactions, ruler, playhead, header, context menu) from
  [openvideodev/react-video-editor](https://github.com/openvideodev/react-video-editor).
- License text: `src/lib/video/vendor/openvideo-timeline/LICENSE` (also at
  <https://github.com/openvideodev/react-video-editor/blob/main/LICENSE>).
- Terms accepted: Free License — Pictify qualifies as a for-profit
  organization with up to 3 employees. Use is for creating videos/images
  inside Pictify with local modifications, which the license permits; the
  code is not being resold or relicensed as a derivative video-editor SDK.
- Each vendored file carries a header noting its upstream path and local
  changes.
- The npm packages `@openvideo/core`, `@openvideo/engine-pixi` and
  `@openvideo/timeline` used alongside the vendored UI are published under
  the MIT license (see their `LICENSE` files in `node_modules`).
- Icon path data in `src/lib/video/vendor/openvideo-timeline/icons.tsx` is
  from [Remix Icon](https://remixicon.com) (Apache License 2.0), the same
  icon set the upstream app uses via `@remixicon/react`.
