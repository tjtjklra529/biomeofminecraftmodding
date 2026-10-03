export const pressCases=[
 {name:'Exact cost and output room',input:3,output:0,enabled:true,expected:true},
 {name:'Too few ingots',input:2,output:0,enabled:true,expected:false},
 {name:'Full output',input:9,output:64,enabled:true,expected:false},
 {name:'Only one output space',input:9,output:63,enabled:true,expected:false},
 {name:'Machine switched off',input:9,output:0,enabled:false,expected:false},
 {name:'Ordinary processing',input:9,output:4,enabled:true,expected:true}
];
export function pressDecision(input,output,enabled,rules){return (rules.input==='inclusive'?input>=3:input>3)&&(!rules.output||64-output>=2)&&(!rules.enabled||enabled);}
export function processPress(snapshot,rules){const allowed=pressDecision(snapshot.input,snapshot.output,snapshot.enabled,rules);return {...snapshot,input:allowed?snapshot.input-3:snapshot.input,output:allowed?snapshot.output+2:snapshot.output,allowed};}
export const starterModel=(style='press')=>style==='motor'?[{name:'base',from:[1,0,1],to:[15,3,15]},{name:'housing',from:[3,3,3],to:[13,12,13]},{name:'shaft',from:[6,6,0],to:[10,10,4]},{name:'cap',from:[4,4,12],to:[12,11,15]}]:style==='buffer'?[{name:'base',from:[1,0,1],to:[15,3,15]},{name:'storage',from:[2,3,2],to:[14,13,14]},{name:'lid',from:[1,13,1],to:[15,15,15]},{name:'port',from:[6,6,0],to:[10,10,2]}]:[{name:'base',from:[1,0,1],to:[15,3,15]},{name:'column',from:[2,3,5],to:[5,15,11]},{name:'head',from:[2,12,3],to:[14,15,13]},{name:'ram',from:[8,6,6],to:[12,12,10]}];
export const palettes={copper:['#3c302e','#754534','#ae6846','#d99661','#f1c58c'],stone:['#303b3b','#52625c','#748576','#a2b49a','#d2dcc0'],steel:['#26313b','#455360','#6a7c87','#a5b6ba','#e5ece0']};
export function starterTexture(style='copper'){const p=palettes[style]||palettes.copper;return Array.from({length:256},(_,i)=>{const x=i%16,y=Math.floor(i/16);if(x===0||x===15||y===0||y===15)return p[1];if(x===2||y===2)return p[3];if(x===13||y===13)return p[0];return (x+y)%7===0?p[2]:p[1];});}
export function minecraftModel(elements){return {credit:'Created in The Biome of Minecraft Modding',textures:{all:'biome:block/copper_press',particle:'#all'},elements:elements.map(e=>({name:e.name,from:e.from,to:e.to,faces:Object.fromEntries(['north','south','east','west','up','down'].map(face=>[face,{uv:[0,0,16,16],texture:'#all'}]))}))};}
export function validElements(elements){return Array.isArray(elements)&&elements.length>=1&&elements.length<=32&&elements.every(e=>typeof e.name==='string'&&e.name.length<=60&&Array.isArray(e.from)&&e.from.length===3&&Array.isArray(e.to)&&e.to.length===3&&e.from.every((v,i)=>Number.isFinite(v)&&v>=0&&v<e.to[i]&&e.to[i]<=16));}
const hex=/^#[0-9a-f]{6}$/i;
export function screenLayoutChecks(layout){
 const l=layout||{title:'Copper Press',inputX:44,inputY:36,outputX:116,outputY:36};
 if(!['inputX','inputY','outputX','outputY'].every(k=>Number.isInteger(l[k]))||typeof l.title!=='string')throw new Error('Provide a screen title and whole-number slot coordinates.');
 const slots=[{x:l.inputX-1,y:l.inputY-1},{x:l.outputX-1,y:l.outputY-1}];
 const inside=slots.every(r=>r.x>=11&&r.y>=21&&r.x+18<=165&&r.y+18<=64);
 const [a,b]=slots,separate=a.x+18<=b.x||b.x+18<=a.x||a.y+18<=b.y||b.y+18<=a.y;
 return [{name:'Slots fit the machine panel',passed:inside,detail:'Keep each 18×18 frame inside X 11–165 and Y 21–64; leave the player inventory clear.'},{name:'Input and output frames do not overlap',passed:separate,detail:'The complete recessed frames must have separate hit regions.'},{name:'Readable screen title',passed:/^[\x20-\x7e]{1,23}$/.test(l.title)&&l.title.trim().length>0,detail:'Use a nonempty title of up to 23 printable ASCII characters for this bitmap-font exercise.'}];
}
export function validateActivity(kind,payload,goal=''){
 if(kind==='press'){
  const r=payload.rules;if(!r||!['inclusive','exclusive'].includes(r.input)||typeof r.output!=='boolean'||typeof r.enabled!=='boolean')throw new Error('Choose the three rule settings.');
  const checks=pressCases.map(c=>({name:c.name,passed:pressDecision(c.input,c.output,c.enabled,r)===c.expected,detail:`Input ${c.input}, output ${c.output}, enabled ${c.enabled}; expected ${c.expected?'process':'reject'}.`}));if(goal==='ui-layout')checks.push(...screenLayoutChecks(payload.layout));return {passed:checks.every(c=>c.passed),checks};
 }
 if(kind==='model'){
  if(!validElements(payload.elements))throw new Error('Every cuboid needs positive dimensions within the 0–16 model space.');
  const elements=payload.elements,checks=[{name:'Valid cuboid bounds',passed:true,detail:'Every axis has from < to, inside the 0–16 block space.'},{name:'Readable component structure',passed:elements.length>=3,detail:'Use at least three separately named parts for base, support, and working head.'},{name:'Distinct part names',passed:new Set(elements.map(e=>e.name.toLowerCase())).size===elements.length,detail:'Each part should have a distinct name for editing and review.'}];
  if(goal==='small-base')checks.push({name:'Base leaves space around the block',passed:elements.some(e=>e.from[0]>=1&&e.from[2]>=1&&e.to[0]<=15&&e.to[2]<=15&&e.to[1]<=4),detail:'Include a base with at least one model unit of inset and height no greater than four.'});
  checks.push({name:'Axis-aligned cuboids for this exercise',passed:!payload.rotated&&!elements.some(e=>e.rotation?.some?.(v=>v!==0)),detail:'Rotation is retained in the Blockbench project but requires separate model and runtime review. Use unrotated cuboids for these lesson checks.'});
  return {passed:checks.every(c=>c.passed),checks};
 }
 if(kind==='texture'){
  const pixels=payload.pixels;if(!Array.isArray(pixels)||pixels.length!==256||pixels.some(c=>c!==null&&!hex.test(c)))throw new Error('Provide a 16×16 texture of hex colours or transparent pixels.');
  const colours=[...new Set(pixels.filter(Boolean))];const brightness=c=>{const n=parseInt(c.slice(1),16);return .2126*(n>>16)+.7152*((n>>8)&255)+.0722*(n&255);};const tones=colours.map(brightness);
  const checks=[{name:'16×16 pixel dimensions',passed:true,detail:'The canvas contains exactly 256 pixels.'},{name:'A usable value ramp',passed:colours.length>=3&&Math.max(...tones)-Math.min(...tones)>=45,detail:'Use at least three colours with distinguishable light and dark values.'},{name:'Opaque block surface',passed:pixels.every(Boolean),detail:'For this opaque machine surface, fill every pixel.'}];
  if(goal==='tile')checks.push({name:'Matching opposite edges',passed:Array.from({length:16},(_,i)=>pixels[i]===pixels[240+i]&&pixels[i*16]===pixels[i*16+15]).every(Boolean),detail:'Match opposite edge samples, then inspect the 3×3 preview for visible repetition. This check does not judge the artwork.'});
  return {passed:checks.every(c=>c.passed),checks};
 }
 throw new Error('Unknown studio activity.');
}
