
(function(){
  'use strict';
  const mq=matchMedia('(max-width:980px)'),nav=document.getElementById('journey-nav'),stage=document.getElementById('stage'),phone=document.getElementById('phone');
  if(!nav||!stage||!phone)return;
  const steps=[...nav.querySelectorAll('.journey-step')],pill=nav.querySelector('.nav-active-bg');
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),ease=t=>{t=clamp(t,0,1);return 1-Math.pow(1-t,4)};
  let desired=null,raf=0,seq=0;
  const active=()=>Math.max(0,steps.findIndex(s=>s.classList.contains('is-active')));
  const centerX=i=>{const s=steps[i];return clamp(s.offsetLeft+s.offsetWidth/2-nav.clientWidth/2,0,Math.max(0,nav.scrollWidth-nav.clientWidth));};

  function placePill(i,instant){
    if(!mq.matches||!pill||!steps[i])return;
    const s=steps[i];
    if(instant)nav.classList.add('nav-instant-v30');
    nav.style.setProperty('--pill-x',s.offsetLeft+'px');
    nav.style.setProperty('--pill-w',s.offsetWidth+'px');
    if(instant){void pill.offsetWidth;nav.classList.remove('nav-instant-v30');}
  }
  function pending(i,on){steps.forEach((s,n)=>s.classList.toggle('nav-pending-v30',on&&n===i));}
  function center(i,instant=false){
    if(!mq.matches)return;
    i=clamp(i,0,steps.length-1);seq++;cancelAnimationFrame(raf);
    const id=seq,from=nav.scrollLeft,to=centerX(i);
    if(instant||Math.abs(to-from)<.5){nav.scrollLeft=to;return;}
    const st=performance.now(),dur=520;
    const tick=now=>{if(id!==seq)return;const t=ease((now-st)/dur);nav.scrollLeft=from+(to-from)*t;if(t<.999)raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);
  }
  function target(i){if(i<0)return;desired=i;pending(i,true);placePill(i,false);center(i,false);}

  // The rail both scrolls and selects, so a press only counts as a choice once
  // the finger lifts without having dragged.
  let press=null,tapHandledAt=0;
  const choose=i=>{target(i);window.HochuStory?.goTo?.(i);};
  nav.addEventListener('pointerdown',e=>{
    if(!mq.matches)return;
    const b=e.target.closest('.journey-step');if(!b)return;
    const i=steps.indexOf(b);if(i<0)return;
    press={i,x:e.clientX,y:e.clientY,id:e.pointerId};
  },{passive:true});
  nav.addEventListener('pointerup',e=>{
    if(!mq.matches||!press||press.id!==e.pointerId)return;
    const i=press.i,moved=Math.hypot(e.clientX-press.x,e.clientY-press.y);
    press=null;
    if(moved>10)return;
    tapHandledAt=performance.now();
    choose(i);
  },{passive:true});
  nav.addEventListener('pointercancel',()=>{press=null;},{passive:true});
  nav.addEventListener('click',e=>{
    if(!mq.matches)return;
    const b=e.target.closest('.journey-step');if(!b)return;
    // The page's own data-goto handler must not fire a second navigation.
    e.preventDefault();e.stopImmediatePropagation();
    if(performance.now()-tapHandledAt<700)return;
    const i=steps.indexOf(b);
    if(i>=0)choose(i);
  },true);

  const obs=new MutationObserver(()=>{
    if(!mq.matches)return;
    if(stage.hasAttribute('data-navigating')){
      const t=Number(window.HochuStory?.target);
      if(Number.isFinite(t)&&t!==desired)target(t);
    } else {
      const a=active();
      if(desired===null){placePill(a,false);center(a,false);}
      else if(a===desired){pending(a,false);placePill(a,false);desired=null;}
    }
  });
  obs.observe(stage,{attributes:true,attributeFilter:['data-navigating','data-scene']});
  steps.forEach(s=>obs.observe(s,{attributes:true,attributeFilter:['class']}));
  const sync=()=>{if(!mq.matches)return;const a=desired??active();placePill(a,true);center(a,true);};
  requestAnimationFrame(sync);
  addEventListener('load',()=>requestAnimationFrame(sync));
  addEventListener('resize',()=>requestAnimationFrame(sync),{passive:true});
  mq.addEventListener?.('change',()=>requestAnimationFrame(sync));

  // phone viewer: old screen stays solid, new screen fades/slides above it. no blank frame possible.
  const order=['home','search','neuro','feed','chats','tickets','create'],titles=steps.slice(0,7).map(s=>s.querySelector('.nav-label')?.textContent?.trim()||'');
  const v=document.createElement('div');v.className='mobile-viewer-v26';v.innerHTML='<div class="mv-top"><div class="mv-title"><span class="mv-title-icon"></span><span class="mv-title-text"></span></div><button class="mv-close" aria-label="Закрыть"></button></div><button class="mv-arrow mv-prev" aria-label="Предыдущий экран"><span aria-hidden="true"></span></button><div class="mv-frame"></div><button class="mv-arrow mv-next" aria-label="Следующий экран"><span aria-hidden="true"></span></button><div class="mv-dots"></div>';document.body.appendChild(v);
  const frame=v.querySelector('.mv-frame'),prev=v.querySelector('.mv-prev'),next=v.querySelector('.mv-next'),close=v.querySelector('.mv-close'),dots=v.querySelector('.mv-dots'),title=v.querySelector('.mv-title-text'),icon=v.querySelector('.mv-title-icon'),titleWrap=v.querySelector('.mv-title');let imgs=[],vi=0,open=false,anim=null,drag=null;
  function strip(el){if(el.nodeType!==1)return;el.removeAttribute('id');[...el.children].forEach(strip)}
  function header(i,animate){title.textContent=titles[i]||'';icon.innerHTML='';const src=steps[i]?.querySelector('.menu-icon');if(src){const c=src.cloneNode(true);c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));icon.appendChild(c)}if(animate)titleWrap.animate([{opacity:.25},{opacity:1}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'})}
  function settle(i){imgs.forEach(im=>{im.getAnimations().forEach(a=>a.cancel());const on=im.dataset.screen===order[i];im.style.opacity=on?'1':'0';im.style.zIndex=on?'2':'0';im.style.transform='none'})}
  function render(i,dir=0,doAnim=true){i=clamp(i,0,6);const oi=vi,old=imgs.find(x=>x.dataset.screen===order[oi]),neu=imgs.find(x=>x.dataset.screen===order[i]);vi=i;prev.disabled=i===0;next.disabled=i===6;[...dots.children].forEach((d,n)=>d.classList.toggle('is-active',n===i));header(i,doAnim&&i!==oi);if(anim){try{anim.cancel()}catch(_){}}if(!doAnim||!dir||!old||!neu||old===neu){settle(i);return}imgs.forEach(x=>{if(x!==old&&x!==neu){x.style.opacity='0';x.style.zIndex='0'}});old.style.opacity='1';old.style.zIndex='1';old.style.transform='none';neu.style.opacity='0';neu.style.zIndex='2';neu.style.transform='none';neu.getBoundingClientRect();anim=neu.animate([{opacity:0},{opacity:1}],{duration:520,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});anim.finished.catch(()=>{}).then(()=>{if(open&&vi===i)settle(i)})}
  function openV(){if(!mq.matches||Number(stage.dataset.scene)===7||open)return;vi=clamp(Number(stage.dataset.scene)||0,0,6);const c=phone.cloneNode(true);strip(c);frame.innerHTML='';frame.appendChild(c);imgs=[...c.querySelectorAll('.screen-image')];imgs.forEach(x=>{x.style.clipPath='none';x.style.maskImage='none';x.style.webkitMaskImage='none';x.style.transition='none'});dots.innerHTML=order.map((_,i)=>`<button class="mv-dot${i===vi?' is-active':''}" data-i="${i}"></button>`).join('');settle(vi);header(vi);prev.disabled=vi===0;next.disabled=vi===6;open=true;v.classList.add('is-open');document.documentElement.classList.add('mv-open-v30');document.documentElement.style.overflow='hidden'}
  function closeV(){if(!open)return;const t=vi;open=false;v.classList.remove('is-open');document.documentElement.classList.remove('mv-open-v30');document.documentElement.style.overflow='';if(t!==Number(stage.dataset.scene))window.HochuStory?.goTo(t)}
  phone.addEventListener('click',e=>{if(mq.matches){e.preventDefault();e.stopPropagation();openV()}},true);close.addEventListener('click',closeV);prev.addEventListener('click',()=>vi>0&&render(vi-1,-1,true));next.addEventListener('click',()=>vi<6&&render(vi+1,1,true));dots.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b)return;const n=Number(b.dataset.i);if(n!==vi)render(n,n>vi?1:-1,true)});
  frame.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};frame.setPointerCapture?.(e.pointerId)});frame.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y,dt=Math.max(1,performance.now()-drag.t);drag=null;if(Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)*1.2&&Math.abs(dx)/dt>.12){const d=dx<0?1:-1,n=clamp(vi+d,0,6);if(n!==vi)render(n,d,true)}});frame.addEventListener('pointercancel',()=>drag=null);
})();
