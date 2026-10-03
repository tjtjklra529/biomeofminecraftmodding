import test from 'node:test';
import assert from 'node:assert/strict';
import {createTutor} from '../public/tutor.mjs';
test('Enter sends one model request; Shift+Enter and IME composition keep editing',async()=>{
 const names=['matchMedia','document','sessionStorage','localStorage','window','location','setTimeout'],old=Object.fromEntries(names.map(k=>[k,globalThis[k]]));const calls=[];let renders=0;
 const storage={getItem:()=>null,setItem(){}};
 try{
  globalThis.matchMedia=()=>({matches:false});globalThis.document={body:{classList:{toggle(){}}},querySelector:()=>null};globalThis.sessionStorage=globalThis.localStorage=storage;globalThis.window={addEventListener(){}};globalThis.location={hash:'#/machine'};globalThis.setTimeout=()=>0;
  let resolve;const tutor=createTutor({getState:()=>({}),render:()=>renders++,request:async(url,body)=>{calls.push({url,body});return await new Promise(r=>resolve=r);}});
  let prevented=0;const key=(shift=false,composing=false)=>({target:{id:'tutor-question',value:'Why does exactly three fail?'},key:'Enter',shiftKey:shift,isComposing:composing,preventDefault:()=>prevented++});
  tutor.keydown(key(true));tutor.keydown(key(false,true));assert.equal(calls.length,0);assert.equal(prevented,0);
  tutor.keydown(key());assert.equal(calls.length,1);assert.equal(prevented,1);assert.equal(calls[0].url,'/api/tutor/chat');assert.equal(calls[0].body.question,'Why does exactly three fail?');assert.equal(calls[0].body.context.id,'free-press');
  tutor.keydown(key());assert.equal(calls.length,1,'busy request is not duplicated');resolve({text:'Exactly three fails a strict greater-than guard.',model:'llama3.1:latest'});await new Promise(r=>old.setTimeout(r,0));assert.match(tutor.markup(),/strict greater-than guard/);assert.ok(renders>=2);
 }finally{for(const k of names){if(old[k]===undefined)delete globalThis[k];else globalThis[k]=old[k];}}
});
