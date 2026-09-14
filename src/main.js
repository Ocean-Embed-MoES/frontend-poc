import './style.css';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {initPreviews} from './previews';

gsap.registerPlugin(ScrollTrigger);
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let userPaused=false;
let modalOpen=false;
let hidden=document.hidden;
let scenes=null;
let lenis=null;
let motionContext=null;
const animationButton=document.querySelector('.motion-control');
const depths=[0,5,10,20,30,50,75,100,125,150,200,300,500,700,1000];

document.querySelector('.output-planes').innerHTML=Array.from({length:15},(_,i)=>`<span style="opacity:${1-i*.045}"></span>`).join('');
document.querySelector('.depth-fallback').innerHTML=Array.from({length:15},(_,i)=>`<span style="--index:${i}"></span>`).join('');

function setupMotion(){
  motionContext?.revert();
  lenis?.destroy();
  lenis=null;
  if(reducedMotion.matches)return;
  lenis=new Lenis({duration:1.15,smoothWheel:true,syncTouch:false});
  lenis.on('scroll',ScrollTrigger.update);
  motionContext=gsap.context(()=>{
    // Content is visible in CSS; animation is a progressive enhancement.
    gsap.from('.hero-copy .text-line',{y:50,opacity:0,duration:1.35,stagger:.13,ease:'expo.out',delay:.15});
    gsap.from('.hero-copy>p,.hero-copy>.button',{y:16,opacity:0,duration:1.1,stagger:.15,ease:'power3.out',delay:.5});
    gsap.from('.hero-art',{opacity:0,scale:.94,duration:1.9,ease:'power2.out',delay:.05});
    gsap.to('.hero-art',{yPercent:16,rotation:5,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.to('.hero-copy',{y:75,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'35% top',end:'90% top',scrub:true}});
    gsap.from('.section-heading',{y:38,opacity:0,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.explore',start:'top 72%',once:true}});
    gsap.from('.depth-study',{y:70,opacity:0,duration:1.3,ease:'power3.out',scrollTrigger:{trigger:'.explore',start:'top 72%',once:true}});
    gsap.from('.architecture-copy',{y:35,opacity:0,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.architecture',start:'top 76%',once:true}});
    gsap.from('.architecture-stage',{y:20,opacity:0,duration:.95,stagger:.2,ease:'power3.out',scrollTrigger:{trigger:'.architecture-visual',start:'top 85%',once:true}});
  });
}
setupMotion();
gsap.ticker.lagSmoothing(0);

let signalTween=gsap.to('.signal-pulses',{strokeDashoffset:-1500,duration:5.5,ease:'none',repeat:-1,paused:true});
let architectureVisible=false;
function updatePlayback(){
  const pause=userPaused||reducedMotion.matches||modalOpen||hidden;
  signalTween.paused(pause||!architectureVisible);
  animationButton.setAttribute('aria-pressed',String(userPaused));
  animationButton.setAttribute('aria-label',userPaused?'Resume ambient animation':'Pause ambient animation');
  animationButton.innerHTML=`<i class="ph ph-${userPaused?'play':'pause'}" aria-hidden="true"></i><span>${userPaused?'Resume':'Pause'} motion</span>`;
}
const architectureObserver=new IntersectionObserver(([entry])=>{architectureVisible=entry.isIntersecting;updatePlayback();});
architectureObserver.observe(document.querySelector('.architecture-visual'));
animationButton.addEventListener('click',()=>{userPaused=!userPaused;updatePlayback();});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;updatePlayback();});
reducedMotion.addEventListener('change',()=>{setupMotion();updatePlayback();});

function tick(time,delta){
  lenis?.raf(time*1000);
  if(hidden)return;
  const paused=userPaused||reducedMotion.matches||modalOpen;
  scenes?.earth?.update(Math.min(delta/1000,.04),paused);
  scenes?.depth?.update(Math.min(delta/1000,.04),paused);
}
gsap.ticker.add(tick);

document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const target=document.querySelector(link.getAttribute('href'));
  if(!target)return;
  event.preventDefault();
  const keyboard=event.detail===0;
  history.replaceState(null,'',link.getAttribute('href'));
  const focusTarget=()=>{target.setAttribute('tabindex','-1');target.focus({preventScroll:true});};
  if(lenis&&!keyboard)lenis.scrollTo(target,{duration:1.5,offset:0,onComplete:focusTarget});
  else{target.scrollIntoView({behavior:'instant'});focusTarget();}
}));

const slider=document.querySelector('#depth-slider');
slider.addEventListener('input',()=>{
  const index=Number(slider.value);
  document.querySelector('#depth-output').value=depths[index].toLocaleString('en-IN');
  slider.setAttribute('aria-valuetext',`${depths[index]} metres below the surface`);
  scenes?.depth?.select(index);
  document.querySelectorAll('.depth-fallback span').forEach((span,i)=>span.classList.toggle('selected',i===index));
});

initPreviews({onOpen(){modalOpen=true;lenis?.stop();updatePlayback();},onClose(){modalOpen=false;lenis?.start();updatePlayback();}});

import('./scenes').then(async({createScenes})=>{
  scenes=await createScenes();
  if(scenes.earth){
    document.querySelector('.earth-controls').hidden=false;
    document.querySelector('#earth-rotate').addEventListener('click',()=>scenes.earth.rotate());
    document.querySelector('#earth-reset').addEventListener('click',()=>scenes.earth.reset());
  }
  scenes.depth?.select(Number(slider.value));
  document.documentElement.dataset.scenes='ready';
}).catch(()=>{
  document.querySelector('.hero-art').classList.add('failed');
  document.querySelector('.depth-art').classList.add('failed');
});

document.fonts.ready.then(()=>ScrollTrigger.refresh());
window.addEventListener('pagehide',(event)=>{
  if(event.persisted)return;
  scenes?.earth?.dispose();scenes?.depth?.dispose();
  architectureObserver.disconnect();signalTween.kill();motionContext?.revert();lenis?.destroy();gsap.ticker.remove(tick);
},{once:true});
