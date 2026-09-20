
(function(){
  'use strict';
  // The story is driven by scroll position, so a restored offset would reopen
  // the page in the middle of it. Every visit starts at the first chapter.
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  var el=document.getElementById('app-loader');
  if(!el)return;
  var mark=document.getElementById('app-loader-mark');
  var shown=performance.now(),fill=0,target=.06,raf=0,ready=false,gone=false;
  function bump(v){if(v>target)target=v;}
  function block(e){e.preventDefault();}
  addEventListener('wheel',block,{passive:false});
  addEventListener('touchmove',block,{passive:false});
  function hide(){
    if(gone)return;
    gone=true;
    cancelAnimationFrame(raf);
    clearInterval(parseWatch);
    removeEventListener('wheel',block);
    removeEventListener('touchmove',block);
    el.classList.add('is-done');
    setTimeout(function(){el.remove();},560);
  }
  function frame(){
    // A slow creep keeps the mark alive between real signals, never reaching the top on its own.
    var age=performance.now()-shown;
    if(!ready)bump(.06+.44*(1-Math.exp(-age/3000)));
    fill+=(target-fill)*(ready?.16:.075);
    mark.style.setProperty('--fill',fill.toFixed(4));
    if(ready&&fill>.995&&age>560){hide();return;}
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  function finish(){ready=true;target=1;}
  // The document is megabytes of inline screenshots: the scenes appear one by
  // one as the parser walks it, which is real progress worth showing.
  var parseWatch=setInterval(function(){
    // The scenes land in the first few per cent of the file; the seven inline
    // screenshots are the last two thirds of it, so they carry the progress.
    var scenes=document.querySelectorAll('.scene').length;
    var shots=document.querySelectorAll('.screen-image').length;
    bump(.10+Math.min(1,scenes/8)*.12+Math.min(1,shots/7)*.62);
    if(document.readyState!=='loading')clearInterval(parseWatch);
  },90);
  document.addEventListener('DOMContentLoaded',function(){
    bump(.88);
    var imgs=[].slice.call(document.querySelectorAll('.screen-image')),done=0;
    if(!imgs.length){bump(.93);return;}
    imgs.forEach(function(img){
      var next=function(){bump(.88+(++done/imgs.length)*.05);};
      (img.decode?img.decode():Promise.resolve()).then(next,next);
    });
  });
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){bump(.90);});
  addEventListener('load',function(){bump(.95);});
  // The story exposes its API once the first real layout has been painted.
  var waited=0;
  var poll=setInterval(function(){
    waited+=60;
    if(window.HochuStory){
      clearInterval(poll);
      // Hold on until the hero screenshot is actually decoded and painted.
      var first=document.querySelector('.screen-image');
      var go=function(){requestAnimationFrame(function(){requestAnimationFrame(finish);});};
      if(first&&first.decode)first.decode().then(go,go);else go();
    }
    else if(waited>30000){clearInterval(poll);finish();}
  },60);
})();
