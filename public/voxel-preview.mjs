import * as THREE from './vendor/three/three.module.js';

const asset=name=>new URL('./minecraft/'+name,import.meta.url).href;
const active=new Map();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function previewMarkup(kind='press',elements=null,view='iso'){return `<div class="voxel-preview" data-voxel="${esc(kind)}" data-view="${esc(view)}" ${elements?`data-elements="${esc(JSON.stringify(elements))}"`:''}><canvas tabindex="0" role="img" aria-label="${esc(kind)} textured 3D model. Drag or use arrow keys to rotate. Scroll to zoom."></canvas><span class="voxel-hint">Drag to rotate · Scroll to zoom</span></div>`;}

// BoxGeometry face order: east, west, up, down, south, north.
export function boxUV(width,height,depth,u=0,v=0){return [
 [u+depth+width,v+depth,depth,height], [u,v+depth,depth,height],
 [u+depth,v,width,depth], [u+depth+width,v,width,depth],
 [u+depth,v+depth,width,height], [u+depth+width+depth,v+depth,width,height]
];}
export function entityParts(kind){
 const part=(name,size,at,uv)=>({name,size,at,uv});
 if(kind==='creeper')return [part('head',[8,8,8],[0,22,0],[0,0]),part('body',[8,12,4],[0,12,0],[16,16]),...[-2,2].flatMap(x=>[-4,4].map(z=>part('foot',[4,6,4],[x,3,z],[0,16])))];
 return [part('head',[8,8,8],[0,28,0],[0,0]),part('body',[8,12,4],[0,18,0],[16,16]),part('right arm',[4,12,4],[-6,18,0],[40,16]),part('left arm',[4,12,4],[6,18,0],[32,48]),part('right leg',[4,12,4],[-2,6,0],[0,16]),part('left leg',[4,12,4],[2,6,0],[16,48])];
}
function makePreview(root){
 const canvas=root.querySelector('canvas'),renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),group=new THREE.Group(),camera=new THREE.OrthographicCamera();scene.add(group);
 const hemi=new THREE.HemisphereLight(0xffffff,0xb6b6b6,2.4),sun=new THREE.DirectionalLight(0xffffff,1.6);sun.position.set(-20,40,30);scene.add(hemi,sun);
 const ownedTextures=[],geometries=[],materials=[],loader=new THREE.TextureLoader();let dead=false,zoom=1,yaw=root.dataset.view==='front'||root.dataset.view==='top'?0:.65,pitch=root.dataset.view==='top'?Math.PI/2:root.dataset.view==='front'?0:.3,drag=null,painted=null,paintTexture=null;
 function render(){if(!dead)renderer.render(scene,camera);}
 function texture(name){const t=loader.load(asset(name),()=>{if(!dead)render();},undefined,()=>{root.dataset.error='texture';root.querySelector('.voxel-hint').textContent='Texture could not load. Reload this preview.';});t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;ownedTextures.push(t);return t;}
 function material(map){const m=new THREE.MeshLambertMaterial({map,transparent:true,alphaTest:.5});materials.push(m);return m;}
 function box(size,at,maps,uv=null,atlas=[64,32]){
  const geometry=new THREE.BoxGeometry(...size);geometries.push(geometry);
  if(uv){const attr=geometry.attributes.uv;boxUV(...size,...uv).forEach(([x,y,w,h],face)=>{const coords=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]];coords.forEach(([a,b],i)=>attr.setXY(face*4+i,a/atlas[0],1-b/atlas[1]));});attr.needsUpdate=true;}
  const mesh=new THREE.Mesh(geometry,maps);mesh.position.set(...at);group.add(mesh);return mesh;
 }
 const kind=root.dataset.voxel,isMob=['creeper','zombie'].includes(kind);let height=isMob?32:16;
 if(isMob){const skin=material(texture(kind+'.png'));for(const p of entityParts(kind)){const mesh=box(p.size,p.at,skin,p.uv,kind==='zombie'?[64,64]:[64,32]);if(kind==='zombie'&&p.name.includes('arm')){mesh.rotation.x=-Math.PI/2;mesh.position.set(p.at[0],23,6);}}}
 else if(root.dataset.elements){const elements=JSON.parse(root.dataset.elements);for(const e of elements){const name=e.name==='base'?'stone':/column|housing|head|cap/.test(e.name)?'iron_block':'copper_block';box(e.to.map((n,i)=>n-e.from[i]),e.to.map((n,i)=>(n+e.from[i])/2-([8,0,8][i])),material(texture(name+'.png')));}}
 else {const map=kind==='copper'?'copper_block':kind==='steel'?'iron_block':kind;
  const faces=kind==='press'?['biome-press-side.svg','biome-press-side.svg','biome-press-top.svg','biome-press-top.svg','biome-press-front.svg','biome-press-side.svg']:kind==='furnace'?['furnace_side.png','furnace_side.png','furnace_top.png','furnace_top.png','furnace_front.png','furnace_side.png']:kind==='oak_log'?['oak_log.png','oak_log.png','oak_log_top.png','oak_log_top.png','oak_log.png','oak_log.png']:Array(6).fill(map+'.png');
  box([16,16,16],[0,8,0],faces.map(name=>material(texture(name))));
 }
 const ground=new THREE.GridHelper(isMob?40:24,isMob?10:6,0x526052,0x3c463e);ground.position.y=-.1;scene.add(ground);geometries.push(ground.geometry);materials.push(ground.material);
 const target=new THREE.Vector3(0,height/2,0);
 function position(){const radius=70;camera.position.set(Math.sin(yaw)*Math.cos(pitch)*radius,target.y+Math.sin(pitch)*radius,Math.cos(yaw)*Math.cos(pitch)*radius);camera.lookAt(target);render();}
 function resize(){const {width,height:h}=root.getBoundingClientRect();if(!width||!h)return;renderer.setSize(width,h,false);const half=(height*.8+5)/zoom;camera.left=-half*width/h;camera.right=half*width/h;camera.top=half;camera.bottom=-half;camera.near=.1;camera.far=200;camera.updateProjectionMatrix();position();}
 const observer=new ResizeObserver(resize);observer.observe(root);
 canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.012;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag[1])*.01,-1.1,1.3);drag=[e.clientX,e.clientY];position();});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(-e.deltaY*.002),.6,2.5);resize();},{passive:false});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){yaw=.65;pitch=.3;zoom=1;}if(e.key==='ArrowLeft')yaw-=.2;if(e.key==='ArrowRight')yaw+=.2;if(e.key==='ArrowUp')pitch=Math.min(pitch+.15,1.3);if(e.key==='ArrowDown')pitch=Math.max(pitch-.15,-1.1);resize();});
 resize();root.dataset.ready='true';
 return {paint(url){if(painted===url)return;painted=url;paintTexture?.dispose();const t=loader.load(url,()=>{if(!dead)render();});t.colorSpace=THREE.SRGBColorSpace;t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;paintTexture=t;group.children.forEach(mesh=>{for(const m of [].concat(mesh.material)){m.map=t;m.needsUpdate=true;}});},dispose(){dead=true;paintTexture?.dispose();observer.disconnect();geometries.forEach(g=>g.dispose());materials.flat().forEach(m=>m.dispose());ownedTextures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();}};
}
export function mountVoxelPreviews(){for(const [root,instance] of active){if(!root.isConnected){instance.dispose();active.delete(root);}}for(const root of document.querySelectorAll('[data-voxel]')){if(!active.has(root)){try{active.set(root,makePreview(root));}catch{root.dataset.error='webgl';root.innerHTML='<p>3D rendering needs WebGL. The original texture is still shown below.</p>';}}const paint=root.closest('.paint-block-preview')?.dataset.paintedTexture;if(paint)active.get(root)?.paint(paint);}}

export function assetGallery(){return `<section class="minecraft-assets panel"><p class="eyebrow">MINECRAFT REFERENCE WORKBENCH</p><h2>Pixels, blocks, and mobs</h2><p>Original Minecraft textures at their native resolution. Rotate the models to inspect every side.</p><h3>Items · 16 × 16 pixels</h3><div class="real-item-gallery">${['copper_ingot','iron_ingot','diamond','coal','redstone','apple','iron_sword','stick'].map(name=>`<figure><img src="${asset(name+'.png')}" alt="${name.replaceAll('_',' ')}" width="64" height="64"><figcaption>${name.replaceAll('_',' ')}</figcaption></figure>`).join('')}</div><h3>Blocks · six textured faces</h3><div class="real-model-gallery">${['copper','furnace','oak_log'].map(name=>`<figure>${previewMarkup(name)}<figcaption>${name.replaceAll('_',' ')} · 16 × 16 per face</figcaption></figure>`).join('')}</div><h3>Mobs · textured body parts</h3><p>Mob skins are texture atlases. Each part uses its own region; shrinking the whole skin to 16 × 16 would destroy the face and body details.</p><div class="real-model-gallery mobs">${['creeper','zombie'].map(name=>`<figure>${previewMarkup(name)}<figcaption>${name} · ${name==='creeper'?'64 × 32':'64 × 64'} skin</figcaption></figure>`).join('')}</div></section>`;}
