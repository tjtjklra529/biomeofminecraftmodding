import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {lessons,units,projects} from '../public/course.mjs';
import {workshopChapters,exportedSource} from '../public/workshop-course.mjs';
import {starterTexture} from '../public/studio-core.mjs';

test('curriculum is complete, uniquely identified, and linked',()=>{
 assert.equal(lessons.length,100);assert.equal(units.length,25);assert.equal(projects.length,6);
 assert.equal(new Set(lessons.map(l=>l.id)).size,100);
 for(const u of units)assert.equal(lessons.filter(l=>l.unit===u.id).length,4);
 for(const l of lessons){assert.ok(l.paragraphs.join(' ').length>300,l.id);assert.equal(l.quiz.options.length,4);assert.ok(l.quiz.answer>=0&&l.quiz.answer<4);assert.ok(l.reference.startsWith('https://'));}
 assert.equal(lessons.filter(l=>l.exercise).length,14);
});

test('local API, actual Java compilation, grading, persistence, and request boundaries',{timeout:120000},async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'biome-test-'));
 let child;
 const base='http://127.0.0.1:4318';
 async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'4318',BIOME_DATA_DIR:dir},windowsHide:true,stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Server startup timeout')),10000);child.stdout.on('data',data=>{if(data.toString().includes('http://')){clearTimeout(timer);resolve();}});child.on('error',reject);});}
 async function stop(){if(child){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;child=null;}}
 try{
  await start();let loaded=await(await fetch(base+'/api/state')).json();assert.ok(loaded.javaAvailable,'Java JDK detected');const headers={'Content-Type':'application/json','X-Biome-Token':loaded.token};
  async function post(url,body){const res=await fetch(base+url,{method:'POST',headers,body:JSON.stringify(body)});assert.equal(res.status,200,url);return res.json();}
  assert.equal((await fetch(base)).status,200);
  assert.equal((await fetch(base+'/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal((await fetch(base+'/api/progress',{method:'POST',headers:{...headers,Origin:'https://example.com'},body:'{}'})).status,403);
  const wrong=await post('/api/quiz',{id:'types',answer:0});assert.equal(wrong.passed,false);assert.equal(wrong.state.lessons.types.completed,false);
  const correct=await post('/api/quiz',{id:'types',answer:1});assert.equal(correct.passed,true);assert.equal(correct.state.lessons.types.completed,false,'lab still required');
  const bad=await post('/api/run',{id:'types',code:'static double fillRatio(int a, int b) { broken code }'});assert.equal(bad.phase,'compile');assert.equal(bad.ok,false);
  const starter=await post('/api/run',{id:'types',code:lessons[0].exercise.starter});assert.equal(starter.ok,false,'wrong implementation must fail');
  for(const lesson of lessons.filter(l=>l.exercise)){
   const result=await post('/api/run',{id:lesson.id,code:lesson.exercise.solution});assert.equal(result.ok,true,lesson.id+': '+result.output);assert.ok(result.tests.every(t=>t.passed));
  }
  const quizOnly=await post('/api/quiz',{id:'classes',answer:2});assert.equal(quizOnly.state.lessons.classes.completed,true);
  await post('/api/progress',{id:'types',note:'Persistence test <script> remains plain text',bookmarked:true});
  await post('/api/project',{id:'workbench',checks:[0,2]});
  await post('/api/progress',{id:'markdown-readme',document:'# My saved README'});
  const publishing=await post('/api/quiz',{id:'curseforge-project',answer:1});assert.equal(publishing.state.lessons['curseforge-project'].completed,true);
  const chapters=workshopChapters;
  const badChapter=await fetch(base+'/api/workshop/save',{method:'POST',headers,body:JSON.stringify({id:'variables',step:99})});assert.equal(badChapter.status,400);
  const fakeStep=await fetch(base+'/api/workshop/check',{method:'POST',headers,body:JSON.stringify({id:'variables',step:0,answer:0})});assert.equal(fakeStep.status,400);
  const wrongPrediction=await post('/api/workshop/check',{id:'variables',step:3,answer:0});assert.equal(wrongPrediction.passed,false);assert.match(wrongPrediction.explanation,/live formula/);assert.equal(wrongPrediction.state.workshop.variables.completed,false);
  const uncompilable=await post('/api/workshop/run',{id:'variables',code:chapters.find(c=>c.id==='variables').exercise.starter});assert.equal(uncompilable.phase,'compile');assert.equal(uncompilable.ok,false);
  const wrongLogic=await post('/api/workshop/run',{id:'recipes',code:'static int platesFrom(int ingots) { return ingots * 2 / 3; }'});assert.equal(wrongLogic.ok,false);assert.ok(wrongLogic.tests.some(t=>!t.passed));
  for(const chapter of chapters.filter(c=>c.exercise)){
   const result=await post('/api/workshop/run',{id:chapter.id,code:chapter.exercise.solution});assert.equal(result.ok,true,chapter.id+': '+result.output);assert.equal(result.state.workshop[chapter.id].completed,false,'reading/checkpoints not automatically awarded');
   for(const [step,item] of chapter.steps.entries())if(item.kind==='predict'){
    const checked=await post('/api/workshop/check',{id:chapter.id,step,answer:item.answer});assert.equal(checked.passed,true);
   }
   const ready=await post('/api/workshop/save',{id:chapter.id,step:5});assert.equal(ready.state.workshop[chapter.id].completed,true);
   assert.ok(exportedSource(chapter,chapter.exercise.solution).includes('public static void main'));
  }
  await post('/api/workshop/save',{id:'variables',code:'// Saved working draft',step:2});
  const rules={input:'inclusive',output:true,enabled:true};
  const wrongRules=await post('/api/studio/test',{id:'firststeps',kind:'press',payload:{rules:{...rules,input:'exclusive'}}});assert.equal(wrongRules.passed,false);assert.equal(Boolean(wrongRules.state.workshop.firststeps?.completed),false);
  const firstPassed=await post('/api/studio/test',{id:'firststeps',kind:'press',payload:{rules}});assert.equal(firstPassed.passed,true);assert.equal(firstPassed.state.workshop.firststeps.completed,false,'reasoning still required');
  const firstChecked=await post('/api/workshop/check',{id:'firststeps',step:3,answer:1});assert.equal(firstChecked.state.workshop.firststeps.completed,true);
  const visualQuiz=await post('/api/quiz',{id:'first-world',answer:0});assert.equal(visualQuiz.state.lessons['first-world'].completed,false,'studio still required');
  const visualDone=await post('/api/studio/test',{id:'first-world',kind:'press',payload:{rules}});assert.equal(visualDone.state.lessons['first-world'].completed,true);
  const outOfOrder=await post('/api/studio/test',{id:'first-inventory',kind:'press',payload:{rules}});assert.equal(outOfOrder.state.lessons['first-inventory'].completed,false,'quiz still required');
  assert.equal((await post('/api/quiz',{id:'first-inventory',answer:1})).state.lessons['first-inventory'].completed,true);
  for(const body of [{id:'free-model',kind:'press',payload:{rules}},{id:'free-model',kind:'model',payload:{elements:[{name:'bad',from:[0,0,0],to:[-1,2,2]}]}},{id:'free-texture',kind:'texture',payload:{pixels:['#ffffff']}}])assert.equal((await fetch(base+'/api/studio/test',{method:'POST',headers,body:JSON.stringify(body)})).status,400);
  await post('/api/studio/save',{id:'first-world',kind:'press',draft:{input:6,output:2,enabled:true,rules}});
  const pixels=starterTexture();pixels[0]='#ffffff';
  assert.equal((await post('/api/studio/test',{id:'pixel-ramp',kind:'texture',payload:{pixels},goal:'tile'})).passed,true,'server uses lesson goal rather than client-supplied goal');
  assert.equal((await post('/api/studio/test',{id:'pixel-tiling',kind:'texture',payload:{pixels},goal:''})).passed,false,'tiling lesson requires seamless boundaries');
  const saved=JSON.parse(await readFile(path.join(dir,'progress.json'),'utf8'));assert.equal(saved.lessons.types.completed,true);assert.equal(saved.lessons.types.bookmarked,true);assert.deepEqual(saved.projects.workbench,[0,2]);
  await stop();await start();loaded=await(await fetch(base+'/api/state')).json();assert.equal(loaded.state.lessons.types.note,'Persistence test <script> remains plain text');assert.equal(loaded.state.lessons.types.completed,true);assert.equal(loaded.state.lessons['markdown-readme'].document,'# My saved README');
  assert.equal(loaded.state.workshop.variables.code,'// Saved working draft');assert.equal(loaded.state.workshop.variables.step,2);assert.equal(loaded.state.workshop.variables.completed,true);assert.equal(loaded.state.workshop.objects.completed,true);
  assert.equal(loaded.state.studios['first-world'].draft.input,6);assert.equal(loaded.state.workshop.firststeps.completed,true);
  assert.equal((await fetch(base+'/api/workshop/save',{method:'POST',headers,body:JSON.stringify({id:'variables',step:1})})).status,403,'old token rejected after restart');
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
