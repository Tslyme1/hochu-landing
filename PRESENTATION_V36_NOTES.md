# Presentation 3.6

Loader: pace the centre-out reveal over at least 1.6 seconds, retain a fully filled frame for 140 ms, use a 680 ms final spring, then fade over 520 ms. A fast-load Chromium run removed the loader after 3.43 seconds. Real delayed readiness still holds the loader; the existing gentle breathing loop continues. Reduced-motion mode skips the added scale motion and long visual pacing.

Phone: approximately 6% larger on both axes, 14 CSS pixels lower in portrait and desktop, 10 pixels lower in landscape. Update the actual geometry, not a crop or a transform on the video. The full document remains extended beyond the visible viewport, while vertical page input remains locked. The gallery reads the same updated phone dimensions. Text content and typography are unchanged; the existing centering follows the enlarged spacing.

Bottom edge: a narrow transparent, masked two-layer backdrop blur (3px and 12px) grows toward the lower edge across the page. It extends below the visible window without painting a solid background, intercepts no input, and stays below the arrow controls and download dock. Hidden in the gallery and when reduced transparency is requested.

Download dock: 8 CSS pixels lower, with its compact size, text, glass style, TestFlight destination and minimum bottom clearance preserved. Height and position follow the visual viewport.

All video, poster and illustration files are unchanged byte for byte. Story timing remains 10 seconds. index.html changes only the three modified resource query versions to 3.6.0.

Validation: 612 Chromium assertions passed with no script errors. All eight scenes at eight viewport sizes were compared against 3.5. Checks cover geometry, unchanged pagination and card dimensions, repeated resize stability, locked wheel scrolling, gallery sizing, TestFlight href, transparent click-through blur and quick/delayed/reduced-motion loader cases. Long-wait readiness was delayed 4.2 seconds and reduced-motion readiness 3.2 seconds. This is browser emulation, not a physical iPhone/Safari test.

Tested and uploaded Git blob hashes:
- motion-v3.css: d9c43be2c217f6d68163c8b1ca408b019008caff
- scripts/motion-v3.js: 80f27186f2203c43c40835244cd103b7072d5f04
- scripts/01-app-loader-v31-js.js: 12d1e114798f870464aff07453a583389533fae9
- index.html: 0aceb23b56c0dc1d9f81c324fc8c9c55c65e34ff
