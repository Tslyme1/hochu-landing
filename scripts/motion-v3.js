/* Хочу v3 — one transition owner; native document scrolling on phones.
   No scroll-to-chapter jumps, blur filters or animated video masks. */
(() => {
  'use strict';
  const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const root=document.documentElement, stage=$('#stage'), story=$('#story'), phone=$('#phone'), anchor=$('#phone-anchor');
  if(!stage||!phone||window.HochuStory?.version===3)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), mobile=matchMedia('(max-width:980px)');
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), ease=t=>t*t*(3-2*t), mix=(a,b,t)=>a+(b-a)*t;
  const palettes=[
    ['start','home','blue','#079fee','#ffffff','#d8f2ff','#c6f1ff','#a0e9ff'],
    ['search','search','light','#f6f6ef','#243347','#818578','#0b9bcf','#dfecc1'],
    ['neuro','neuro','dark','#101125','#faf9ff','#aaa5c3','#d7aaff','#6d3a9e'],
    ['feed','feed','light','#fcf1ed','#3e303a','#97828a','#d97672','#f5caba'],
    ['chats','chats','light','#eaf7f2','#203f45','#6e908d','#069db2','#b7e6db'],
    ['tickets','tickets','light','#edf6ff','#203853','#7c95ad','#019bdc','#b9dff4'],
    ['create','create','light','#f3effb','#352d49','#9485a5','#9b6acf','#d5bfef'],
    ['together','home','blue','#079fee','#ffffff','#d8f2ff','#c6f1ff','#a0e9ff']
  ];
  const keys=['bg','fg','muted','accent','aura'];
  const chapters=palettes.map(([id,screen,tone,...colors])=>({id,screen,tone,colors,channels:colors.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)))}));
  const scenes=$$('.scene').map((el,i)=>({el,copy:$('.copy',el),art:$('.art-enter',el),title:$('h1,h2',el).textContent.trim()}));
  const originalMedia=$$('.screen-image',phone), sourceByName=new Map(), players=new Set(), wanted=new Set();
  const prepared=new WeakSet(), playPending=new WeakSet();
  let visible=true, current=0, target=0, transition=null, pending=null, queued=null, frame=0, elapsed=0, last=performance.now();
  let held=false, gesture=null, suppressClickUntil=0, lastScroll=-Infinity, resizeTimer=0, lastWidth=0, view=null;
  const duration=420, cycle=10000, wrap=i=>(i+chapters.length)%chapters.length;
  // Keep the original DOM, illustration layers and all product copy.
  stage.append(anchor); const prev=$('.phone-chevron-prev'),next=$('.phone-chevron-next');stage.append(prev,next);
  const legacy=$('#journey-nav');legacy.hidden=true;legacy.inert=true;legacy.setAttribute('aria-hidden','true');
  const labels=$$('.nav-label',legacy).map(el=>el.textContent.trim());
  const nav=document.createElement('nav');nav.id='stories-pagination';nav.setAttribute('aria-label','Разделы сайта. Автопереход каждые 10 секунд');
  nav.innerHTML=chapters.map((c,i)=>`<button type="button" data-story="${i}" aria-label="${i+1}. ${labels[i]}"><i class="story-fill" aria-hidden="true"></i></button>`).join('');stage.append(nav);
  const navButtons=$$('button',nav),fills=$$('.story-fill',nav);
  const arrow=d=>`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${d<0?'M15 5 8 12l7 7':'m9 5 7 7-7 7'}"/></svg>`;
  prev.innerHTML=arrow(-1);next.innerHTML=arrow(1);prev.disabled=next.disabled=false;
  prev.setAttribute('aria-label','Предыдущий раздел');next.setAttribute('aria-label','Следующий раздел');
  scenes.forEach((s,i)=>{
    ['bg','fg','muted','accent'].forEach((k,j)=>s.el.style.setProperty('--local-'+k,chapters[i].colors[j]));
    s.el.style.setProperty('--enter','1');s.el.style.setProperty('--exit','0');
    $$('h1,h2,.line-inner,.description,.eyebrow,.micro-label,.story-button',s.el).forEach(e=>{e.style.opacity='1';e.style.transform='none';e.style.filter='none';});
    s.copy.style.filter='none';if(s.art){s.art.style.transform='none';s.art.style.filter='none';}
  });
  function setVar(k,v){if(root.style.getPropertyValue(k)!==v)root.style.setProperty(k,v);}
  function positionMedia(node){
    const parent=node.parentElement,frame=parent?.parentElement;if(!frame)return;
    const css=getComputedStyle(frame),nw=node.videoWidth||node.naturalWidth||Number(node.dataset.frameWidth)||Number(node.getAttribute('width'))||592;
    const nh=node.videoHeight||node.naturalHeight||Number(node.dataset.frameHeight)||Number(node.getAttribute('height'))||1280;
    const W=frame.clientWidth,H=frame.clientHeight,L=parseFloat(css.paddingLeft)||6,R=parseFloat(css.paddingRight)||6,T=parseFloat(css.paddingTop)||6,B=parseFloat(css.paddingBottom)||6;
    const scale=Math.min((W-L-R)/nw,(H-T-B)/nh);
    for(const [k,v] of Object.entries({width:nw*scale,height:nh*scale,left:L+(W-L-R-nw*scale)/2,top:T+(H-T-B-nh*scale)/2}))frame.style.setProperty('--media-screen-'+k,v.toFixed(3)+'px');
  }
  function record(el){
    const video=el.tagName==='VIDEO';let poster=null;
    el.style.cssText+=';transform:none;mask-image:none;-webkit-mask-image:none;clip-path:none;transition:none;opacity:0;z-index:0';
    if(video){
      el.controls=false;el.removeAttribute('controls');el.muted=el.defaultMuted=true;el.playsInline=true;el.loop=true;el.preload='metadata';
      el.setAttribute('playsinline','');el.setAttribute('webkit-playsinline','');el.disablePictureInPicture=true;el.disableRemotePlayback=true;
      poster=document.createElement('img');poster.className='screen-image media-fallback';poster.src=el.poster;poster.alt='';poster.setAttribute('aria-hidden','true');poster.style.cssText=el.style.cssText;el.before(poster);players.add(el);
    }
    const r={el,poster,video,decoded:!video,opacity:0,z:0};
    if(video){
      const decoded=()=>{r.decoded=true;showMedia(r,r.opacity,r.z);};
      el.addEventListener('loadedmetadata',()=>{if(r.opacity>.9)positionMedia(el);});
      el.addEventListener('playing',()=>{
        if(!wanted.has(el)){el.pause();return;}
        if(el.requestVideoFrameCallback)el.requestVideoFrameCallback(decoded);else decoded();
      });
      el.addEventListener('error',()=>{r.decoded=false;showMedia(r,r.opacity,r.z);});
    }else if(el.decode)el.decode().catch(()=>{});
    return r;
  }
  originalMedia.forEach(el=>sourceByName.set(el.dataset.screen,record(el)));
  function showMedia(r,opacity,z){
    if(!r)return;r.opacity=opacity;r.z=z;
    const useVideo=!r.video||r.decoded;
    r.el.style.zIndex=String(z);r.el.style.opacity=String(useVideo?opacity:0);
    if(r.poster){r.poster.style.zIndex=String(z);r.poster.style.opacity=String(useVideo?0:opacity);}
  }
  function play(el){
    if(!wanted.has(el)||playPending.has(el)||!el.paused)return;
    playPending.add(el);const p=el.play();
    if(!p?.then){playPending.delete(el);return;}
    p.then(()=>{playPending.delete(el);if(!wanted.has(el))el.pause();}).catch(()=>playPending.delete(el));
  }
  function getSource(index){return sourceByName.get(chapters[index].screen);}
  function mediaState(extra){
    wanted.clear();
    if(visible&&!document.hidden&&!reduced.matches&&!$('#download-dialog').open){
      if(view?.open){for(const r of view.live||[])if(r?.video)wanted.add(r.el);}
      else{
        const indices=transition?[transition.from,transition.to]:[current];
        if(pending)indices.push(pending.to);
        indices.forEach(i=>{if(i!==7){const r=getSource(i);if(r?.video)wanted.add(r.el);}});
        if(extra?.video)wanted.add(extra.el);
      }
    }
    players.forEach(el=>{if(wanted.has(el))play(el);else if(!el.paused)el.pause();});
  }
  async function prepare(r){
    if(!r)return;
    if(!r.video){if(r.el.decode)await Promise.race([r.el.decode().catch(()=>{}),new Promise(s=>setTimeout(s,180))]);return;}
    if(!prepared.has(r.el)&&r.opacity===0){prepared.add(r.el);try{if(r.el.currentTime>.1)r.el.currentTime=0;}catch{}}
    if(reduced.matches)return;
    mediaState(r);
    if(r.decoded&&r.el.readyState>=2)return;
    await new Promise(resolve=>{
      let finished=false,callback=0;
      const done=()=>{if(finished)return;finished=true;clearTimeout(timer);r.el.removeEventListener('loadeddata',ready);resolve();};
      const ready=()=>{if(r.el.requestVideoFrameCallback){callback=r.el.requestVideoFrameCallback(()=>{r.decoded=true;done();});}else{r.decoded=r.el.readyState>=2;done();}};
      const timer=setTimeout(()=>{if(callback)r.el.cancelVideoFrameCallback?.(callback);done();},420);
      if(r.el.readyState>=2)ready();else r.el.addEventListener('loadeddata',ready,{once:true});
    });
  }
  function palette(a,b,p){
    keys.forEach((key,j)=>{const col=a.channels[j].map((x,k)=>Math.round(mix(x,b.channels[j][k],p)));setVar('--'+key,`rgb(${col.join(',')})`);});
    // Root canvas follows the actual scene; no fixed/sticky blue surfaces.
    const rgb=a.channels[0].map((x,k)=>Math.round(mix(x,b.channels[0][k],p)));
    root.style.backgroundColor=`rgb(${rgb.join(',')})`;
    const opacity=c=>c.tone==='light'?.86:c.tone==='dark'?.055:.16;
    setVar('--band-opacity',String(mix(opacity(a),opacity(b),p)));
    const chosen=p<.5?a:b;
    setVar('--border',chosen.tone==='light'?'rgba(24,44,66,.16)':'rgba(255,255,255,.2)');
    setVar('--panel',chosen.tone==='light'?'rgba(24,44,66,.06)':'rgba(255,255,255,.08)');
    setVar('--bloom','0');
  }
  function scene(index,opacity,y=0){
    const s=scenes[index],on=opacity>0;
    s.el.style.visibility=on?'visible':'hidden';s.el.classList.toggle('is-visible',on);
    s.copy.style.opacity=String(opacity);s.copy.style.transform=y?`translate3d(0,${y.toFixed(2)}px,0)`:'none';
    if(s.art)s.art.style.opacity=String(opacity);
  }
  function render(a,b,p){
    const q=ease(clamp(p));palette(chapters[a],chapters[b],q);
    if(a===b){scene(a,1);showMedia(getSource(a),1,1);}
    else{
      scene(a,1-q,-q*5);scene(b,q,(1-q)*5);
      const from=getSource(a),to=getSource(b);
      if(from===to)showMedia(to,1,2);
      else{showMedia(from,1,1);showMedia(to,q,2);}
    }
    setVar('--device-opacity',String(mix(a===7?0:1,b===7?0:1,q)));
  }
  function mark(index){
    stage.dataset.scene=String(index);stage.dataset.tone=chapters[index].tone;
    scenes.forEach((s,i)=>{s.el.inert=i!==index;s.el.setAttribute('aria-hidden',String(i!==index));s.el.classList.toggle('is-active',i===index);});
    $$('.journey-step',legacy).forEach((el,i)=>el.classList.toggle('is-active',i===index));
    navButtons.forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  }
  function settle(index){
    scenes.forEach((_,i)=>{if(i!==index)scene(i,0);});sourceByName.forEach(r=>showMedia(r,0,0));
    current=index;target=queued??index;mark(index);render(index,index,1);positionMedia(getSource(index).el);
    transition=null;pending=null;stage.removeAttribute('data-navigating');mediaState();
    $('#scene-announcement').textContent=`${index+1} из 8. ${scenes[index].title}`;
  }
  async function goTo(value,behavior){
    const number=Number(value);if(!Number.isFinite(number))return;
    const index=wrap(Math.round(number));target=index;elapsed=0;
    if(transition||pending){queued=index;return;}
    if(index===current){queued=null;return;}
    pending={to:index};
    await prepare(getSource(index));
    if(queued!==null&&queued!==index){const newer=queued;queued=null;pending=null;mediaState();goTo(newer,behavior);return;}
    queued=null;pending=null;
    if(behavior==='instant'||behavior==='auto'||reduced.matches){settle(index);requestTick();return;}
    const from=current;
    transition={from,to:index,start:performance.now()};stage.dataset.navigating='true';stage.dataset.destination=String(index);
    // Do NOT seek a visible source or mutate document scroll position here.
    mark(index);render(from,index,0);mediaState();elapsed=0;last=performance.now();requestTick();
  }
  const requestTick=()=>{if(!frame)frame=requestAnimationFrame(tick);};
  function blocked(){return reduced.matches||document.hidden||!visible||held||view?.open||$('#download-dialog').open||!!$('#app-loader')||performance.now()-lastScroll<1100;}
  function tick(now){
    frame=0;const dt=Math.min(80,Math.max(0,now-last));last=now;
    if(transition){
      const t=transition,p=clamp((now-t.start)/duration);render(t.from,t.to,p);
      if(p===1){const requested=queued;queued=null;settle(t.to);if(requested!==null&&requested!==current)goTo(requested);}
    }
    if(!blocked())elapsed+=dt;
    if(elapsed>=cycle&&!transition&&!pending){elapsed=0;goTo(current+1);}
    const bar=transition?transition.to:pending?pending.to:current;
    fills.forEach((f,i)=>{f.style.transform=`scaleX(${i===bar?clamp(elapsed/cycle).toFixed(4):0})`;});
    if(!document.hidden&&visible)requestTick();
  }
  function fit(){
    const vv=visualViewport;if(vv&&Math.abs(vv.scale-1)>.02)return;
    const W=root.clientWidth,H=innerHeight;
    const compact=mobile.matches,land=compact&&W>H;
    const probe=$('#motion-safe-probe'),cs=getComputedStyle(probe),top=parseFloat(cs.paddingTop)||0,bottom=parseFloat(cs.paddingBottom)||0;
    setVar('--visible-h',`${Math.round(vv?.height||H)}px`);
    setVar('--viewport-stable',`${H}px`);
    const headerTop=Math.max(12,top+8),railTop=headerTop+47;
    setVar('--motion-header-top',headerTop+'px');setVar('--motion-nav-top',railTop+'px');
    // Use the final scene as the responsive typography reference, without
    // restyling it or hard-coding one phone's pixel value across breakpoints.
    const reference=getComputedStyle($('.description',scenes[7].el));
    setVar('--motion-description-size',reference.fontSize);
    setVar('--motion-description-line-height',reference.lineHeight);
    const widthChanged=Math.abs(lastWidth-W)>2;lastWidth=W;
    if(compact){
      const font=land?clamp(W*.04,26,34):clamp(W*.082,27,37);
      setVar('--motion-heading',font+'px');
      const railBottom=railTop+nav.offsetHeight;
      const copies=scenes.slice(0,7),heights=copies.map(s=>s.copy.offsetHeight),copyH=Math.max(...heights);
      if(!land){
        // The phone keeps the same position throughout a story. Each individual
        // copy block is centered in the space between the rail and that phone,
        // so a one-line heading has the same top/bottom breathing room.
        const pw=Math.min(390,W*.67),ph=pw/.466,pt=railBottom+copyH+32;
        setVar('--phone-h',ph+'px');setVar('--phone-w',pw+'px');setVar('--motion-phone-y',pt+ph/2+'px');setVar('--motion-phone-x','50%');
        copies.forEach((s,i)=>s.copy.style.setProperty('--motion-copy-top-local',(railBottom+(pt-railBottom-heights[i])/2)+'px'));
        setVar('--motion-copy-top',railBottom+16+'px');setVar('--motion-scene-height',Math.max(H,pt+ph+bottom+38)+'px');
        setVar('--motion-arrow-y',Math.min(pt+ph*.50,(vv?.height||H)-90)+'px');
      }else{
        const ph=Math.max(250,Math.min(H-railTop-28,420)),pw=ph*.466,pt=railBottom+8;
        setVar('--phone-h',ph+'px');setVar('--phone-w',pw+'px');setVar('--motion-phone-y',pt+ph/2+'px');setVar('--motion-phone-x','74%');
        copies.forEach((s,i)=>s.copy.style.setProperty('--motion-copy-top-local',Math.max(railBottom+12,pt+(ph-heights[i])/2)+'px'));
        setVar('--motion-copy-top',railBottom+18+'px');setVar('--motion-scene-height',pt+ph+bottom+24+'px');setVar('--motion-arrow-y',pt+ph/2+'px');
      }
    }else{
      ['--phone-h','--phone-w','--phone-y'].forEach(k=>root.style.removeProperty(k));
      setVar('--motion-scene-height',Math.max(760,H)+'px');
      const device=anchor.getBoundingClientRect(),stageTop=stage.getBoundingClientRect().top;
      const center=device.top-stageTop+device.height/2;
      scenes.slice(0,7).forEach(s=>s.copy.style.setProperty('--motion-copy-top-local',Math.max(106,center-s.copy.offsetHeight/2)+'px'));
    }
    positionMedia(getSource(current).el);if(view?.open)view.fit();
    if(widthChanged)requestAnimationFrame(()=>positionMedia(getSource(current).el));
  }
  const probe=document.createElement('div');probe.id='motion-safe-probe';probe.setAttribute('aria-hidden','true');document.body.append(probe);
  function direction(d){goTo(target+d);}
  prev.addEventListener('click',()=>direction(-1));next.addEventListener('click',()=>direction(1));
  nav.addEventListener('click',e=>{const b=e.target.closest('[data-story]');if(b)goTo(Number(b.dataset.story));});
  $$('[data-goto]').forEach(el=>el.addEventListener('click',()=>goTo(Number(el.dataset.goto))));
  nav.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const i=Number(e.target.closest('button')?.dataset.story)||0;const n=e.key==='Home'?0:e.key==='End'?7:wrap(i+(e.key==='ArrowRight'?1:-1));goTo(n);navButtons[n].focus({preventScroll:true});});
  stage.addEventListener('pointerdown',e=>{
    if(!e.isPrimary)return;held=true;
    if(e.target.closest('button,a,input,dialog')||e.clientX<24||e.clientX>innerWidth-24)return;
    gesture={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId};
  },{passive:true});
  stage.addEventListener('pointerup',e=>{
    held=false;if(!gesture||gesture.id!==e.pointerId)return;
    const g=gesture;gesture=null;const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.35){suppressClickUntil=performance.now()+600;direction(dx<0?1:-1);}
  });
  addEventListener('pointerup',()=>held=false,{passive:true});addEventListener('pointercancel',()=>{held=false;gesture=null;},{passive:true});
  addEventListener('scroll',()=>{lastScroll=performance.now();},{passive:true});
  addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.altKey||e.metaKey||e.ctrlKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||$('#download-dialog').open||view?.open)return;
    if(e.key==='ArrowRight'){e.preventDefault();direction(1);}if(e.key==='ArrowLeft'){e.preventDefault();direction(-1);}
  });
  const dialog=$('#download-dialog');
  $$('[data-download]').forEach(b=>b.addEventListener('click',()=>{const url=window.HOCHU_CONFIG?.appStoreUrl||'';if(/^https:\/\/apps\.apple\.com\//.test(url))window.open(url,'_blank','noopener,noreferrer');else dialog.showModal();}));
  $$('.dialog-close,.dialog-ok',dialog).forEach(b=>b.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('close',()=>{last=performance.now();mediaState();});
  new MutationObserver(()=>mediaState()).observe(dialog,{attributes:true,attributeFilter:['open']});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  // Original enlarged media viewer, with one persistent frame and the same
  // decode-before-reveal rule. It does not emulate any application scenario.
  function createViewer(){
    const overlay=document.createElement('div');overlay.className='mobile-viewer-v26';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Просмотр записи');overlay.inert=true;
    overlay.innerHTML='<div class="mv-top"><div class="mv-title"><span class="mv-title-text"></span></div><button class="mv-close" aria-label="Закрыть"></button></div><button class="mv-arrow mv-prev" aria-label="Предыдущий экран">'+arrow(-1)+'</button><div class="mv-frame"></div><button class="mv-arrow mv-next" aria-label="Следующий экран">'+arrow(1)+'</button>';
    document.body.append(overlay);const v={open:false,index:0,live:[],el:overlay,busy:false,sequence:0};
    const holder=$('.mv-frame',overlay),title=$('.mv-title-text',overlay),close=$('.mv-close',overlay);
    v.fit=()=>{
      if(!v.open)return;
      // Read the same untransformed device dimensions used on the main page.
      // A tall device scrolls inside the gallery instead of being downscaled.
      const css=getComputedStyle(phone),w=parseFloat(css.width),h=parseFloat(css.height);
      if(!(w>0&&h>0))return;
      const safe=getComputedStyle($('#motion-safe-probe')),safeTop=parseFloat(safe.paddingTop)||0,safeBottom=parseFloat(safe.paddingBottom)||0;
      const vh=window.visualViewport?.height||innerHeight,top=Math.max(safeTop+76,(vh-h)/2);
      overlay.style.setProperty('--gallery-phone-w',w+'px');overlay.style.setProperty('--gallery-phone-h',h+'px');
      overlay.style.setProperty('--gallery-phone-top',top+'px');overlay.style.setProperty('--gallery-phone-bottom',Math.max(24,safeBottom+16)+'px');
      overlay.style.setProperty('--gallery-arrow-y',clamp(top+h/2,82,Math.max(82,vh-62))+'px');
      const r=v.live[v.live.length-1];if(r)positionMedia(r.el);
    };
    function build(){
      const shell=phone.cloneNode(false);shell.removeAttribute('id');shell.removeAttribute('style');
      const screen=$('.phone-screen',phone).cloneNode(false);screen.removeAttribute('id');shell.append(screen);holder.replaceChildren(shell);
      v.records=chapters.slice(0,7).map(c=>{const clone=getSource(palettes.findIndex(a=>a[1]===c.screen)).el.cloneNode(true);clone.removeAttribute('id');clone.removeAttribute('style');screen.append(clone);return record(clone);});
    }
    async function show(i,instant=false){
      i=(i+7)%7;if(v.busy)return;v.busy=true;const seq=++v.sequence,old=v.live[v.live.length-1],r=v.records[i];
      v.index=i;v.live=old&&old!==r?[old,r]:[r];mediaState();await prepare(r);
      if(seq!==v.sequence||!v.open){v.busy=false;return;}
      v.fit();positionMedia(r.el);title.textContent=labels[i];v.records.forEach(x=>{if(x!==old&&x!==r)showMedia(x,0,0);});
      const start=performance.now();function step(now){if(seq!==v.sequence||!v.open)return;const p=instant||reduced.matches?1:clamp((now-start)/320);if(old&&old!==r)showMedia(old,1,1);showMedia(r,ease(p),2);if(p<1)requestAnimationFrame(step);else{if(old&&old!==r)showMedia(old,0,0);v.live=[r];v.busy=false;mediaState();}}requestAnimationFrame(step);
    }
    function shut(){if(!v.open)return;v.open=false;v.sequence++;v.busy=false;v.live=[];overlay.classList.remove('is-open');overlay.inert=true;root.classList.remove('mv-open-v30');const i=v.index;v.records?.forEach(r=>{if(r.video){r.el.pause();players.delete(r.el);}});holder.replaceChildren();mediaState();last=performance.now();if(i!==current)goTo(i);}
    phone.addEventListener('click',()=>{if(!mobile.matches||current===7||performance.now()<suppressClickUntil||transition||pending||v.open)return;v.open=true;v.index=current;build();overlay.inert=false;overlay.classList.add('is-open');root.classList.add('mv-open-v30');overlay.scrollTop=0;v.fit();show(current,true);close.focus({preventScroll:true});});
    close.addEventListener('click',shut);$('.mv-prev',overlay).addEventListener('click',()=>show(v.index-1));$('.mv-next',overlay).addEventListener('click',()=>show(v.index+1));
    let drag=null;holder.addEventListener('pointerdown',e=>drag={x:e.clientX,y:e.clientY});holder.addEventListener('pointerup',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3)show(v.index+(dx<0?1:-1));});holder.addEventListener('pointercancel',()=>drag=null);
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape')shut();if(e.key==='ArrowRight'){e.preventDefault();show(v.index+1);}if(e.key==='ArrowLeft'){e.preventDefault();show(v.index-1);}if(e.key==='Tab'){const list=$$('button',overlay),i=list.indexOf(document.activeElement);e.preventDefault();list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();}});
    return v;
  }
  view=createViewer();
  const api=window.HochuStory={version:3,goTo,chapters:chapters.map((c,i)=>({id:c.id,title:scenes[i].title})),get active(){return transition?transition.to:current;},get target(){return target;},get progress(){return current;},get step(){return stage.offsetHeight;},get isNavigating(){return !!(transition||pending);},get isSnapping(){return false;},get visibleScenes(){return transition?[transition.from,transition.to]:[current];},seek:i=>goTo(Math.round(i),'instant')};
  window.KhochuStories={version:3,next:()=>direction(1),previous:()=>direction(-1),goTo,fit,getState:()=>({shown:api.active,actual:current,target,elapsed,duration:cycle,busy:!!transition,preparing:!!pending,queued,paused:blocked()})};
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fit,100);},{passive:true});
  visualViewport?.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fit,120);},{passive:true});
  document.addEventListener('visibilitychange',()=>{last=performance.now();held=false;mediaState();if(!document.hidden)requestTick();});
  addEventListener('pagehide',()=>{visible=false;cancelAnimationFrame(frame);frame=0;mediaState();});
  addEventListener('pageshow',()=>{visible=true;last=performance.now();fit();mediaState();requestTick();});
  reduced.addEventListener('change',()=>{if(transition)settle(transition.to);elapsed=0;mediaState();requestTick();});
  document.addEventListener('pointerup',()=>wanted.forEach(play),{passive:true});
  document.fonts?.ready.then(fit);
  // Never ask iOS to keep the hero's blue tint after leaving the hero.
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.remove());
  const hash=chapters.findIndex(c=>c.id===location.hash.slice(1));
  current=hash>=0?hash:0;settle(current);fit();requestTick();
  addEventListener('hashchange',()=>{const i=chapters.findIndex(c=>c.id===location.hash.slice(1));if(i>=0)goTo(i);});
})();
