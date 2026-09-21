# Top download card — 3.7

The compact download card is fixed at the safe top of the visual viewport, centered in portrait, landscape and desktop. Its measured height reserves the first row; the compact story rail follows 8 CSS pixels below the card. Each chapter's copy is centered between the rail and the phone. The finale reserves the same top area. There is no second download card at the bottom.

The TestFlight link remains https://testflight.apple.com/join/e2QTBjKN. The card uses a live backdrop blur, translucent surface and edge highlights, with light/dark colors selected by the device's prefers-color-scheme preference. This is a web glass effect, not access to Safari's native toolbar material. Reduced transparency and unsupported-filter fallbacks use a solid readable surface.

The large phone and extended page canvas from 3.6 are preserved; no media crop, spatial video zoom or re-encoding is added. The lower-edge blur stays at the bottom, independently of the card. Vertical page input remains blocked, while arrows, horizontal swipes, compact story controls, the ten-second loop and the gallery continue working. The gallery hides the card and uses the main-page mockup dimensions.

Rebased onto 4b642d75eafea52676566dd6be36971974c51d30 so the newly published paced loader, source HTML versions and other concurrent changes are not reverted. No recording, poster, illustration or copy file is changed. The loader controller is unchanged from that parent. The CSS breathing loop retains the slower pace of the preceding local preview.

Validation uses Chromium viewport/touch emulation at 320x568, 375x667, 390x744, 430x932, 768x1024, 844x390, 1024x768 and 1440x900, across all eight chapters. Checks cover top positioning, safe-area offsets, centered navigation, content order, page scroll lock, system theme switching, gallery geometry, pointer navigation, ten-second wraparound, and quick/4.2-second-delayed loading. Native Safari/iPhone has not been tested.

Validated source blob hashes:
- scripts/motion-v3.js: a5e21ebd5a77e0976f8d281f244832bad1cc950f
- motion-v3.css: a3002b26b046a6349d5d6fb441b3a00c20c8c727
- unchanged loader: 12d1e114798f870464aff07453a583389533fae9
- unchanged HTML: 0aceb23b56c0dc1d9f81c324fc8c9c55c65e34ff
