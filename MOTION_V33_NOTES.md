# 3.3 — large phone, input-only scroll lock, glass download dock

The portrait phone uses 67% of the viewport width (up to 390 CSS px), with its original proportions. It is not reduced to fit above browser controls. The real scene extends at least 140 px beyond the phone and 160 px beyond the visible portrait window. Decorative art is clipped only at the full scene bounds; body is no longer a fixed viewport-height clip.

Vertical wheel, single-touch and page-key scrolling are blocked; document offset stays at zero. Gallery/dialog internal scrolling, pinch zoom, horizontal navigation and the ten-second loop remain available.

The former header is removed at initialization. Centered compact stories and individually centered title blocks move upward. A rounded glass-style download dock tracks visualViewport and safe-area insets, and is hidden inside the gallery. The button targets the supplied invitation: https://testflight.apple.com/join/e2QTBjKN.

No media, poster, illustration, title, loader or story-timing changes. This tree preserves the independent media replacement and poster-restoration commits through e1256052.

Validation: 555 assertions passed in Chromium over eight scenes and eleven viewport sizes, including expanded paint bounds, original large phone size, zero document movement under wheel/key/touch, gallery size/scrolling, card geometry, arrows/swipes and the ten-second last-to-first loop. Published CSS/JS hashes match the tested files exactly. The browser test used locally inlined HTML and the a0083a8 media artifact; later media-only updates are untouched.

Limitations: no physical iPhone or native Safari toolbar-transparency test. This is a CSS glass effect inside the website, not a native Apple Liquid Glass component. Safari controls its own panels. The sandbox browser blocks external navigation; the download check verifies the supplied href and creation of a new tab, not TestFlight installation.
