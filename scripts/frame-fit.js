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
    // CSS width/height are unaffected by perspective, unlike getBoundingClientRect().
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
