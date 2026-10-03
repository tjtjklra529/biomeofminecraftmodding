import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorStatus,chatTutor,tutorMessages} from '../ollama-tutor.mjs';
import {screenLayoutChecks,validateActivity} from '../public/studio-core.mjs';
const models={models:[{name:'llama3.1:latest',size:4900000000},{name:'qwen3-coder:latest',size:18500000000}]};
test('Ollama conversation forwards history, code and failures and returns model content',async()=>{
 let sent;
 const fetcher=async(url,options)=>{if(url.endsWith('/api/tags'))return {ok:true,json:async()=>models};sent=JSON.parse(options.body);return {ok:true,json:async()=>({message:{content:'Use >= to include the exact recipe cost.'}})};};
 const reply=await chatTutor({question:'Why does my exact-cost test fail?',history:[{role:'user',text:'I have three ingots.'},{role:'assistant',text:'Show the condition.'}],context:{id:'firststeps',code:'return input > 3;',result:{checks:[{name:'Exact cost',passed:false}]}}},{},{fetcher});
 assert.equal(reply.text,'Use >= to include the exact recipe cost.');assert.equal(reply.model,'llama3.1:latest');assert.equal(sent.model,'llama3.1:latest');assert.equal(sent.messages[1].content,'I have three ingots.');assert.match(sent.messages[0].content,/return input > 3;/);assert.match(sent.messages[0].content,/Exact cost/);assert.equal(sent.messages.at(-1).content,'Why does my exact-cost test fail?');
 await assert.rejects(chatTutor({question:'Explain',model:'unknown'},{},{fetcher}),/installed Ollama model/);
 assert.throws(()=>tutorMessages({question:''},{}),/question/);
});
test('Ollama errors are visible instead of substituting a canned answer',async()=>{
 const offline=async()=>{throw new Error('offline');};assert.equal((await tutorStatus(offline)).online,false);await assert.rejects(chatTutor({question:'Help'}, {},{fetcher:offline}),/offline/);
 const empty=async url=>({ok:true,json:async()=>url.endsWith('/api/tags')?models:{message:{content:''}}});await assert.rejects(chatTutor({question:'Help'}, {},{fetcher:empty}),/empty answer/);
});
test('screen checks distinguish overlap, clipping and a valid custom layout',()=>{
 const layout={title:'Copper Press',inputX:44,inputY:36,outputX:116,outputY:36};assert.ok(screenLayoutChecks(layout).every(c=>c.passed));
 assert.equal(screenLayoutChecks({...layout,outputX:50})[1].passed,false);assert.equal(screenLayoutChecks({...layout,inputY:84})[0].passed,false);assert.equal(screenLayoutChecks({...layout,title:''})[2].passed,false);
 assert.throws(()=>screenLayoutChecks({...layout,inputX:NaN}),/whole-number/);
 const rules={input:'inclusive',output:true,enabled:true};assert.equal(validateActivity('press',{layout,rules},'ui-layout').passed,true);assert.equal(validateActivity('press',{layout:{...layout,outputX:50},rules},'ui-layout').passed,false);
});
