const depths=[0,5,10,20,30,50,75,100,125,150,200,300,500,700,1000];
// Illustrative profiles only. These are not model predictions or observations.
const profiles={
  bengal:{name:'Bay of Bengal',location:'15° N, 88° E',values:[28.9,28.8,28.7,28.5,28.1,26.7,24.5,22.1,20.2,18.6,15.2,12.8,9.4,7.2,5.1]},
  arabian:{name:'Arabian Sea',location:'15° N, 65° E',values:[27.4,27.4,27.3,27.1,26.8,25.3,23.2,21.0,19.6,18.1,16.0,13.5,10.7,8.7,6.4]},
};

function chart(region){
  const points=region.values.map((value,i)=>`${45+(value/32)*260},${22+depths[i]/1000*242}`).join(' ');
  return `<svg class="profile-chart" viewBox="0 0 340 310" role="img" aria-label="Illustrative ${region.name} temperature profile, from ${region.values[0]} degrees Celsius at the surface to ${region.values[14]} degrees at 1,000 metres">
    ${[0,200,500,1000].map(depth=>`<line x1="45" x2="305" y1="${22+depth/1000*242}" y2="${22+depth/1000*242}" stroke="#2c2c2c"/><text x="36" y="${26+depth/1000*242}" text-anchor="end">${depth}</text>`).join('')}
    ${[0,10,20,30].map(temp=>`<text x="${45+temp/32*260}" y="286" text-anchor="middle">${temp}°</text>`).join('')}
    <polyline class="chart-line" points="${points}"/><text x="176" y="306" text-anchor="middle">Temperature (°C)</text><text x="45" y="12">Depth (m)</text></svg>`;
}

export function initPreviews({onOpen,onClose}){
  const dialog=document.querySelector('#detail-dialog');
  const content=document.querySelector('#dialog-content');
  let opener=null;
  const explorerContent=`<h2 id="dialog-title">Your first look below.</h2><p class="dialog-intro">A glimpse of the ocean explorer. Select a region to compare its illustrative temperature profile from the surface to 1,000 metres.</p><div class="profile-layout"><div class="profile-details"><div class="profile-options" role="group" aria-label="Ocean region"><button class="region-button" data-region="bengal" aria-pressed="true">Bay of Bengal</button><button class="region-button" data-region="arabian" aria-pressed="false">Arabian Sea</button></div><div id="region-details" aria-live="polite"></div></div><div id="profile-visual"></div></div><p class="preview-note">Interactive concept preview. Profiles are illustrative, not satellite observations or OceanEmbed model output. The full dashboard is the next part of OceanEmbed.</p>`;
  const architectureContent=`<h2 id="dialog-title">From signals to structure.</h2><p class="dialog-intro">OceanEmbed learns the relationship between the ocean we can observe and the depths we cannot see from space.</p><div class="pipeline-details"><article><h3>Prepare the surface</h3><p>Harmonize satellite observations to a daily 0.25° grid. Derive gradients and wind stress curl to form 12 channels, then combine a seven-day window.</p></article><article><h3>Learn the embedding</h3><p>A U-Net encoder with channel and spatial attention compresses the surface state into a 512-channel satellite embedding.</p></article><article><h3>Reconstruct the depths</h3><p>The decoder restores spatial detail through skip connections and estimates temperature at 15 standard depths, from 0 to 1,000 metres.</p></article><article><h3>Evaluate the result</h3><p>Compare reconstruction with GLORYS reference fields and independent ARGO profiles, using depth-wise RMSE, bias and correlation.</p></article></div><p class="preview-note">The proposed OceanEmbed framework. Architecture describes the system design; it does not imply a trained or validated model.</p>`;
  function setRegion(key){
    const region=profiles[key];
    content.querySelectorAll('[data-region]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.region===key)));
    content.querySelector('#region-details').innerHTML=`<dl><div><dt>Region</dt><dd>${region.name}</dd></div><div><dt>Location</dt><dd>${region.location}</dd></div><div><dt>Depth range</dt><dd>0–1,000 m</dd></div><div><dt>Depth levels</dt><dd>15</dd></div></dl>`;
    content.querySelector('#profile-visual').innerHTML=chart(region);
  }
  document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;
    content.innerHTML=button.dataset.open==='explorer'?explorerContent:architectureContent;
    if(button.dataset.open==='explorer')setRegion('bengal');
    dialog.showModal();
    onOpen();
    dialog.querySelector('.close-dialog').focus();
  }));
  content.addEventListener('click',event=>{const button=event.target.closest('[data-region]');if(button)setRegion(button.dataset.region);});
  dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.querySelector('.wordmark').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{onClose();opener?.focus({preventScroll:true});});
}
