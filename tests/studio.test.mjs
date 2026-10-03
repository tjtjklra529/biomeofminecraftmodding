import test from 'node:test';
import assert from 'node:assert/strict';
import {processPress,validateActivity,starterModel,starterTexture,minecraftModel} from '../public/studio-core.mjs';
import {tutorMessages} from '../ollama-tutor.mjs';
import {lessons} from '../public/course.mjs';
import {phases} from '../public/pathway.mjs';

test('press conserves rejected state and consumes complete batches at every inventory boundary',()=>{
 const rules={input:'inclusive',output:true,enabled:true};
 for(let input=0;input<=64;input++)for(let output=0;output<=64;output++)for(const enabled of [false,true]){
  const before={input,output,enabled},after=processPress(before,rules),expected=enabled&&input>=3&&output<=62;
  assert.equal(after.allowed,expected);
  assert.equal(after.input,expected?input-3:input);assert.equal(after.output,expected?output+2:output);
  assert.ok(after.output<=64);assert.deepEqual(before,{input,output,enabled},'does not mutate supplied snapshot');
 }
 const broken=validateActivity('press',{rules:{input:'exclusive',output:false,enabled:false}});assert.equal(broken.passed,false);assert.equal(broken.checks.filter(c=>!c.passed).length,4);
});
test('model export keeps geometry, resource references, and six faces; invalid dimensions rejected',()=>{
 const source=starterModel(),exported=minecraftModel(source);assert.deepEqual(exported.elements.map(e=>e.from),source.map(e=>e.from));
 for(const part of exported.elements){assert.equal(Object.keys(part.faces).length,6);for(const face of Object.values(part.faces))assert.equal(face.texture,'#all');}
 assert.equal(exported.textures.all,'biome:block/copper_press');assert.equal(validateActivity('model',{elements:source},'small-base').passed,true);
 source[0].to[0]=source[0].from[0];assert.throws(()=>validateActivity('model',{elements:source}),/positive dimensions/);
});
test('texture checks detect flat material and broken repeat edges',()=>{
 const pixels=starterTexture();assert.equal(validateActivity('texture',{pixels},'tile').passed,true);
 pixels[0]='#ffffff';const report=validateActivity('texture',{pixels},'tile');assert.equal(report.passed,false);assert.equal(report.checks.find(c=>c.name==='Matching opposite edges').passed,false);
 assert.equal(validateActivity('texture',{pixels:Array(256).fill('#754534')}).passed,false);
 assert.throws(()=>validateActivity('texture',{pixels:Array(256).fill('red')}),/hex colours/);
});
test('tutor explains actual failures and pathway links resolve to authored courses',()=>{
 const messages=tutorMessages({question:'Explain my failed tests',history:[{role:'user',text:'I have input 3'},{role:'assistant',text:'Trace the guard.'}],context:{id:'free-press',result:{checks:[{name:'Exact cost',passed:false}]},workspace:{input:3}}},{});assert.match(messages[0].content,/Exact cost/);assert.match(messages[0].content,/input/);assert.equal(messages[1].content,'I have input 3');assert.equal(messages.at(-1).content,'Explain my failed tests');
 for(const phase of phases)for(const course of phase.courses)if(course.unit)assert.ok(lessons.some(l=>l.unit===course.unit));
 assert.equal(lessons.filter(l=>l.activity).length,36);
});
