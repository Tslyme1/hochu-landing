# Loader 3.4

Only the loader controller and loader-scoped CSS changed. The large phone, glass TestFlight dock, blocked vertical page input, ten-second stories, gallery, source logo and every recording are unchanged.

The caption below the logo is hidden before first paint by CSS and removed from the DOM by the early loader controller. The logo stays centred without reserving space for the old caption.

An unmasked outer wrapper owns the soft shadow and spring transform. A separate rounded inner surface clips only the image/reveal and carries a subtle stationary glass highlight and rim. The centre-out circular reveal is preserved; there is no sweeping stripe.

Sequence: complete the reveal to exactly 1; paint that complete frame; run one 500ms spring (1 -> 1.075 -> .99 -> 1); then fade the loader for 300ms and remove it. The fade is triggered by animationend, with bounded fallback timers for interruption. Reduced-motion mode skips the spring and uses a short fade.

56 checks passed in Chromium at 320x568, 390x700, 430x932, 844x390 and 1440x900. Checks sample every rendered frame to verify completion before spring, no fading during spring, return to scale 1 before fading, caption absence and an unclipped outer shadow wrapper. Post-loader geometry was compared with the previous commit. Story navigation, the existing vertical-scroll lock and the TestFlight link were also checked.

Tests use the current GitHub Pages artifact with media inlined in the browser harness. Physical Safari/iPhone rendering was not tested. No media files were re-encoded or added.
