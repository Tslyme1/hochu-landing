
(function(){
  var collage=document.querySelector('.scene-finale .finale-collage');
  if(!collage || collage.querySelector('.finale-map-hero')) return;
  collage.insertAdjacentHTML('beforeend', `
    <div class="finale-map-hero" aria-hidden="true">
      <svg class="map-svg" viewBox="0 0 340 228" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mapFoldBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f7fbff"/>
            <stop offset="100%" stop-color="#dcecff"/>
          </linearGradient>
          <linearGradient id="mapFoldShade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".9"/>
            <stop offset="100%" stop-color="#cbdfff" stop-opacity=".95"/>
          </linearGradient>
          <linearGradient id="mapRoute" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1aa6ff"/>
            <stop offset="100%" stop-color="#3d5cff"/>
          </linearGradient>
        </defs>
        <path d="M24 128 98 86l56 34 72-42 92 39-18 76-87-28-54 34-62-35-63 24-10-60Z" fill="url(#mapFoldBg)"/>
        <path d="M24 128 98 86l56 34v79l-57-35-63 24Z" fill="#edf5ff"/>
        <path d="m154 120 72-42v87l-67 34-5-79Z" fill="url(#mapFoldShade)"/>
        <path d="m226 78 92 39-18 76-87-28 13-87Z" fill="#ebf4ff"/>
        <path d="m98 86 56 34 72-42" stroke="#c7daff" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="m97 164 57 35 59-34" stroke="#c7daff" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M78 154c26-35 67-35 102-10 22 16 37 18 61 2" fill="none" stroke="url(#mapRoute)" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 14"/>
        <circle cx="76" cy="154" r="12" fill="#ffffff" stroke="#4f7cff" stroke-width="7"/>
        <circle cx="243" cy="146" r="12" fill="#ffffff" stroke="#4f7cff" stroke-width="7"/>
      </svg>
      <div class="map-pin-3d">
        <svg viewBox="0 0 140 164" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="mapPinBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#dca7ff"/>
              <stop offset="100%" stop-color="#7748f2"/>
            </linearGradient>
          </defs>
          <path d="M70 160c28-40 46-67 46-92a46 46 0 1 0-92 0c0 25 18 52 46 92Z" fill="url(#mapPinBody)"/>
          <ellipse cx="53" cy="38" rx="16" ry="24" fill="#fff" opacity=".23"/>
          <circle cx="70" cy="68" r="20" fill="#ffffff" opacity=".96"/>
        </svg>
      </div>
    </div>
    <div class="extra-spark-bottom" aria-hidden="true">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sparkExtraGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffe2ff"/>
            <stop offset="45%" stop-color="#eb9eff"/>
            <stop offset="100%" stop-color="#985dfc"/>
          </linearGradient>
        </defs>
        <path d="M60 6c5 24 10 37 20 47 10 9 23 14 47 19-24 4-37 9-47 19-9 10-14 23-19 47-5-24-10-37-20-47C31 82 18 77-6 72c24-5 37-10 47-19 9-10 14-23 19-47Z" fill="url(#sparkExtraGrad)"/>
      </svg>
    </div>
    <div class="finale-orb orb-left" aria-hidden="true"></div>
    <div class="finale-orb orb-mid" aria-hidden="true"></div>
    <div class="finale-orb orb-right" aria-hidden="true"></div>
  `);
})();
