# Mobile layout repairs — 3.8

The top download card is 8 CSS pixels lower. Its safe-area clearance is preserved. The story rail has another 8 pixels of separation from the card; in portrait the text is 8 pixels lower but the big phone keeps its prior dimensions and position, so the indicators are closer to the text without pushing the phone farther down.

The finale no longer loses its horizontal centering when a scene transition writes transform:none. Its text uses symmetric insets and automatic horizontal margins. A single measured layout places the original four photo cards, headline, subtitle and lower props. Portrait, landscape and wide layouts are separated. Photographs no longer cross the subtitle, including at 320px width. All original copy and media are retained.

The download card now has a single rounded inner glass surface. The outer component holds the unclipped shadow; the oversized filtered highlights and negative-z-index pseudo layers have been removed. An explicit rounded clip keeps the remaining highlights within the same 21px contour. Light/dark device colors, translucency and the existing TestFlight link are retained.

For the Safari bottom-edge regression, the decorative blur is now absolutely positioned in the real document rather than fixed to the browser viewport. Both scene ancestors keep vertical overflow visible. The document retains at least 240 CSS pixels of extra paint area below the visible window; the phone and its source raster are not reduced or cropped. The blur remains transparent, pointer-events:none, below the controls, and hidden in the gallery. Vertical input remains locked; there is no active fixed full-width layer touching the bottom edge after the loader disappears.

Validation: 1041 Chromium assertions passed with no script errors, across eight viewports and all eight chapters. Tests cover finale centering and text/photo separation, safe-area probe offsets, top controls, extended document geometry, absence of a bottom fixed layer, light/dark switching, wheel and real touch input, arrow/story navigation, ten-second wraparound, gallery dimensions, and an additional run with real embedded MP4 data. Media bytes and loader source were compared to the starting checkout. Screenshots were visually inspected at portrait, landscape and desktop sizes. The browser harness embeds local assets because this environment blocks Chromium network navigation.

Native iPhone/Safari toolbar rendering is not tested. WebKit browser installation was attempted but the download host was not resolvable. These checks establish the page layout and changed paint structure, not native toolbar translucency.

Rebased onto 4b13f2cb9f52bd686ff1935e3a816bf7535d3062. Preserve that concurrent commit's fresh home/search video URLs, assets and index.html unchanged. Only the CSS, scene controller and this note are changed. The existing Vercel headers require revalidation of these CSS/JS resources.

Validated uploaded source hashes:
- motion-v3.css: 3ad0e61379cc56325b71a72722409572b93fd375
- scripts/motion-v3.js: 6b67bdaace4a3617fbafff9f6baa14d856159f89

Technical reference for constrained Safari layers: https://bugs.webkit.org/show_bug.cgi?id=301756 and https://developer.apple.com/forums/thread/800798 .
