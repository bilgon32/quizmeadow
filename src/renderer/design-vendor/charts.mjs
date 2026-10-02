// Original framework-neutral SVG charts. No dependencies, DOM required only by mountChart.
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const types=['line','area','column','bar','stacked','donut','pie','scatter'];
const fmt=value=>Number(value.toFixed(2)).toLocaleString('en-US');
function validate(spec){
 if(!types.includes(spec.type))throw new TypeError('Unknown chart type');
 if(!/^[a-zA-Z][\w-]*$/.test(spec.id??''))throw new TypeError('Chart id must be a unique safe identifier');
 if(!spec.title||!Array.isArray(spec.series)||!spec.series.length||spec.series.length>6||!Array.isArray(spec.rows)||!spec.rows.length)throw new TypeError('Title, 1–6 series and rows are required');
 for(const s of spec.series)if(!s.name||s.color!=null&&(!Number.isInteger(s.color)||s.color<1||s.color>6))throw new TypeError('Named series and color index 1–6 required');
 for(const row of spec.rows){if(typeof row.label!=='string'||!Array.isArray(row.values)||row.values.length!==spec.series.length||row.values.some(v=>v!==null&&!Number.isFinite(v)))throw new TypeError('Each row needs a label and one finite value or null per series');if(spec.type==='scatter'&&!Number.isFinite(row.x))throw new TypeError('Scatter x must be finite');}
 if(['area','stacked','donut','pie'].includes(spec.type)&&spec.rows.some(row=>row.values.some(v=>v===null||v<0)||!Number.isFinite(row.values.reduce((sum,v)=>sum+v,0))))throw new TypeError('Parts require complete nonnegative values');
 if(['donut','pie'].includes(spec.type)&&(spec.rows.length!==1||spec.rows[0].values.reduce((s,v)=>s+v,0)<=0))throw new TypeError('Donut requires one complete positive total');
 return spec;
}
const seriesColor=(spec,i)=>`var(--bgp-data-${spec.series[i].color??i+1})`;
const dash=['','8 5','2 5','10 4 2 4','6 3','1 4'];
const seriesLabel=(spec,i)=>`${String(i+1).padStart(2,'0')} ${spec.series[i].name}`;
const text=(x,y,value,cls='',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${escape(value)}</text>`;
function marker(x,y,i,color){const style=`fill="${color}" class="bgp-chart-mark"`;
 if(i%3===1)return `<rect x="${x-4}" y="${y-4}" width="8" height="8" ${style}/>`;
 if(i%3===2)return `<path d="M${x} ${y-5}l5 9h-10Z" ${style}/>`;
 return `<circle cx="${x}" cy="${y}" r="4" ${style}/>`;
}
export function cartesianGeometry(input,{width=640,height=300}={}){
 if(!Number.isFinite(width)||!Number.isFinite(height))throw new TypeError('Chart dimensions must be finite');
 const spec=validate(input);width=Math.max(180,width);height=Math.max(240,height);
 const values=spec.type==='stacked'||spec.type==='area'?spec.rows.map(row=>row.values.reduce((s,v)=>s+v,0)):spec.rows.flatMap(row=>row.values).filter(v=>v!==null);
 const rawLow=Math.min(0,...values),rawHigh=Math.max(0,...values),span=rawHigh-rawLow||1;
 if(!Number.isFinite(span))throw new RangeError('Numeric domain is too wide');
 const magnitude=10**Math.floor(Math.log10(span/4)),step=[1,2,2.5,5,10].map(n=>n*magnitude).find(n=>n>=span/4);
 if(!step||!Number.isFinite(step))throw new RangeError('Numeric domain exceeds usable precision');
 const low=Math.floor(rawLow/step)*step,max=Math.ceil((rawHigh===rawLow?rawLow+1:rawHigh)/step)*step;
 if(!Number.isFinite(low)||!Number.isFinite(max)||max<=low)throw new RangeError('Numeric domain exceeds usable precision');
 const plot={left:50,right:width-30,top:24,bottom:height-48};
 const y=value=>plot.bottom-(value-low)/(max-low)*(plot.bottom-plot.top);
 const x=i=>spec.rows.length===1?(plot.left+plot.right)/2:plot.left+i/(spec.rows.length-1)*(plot.right-plot.left);
 return {width,height,plot,min:low,max,zero:y(0),points:spec.series.map((s,j)=>spec.rows.map((row,i)=>row.values[j]===null?null:{x:x(i),y:y(row.values[j]),value:row.values[j]})),y,x};
}
export function partGeometry(input){const spec=validate(input),values=spec.rows[0].values,total=values.reduce((s,v)=>s+v,0);let offset=0;return {total,parts:values.map((value,i)=>{const part={index:i,value,fraction:value/total,start:offset,end:offset+value/total};offset=part.end;return part;})};}
function paths(points){const groups=[];let group=[];for(const p of points){if(p)group.push(p);else if(group.length){groups.push(group);group=[];}}if(group.length)groups.push(group);return groups.map(g=>g.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' '));}
function plotSVG(spec,options={}){
 const g=cartesianGeometry(spec,options),{width:w,height:h,plot:p}=g;let content='';
 const pattern=i=>`url(#${spec.id}-pattern-${i})`;
 content+=`<defs>${spec.series.map((series,i)=>`<pattern id="${spec.id}-pattern-${i}" patternUnits="userSpaceOnUse" width="${8+i*3}" height="${8+i*3}" patternTransform="rotate(${[0,45,90,-45,25,65][i]})"><rect width="100%" height="100%" fill="${seriesColor(spec,i)}"/><path d="M0 0V${8+i*3}" stroke="var(--bgp-display)" stroke-width="1.5"/></pattern>`).join('')}</defs>`;
 const ticks=[0,.25,.5,.75,1].map(f=>g.min+(g.max-g.min)*f);
 if(['donut','pie'].includes(spec.type)){
  const {total,parts}=partGeometry(spec),cx=w/2,cy=104,r=Math.min(72,(w-76)/2);
  content+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bgp-display-track)" stroke-width="26"/>`;
  for(const part of parts){if(!part.value)continue;const a=part.start*2*Math.PI-Math.PI/2,b=part.end*2*Math.PI-Math.PI/2;const point=theta=>`${cx+r*Math.cos(theta)} ${cy+r*Math.sin(theta)}`;
   if(spec.type==='pie'){const radius=r+13,outer=theta=>`${cx+radius*Math.cos(theta)} ${cy+radius*Math.sin(theta)}`;content+=part.fraction===1?`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${pattern(part.index)}"/>`:`<path d="M${cx} ${cy}L${outer(a)}A${radius} ${radius} 0 ${part.fraction>.5?1:0} 1 ${outer(b)}Z" fill="${pattern(part.index)}" stroke="var(--bgp-display)" stroke-width="3"/>`;continue;}
   if(part.fraction===1)content+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${pattern(part.index)}" stroke-width="26"/>`;
   else content+=`<path d="M${point(a)} A${r} ${r} 0 ${part.fraction>.5?1:0} 1 ${point(b)}" fill="none" stroke="${pattern(part.index)}" stroke-width="26"/><path d="M${cx+(r-13)*Math.cos(a)} ${cy+(r-13)*Math.sin(a)}L${cx+(r+13)*Math.cos(a)} ${cy+(r+13)*Math.sin(a)}" stroke="var(--bgp-display)" stroke-width="3"/>`;
  }
  parts.forEach(part=>{if(!part.value)return;const angle=(part.start+part.end)*Math.PI-Math.PI/2;const x=cx+(r+25)*Math.cos(angle),y=cy+(r+25)*Math.sin(angle);content+=text(x,y+4,String(part.index+1).padStart(2,'0'),'bgp-chart-value','middle');});
  if(spec.type==='donut')content+=text(cx,102,fmt(total),'bgp-chart-value','middle')+text(cx,126,spec.unit??'total','','middle');
  parts.forEach((part,i)=>{content+=text(16,210+i*24,`${seriesLabel(spec,i)} · ${fmt(part.value)} / ${fmt(part.fraction*100)}%`);});
  return {width:w,height:Math.max(h,230+parts.length*24),content};
 }
 if(spec.type==='bar'){
  const left=Math.min(140,w*.34),right=w-44,bh=Math.max(14,24/spec.series.length),rowHeight=Math.max(56,(bh+4)*spec.series.length+16),height=spec.rows.length*rowHeight+54;
  const x=value=>left+(value-g.min)/(g.max-g.min)*(right-left),zero=x(0);
  content+=`<path d="M${zero} 15V${height-34}" class="bgp-chart-axis"/>`;
  spec.rows.forEach((row,i)=>{const y=24+i*rowHeight;content+=text(10,y+17,row.label);
   row.values.forEach((v,j)=>{if(v===null)return;const yy=y+j*(bh+4);content+=`<rect x="${Math.min(zero,x(v))}" y="${yy}" width="${Math.abs(x(v)-zero)}" height="${bh}" fill="${spec.series.length>1?pattern(j):seriesColor(spec,j)}" class="bgp-chart-mark"/>`+text(x(v)+(v<0?-6:6),yy+bh,fmt(v),'bgp-chart-value',v<0?'end':'start');});
  });content+=text(left,height-10,`${spec.unit??'Value'} · zero baseline`);return {width:w,height,content};
 }
 content+=`<rect x="${p.left}" y="${p.top}" width="${p.right-p.left}" height="${p.bottom-p.top}" fill="var(--bgp-display)"/>`;
 ticks.forEach(v=>{const y=g.y(v);content+=`<path d="M${p.left} ${y}H${p.right}" class="bgp-chart-grid"/>`+text(p.left-8,y+4,fmt(v),'','end');});
 content+=`<path d="M${p.left} ${p.top}V${p.bottom}H${p.right}" class="bgp-chart-axis"/><path d="M${p.left} ${g.zero}H${p.right}" class="bgp-chart-axis"/>`+text(p.left,14,spec.unit??'Value');
 if(spec.type==='scatter'){
  const minX=Math.min(0,...spec.rows.map(row=>row.x)),maxX=Math.max(1,...spec.rows.map(row=>row.x));if(!Number.isFinite(maxX-minX))throw new RangeError('Scatter domain is too wide');const x=value=>p.left+(value-minX)/(maxX-minX)*(p.right-p.left);
  [0,.5,1].forEach(f=>{const v=minX+f*(maxX-minX);content+=text(x(v),h-27,fmt(v),'','middle');});content+=text((p.left+p.right)/2,h-5,spec.xLabel??'x','','middle');
  spec.rows.forEach(row=>row.values.forEach((value,i)=>{if(value!==null)content+=`<g><title>${escape(row.label)}: ${fmt(row.x)}, ${fmt(value)}</title>${marker(x(row.x),g.y(value),i,seriesColor(spec,i))}</g>`;}));
 }else {
  const every=Math.max(1,Math.ceil(spec.rows.length/Math.max(2,Math.floor((w-70)/62))));
  spec.rows.forEach((row,i)=>{if(!['column','stacked'].includes(spec.type)&&(i%every===0||i===spec.rows.length-1))content+=text(g.x(i),h-25,row.label,'','middle');});
  if(['column','stacked'].includes(spec.type)){
   const step=(p.right-p.left)/spec.rows.length,bw=Math.min(48,step*.7);
   spec.rows.forEach((row,i)=>{const center=p.left+step*(i+.5);let previous=0;row.values.forEach((v,j)=>{if(v===null)return;const a=spec.type==='stacked'?previous:0,b=a+v;const barWidth=spec.type==='stacked'?bw:bw/spec.series.length,x=center-bw/2+(spec.type==='stacked'?0:j*barWidth);content+=`<rect x="${x}" y="${Math.min(g.y(a),g.y(b))}" width="${barWidth}" height="${Math.abs(g.y(b)-g.y(a))}" fill="${spec.series.length>1?pattern(j):seriesColor(spec,j)}" class="bgp-chart-mark"/>`;previous=b;});});
   // Category tick centers must match the column positions, not the line positions.
   spec.rows.forEach((row,i)=>{if(i%every===0||i===spec.rows.length-1)content+=text(p.left+step*(i+.5),h-25,row.label,'','middle');});
  } else if(spec.type==='area'){
   let previous=spec.rows.map(()=>0);
   spec.series.forEach((s,i)=>{const top=spec.rows.map((row,j)=>previous[j]+row.values[i]);const poly=[...top.map((v,j)=>`${g.x(j)} ${g.y(v)}`),...previous.map((v,j)=>`${g.x(j)} ${g.y(v)}`).reverse()].join(' ');content+=`<polygon points="${poly}" fill="${pattern(i)}" class="bgp-chart-mark"/>`;previous=top;});
  }else spec.series.forEach((s,i)=>{for(const d of paths(g.points[i]))content+=`<path d="${d}" class="bgp-chart-line" stroke="${seriesColor(spec,i)}" stroke-dasharray="${dash[i]}"/>`;g.points[i].forEach(point=>{if(point)content+=marker(point.x,point.y,i,seriesColor(spec,i));});const end=g.points[i].at(-1);if(end)content+=text(end.x-8,end.y-10,String(i+1).padStart(2,'0'),'bgp-chart-value','end');});
 }
 return {width:w,height:h,content};
}
function svg(spec,options){const p=plotSVG(spec,options);return `<svg viewBox="0 0 ${p.width} ${p.height}" role="img" aria-labelledby="${spec.id}-title ${spec.id}-description"><title id="${spec.id}-title">${escape(spec.title)}</title><desc id="${spec.id}-description">${escape(spec.description??'')} Exact values are in the accompanying data table.</desc>${p.content}</svg>`;}
export function renderChart(input,options={}){
 const spec=validate(input),unit=spec.unit?` (${spec.unit})`:'';
 return `<figure class="bgp-chart"><div class="bgp-readout bgp-chart-face">${svg(spec,options)}</div><ul class="bgp-chart-legend" aria-label="Series">${spec.series.map((s,i)=>`<li>${['stacked','area','donut','pie'].includes(spec.type)?`<svg viewBox="0 0 24 12" aria-hidden="true"><rect width="24" height="12" fill="url(#${spec.id}-pattern-${i})"/></svg>`:`<span class="bgp-chart-key" style="--series:${seriesColor(spec,i)}" aria-hidden="true"></span>`}${escape(seriesLabel(spec,i))}${spec.type==='line'?` · ${['solid ○','dashed □','dotted △','dash-dot ○','short dash □','fine dots △'][i]}`:''}</li>`).join('')}</ul><figcaption><p>${escape(spec.description??'')}</p><details><summary>View data table</summary><div class="bgp-table-wrap" tabindex="0" role="region" aria-label="${escape(spec.title)} data"><table class="bgp-table"><caption>${escape(spec.title+unit)}</caption><thead><tr><th scope="col">${escape(spec.xLabel??'Period / item')}</th>${spec.type==='scatter'?'<th scope="col">x</th>':''}${spec.series.map((s,i)=>`<th scope="col">${escape(seriesLabel(spec,i))}</th>`).join('')}</tr></thead><tbody>${spec.rows.map(row=>`<tr><th scope="row">${escape(row.label)}</th>${spec.type==='scatter'?`<td>${fmt(row.x)}</td>`:''}${row.values.map(v=>`<td>${v===null?'Missing':fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details></figcaption></figure>`;
}
export function mountChart(container,input){
 let spec=validate(input),width=Math.max(180,container.clientWidth-26),disposed=false;
 container.innerHTML=renderChart(spec,{width});
 const observer=new ResizeObserver(entries=>{const next=Math.max(180,entries[0].contentRect.width-26);if(disposed||Math.abs(width-next)<2)return;width=next;container.querySelector('.bgp-chart-face').innerHTML=svg(spec,{width});});observer.observe(container);
 return {update(next){spec=validate(next);const open=container.querySelector('details').open;container.innerHTML=renderChart(spec,{width});container.querySelector('details').open=open;},destroy(){disposed=true;observer.disconnect();}};
}
