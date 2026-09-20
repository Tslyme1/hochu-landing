
(function(){
  const stage=document.getElementById('stage');
  const prev=document.querySelector('.phone-chevron-prev');
  const next=document.querySelector('.phone-chevron-next');
  if(!stage||!prev||!next)return;
  function mount(){
    if(innerWidth<=980){
      if(prev.parentElement!==stage)stage.appendChild(prev);
      if(next.parentElement!==stage)stage.appendChild(next);
    }
  }
  mount();
  addEventListener('resize',mount,{passive:true});
})();
