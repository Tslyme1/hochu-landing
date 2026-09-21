# Loader and download dock 3.5

The loader gently breathes during a long wait: after a one-second delay, its scale cycles between 1 and 1.04 over 1.8 seconds. On completion, the final spring starts from the current breathing scale, not from a reset value, so the handoff does not jump. A fully filled frame precedes the spring, and fading starts only once the spring has settled. Reduced-motion mode disables both scale animations. The caption remains removed and the outer shadow remains unclipped.

The download card now follows the compact proportions of the supplied App Store screenshot: at a 390px viewport it is 350x70px (previously 362x84px), with 20px side margins, a 48px icon, a 94x32px visible button, 17px title and 12px subtitle. The invisible button target remains 44px high. Small screens adapt without overlapping text and controls. The existing glass treatment, blue button, TestFlight invitation, fixed positioning and gallery behavior are preserved.

Only motion-v3.css and the loader controller were changed. Main-page phone size and position, headings, stories, scene navigation, scroll lock, recordings and posters are unchanged.

290 Chromium checks passed using the local source blobs recorded below. Long-wait cases delayed the real story API by 4.2 and 6.1 seconds; reduced motion was tested with a 3.2-second delay. The harness samples animation phases and scale frame by frame and verifies continued breathing, no early fade, a continuous handoff to the final spring, and cleanup. Eight viewport sizes and all eight scenes were checked for card geometry and overlaps. Main phone, copy and story-rail geometry were compared against version 3.4.

Validated Git blob hashes:
- motion-v3.css: 9cdc9ea8480c65cac2a44108bceb8ff9d38d0b4a
- scripts/01-app-loader-v31-js.js: cd3870b0adbdf82f41f29d53ddaab8138b03a4ca

Tests use Chromium viewport emulation, not physical Safari/iPhone. TestFlight href and tab target were checked; no enrollment or download was performed.
