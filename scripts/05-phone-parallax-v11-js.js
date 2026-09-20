
(()=>{
  const phone=document.getElementById('phone');
  const anchor=document.getElementById('phone-anchor');
  if(!phone||!anchor) return;
  const fine=matchMedia('(hover:hover) and (pointer:fine) and (min-width:981px)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let raf=0,tx=0,ty=0,lx=50,ly=36;
  const reset=()=>{
    if(raf){cancelAnimationFrame(raf);raf=0;}
    phone.classList.remove('is-parallax-hover');
    phone.style.setProperty('--phone-rx','0deg');
    phone.style.setProperty('--phone-ry','0deg');
    phone.style.setProperty('--phone-lx','50%');
    phone.style.setProperty('--phone-ly','36%');
  };
  const paint=()=>{
    raf=0;
    phone.style.setProperty('--phone-rx',tx.toFixed(2)+'deg');
    phone.style.setProperty('--phone-ry',ty.toFixed(2)+'deg');
    phone.style.setProperty('--phone-lx',lx.toFixed(1)+'%');
    phone.style.setProperty('--phone-ly',ly.toFixed(1)+'%');
  };
  anchor.addEventListener('pointerenter',()=>{
    if(!fine.matches||reduced.matches) return;
    phone.classList.add('is-parallax-hover');
  });
  anchor.addEventListener('pointermove',e=>{
    if(!fine.matches||reduced.matches) return;
    const r=phone.getBoundingClientRect();
    if(!r.width||!r.height) return;
    const nx=Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width-.5)*2));
    const ny=Math.max(-1,Math.min(1,((e.clientY-r.top)/r.height-.5)*2));
    /* Tilt subtly away from the cursor. */
    ty=-nx*6.5;
    tx=ny*5.2;
    lx=((e.clientX-r.left)/r.width)*100;
    ly=((e.clientY-r.top)/r.height)*100;
    phone.classList.add('is-parallax-hover');
    if(!raf) raf=requestAnimationFrame(paint);
  },{passive:true});
  anchor.addEventListener('pointerleave',reset,{passive:true});
  fine.addEventListener?.('change',reset);
  reduced.addEventListener?.('change',reset);
})();
