
/* Хочу / v5. Native scrolling and explicit two-scene navigation transitions.
 * No wheel hijacking, third-party scripts, remote fonts or runtime requests.
 * The phone anchor's position and transform are NEVER modified by this script.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const stage = document.getElementById('stage');
  const story = document.getElementById('story');
  if (!stage || !story) return;
  const config = window.HOCHU_CONFIG || {};
  const phone = document.getElementById('phone');
  const nav = document.getElementById('journey-nav');
  const navSteps = [...document.querySelectorAll('.journey-step')];
  const imageNodes = [...document.querySelectorAll('.screen-image')];
  const announcement = document.getElementById('scene-announcement');
  const navIndicator = nav.querySelector('.nav-active-bg');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const maskSupported = CSS.supports('mask-image', 'linear-gradient(black, transparent)');

  const chapters = [
    {id:'start', screen:'home', title:'Хочу - Жизнь вашего города в одном приложении', caption:'События от людей и афиш, сообществ и блогеров, чаты с друзьями — всё, чтобы от идеи дойти до встречи', word:'ХОЧУ', tone:'blue', bg:'#079fee', fg:'#ffffff', muted:'#d8f2ff', accent:'#c6f1ff', aura:'#a0e9ff', reveal:'up'},
    {id:'search', screen:'search', title:'Ищите досуг так, как удобно вам', caption:'С помощью удобных фильтров в списке и на карте — по настроению, компании, бюджету и многому другому', word:'СЕГОДНЯ', tone:'light', bg:'#f6f6ef', fg:'#243347', muted:'#818578', accent:'#0b9bcf', aura:'#dfecc1', reveal:'up'},
    {id:'neuro', screen:'neuro', title:'А мы подскажем, что может понравиться', caption:'Нейроподборка · Для вас', word:'ДЛЯ ВАС', tone:'dark', bg:'#101125', fg:'#faf9ff', muted:'#aaa5c3', accent:'#d7aaff', aura:'#6d3a9e', reveal:'iris'},
    {id:'feed', screen:'feed', title:'Иногда всё начинается с поста', caption:'События и подборки от людей и сообществ, который становится планами', word:'ВДОХНОВЕНИЕ', tone:'light', bg:'#fcf1ed', fg:'#3e303a', muted:'#97828a', accent:'#d97672', aura:'#f5caba', reveal:'side'},
    {id:'chats', screen:'chats', title:'Нашли событие?', caption:'Делитесь впечатлениями в чате, обсуждайте детали встреч', word:'ВМЕСТЕ', tone:'light', bg:'#eaf7f2', fg:'#203f45', muted:'#6e908d', accent:'#069db2', aura:'#b7e6db', reveal:'up'},
    {id:'tickets', screen:'tickets', title:'Нужен билет? Выберите, где купить', caption:'Предложения разных площадок', word:'ИДЁМ', tone:'light', bg:'#edf6ff', fg:'#203853', muted:'#7c95ad', accent:'#019bdc', aura:'#b9dff4', reveal:'up'},
    {id:'create', screen:'create', title:'А в следующий раз вдохновите других', caption:'Посты · События · Подборки', word:'СОЗДАВАЙТЕ', tone:'light', bg:'#f3effb', fg:'#352d49', muted:'#9485a5', accent:'#9b6acf', aura:'#d5bfef', reveal:'side'},
    {id:'together', screen:'home', title:'Хочу - уже повод', caption:'Находите идеи, зовите друзей, обсуждайте планы, покупайте билеты и превращайте онлайн-интерес в реальные встречи в городе', word:'ХОЧУ', tone:'blue', bg:'#079fee', fg:'#ffffff', muted:'#d8f2ff', accent:'#c6f1ff', aura:'#a0e9ff', reveal:'iris'},
  ];
  nav.style.setProperty('--chapter-count', String(chapters.length));
  const clamp = (n, a=0, b=1) => Math.max(a, Math.min(b,n));
  const mix = (a,b,t) => a+(b-a)*t;
  const smooth = n => {n=clamp(n); return n*n*(3-2*n);};
  const smoother = n => {n=clamp(n); return n*n*n*(n*(n*6-15)+10);};
  const outCubic = n => 1-Math.pow(1-clamp(n),3);
  const hex = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const keys=['bg','fg','muted','accent','aura'];
  chapters.forEach(c => keys.forEach(k=>{c[k+'RGB']=hex(c[k]);}));
  const scenes = [...document.querySelectorAll('.scene')].map((el,i) => {
    const c=chapters[i];
    ['fg','muted','accent','bg'].forEach(k=>el.style.setProperty('--local-'+k,c[k]));
    return { el, copy:el.querySelector('.copy'), eye:el.querySelector('.eyebrow'), heading:el.querySelector('h1,h2'), lines:[...el.querySelectorAll('.line-inner')], description:el.querySelector('.description'), micro:el.querySelector('.micro-label'), button:el.querySelector('.story-button'), art:el.querySelector('.art-enter') };
  });
  imageNodes.forEach(img => { if (typeof img.decode==='function') img.decode().catch(()=>{}); });

  let step=1, maxScroll=1, active=-1, visual=0, target=0, raf=0, lastTime=0;
  let isReduced=reducedQuery.matches, compact=false, lastVisible=new Set();
  let announceTimer=0, resizeTimer=0, navigation=null, initial=true;
  let snapTimer=0, snapState=null, snapRaf=0;
  const dampMs=clamp(Number(config.scrollSmoothingMs)||185,80,420);
  const snapDelayMs=clamp(Number(config.scrollSnapDelayMs)||150,80,400);
  const snapDurationMs=clamp(Number(config.scrollSnapDurationMs)||420,220,800);

  function activate(index) {
    if (active===index) return;
    active=index;
    const c=chapters[index];
    stage.dataset.scene=String(index);
    stage.dataset.tone=c.tone;
    nav.style.setProperty('--active',String(index));
    navSteps.forEach((el,i)=>{
      el.classList.toggle('is-active',i===index);
      el.classList.toggle('is-past',i<index);
      if (i===index) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
    });
    /* Mobile rail centering is handled by the final smooth-nav controller. */
    scenes.forEach((scene,i)=>{
      scene.el.inert=i!==index;
      scene.el.setAttribute('aria-hidden',String(i!==index));
      scene.el.classList.toggle('is-active',i===index);
    });
    phone.setAttribute('aria-label','Экран приложения Хочу: '+c.title);
    clearTimeout(announceTimer);
    announceTimer=setTimeout(()=>{ announcement.textContent=`${index+1} из ${chapters.length}. ${c.title}`; },600);
  }

  function paintElement(el, opacity, y, blur, rotation=0) {
    if (!el) return;
    el.style.opacity=String(clamp(opacity));
    if(compact){
      el.style.transform=isReduced?'none':`translate3d(0,${(y*.22).toFixed(2)}px,0)`;
      el.style.filter='none';
      return;
    }
    el.style.transform=isReduced?'none':`perspective(900px) translate3d(0,${y.toFixed(2)}px,0) rotateX(${rotation.toFixed(2)}deg)`;
    el.style.filter=isReduced||blur<.025?'none':`blur(${blur.toFixed(2)}px)`;
  }

  function paintScene(index, phase, role, direction=1) {
    const s=scenes[index];
    s.el.style.visibility='visible';
    s.el.classList.add('is-visible');
    const stable=role==='stable';
    const incoming=role==='in';
    if (compact) {
      // Phones fade the whole block as one composited layer. Animating each line
      // separately repainted the text every frame, which is what stuttered.
      if(s.el.dataset.flatCopy!=='1'){
        [s.eye,...s.lines,s.heading,s.description,s.micro,s.button].filter(Boolean)
          .forEach(el=>{el.style.opacity='1';el.style.transform='none';el.style.filter='none';});
        s.el.dataset.flatCopy='1';
      }
      let weight=1;
      if(!stable && !isReduced){
        // The outgoing copy is gone before the incoming one arrives — never a
        // cross-dissolve, because on a narrow screen both share the same band.
        weight=incoming?smoother(clamp((phase-.46)/.54)):1-smoother(clamp(phase/.42));
      }
      s.copy.style.opacity=String(clamp(weight));
      paintSceneArt(s,phase,stable,incoming,direction);
      return;
    }
    if(s.el.dataset.flatCopy==='1'){s.copy.style.removeProperty('opacity');delete s.el.dataset.flatCopy;}
    // Masked lines leave upwards; incoming lines settle one after another.
    const parts=[s.eye,...s.lines,s.description,s.micro,s.button];
    // Never leave stale line transforms when changing orientation.
    s.heading.style.opacity='1';s.heading.style.transform='none';s.heading.style.filter='none';
    parts.filter(Boolean).forEach((el,n)=>{
      let weight=1, y=0, blur=0, rot=0;
      if (!stable && !isReduced) {
        if(incoming) {
          const start=.235+n*.022;
          const enter=outCubic((phase-start)/(.94-start));
          weight=enter; y=(1-enter)*(58+n*3); blur=(1-enter)*6; rot=(1-enter)*9;
        } else {
          const leave=smooth((phase-n*.012)/.48);
          weight=1-leave; y=-leave*(50+n*2); blur=leave*4; rot=-leave*8;
        }
      }
      paintElement(el,weight,y*direction,blur,rot*direction);
    });
    paintSceneArt(s,phase,stable,incoming,direction);
  }

  function paintSceneArt(s,phase,stable,incoming,direction) {
    let enter=1,exit=0;
    if(!stable&&!isReduced) {
      if(compact){
        if(incoming) enter=smoother(clamp((phase-.46)/.54));
        else exit=smoother(clamp(phase/.42));
      } else {
        if(incoming) enter=outCubic((phase-.20)/.80);
        else exit=smooth(phase/.67);
      }
    }
    s.el.style.setProperty('--enter',String(enter));
    s.el.style.setProperty('--exit',String(exit));
    const artOpacity=enter*(1-exit);
    s.art.style.opacity=String(artOpacity);
    if(compact){
      s.art.style.transform='none';
      s.art.style.filter='none';
    } else {
      s.art.style.transform=isReduced?'none':`perspective(1100px) translate3d(${((1-enter)*52+exit*25).toFixed(2)}px,${(((1-enter)*64-exit*42)*direction).toFixed(2)}px,0) rotate(${((1-enter)*-8+exit*7).toFixed(2)}deg) rotateY(${((1-enter)*-10+exit*7).toFixed(2)}deg) scale(${(1-(1-enter)*.13-exit*.1).toFixed(4)})`;
      s.art.style.filter=isReduced||artOpacity>.998?'none':`blur(${((1-artOpacity)*4).toFixed(2)}px)`;
    }
  }

  function paintScreens(a,b,t,direction=1) {
    const mobileT=smoother(clamp(t,0,1));
    for(const img of imageNodes) {
      const name=img.dataset.screen;
      img.style.maskImage='none'; img.style.webkitMaskImage='none'; img.style.clipPath='none';
      img.style.transition='none';
      img.style.backfaceVisibility='hidden'; img.style.webkitBackfaceVisibility='hidden';

      if(compact){
        /* Phones only get opacity here. Masks and clip paths repaint the full-size
           screenshot every frame, which is what made the device stutter. */
        img.style.transform='none';
        img.style.zIndex='0';
        img.style.opacity='0';
        if(a.screen===b.screen){
          if(name===a.screen){img.style.opacity='1';img.style.zIndex='2';}
          continue;
        }
        if(name===a.screen){
          /* The previous screen stays solid underneath, so no frame is ever blank. */
          img.style.opacity='1';img.style.zIndex='1';
        } else if(name===b.screen){
          img.style.opacity=String(1-Math.pow(1-mobileT,3));
          img.style.zIndex='2';
        }
        continue;
      }

      img.style.transform='none';
      if(name===a.screen) {img.style.opacity='1';img.style.zIndex='1';}
      else {img.style.opacity='0';img.style.zIndex='0';}
      if(a.screen!==b.screen && name===b.screen) {
        img.style.zIndex='2';
        img.style.opacity=t<.0001?'0':'1';
        if(t>.9999) {img.style.clipPath='none';continue;}
        if(b.reveal==='iris') {
          img.style.clipPath=`circle(${(t*117).toFixed(3)}% at 50% 44%)`;
          img.style.opacity=String(Math.min(1,t*4));
        } else if(maskSupported) {
          const edge=t*119-9;
          const revealDirection=b.reveal==='side'?'to right':'to top';
          const mask=`linear-gradient(${revealDirection},#000 ${edge.toFixed(2)}%,transparent ${(edge+11).toFixed(2)}%)`;
          img.style.maskImage=mask; img.style.webkitMaskImage=mask;
        } else { img.style.opacity=String(t); }
      }
    }
  }

  function paintPair(from,to,phase,blend,screenBlend,position,direction=1,direct=false) {
    const selected=phase>.51?to:from;
    activate(selected);
    const a=chapters[from],b=chapters[to];
    const palette={};
    keys.forEach(k=>{palette[k]=a[k+'RGB'].map((v,i)=>Math.round(mix(v,b[k+'RGB'][i],blend)));});
    if(!isReduced && (a.tone==='dark'||b.tone==='dark') && a.tone!==b.tone) {
      // Travel through a violet twilight, not a desaturated gray midpoint.
      const tint=b.tone==='dark'?[-8,-31,26]:[12,-25,29];
      const bell=Math.sin(Math.PI*blend);
      palette.bg=palette.bg.map((v,i)=>Math.round(clamp(v+tint[i]*bell,0,255)));
    }
    if(!isReduced && (a.tone==='light')!==(b.tone==='light')) {
      // Opposite foreground colors must not cancel each other at the midpoint.
      const luma=palette.bg[0]*.2126+palette.bg[1]*.7152+palette.bg[2]*.0722;
      const useDarkInk=luma>157;
      const ink=(a.tone==='light')===useDarkInk?a:b;
      ['fg','muted','accent'].forEach(k=>{palette[k]=ink[k+'RGB'];});
    }
    keys.forEach(k=>root.style.setProperty('--'+k,isReduced?chapters[selected][k]:`rgb(${palette[k].join(',')})`));
    const fg=isReduced?chapters[selected].fgRGB:palette.fg;
    root.style.setProperty('--border',`rgba(${fg.join(',')},.16)`);
    root.style.setProperty('--panel',`rgba(${fg.join(',')},.065)`);
    root.style.setProperty('--next-aura',b.aura);
    root.style.setProperty('--bloom',isReduced?'0':String(Math.sin(Math.PI*blend)));
    root.style.setProperty('--motion',String(blend));
    root.style.setProperty('--journey',String(position));
    // The same three broad bands drift gently between the two endpoint palettes.
    const bandOpacity=c=>c.tone==='light'?.86:(c.tone==='dark'?.055:.16);
    root.style.setProperty('--band-opacity',String(mix(bandOpacity(a),bandOpacity(b),blend)));
    root.style.setProperty('--band-angle',`${mix(-23+from*1.8,-23+to*1.8,blend)}deg`);
    root.style.setProperty('--band-x',`${mix(Math.sin(from*.8)*18,Math.sin(to*.8)*18,blend)}px`);
    root.style.setProperty('--band-y',`${mix(Math.cos(from*.65)*24,Math.cos(to*.65)*24,blend)}px`);
    paintPairScenes(from,to,phase,selected,direction);
    if(isReduced)paintScreens(chapters[selected],chapters[selected],0,direction); else paintScreens(a,b,screenBlend,direction);
    paintNavProgress(selected,position,phase,direct);
  }

  function paintPairScenes(from,to,phase,selected,direction) {
    const visible=new Set();
    if(isReduced || from===to) {paintScene(selected,0,'stable');visible.add(selected);}
    else {
      paintScene(from,phase,phase===0?'stable':'out',direction);visible.add(from);
      if(phase>0) {paintScene(to,phase,'in',direction);visible.add(to);}
    }
    for(const i of lastVisible) if(!visible.has(i)){scenes[i].el.style.visibility='hidden';scenes[i].el.classList.remove('is-visible');}
    lastVisible=visible;
  }

  function paintNavProgress(selected,position,phase,direct) {
    // True total progress is distributed across the labeled navigation segments.
    const navProgress=(direct?selected:position)/(chapters.length-1)*chapters.length;
    navSteps.forEach((el,i)=>{
      const fill=clamp(navProgress-i).toFixed(3);
      if(el.dataset.fill===fill)return;
      el.dataset.fill=fill;
      el.style.setProperty('--fill',fill);
    });
    navIndicator.style.opacity=direct?String(.3+.7*Math.abs(phase*2-1)):'1';
  }


  function paint(position) {
    position=clamp(position,0,chapters.length-1);
    const from=Math.floor(position), to=Math.min(chapters.length-1,from+1), local=position-from;
    paintPair(from,to,clamp((local-.22)/.74),smoother((local-.14)/.82),smoother((local-.20)/.76),position);
  }

  function update(now) {
    raf=0;
    const dt=lastTime?Math.min(48,now-lastTime):16.67;
    lastTime=now;
    if(navigation) {
      // Native scroll is already parked at the destination. Only these two
      // scenes participate: e.g. 7 -> 0, with no intermediate chapter renders.
      const n=navigation;
      const t=clamp((now-n.start)/n.duration);
      paintPair(n.from,n.to,t,smoother(t),smoother((t-.10)/.86),n.to,n.direction,true);
      if(t<1) { raf=requestAnimationFrame(update); return; }
      if(compact) window.scrollTo({top:n.to*step,behavior:'instant'});
      navigation=null;
      stage.removeAttribute('data-navigating');
      visual=target=n.to;
      paint(visual);
      lastTime=0;
      return;
    }
    target=clamp(window.scrollY/step,0,chapters.length-1);
    visual=isReduced?target:mix(visual,target,1-Math.exp(-dt/dampMs));
    if(Math.abs(target-visual)<.000045)visual=target;
    paint(visual);
    if(Math.abs(target-visual)>.000045)raf=requestAnimationFrame(update);
    else lastTime=0;
  }
  function requestPaint(){if(!raf)raf=requestAnimationFrame(update);}

  function layoutTitles() {
    root.style.removeProperty('--heading-size');
    scenes.forEach(s=>s.copy.style.removeProperty('width'));
    if(compact && !(innerHeight<=510 && innerWidth>innerHeight)) return;
    const heroStyle=getComputedStyle(scenes[0].heading);
    const baseSize=parseFloat(heroStyle.fontSize);
    const maxWidth=Math.max(120,scenes[0].copy.getBoundingClientRect().right-(innerWidth<1100?22:28));
    const measureEl=document.createElement('span');
    measureEl.style.cssText='position:absolute;visibility:hidden;white-space:pre;width:max-content;pointer-events:none';
    measureEl.style.fontFamily=heroStyle.fontFamily;
    measureEl.style.fontWeight=heroStyle.fontWeight;
    measureEl.style.fontSize=baseSize+'px';
    measureEl.style.letterSpacing=heroStyle.letterSpacing;
    stage.append(measureEl);
    const width=text=>{measureEl.textContent=text;return measureEl.getBoundingClientRect().width;};
    // Fit the longest indivisible word ONCE, across the entire presentation.
    // This prevents a later title from switching to a smaller type size.
    const longest=Math.max(...scenes.flatMap(s=>s.heading.textContent.trim().split(/\s+/).map(width)));
    const sharedSize=Math.min(baseSize,baseSize*(maxWidth-6)/longest);
    root.style.setProperty('--heading-size',sharedSize.toFixed(3)+'px');
    const finalStyle=getComputedStyle(scenes[0].heading);
    measureEl.style.fontSize=finalStyle.fontSize;
    measureEl.style.letterSpacing=finalStyle.letterSpacing;
    scenes.forEach(s=>{
      const originalWidth=s.copy.getBoundingClientRect().width;
      const desired=Math.max(...s.lines.map(line=>width(line.textContent.trim())))+6;
      s.copy.style.width=Math.ceil(Math.min(maxWidth,Math.max(originalWidth,desired)))+'px';
    });
    measureEl.remove();
  }

  function measure(preserve=false) {
    cancelSnap();
    const old=navigation?navigation.to:(step>1?window.scrollY/step:0);
    root.style.removeProperty('--phone-h');
    const height=stage.getBoundingClientRect().height;
    compact=innerWidth<=980 || innerHeight<=510;
    layoutTitles();
    // On phones, reserve a text zone between the tab rail and a much larger device.
    // The copy is centered in that zone instead of being pinned to an arbitrary Y coordinate.
    if(innerWidth<=980 && !(innerHeight<=510 && innerWidth>innerHeight)) {
      const phoneScenes=scenes.filter((_,i)=>i<chapters.length-1);
      // 14px keeps the headline clear of the tab rail instead of touching it.
      const navBottom=Math.max(nav.getBoundingClientRect().bottom,innerWidth<=360?88:100)+14;
      const maxCopyHeight=Math.max(...phoneScenes.map(s=>s.copy.offsetHeight));
      const bottom=innerHeight<=650&&innerWidth<=600?10:16;
      const ratio=innerHeight<=650?.56:(innerWidth<=430?.64:.66);
      const maxByWidth=(innerWidth*.80)/.466;
      const desired=Math.min(height*ratio,maxByWidth);
      // Breathing room between the last line of copy and the top of the device.
      const gap=innerHeight<=650?26:38;
      const available=Math.max(230,height-bottom-(navBottom+maxCopyHeight+gap));
      const phoneHeight=Math.max(230,Math.min(desired,available));
      root.style.setProperty('--phone-h',Math.floor(phoneHeight)+'px');
      const phoneTop=height-bottom-phoneHeight;
      // Every chapter's copy sits the same distance above the device. Centering
      // one shared axis in the band instead left the taller chapters crowding
      // the phone while the shorter ones floated, which read as uneven.
      root.style.removeProperty('--mobile-copy-y');
      phoneScenes.forEach(s=>{
        const own=s.copy.offsetHeight;
        const center=Math.max(navBottom+own/2,phoneTop-gap-own/2);
        s.copy.style.setProperty('--mobile-copy-y',Math.round(center)+'px');
      });
    } else {
      root.style.removeProperty('--mobile-copy-y');
      scenes.forEach(s=>s.copy.style.removeProperty('--mobile-copy-y'));
    }
    step=Math.round(height*clamp(Number(config.chapterLength)||1.25,.8,2));
    maxScroll=step*(chapters.length-1);
    story.style.height=`${Math.ceil(maxScroll+height)}px`;
    if(preserve){navigation=null;stage.removeAttribute('data-navigating');window.scrollTo({top:clamp(old,0,chapters.length-1)*step,behavior:'instant'});}
    target=clamp(window.scrollY/step,0,chapters.length-1);
    if(initial || preserve){visual=target;initial=false;}
    requestPaint();
  }

  function cancelSnap() {
    clearTimeout(snapTimer); snapTimer=0;
    if(snapState) snapState.cancelled=true;
    snapState=null;
    if(snapRaf){cancelAnimationFrame(snapRaf);snapRaf=0;}
  }

  function runSnap(now) {
    snapRaf=0;
    const s=snapState;
    if(!s||s.cancelled||navigation)return;
    const t=clamp((now-s.start)/s.duration);
    const eased=smoother(t);
    window.scrollTo({top:mix(s.from,s.to,eased),behavior:'instant'});
    requestPaint();
    if(t<1){snapRaf=requestAnimationFrame(runSnap);return;}
    window.scrollTo({top:s.to,behavior:'instant'});
    snapState=null;
    const settled=clamp(Math.round(s.to/step),0,chapters.length-1);
    target=visual=settled;
    paint(settled);
    requestPaint();
  }

  function snapToNearest() {
    clearTimeout(snapTimer); snapTimer=0;
    if(navigation||snapState||step<=1)return;
    const position=clamp(window.scrollY/step,0,chapters.length-1);
    const nearest=clamp(Math.round(position),0,chapters.length-1);
    const destination=nearest*step;
    if(Math.abs(window.scrollY-destination)<1){
      window.scrollTo({top:destination,behavior:'instant'});
      return;
    }
    snapState={from:window.scrollY,to:destination,start:performance.now(),duration:snapDurationMs,cancelled:false};
    snapRaf=requestAnimationFrame(runSnap);
  }

  function scheduleSnap() {
    if(navigation||snapState)return;
    clearTimeout(snapTimer);
    snapTimer=setTimeout(snapToNearest,snapDelayMs);
  }

  function goTo(index, behavior) {
    if(!Number.isFinite(index))return;
    cancelSnap();
    index=clamp(Math.round(index),0,chapters.length-1);
    const from=active<0?Math.round(visual):active;
    isReduced=reducedQuery.matches;
    const instant=isReduced||behavior==='instant'||behavior==='auto'||from===index;
    navigation=null;
    target=visual=index;
    if(instant) {
      stage.removeAttribute('data-navigating');
      window.scrollTo({top:index*step,behavior:'instant'});
      paint(index); requestPaint(); return;
    }
    navigation={from,to:index,start:performance.now(),
      duration:clamp(Number(config.navigationDurationMs)||1080,760,1800),direction:index>from?1:-1};
    stage.dataset.navigating='true';
    // Desktop and mobile now share one visual transition. On mobile the real
    // document scroll is synchronized only after the animation has finished,
    // avoiding a visualViewport/layout jump while the phone and copy animate.
    if(!compact) window.scrollTo({top:index*step,behavior:'instant'});
    paintPair(from,index,0,0,0,index,navigation.direction,true);
    lastTime=0;
    requestPaint();
  }

  function cancelNavigation() {
    if(!navigation)return;
    // Return control to the user at the dominant visible scene, avoiding
    // the numerical scroll tween that used to expose unwanted chapters.
    const index=active;
    navigation=null;
    stage.removeAttribute('data-navigating');
    visual=target=index;
    window.scrollTo({top:index*step,behavior:'instant'});
    paint(index);
    requestPaint();
  }
  document.querySelectorAll('[data-goto]').forEach(el=>el.addEventListener('click',()=>goTo(Number(el.dataset.goto))));
  addEventListener('scroll',()=>{requestPaint();if(!navigation&&!snapState)scheduleSnap();},{passive:true});
  // A person always retains control of native scrolling; manual input cancels a nav tween.
  addEventListener('wheel',e=>{
    if(snapState)cancelSnap();
    clearTimeout(snapTimer);snapTimer=0;
    if(!navigation||e.ctrlKey)return;
    // The compositor may apply this wheel before JavaScript sees it. During
    // the one interruption frame, reapply its delta after rebasing the scroll.
    // All ordinary wheel events remain entirely native and unmodified.
    if(e.cancelable)e.preventDefault();
    const unit=e.deltaMode===1?16:(e.deltaMode===2?stage.clientHeight:1);
    cancelNavigation();
    window.scrollBy({top:e.deltaY*unit,left:e.deltaX*unit,behavior:'instant'});
    requestPaint();
  },{passive:false});
  // A tap on the rail starts its navigation on pointerdown, which fires first —
  // cancelling here would kill the jump the tap just asked for.
  addEventListener('touchstart',e=>{
    if(e.target?.closest?.('.journey-nav'))return;
    cancelSnap();cancelNavigation();
  },{passive:true});
  // Dragging the native scrollbar should also cancel a pending chapter animation.
  addEventListener('pointerdown',e=>{if(e.clientX>=document.documentElement.clientWidth){cancelSnap();cancelNavigation();}},{passive:true});
  addEventListener('resize',()=>{
    clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>measure(true),140);
  },{passive:true});
  reducedQuery.addEventListener('change',e=>{
    const destination=navigation?.to;
    isReduced=e.matches;
    if(destination!==undefined)goTo(destination,'instant');
    root.style.setProperty('--mx','0px');root.style.setProperty('--my','0px');requestPaint();
  });
  addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.getElementById('download-dialog').open)return;
    if(['ArrowUp','ArrowDown','PageUp','PageDown',' '].includes(e.key))cancelNavigation();
    if(e.key==='ArrowRight'){e.preventDefault();goTo(active+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();goTo(active-1);}
    if(e.key==='Home'){e.preventDefault();goTo(0);}
    if(e.key==='End'){e.preventDefault();goTo(chapters.length-1);}
  });
  // Independent, subtle pointer parallax never touches the phone or copy layout.
  if(matchMedia('(pointer:fine)').matches) {
    let pointerRaf=0,px=0,py=0;
    addEventListener('pointermove',e=>{
      if(isReduced)return;
      px=(e.clientX/innerWidth-.5)*12;py=(e.clientY/innerHeight-.5)*10;
      if(!pointerRaf)pointerRaf=requestAnimationFrame(()=>{root.style.setProperty('--mx',px.toFixed(2)+'px');root.style.setProperty('--my',py.toFixed(2)+'px');pointerRaf=0;});
    },{passive:true});
    document.addEventListener('mouseleave',()=>{root.style.setProperty('--mx','0px');root.style.setProperty('--my','0px');});
  }

  // Horizontal swipe changes chapters on touch devices. The top rail keeps its own native horizontal scroll.
  let swipeGesture=null;
  stage.addEventListener('touchstart',e=>{
    if(innerWidth>980||e.touches.length!==1||e.target.closest('.journey-nav,.app-store,.download-dialog,button,a,input,textarea,select'))return;
    const t=e.touches[0];
    if(t.clientX<24||t.clientX>innerWidth-24)return; // keep OS edge gestures intact
    swipeGesture={x:t.clientX,y:t.clientY,time:performance.now()};
  },{passive:true});
  stage.addEventListener('touchend',e=>{
    if(!swipeGesture||innerWidth>980){swipeGesture=null;return;}
    const t=e.changedTouches[0],dx=t.clientX-swipeGesture.x,dy=t.clientY-swipeGesture.y;
    const dt=Math.max(1,performance.now()-swipeGesture.time),vx=Math.abs(dx)/dt;
    swipeGesture=null;
    if(Math.abs(dx)<46||Math.abs(dx)<Math.abs(dy)*1.25||vx<.16)return;
    goTo(active+(dx<0?1:-1));
  },{passive:true});
  stage.addEventListener('touchcancel',()=>{swipeGesture=null;},{passive:true});

  // App Store: configure the real product URL once in config.js; never guess an app ID.
  const dialog=document.getElementById('download-dialog');
  const downloadButtons=[...document.querySelectorAll('[data-download]')];
  let appStoreURL=null;
  try {
    if(config.appStoreUrl){const url=new URL(config.appStoreUrl);if(url.protocol==='https:'&&url.hostname==='apps.apple.com')appStoreURL=url.href;}
  } catch(e){console.warn('Некорректная ссылка на App Store в HOCHU_CONFIG.');}
  downloadButtons.forEach(button=>button.addEventListener('click',()=>{
    if(appStoreURL) {window.open(appStoreURL,'_blank','noopener,noreferrer');}
    else if(typeof dialog.showModal==='function')dialog.showModal();
    else window.alert('В этой версии сайта ссылка на приложение ещё не указана.');
  }));
  dialog.querySelectorAll('.dialog-close,.dialog-ok').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});

  function indexFromHash() {
    const id=location.hash.slice(1);
    // Old #city links resolve to the merged opening chapter.
    return chapters.findIndex(c=>c.id===(id==='city'?'start':id));
  }
  function routeHash() {const i=indexFromHash();if(i>=0)goTo(i,'instant');}
  addEventListener('hashchange',()=>{const i=indexFromHash();if(i>=0)goTo(i);});
  addEventListener('pageshow',requestPaint);
  measure(); routeHash(); paint(visual);
  // Small integration API, also used by the supplied regression test.
  window.HochuStory={
    goTo, chapters:chapters.map(({id,title})=>({id,title})),
    get active(){return active;}, get step(){return step;}, get progress(){return visual;},
    get isNavigating(){return Boolean(navigation);}, get isSnapping(){return Boolean(snapState);}, get visibleScenes(){return [...lastVisible];},
    get target(){return target;}, get appStoreConfigured(){return Boolean(appStoreURL);},
    seek(position){cancelSnap();navigation=null;stage.removeAttribute('data-navigating');visual=target=clamp(Number(position)||0,0,chapters.length-1);window.scrollTo({top:visual*step,behavior:'instant'});paint(visual);}
  };
})();

