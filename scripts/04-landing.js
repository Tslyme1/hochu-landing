
(function(){
  const stage=document.getElementById('stage');
  const prev=document.querySelector('.phone-chevron-prev');
  const next=document.querySelector('.phone-chevron-next');
  if(!stage||!prev||!next)return;
  const chapterCount=document.querySelectorAll('.journey-step').length;
  const current=()=>Math.max(0,Math.min(chapterCount-1,Number(stage.dataset.scene ?? window.HochuStory?.active ?? 0)));
  const sync=()=>{
    const i=current();
    prev.disabled=i<=0;
    next.disabled=i>=chapterCount-1;
    prev.setAttribute('aria-hidden',innerWidth>980?'true':'false');
    next.setAttribute('aria-hidden',innerWidth>980?'true':'false');
  };
  const go=delta=>{
    const i=current(),to=Math.max(0,Math.min(chapterCount-1,i+delta));
    if(to!==i&&window.HochuStory?.goTo)window.HochuStory.goTo(to);
  };
  prev.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();go(-1);});
  next.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();go(1);});
  new MutationObserver(sync).observe(stage,{attributes:true,attributeFilter:['data-scene']});
  addEventListener('resize',sync,{passive:true});
  sync();
})();
