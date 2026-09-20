
/* Video-only integration. The original landing is not reimplemented. */
(() => {
  'use strict';
  const stage = document.getElementById('stage');
  const phone = document.getElementById('phone');
  if (!stage || !phone) return;
  const selector = 'video[data-landing-video]';
  const screenByScene = {0:'home',1:'search',2:'neuro',4:'chats',5:'tickets',6:'create'};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const watched = new WeakSet(), pending = new WeakSet(), wanted = new Set();
  let previousMain = null, previousViewer = null, viewerOpened = false;
  let scheduled = 0, inPage = true;
  const viewer = document.querySelector('.mobile-viewer-v26');
  function configure(video) {
    video.controls = false;
    video.removeAttribute('controls');
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.setAttribute('controlslist','nodownload nofullscreen noremoteplayback noplaybackrate');
    video.setAttribute('aria-hidden','true');
    video.tabIndex = -1;
  }
  function tryPlay(video) {
    if (!wanted.has(video) || pending.has(video) || !video.paused) return;
    video.muted = true;
    pending.add(video);
    const promise = video.play();
    if (!promise?.then) {pending.delete(video);return;}
    promise.then(() => {
      pending.delete(video);
      if (!wanted.has(video)) video.pause();
    }).catch(() => {
      pending.delete(video);
      // Keep the poster when the browser rejects autoplay. No player is revealed.
      // The next ordinary page gesture retries playback without intercepting it.
    });
  }
  function watch(video) {
    if (watched.has(video)) return;
    watched.add(video);
    configure(video);
    video.addEventListener('loadeddata', () => tryPlay(video));
    video.addEventListener('canplay', () => tryPlay(video));
    video.addEventListener('playing', () => {if(!wanted.has(video))video.pause();});
    new MutationObserver(() => {
      if (video.hasAttribute('controls')) {video.controls=false;video.removeAttribute('controls');}
    }).observe(video,{attributes:true,attributeFilter:['controls']});
  }
  function seek(video, time=0) {if(video)try{video.currentTime=time;}catch(_){}}
  function sync() {
    scheduled=0;
    const mains=[...phone.querySelectorAll(selector)];
    const open=!!viewer&&viewer.classList.contains('is-open')&&matchMedia('(max-width:980px)').matches;
    const enlargedVideos=viewer?[...viewer.querySelectorAll(selector)]:[];
    const all=mains.concat(enlargedVideos);
    all.forEach(watch);
    const key=screenByScene[Number(stage.dataset.scene)];
    const main=mains.find(v=>v.dataset.screen===key)||null;
    const screen=open?[...viewer.querySelectorAll('.mv-frame .screen-image')].find(el=>el.style.zIndex==='2'):null;
    const enlarged=screen?.matches(selector)?screen:null;
    if(main!==previousMain)seek(main);
    if(enlarged!==previousViewer) {
      const same=open&&!viewerOpened&&main&&enlarged&&main.dataset.screen===enlarged.dataset.screen;
      seek(enlarged,same?main.currentTime:0);
    }
    previousMain=main;previousViewer=enlarged;viewerOpened=open;
    wanted.clear();
    if(inPage&&!document.hidden&&!reduced.matches&&!document.getElementById('download-dialog')?.open) {
      const active=open?enlarged:main;
      if(active)wanted.add(active);
    }
    all.forEach(v=>{if(wanted.has(v))tryPlay(v);else if(!v.paused)v.pause();});
    const dots=viewer?.querySelector('.mv-dots');
    if(dots){dots.hidden=true;dots.inert=true;dots.setAttribute('aria-hidden','true');}
  }
  function schedule(){if(!scheduled)scheduled=requestAnimationFrame(sync);}
  new MutationObserver(schedule).observe(stage,{attributes:true,attributeFilter:['data-scene','data-navigating']});
  if(viewer)new MutationObserver(schedule).observe(viewer,{attributes:true,childList:true,subtree:true,attributeFilter:['class','style']});
  const dialog=document.getElementById('download-dialog');
  if(dialog)new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',sync);
  addEventListener('pagehide',()=>{inPage=false;sync();});
  addEventListener('pageshow',()=>{inPage=true;schedule();});
  addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener('change',sync);
  document.addEventListener('pointerup',()=>wanted.forEach(tryPlay),{passive:true});
  document.addEventListener('touchend',()=>wanted.forEach(tryPlay),{passive:true});
  document.addEventListener('keydown',()=>wanted.forEach(tryPlay),{passive:true});
  sync();
})();

