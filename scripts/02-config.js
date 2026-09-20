
// Set the actual product URL when available; an empty string is intentional.
window.HOCHU_CONFIG = {
  appStoreUrl: "",
  scrollSmoothingMs: 185,
  chapterLength: 1.25,
  navigationDurationMs: 1080,
  scrollSnapDelayMs: 150,
  scrollSnapDurationMs: 420
};

/* Safari edge-to-edge surface, v2. No changes to videos, text or story timing. */
(() => {
  'use strict';
  if (window.KhochuSafariSurface) return;
  const root = document.documentElement;
  const script = document.currentScript;
  // Version the small corrective stylesheet, not the large unchanged assets.
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.id = 'safari-surface-v2';
  link.href = new URL('../frame-fit.css?v=safari-surface-2', script.src || document.baseURI).href;
  document.head.append(link);

  // Safari's native UI is browser-controlled. Theme-color is not a command to
  // make its controls transparent. Do not keep requesting a blue toolbar on iOS.
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) {
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.remove());
  }
  let pending = 0;
  function fitSurface() {
    pending = 0;
    const vv = window.visualViewport;
    if (vv && Math.abs(vv.scale - 1) > .02) return;
    // Only the decorative background extends; important content keeps the
    // current visual-viewport/safe-area fit. Never zoom or enlarge the video.
    const hidden = Math.max(0, window.innerHeight - (vv?.height || innerHeight));
    const top = Math.max(100, (vv?.offsetTop || 0) + 64);
    const bottom = Math.max(180, hidden + 80);
    root.style.setProperty('--safari-bleed-top', Math.ceil(top) + 'px');
    root.style.setProperty('--safari-bleed-bottom', Math.ceil(bottom) + 'px');
  }
  function schedule() { if (!pending) pending = requestAnimationFrame(fitSurface); }
  addEventListener('resize', schedule, {passive:true});
  addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', schedule, {passive:true});
  window.visualViewport?.addEventListener('scroll', schedule, {passive:true});
  fitSurface();
  window.KhochuSafariSurface = {
    version: '2',
    fit: fitSurface,
    getState: () => ({
      ios, browserChromeControlledBySafari: true,
      viewportFit: document.querySelector('meta[name="viewport"]')?.content,
      themeColor: document.querySelector('meta[name="theme-color"]')?.content || null,
      bodyColor: getComputedStyle(document.body).backgroundColor,
      stageColor: getComputedStyle(document.getElementById('stage')).backgroundColor,
      bleedTop: root.style.getPropertyValue('--safari-bleed-top'),
      bleedBottom: root.style.getPropertyValue('--safari-bleed-bottom')
    })
  };
})();
