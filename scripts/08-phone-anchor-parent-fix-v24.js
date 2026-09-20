
(function(){
  const stage=document.getElementById('stage');
  const anchor=document.getElementById('phone-anchor');
  if(!stage||!anchor)return;
  if(anchor.parentElement!==stage) stage.appendChild(anchor);
})();
