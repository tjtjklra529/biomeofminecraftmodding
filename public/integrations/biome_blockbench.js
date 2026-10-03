/* Biome Academy companion for Blockbench. MIT; course integration only. */
(function(){
 const query=new URLSearchParams(location.search),workspace=query.get('biome_workspace')||'free-model';
 const parentOrigin=query.get('biome_origin')||location.origin;
 if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(parentOrigin)&&!['https://tjtjklra529.github.io','https://biomeofminecraftmodding.esmp.app'].includes(parentOrigin))return;
 let actions=[],timer,listener,loading=false;
 function send(type,payload={}){if(window.parent!==window)window.parent.postMessage({source:'biome-blockbench',type,workspace,...payload},parentOrigin);}
 function snapshot(){if(!window.Project||loading)return;const elements=Cube.all.map(c=>({name:c.name,from:[...c.from],to:[...c.to],rotation:[...c.rotation]}));send('snapshot',{elements,projectName:Project.name,bbmodel:Codecs.project.compile({raw:true})});}
 function loadProject(model){if(!model)return;loading=true;try{const source=model.meta?model:{...model,textures:{}};(model.meta?Codecs.project:Codecs.java_block).load(source,{name:'copper_press.json',path:'copper_press.json'});if(!model.meta){const tex=new Texture({name:'copper_press.png'}).fromPath(location.origin+'/minecraft/copper_block.png').add();Cube.all.forEach(c=>c.applyTexture(tex,true));}}finally{loading=false;}Blockbench.showQuickMessage('Biome lesson model loaded');snapshot();}
 function register(){
  if(!window.Blockbench?.setup_successful||!window.Plugin||!window.Codecs){timer=setTimeout(register,250);return;}
  if(location.pathname.startsWith('/vendor/blockbench/')){Plugins.registered.biome_academy=new Plugin('biome_academy');}
  Plugin.register('biome_academy',{title:'Biome Academy',author:'The Biome of Minecraft Modding',description:'Lesson starter models, live workspace sync and model checks.',icon:'school',version:'1.0.0',variant:'both',onload(){
   actions.push(new Action('biome_send_model',{name:'Biome: send model to lesson',icon:'school',click:snapshot}));
   actions.push(new Action('biome_check_model',{name:'Biome: check block bounds',icon:'fact_check',click(){const cubes=Cube.all,invalid=cubes.filter(c=>c.from.some((v,i)=>v<0||v>=c.to[i]||c.to[i]>16));Blockbench.showMessageBox({title:'Biome model check',message:`${cubes.length} cuboids. ${invalid.length?invalid.map(c=>c.name).join(', ')+' need bounds inside 0–16 with positive dimensions.':'Bounds are valid. Review silhouette, materials and UVs visually too.'}`});snapshot();}}));
   actions.forEach(a=>MenuBar.addAction(a,'tools'));
   Blockbench.on('finish_edit',snapshot);Blockbench.on('select_project',snapshot);
   listener=e=>{if(e.origin!==parentOrigin||e.source!==window.parent||e.data?.source!=='biome-academy'||e.data.workspace!==workspace)return;if(e.data.type==='load')loadProject(e.data.model);if(e.data.type==='snapshot')snapshot();};
   window.addEventListener('message',listener);send('ready');
  },onunload(){actions.forEach(a=>a.delete());Blockbench.removeListener('finish_edit',snapshot);Blockbench.removeListener('select_project',snapshot);window.removeEventListener('message',listener);clearTimeout(timer);}});
 }
 register();
})();
