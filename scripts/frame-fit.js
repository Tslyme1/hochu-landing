/* Full-frame fit: no media crop, no zoom, no video re-encoding.
   Use untransformed CSS dimensions so the original 3D tilt cannot create a gap. */
(() => {
  'use strict';
  const stage = document.getElementById('stage');
  const mainPhone = document.getElementById('phone');
  if (!stage || !mainPhone) return;
  const order = ['home', 'search', 'neuro', 'feed', 'chats', 'tickets', 'create'];
  const registered = new WeakSet();
  let frame = 0;
  const number = value => Number.parseFloat(value) || 0;
  function schedule() {
    if (!frame) frame = requestAnimationFrame(fitAll);
  }
  function sourceFor(phone) {
    const sources = [...phone.querySelectorAll('.screen-image')];
    if (phone === mainPhone) {
      const key = order[Math.min(6, Math.max(0, Number(stage.dataset.scene) || 0))];
      return sources.find(el => el.dataset.screen === key) || sources[0];
    }
    return sources.find(el => el.style.zIndex === '2') ||
      sources.find(el => number(el.style.opacity) > .5) || sources[0];
  }
  function set(phone, name, value) {
    const rounded = `${value.toFixed(6)}px`;
    if (phone.style.getPropertyValue(name) !== rounded) phone.style.setProperty(name, rounded);
  }
  function fit(phone) {
    const screen = [...phone.children].find(el => el.classList.contains('phone-screen'));
    const source = sourceFor(phone);
    if (!screen || !source) return;
    for (const media of phone.querySelectorAll('.screen-image')) {
      if (!registered.has(media)) {
        registered.add(media);
        media.addEventListener('loadedmetadata', schedule);
        media.addEventListener('load', schedule);
      }
    }
    const width = number(source.dataset.frameWidth) || source.videoWidth || source.naturalWidth || number(source.getAttribute('width'));
    const height = number(source.dataset.frameHeight) || source.videoHeight || source.naturalHeight || number(source.getAttribute('height'));
    if (!(width > 0 && height > 0)) return;
    const css = getComputedStyle(phone);
    const innerW = number(css.width) - number(css.borderLeftWidth) - number(css.borderRightWidth);
    const innerH = number(css.height) - number(css.borderTopWidth) - number(css.borderBottomWidth);
    const left = number(css.paddingLeft), right = number(css.paddingRight);
    const top = number(css.paddingTop), bottom = number(css.paddingBottom);
    const maxW = innerW - left - right, maxH = innerH - top - bottom;
    if (!(maxW > 0 && maxH > 0)) return;
    const scale = Math.min(maxW / width, maxH / height);
    const screenW = width * scale, screenH = height * scale;
    set(phone, '--media-screen-width', screenW);
    set(phone, '--media-screen-height', screenH);
    set(phone, '--media-screen-left', left + (maxW - screenW) / 2);
    set(phone, '--media-screen-top', top + (maxH - screenH) / 2);
  }
  function fitAll() {
    frame = 0;
    document.querySelectorAll('#phone, .mobile-viewer-v26 .mv-frame > .phone').forEach(fit);
  }
  new MutationObserver(schedule).observe(stage, {
    attributes: true, attributeFilter: ['data-scene', 'data-navigating']
  });
  const viewer = document.querySelector('.mobile-viewer-v26');
  if (viewer) {
    new MutationObserver(schedule).observe(viewer, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style']
    });
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    observer.observe(mainPhone);
    const frame = viewer?.querySelector('.mv-frame');
    if (frame) observer.observe(frame);
  }
  addEventListener('resize', schedule, {passive: true});
  addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', schedule, {passive: true});
  fitAll();
})();

/* Mobile stories upgrade. Loaded by the existing entry point, so content and media stay untouched. */
(() => {
  const style = document.createElement('style');
  style.id = 'stories-mobile-v1';
  style.textContent = `
html,body{background-color:var(--bg,#079fee)!important;background-image:none!important;}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}
html,body{overflow-x:clip!important;max-width:100%;}
#scenes{overflow:clip!important;}
#stage{height:var(--stories-height,100dvh)!important;min-height:0!important;}
#journey-nav{display:none!important;}
#stage .header{overflow:visible!important;}
#stories-pagination{position:absolute;top:var(--stories-nav-top,88px);left:50%;transform:translateX(-50%);width:min(560px,calc(100% - 40px));display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px;height:32px;z-index:45;color:var(--fg);background:transparent;}
#stories-pagination button{position:relative;display:block;min-width:0;height:32px;padding:0;border:0;background:none;color:inherit;touch-action:manipulation;cursor:pointer;}
#stories-pagination button::before,#stories-pagination .story-fill{position:absolute;left:0;right:0;top:14px;height:3px;border-radius:8px;background:currentColor;pointer-events:none;}
#stories-pagination button::before{content:"";opacity:.23;}
#stories-pagination .story-fill{transform:scaleX(0);transform-origin:left;will-change:transform;}
#stories-pagination button:focus-visible{outline:2px solid currentColor;outline-offset:1px;border-radius:5px;}
.story-pause{flex:none;min-width:44px;min-height:44px;margin-left:auto;margin-right:12px;font:600 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--fg);opacity:.76;white-space:nowrap;}
.story-pause:hover,.story-pause:focus-visible{opacity:1;}
html.mv-open-v30 #stories-pagination{visibility:hidden;pointer-events:none;}
.story-safe-probe{position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px);}
@media(max-width:980px){
 :root{--phone-h:var(--stories-phone-h,440px)!important;--phone-w:calc(var(--stories-phone-h,440px)*.466)!important;--phone-y:var(--stories-phone-y,440px)!important;}
 #stage{overflow:visible!important;background:transparent!important;}
 #stage>.ambient{position:fixed!important;inset:calc(-1 * env(safe-area-inset-top,0px)) 0 calc(-160px - env(safe-area-inset-bottom,0px))!important;background-color:var(--bg);overflow:hidden;}
 #stage>.header{top:var(--stories-header-top,12px)!important;left:max(18px,env(safe-area-inset-left,0px))!important;right:max(18px,env(safe-area-inset-right,0px))!important;height:44px!important;gap:8px!important;}
 #stage .header .brand{font-size:27px!important;gap:7px!important;letter-spacing:-1px!important;}
 #stage .header .brand img{width:32px!important;height:34px!important;}
 #stage .header .app-store{height:42px!important;min-height:42px!important;padding:6px 12px!important;border-radius:14px!important;}
 #stage .header .app-store strong{font-size:14px!important;}
 #stage .header .app-store small{font-size:7px!important;}
 #stage .header .app-store svg{width:23px!important;height:25px!important;}
 #stories-pagination{left:max(18px,env(safe-area-inset-left,0px));right:max(18px,env(safe-area-inset-right,0px));width:auto;transform:none;gap:5px;}
 .story-pause{font-size:10px;margin-right:3px;}
 #stage .scene:not(.scene-finale) .copy{top:var(--stories-copy-y,165px)!important;left:4%!important;right:auto!important;width:92%!important;transform:translateY(-50%)!important;text-align:center;}
 #stage .scene:not(.scene-finale) h1,#stage .scene:not(.scene-finale) h2{font-size:var(--stories-title-size,34px)!important;line-height:1.07!important;letter-spacing:-.052em!important;}
 #stage .scene:not(.scene-finale) .description{font-size:var(--stories-description-size,14px)!important;line-height:1.4!important;margin-top:13px!important;white-space:normal!important;text-wrap:pretty!important;max-width:100%!important;overflow:visible!important;}
 #stage .scene:not(.scene-finale) .eyebrow,#stage .scene:not(.scene-finale) .micro-label{display:none!important;}
 #phone-anchor{left:var(--stories-phone-x,50%)!important;top:var(--stories-phone-y)!important;width:calc(var(--stories-phone-h)*.466)!important;height:var(--stories-phone-h)!important;transform:translate(-50%,-50%)!important;}
 #stage .phone-chevron{top:var(--stories-phone-y)!important;}
 #stage .phone-chevron-prev{left:calc(var(--stories-phone-x,50%) - var(--phone-w)/2 - 52px)!important;right:auto!important;}
 #stage .phone-chevron-next{left:calc(var(--stories-phone-x,50%) + var(--phone-w)/2 + 10px)!important;right:auto!important;}
 #stage .scene-finale .copy{top:var(--stories-finale-y,43%)!important;}
}
@media(max-width:360px){
 #stage .header .brand{font-size:24px!important;gap:4px!important;}
 #stage .header .brand img{width:29px!important;height:31px!important;}
 #stage .header .app-store{padding:5px 9px!important;gap:5px!important;}
 #stage .header .app-store strong{font-size:12px!important;}
 #stage .header .app-store svg{width:20px!important;}
 .story-pause{min-width:40px;font-size:9px;margin-right:0;}
}
@media(max-width:980px) and (max-height:540px) and (orientation:landscape){
 #stage .scene:not(.scene-finale) .copy{left:max(24px,env(safe-area-inset-left,0px))!important;width:42%!important;text-align:left;}
 #stage .scene:not(.scene-finale) .title-line,#stage .scene:not(.scene-finale) .line-inner{display:inline!important;}
 #stage .scene:not(.scene-finale) .description{font-size:12px!important;line-height:1.35!important;}
 #stage .scene:not(.scene-finale) .art{display:none!important;}
 #stories-pagination{height:28px;}
}
@media(prefers-reduced-motion:reduce){#stories-pagination .story-fill{will-change:auto;}}
`;
  document.head.append(style);
})();

/* Seven-second stories. Existing scene content, transition engine and media remain intact. */
(() => {
  'use strict';
  if (window.KhochuStories) return;
  const root = document.documentElement, stage = document.getElementById('stage');
  const api = window.HochuStory, legacy = document.getElementById('journey-nav');
  if (!stage || !api || !legacy) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const count = api.chapters.length, duration = 7000;
  const labels = [...legacy.querySelectorAll('.nav-label')].map(el => el.textContent.trim());
  legacy.inert = true;
  legacy.setAttribute('aria-hidden', 'true');
  const nav = document.createElement('nav');
  nav.id = 'stories-pagination';
  nav.setAttribute('aria-label', 'Разделы сайта. Автопереход каждые 7 секунд');
  const buttons = [], fills = [];
  for (let i = 0; i < count; i++) {
    const b = document.createElement('button'), fill = document.createElement('i');
    b.type = 'button'; b.dataset.story = String(i);
    b.setAttribute('aria-label', `${i + 1}. ${labels[i] || api.chapters[i].title}`);
    fill.className = 'story-fill'; fill.setAttribute('aria-hidden', 'true');
    b.append(fill); nav.append(b); buttons.push(b); fills.push(fill);
  }
  nav.style.gridTemplateColumns = `repeat(${count},minmax(0,1fr))`;
  stage.append(nav);
  const pause = document.createElement('button');
  pause.type = 'button'; pause.className = 'story-pause';
  stage.querySelector('.header').insertBefore(pause, stage.querySelector('.header .app-store'));
  const probe = document.createElement('div'); probe.className = 'story-safe-probe';
  probe.setAttribute('aria-hidden', 'true'); document.body.append(probe);
  const viewer = document.querySelector('.mobile-viewer-v26');
  const dialog = document.getElementById('download-dialog');
  const nativeGo = api.goTo.bind(api);
  let shown = Math.max(0, api.active), elapsed = 0, previousTime = performance.now();
  let requested = null, userPaused = reduce.matches, manuallySet = false, held = false, focused = false;
  let frame = 0, resizeTimer = 0, mounted = true, lastTint = '', lastTintAt = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const px = n => `${Math.round(n * 100) / 100}px`;
  function set(name, value) { if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value); }
  function setPause(value) {
    userPaused = value;
    pause.textContent = value ? 'Продолжить' : 'Пауза';
    pause.setAttribute('aria-label', value ? 'Продолжить автоматическую смену экранов' : 'Приостановить автоматическую смену экранов');
    pause.setAttribute('aria-pressed', String(value));
    previousTime = performance.now();
  }
  function tint() {
    const c = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (!c || c === lastTint) return;
    lastTint = c;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', c);
  }
  function fit() {
    if (!mounted) return;
    const vv = window.visualViewport;
    if (vv && Math.abs(vv.scale - 1) > .02) return;
    const h = Math.round(vv?.height || innerHeight), w = document.documentElement.clientWidth;
    const safe = getComputedStyle(probe), top = parseFloat(safe.paddingTop) || 0, bottom = parseFloat(safe.paddingBottom) || 0;
    set('--stories-height', px(h));
    const mobile = w <= 980, landscape = mobile && w > h && h <= 540;
    const headerTop = mobile ? Math.max(10, top + 6) : 24;
    set('--stories-header-top', px(headerTop));
    const headerH = mobile ? 44 : 58, navTop = headerTop + headerH + (mobile ? 3 : 4);
    set('--stories-nav-top', px(navTop));
    if (mobile) {
      const navBottom = navTop + (landscape ? 28 : 32);
      set('--stories-title-size', px(landscape ? clamp(h * .082, 25, 33) : clamp(h * .048, 27, 38)));
      set('--stories-description-size', px(h < 720 ? 13 : 14));
      const copies = [...stage.querySelectorAll('.scene:not(.scene-finale) .copy')];
      const copyH = Math.max(...copies.map(el => el.offsetHeight));
      const availableBottom = h - Math.max(18, bottom + 8);
      const copyTop = navBottom + (landscape ? 14 : 17);
      if (landscape) {
        const ph = Math.max(110, Math.min(availableBottom - copyTop - 10, w * .27 / .466));
        set('--stories-phone-x', '74%');
        set('--stories-phone-h', px(ph));
        set('--stories-phone-y', px(copyTop + (availableBottom - copyTop) / 2));
        set('--stories-copy-y', px(copyTop + (availableBottom - copyTop) / 2));
      } else {
        const minPhoneTop = copyTop + copyH + 20;
        const ph = Math.max(100, Math.min(availableBottom - minPhoneTop, (w - 110) / .466, 740));
        const slack = Math.max(0, availableBottom - minPhoneTop - ph);
        set('--stories-phone-x', '50%');
        set('--stories-phone-h', px(ph));
        set('--stories-phone-y', px(minPhoneTop + slack / 2 + ph / 2));
        set('--stories-copy-y', px(copyTop + copyH / 2));
      }
      set('--stories-finale-y', px(navBottom + (availableBottom - navBottom) * .47));
    }
    tint();
  }
  function progress() {
    for (let i = 0; i < count; i++) {
      fills[i].style.transform = `scaleX(${i < shown ? 1 : i === shown ? clamp(elapsed / duration, 0, 1).toFixed(5) : 0})`;
      if (i === shown) buttons[i].setAttribute('aria-current', 'step');
      else buttons[i].removeAttribute('aria-current');
    }
  }
  function navigate(index, behavior) {
    index = ((Math.round(Number(index) || 0) % count) + count) % count;
    shown = index; requested = index; elapsed = 0; previousTime = performance.now();
    nativeGo(index, behavior); progress();
  }
  api.goTo = navigate;
  nav.addEventListener('click', e => { const b = e.target.closest('button[data-story]'); if (b) navigate(Number(b.dataset.story)); });
  nav.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    const i = Number(e.target.closest('button')?.dataset.story) || 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? count - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + count) % count;
    navigate(to); buttons[to].focus({preventScroll: true});
  });
  pause.addEventListener('click', () => { manuallySet = true; setPause(!userPaused); });
  stage.addEventListener('pointerdown', e => { if (e.isPrimary) held = true; }, {passive: true});
  addEventListener('pointerup', () => { held = false; previousTime = performance.now(); }, {passive: true});
  addEventListener('pointercancel', () => { held = false; previousTime = performance.now(); }, {passive: true});
  stage.addEventListener('focusin', e => { focused = e.target.matches(':focus-visible') && !e.target.closest('.story-pause'); });
  stage.addEventListener('focusout', () => { focused = false; });
  new MutationObserver(() => {
    const actual = Math.max(0, api.active);
    if (!api.isNavigating) {
      if (actual !== shown) { shown = actual; elapsed = 0; previousTime = performance.now(); }
      requested = null;
    } else if (actual !== shown && requested === null) {
      shown = actual; elapsed = 0; previousTime = performance.now();
    }
    tint();
  }).observe(stage, {attributes: true, attributeFilter: ['data-scene', 'data-navigating']});
  function blocked() {
    return userPaused || held || focused || document.hidden || !mounted || !!document.getElementById('app-loader') ||
      !!dialog?.open || !!viewer?.classList.contains('is-open') || api.isSnapping;
  }
  function tick(now) {
    frame = 0;
    const dt = Math.min(100, Math.max(0, now - previousTime)); previousTime = now;
    if (!blocked()) {
      elapsed += dt;
      if (elapsed >= duration) {
        elapsed = 0; shown = (shown + 1) % count; requested = shown;
        nativeGo(shown);
      }
    }
    progress();
    if (now - lastTintAt > 90) { lastTintAt = now; tint(); }
    if (!document.hidden && mounted) frame = requestAnimationFrame(tick);
  }
  function scheduleFit() { clearTimeout(resizeTimer); resizeTimer = setTimeout(fit, 180); }
  addEventListener('resize', scheduleFit, {passive: true});
  window.visualViewport?.addEventListener('resize', scheduleFit, {passive: true});
  document.fonts?.ready.then(fit);
  document.addEventListener('visibilitychange', () => {
    previousTime = performance.now();
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; held = false; }
    else if (!frame) frame = requestAnimationFrame(tick);
  });
  addEventListener('pagehide', () => { mounted = false; cancelAnimationFrame(frame); frame = 0; });
  addEventListener('pageshow', () => { mounted = true; previousTime = performance.now(); fit(); if (!frame) frame = requestAnimationFrame(tick); });
  reduce.addEventListener('change', e => { if (!manuallySet) setPause(e.matches); });
  window.KhochuStories = {
    next: () => navigate(shown + 1), previous: () => navigate(shown - 1), goTo: navigate,
    pause: () => setPause(true), resume: () => setPause(false), fit,
    getState: () => ({shown, actual: api.active, elapsed, duration, paused: blocked(), userPaused, browserColor: lastTint})
  };
  setPause(userPaused); fit(); progress(); frame = requestAnimationFrame(tick);
})();
