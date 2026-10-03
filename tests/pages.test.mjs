import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserApi} from '../public/browser-api.mjs';
test('Pages starts without a server and preserves lesson and studio progress',async()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},api=createBrowserApi(storage);
 assert.equal((await api('/api/state')).javaAvailable,false);
 const rules={input:'inclusive',output:true,enabled:true};
 assert.equal((await api('/api/studio/test',{id:'first-world',kind:'press',payload:{rules}})).state.lessons['first-world'].completed,false);
 assert.equal((await api('/api/quiz',{id:'first-world',answer:0})).state.lessons['first-world'].completed,true);
 await api('/api/progress',{id:'first-world',note:'My design note',bookmarked:true});
 const restarted=createBrowserApi(storage);const state=(await restarted('/api/state')).state;assert.equal(state.lessons['first-world'].note,'My design note');assert.equal(state.lessons['first-world'].completed,true);
 await assert.rejects(api('/api/studio/test',{id:'free-texture',kind:'press',payload:{rules}}),/does not match/);
 assert.equal((await api('/api/run',{id:'types',code:'broken'})).phase,'setup');assert.equal((await api('/api/tutor/status')).online,false);
});
test('Pages grades checkpoint answers without pretending to run Java',async()=>{
 const storage={getItem:()=>null,setItem(){}},api=createBrowserApi(storage);
 await api('/api/workshop/save',{id:'variables',step:2,code:'// my draft'});
 const loaded=await api('/api/state');assert.equal(loaded.state.workshop.variables.code,'// my draft');assert.equal(loaded.state.workshop.variables.completed,false);
 await api('/api/project',{id:'workbench',checks:[0,2]});assert.deepEqual((await api('/api/state')).state.projects.workbench,[0,2]);
 await assert.rejects(api('/api/project',{id:'workbench',checks:[999]}),/Invalid/);
});
