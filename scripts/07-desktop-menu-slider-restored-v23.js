
(function(){
  if(innerWidth<=980)return;
  const nav=document.getElementById('journey-nav');
  if(!nav)return;
  const bg=nav.querySelector('.nav-active-bg');
  const steps=[...nav.querySelectorAll('.journey-step')];
  if(!bg||!steps.length)return;
  bg.style.removeProperty('display');
  let ready=false,raf=0,desired=null;
  const clampIndex=i=>Math.max(0,Math.min(steps.length-1,Number(i)||0));
  const activeStep=()=>nav.querySelector('.journey-step.is-active')||steps[0];
  function place(step,instant=false){
    if(!step)return;
    cancelAnimationFrame(raf);
    const run=()=>{
      if(instant||!ready)bg.style.transition='none';
      const nr=nav.getBoundingClientRect(),sr=step.getBoundingClientRect();
      const x=sr.left-nr.left+nav.scrollLeft,y=sr.top-nr.top+nav.scrollTop;
      bg.style.width=sr.width+'px';
      bg.style.height=sr.height+'px';
      bg.style.transform=`translate3d(${x}px,${y}px,0)`;
      bg.style.opacity='1';
      if(instant||!ready){bg.getBoundingClientRect();bg.style.transition='';ready=true;}
    };
    instant?run():raf=requestAnimationFrame(run);
  }
  function target(i){desired=clampIndex(i);place(steps[desired],false);}
  nav.addEventListener('pointerdown',e=>{const s=e.target.closest('.journey-step');if(s&&nav.contains(s))target(steps.indexOf(s));},{passive:true});
  nav.addEventListener('click',e=>{const s=e.target.closest('.journey-step');if(s&&nav.contains(s))target(steps.indexOf(s));},true);
  const mo=new MutationObserver(()=>{
    const active=activeStep(),ai=steps.indexOf(active);
    if(desired!==null){
      if(ai===desired){place(active,false);desired=null;}
      else place(steps[desired],false);
    }else place(active,false);
  });
  steps.forEach(s=>mo.observe(s,{attributes:true,attributeFilter:['class']}));
  if('ResizeObserver' in window){
    const ro=new ResizeObserver(()=>place(activeStep(),true));
    ro.observe(nav);steps.forEach(s=>ro.observe(s));
  }else addEventListener('resize',()=>place(activeStep(),true),{passive:true});
  place(activeStep(),true);
})();
