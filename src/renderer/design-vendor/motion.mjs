/** Optional local motion. Host owns lifecycle; stable shells never receive change animation. */
const entered=new WeakSet();
const controllers=new WeakMap();
export const reducedMotion=root=>globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches||root?.dataset.motion==='reduced';
export function createMotion(root){
 const preference=globalThis.matchMedia('(prefers-reduced-motion: reduce)'),running=new Map();
 let destroyed=false;
 const reduced=()=>preference.matches||root?.dataset.motion==='reduced';
 const cancel=node=>{const entry=running.get(node);if(entry){entry.animation.cancel();running.delete(node);}return entry;};
 const finishAll=()=>{for(const [node,entry]of [...running]){cancel(node);entry.finish?.();}};
 const track=(node,frames,duration,finish)=>{
  const animation=node.animate(frames,{duration,easing:'cubic-bezier(.2,0,0,1)'});
  running.set(node,{animation,finish});
  animation.onfinish=()=>{if(running.get(node)?.animation!==animation)return;running.delete(node);finish?.();};
  return animation;
 };
 const preferenceChange=()=>{if(reduced())finishAll();};
 const visibilityChange=()=>{if(root.ownerDocument.hidden)finishAll();};
 preference.addEventListener('change',preferenceChange);
 root.ownerDocument.addEventListener('visibilitychange',visibilityChange);
 const observer=new MutationObserver(preferenceChange);observer.observe(root,{attributes:true,attributeFilter:['data-motion']});
 return {
  enterOnce(node){if(destroyed||entered.has(node))return false;entered.add(node);if(reduced())return false;track(node,[{opacity:0},{opacity:1}],450);return true;},
  signalChange(node){if(destroyed)return;cancel(node);if(reduced())return;track(node,[{opacity:.25},{opacity:1}],160);},
  toggleDisclosure(details){
   if(destroyed)return;
   const body=details.querySelector('.bgp-disclosure-body'),summary=details.querySelector('summary');if(!body||!summary)return;
   const desired=details.dataset.targetOpen===undefined?!details.open:details.dataset.targetOpen!=='true';
   const from=details.open?body.getBoundingClientRect().height:0,opacity=details.open?getComputedStyle(body).opacity:0;
   cancel(body);details.dataset.targetOpen=String(desired);summary.setAttribute('aria-expanded',String(desired));
   if(!desired&&body.contains(root.ownerDocument.activeElement))summary.focus();body.inert=!desired;
   const finish=()=>{details.open=desired;body.inert=!desired;delete details.dataset.targetOpen;};
   if(reduced()){finish();return;}details.open=true;
   track(body,[{height:from+'px',opacity},{height:(desired?body.scrollHeight:0)+'px',opacity:desired?1:0}],200,finish);
  },
  finish:finishAll,
  destroy(){if(destroyed)return;destroyed=true;finishAll();observer.disconnect();preference.removeEventListener('change',preferenceChange);root.ownerDocument.removeEventListener('visibilitychange',visibilityChange);}
 };
}
const controller=root=>{if(!controllers.has(root))controllers.set(root,createMotion(root));return controllers.get(root);};
export const enterOnce=(node,{root=node.closest('.bg-project')}={})=>controller(root).enterOnce(node);
export const signalChange=(node,{root=node.closest('.bg-project')}={})=>controller(root).signalChange(node);
export function destroyMotion(root){controllers.get(root)?.destroy();controllers.delete(root);}

/** Recessed meter geometry: pivot (180,166), -64..64 degrees, normalized input 0..1.
 * This is a visual response, not a calibrated hardware VU instrument.
 * Call suspend when hidden/offscreen, and destroy on unmount. */
export class NeedleMotion {
 constructor(needle, {root=needle.closest('.bg-project')}={}) {this.needle=needle;this.root=root;this.position=0;this.target=0;this.velocity=0;this.frame=0;this.paint();}
 paint() {this.needle.setAttribute('transform',`rotate(${-64+128*this.position} 180 166)`);}
 set(value) {
  this.target=Math.max(0,Math.min(1,Number(value)||0));
  if(reducedMotion(this.root)||document.hidden) {this.suspend();this.position=this.target;this.velocity=0;this.paint();return;}
  this.started=performance.now();
  if(this.frame)return;
  this.last=performance.now();
  const tick=now=>{
   if(reducedMotion(this.root)||document.hidden){this.frame=0;this.position=this.target;this.velocity=0;this.paint();return;}
   let remaining=Math.min(.032,(now-this.last)/1000);this.last=now;
   while(remaining>0){const dt=Math.min(.004,remaining);const accel=400*(this.target-this.position)-34*this.velocity;this.velocity+=accel*dt;this.position=Math.max(0,Math.min(1,this.position+this.velocity*dt));remaining-=dt;}
   this.paint();
   if((Math.abs(this.target-this.position)<.0004&&Math.abs(this.velocity)<.005)||now-this.started>=600){this.position=this.target;this.velocity=0;this.paint();this.frame=0;return;}
   this.frame=requestAnimationFrame(tick);
  };this.frame=requestAnimationFrame(tick);
 }
 suspend(){cancelAnimationFrame(this.frame);this.frame=0;}
 snap(){this.suspend();this.position=this.target;this.velocity=0;this.paint();}
 destroy(){this.suspend();}
}

/** Explicit finite trace preview. Axis, points, data and component identity stay still. */
export function revealTrace(svg,{root=document.body}={}) {
 if(reducedMotion(root))return ()=>{};
 const animations=[...svg.querySelectorAll('.bgp-chart-line')].map(path=>path.animate(
  [{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],
  {duration:600,easing:'cubic-bezier(.2,0,0,1)'}));
 return ()=>animations.forEach(animation=>animation.cancel());
}
