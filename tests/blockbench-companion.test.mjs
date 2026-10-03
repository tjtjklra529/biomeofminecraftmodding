import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('Blockbench companion loads models, publishes cuboids and rejects foreign messages',async()=>{
 const posts=[],listeners={},hooks={},origin='http://127.0.0.1:4320',parent={postMessage:(data,to)=>posts.push({data,to})};let loaded=null;
 const cube={name:'base',from:[1,0,1],to:[15,3,15],rotation:[0,0,0],applyTexture(){}};
 const api={window:null,location:{search:'?biome_workspace=bb-coordinates&biome_origin='+encodeURIComponent(origin),pathname:'/vendor/blockbench/index.html',origin},URLSearchParams,setTimeout,clearTimeout,Cube:{all:[cube]},Project:{name:'Press'},Codecs:{project:{compile:()=>({meta:{model_format:'java_block'},elements:[cube]})},java_block:{load:m=>loaded=m}},MenuBar:{addAction(){}},Action:class{constructor(id,options){this.id=id;Object.assign(this,options);}delete(){}},Texture:class{fromPath(){return this;}add(){return this;}},Plugins:{registered:{}},Plugin:class{static register(id,data){data.onload();}},Blockbench:{setup_successful:true,showQuickMessage(){},showMessageBox(){},on:(name,fn)=>hooks[name]=fn,removeListener(){}}};
 api.window=api;api.parent=parent;api.addEventListener=(name,fn)=>listeners[name]=fn;api.removeEventListener=()=>{};
 vm.runInNewContext(await readFile(new URL('../public/integrations/biome_blockbench.js',import.meta.url),'utf8'),api);
 assert.equal(posts[0].data.type,'ready');assert.equal(posts[0].to,origin);
 const message={source:'biome-academy',workspace:'bb-coordinates',type:'load',model:{elements:[cube]}};
 listeners.message({origin:'https://untrusted.test',source:parent,data:message});assert.equal(loaded,null);
 listeners.message({origin,source:parent,data:message});assert.ok(loaded);assert.equal(posts.at(-1).data.type,'snapshot');assert.equal(posts.at(-1).data.elements[0].name,'base');
 cube.rotation=[0,45,0];hooks.finish_edit();assert.equal(posts.at(-1).data.elements[0].rotation[1],45,'rotation survives the companion snapshot');
});
