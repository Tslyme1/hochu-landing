# Motion v3 — transition and mobile viewport repair

## Scope

The original eight product sections, their headings, descriptions, SVG art and all existing image/video assets are retained. No media is recompressed. The old hidden menu icon payload is removed from index.html; accessible section labels remain.

The entry point loads motion-v3.css and scripts/motion-v3.js, instead of the accumulated scroll controller, snapping code, story wrapper, viewer and Safari patches. Old source files remain in the repository as a reference but are not loaded. Loader and desktop hover-parallax remain.

## Changes

- Removed the Pause button and reduced the top-left brand.
- Bare chevrons near the mobile screen edges with 44px invisible touch targets.
- One 420ms transition controller for arrows, story bars and horizontal swipes; rapid inputs resolve to the latest requested section.
- No programmatic document scrolling during section navigation. Outgoing content remains visible while incoming content appears; no deliberate empty interval.
- Persistent video layers, native decoded-frame readiness, poster fallback, and no seeking a currently visible recording. Native player controls remain disabled.
- Seven-second automatic story progression and last-to-first wrap. Interaction, native scrolling, open media viewer, hidden tab and reduced-motion settings pause automatic progression without an extra visible button.
- On mobile the phone is about 67% of viewport width, keeps its aspect ratio and lives in a normal-height document. It can extend below the first screen and can be reached by native vertical scrolling, rather than being cut by a sticky viewport-sized container.
- Root background follows the actual section. Opaque full-width fixed/sticky background layers and forced theme-color tint are removed. Safari itself controls the native toolbar material; its physical-device appearance is not verified by Chromium emulation.
- CSS and script have new versioned URLs. Vercel is configured to revalidate entry files, while existing media assets remain cacheable.

## Verification

300 automated Chromium checks passed, with no uncaught script errors: eight scenes, nine viewport sizes, rapid input sequences, decoded video coverage during the reported tickets-to-authors transition, continuous text opacity, no scroll jumps during navigation, native touch swipes, seven-second wrap, reachable phone bottom, hidden controls and unchanged asset hashes.

Final smoke testing also covered opening the existing-style enlarged media viewer, playing video there, next/close behavior, and exact original scene DOM equality. The largest file remains 5,884,117 bytes, below 25 MB.

Tests used actual page markup and local media served through Playwright request fulfillment. These are not physical iPhone, mobile-network or native Safari toolbar-transparency tests. GitHub Pages/Vercel deployment status is a separate check, not visual proof of device-specific behavior.
