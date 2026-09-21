/* Loader 3.5: breathe during long waits -> filled frame -> one spring -> fade. */
(function(){
  'use strict';
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  var el=document.getElementById('app-loader');
  if(!el)return;
  var mark=document.getElementById('app-loader-mark');
  if(!mark){el.remove();return;}
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var surface=document.createElement('div');
  surface.className='app-loader-surface';
  Array.from(mark.children).forEach(function(node){surface.append(node);});
  mark.append(surface);
  el.querySelectorAll('.app-loader-word').forEach(function(word){word.remove();});
  el.dataset.loaderPhase='filling';
  el.setAttribute('aria-busy','true');
  var shown=performance.now(),last=shown,fill=0,target=.06,raf=0,ready=false;
  var phase='filling',parseWatch=0,poll=0,springTimer=0,fadeTimer=0;
  function bump(v){if(phase==='filling'&&v>target)target=Math.min(1,v);}
  function block(e){if(e.cancelable)e.preventDefault();}
  addEventListener('wheel',block,{passive:false});
  addEventListener('touchmove',block,{passive:false});
  function clearProgress(){cancelAnimationFrame(raf);raf=0;clearInterval(parseWatch);clearInterval(poll);}
  function remove(){
    if(phase==='removed')return;
    phase='removed';clearProgress();clearTimeout(springTimer);clearTimeout(fadeTimer);
    removeEventListener('wheel',block);removeEventListener('touchmove',block);
    document.removeEventListener('visibilitychange',resume);
    reduced.removeEventListener('change',motionPreference);
    el.removeEventListener('transitionend',fadeEnded);
    mark.removeEventListener('animationend',springEnded);
    el.remove();
  }
  function fadeEnded(e){if(e.target===el&&e.propertyName==='opacity')remove();}
  function hide(){
    if(phase==='fading'||phase==='removed')return;
    clearProgress();clearTimeout(springTimer);
    phase='fading';el.dataset.loaderPhase=phase;el.setAttribute('aria-busy','false');
    el.addEventListener('transitionend',fadeEnded);
    el.classList.add('is-done');
    // A fallback covers suspended tabs or an interrupted CSS transition.
    fadeTimer=setTimeout(remove,reduced.matches?200:420);
  }
  function springEnded(e){
    if(e.target===mark&&e.animationName==='hochu-loader-spring'&&phase==='spring')hide();
  }
  mark.addEventListener('animationend',springEnded);
  function complete(){
    if(phase!=='filling')return;
    clearProgress();fill=1;mark.style.setProperty('--fill','1');
    phase='filled';el.dataset.loaderPhase=phase;
    // Paint the completely filled logo before its scale starts changing.
    raf=requestAnimationFrame(function(){raf=requestAnimationFrame(function(){
      raf=0;
      if(phase!=='filled')return;
      if(reduced.matches){hide();return;}
      // Continue from the breathing loop's current scale, never snap back to 1.
      var from=getComputedStyle(mark).transform;
      mark.style.setProperty('--loader-spring-from',from==='none'?'scale(1)':from);
      phase='spring';el.dataset.loaderPhase=phase;el.classList.add('is-complete');
      // Normally animationend starts the fade after the mark returns to scale(1).
      springTimer=setTimeout(hide,650);
    });});
  }
  function frame(now){
    raf=0;if(phase!=='filling')return;
    var age=now-shown,dt=Math.min(64,Math.max(0,now-last));last=now;
    if(!ready)bump(.06+.44*(1-Math.exp(-age/3000)));
    fill+=(target-fill)*(1-Math.exp(-dt/(ready?72:180)));
    mark.style.setProperty('--fill',fill.toFixed(4));
    if(ready&&(reduced.matches||fill>.995)&&age>(reduced.matches?160:560)){complete();return;}
    if(!document.hidden)raf=requestAnimationFrame(frame);
  }
  function finish(){if(phase!=='filling')return;ready=true;target=1;resume();}
  function resume(){
    last=performance.now();
    el.classList.toggle('is-suspended',document.hidden);
    if(document.hidden){cancelAnimationFrame(raf);raf=0;return;}
    if(phase==='filling'&&!raf)raf=requestAnimationFrame(frame);
    // A tab hidden between the full frame and the spring must not get stuck.
    if(phase==='filled'&&!raf){phase='filling';complete();}
  }
  function motionPreference(){if(reduced.matches&&(phase==='spring'||phase==='filled'))hide();}
  document.addEventListener('visibilitychange',resume);
  reduced.addEventListener('change',motionPreference);
  raf=requestAnimationFrame(frame);
  // Preserve the original readiness signals; a progressing mark is not a claim
  // that all videos have downloaded. The first usable scene ends loading.
  parseWatch=setInterval(function(){
    var scenes=document.querySelectorAll('.scene').length;
    var shots=document.querySelectorAll('.screen-image').length;
    bump(.10+Math.min(1,scenes/8)*.12+Math.min(1,shots/7)*.62);
    if(document.readyState!=='loading')clearInterval(parseWatch);
  },90);
  function parsed(){
    bump(.88);
    var imgs=Array.from(document.querySelectorAll('.screen-image')),done=0;
    if(!imgs.length){bump(.93);return;}
    imgs.forEach(function(img){
      var next=function(){bump(.88+(++done/imgs.length)*.05);};
      (img.decode?img.decode():Promise.resolve()).then(next,next);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',parsed,{once:true});else parsed();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){bump(.90);});
  addEventListener('load',function(){bump(.95);},{once:true});
  var waited=0;
  poll=setInterval(function(){
    waited+=60;
    if(window.HochuStory){
      clearInterval(poll);
      var first=document.querySelector('.screen-image');
      var go=function(){requestAnimationFrame(function(){requestAnimationFrame(finish);});};
      if(first&&first.decode)first.decode().then(go,go);else go();
    }else if(waited>30000){clearInterval(poll);finish();}
  },60);
})();
