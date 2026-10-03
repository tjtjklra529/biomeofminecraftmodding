import {lessons,projects} from './course.mjs';
import {workshopChapters,workshopComplete} from './workshop-course.mjs';
import {validateActivity,validElements} from './studio-core.mjs';
export const hosted=typeof location!=='undefined'&&location.hostname!=='127.0.0.1'&&location.hostname!=='localhost';
export function createBrowserApi(storage=localStorage){
 const key='biome-pages-progress-v1';let state={version:1,lessons:{},projects:{},history:[],studios:{},workshop:{},lastLesson:null};
 try{const saved=JSON.parse(storage.getItem(key));if(saved?.version===1)state={...state,...saved};}catch{}
 const now=()=>new Date().toISOString(),persist=()=>{storage.setItem(key,JSON.stringify(state));return {state};};
 const row=id=>state.lessons[id]??={id,quizPassed:false,codePassed:false,completed:false,attempts:0,bookmarked:false,note:'',code:''};
 function complete(l,r){const was=r.completed;r.completed=!!(r.quizPassed&&(!l.exercise||r.codePassed)&&(!l.activity||r.activityPassed));r.updatedAt=now();state.lastLesson=l.id;if(r.completed&&!was){r.completedAt=now();state.history.push({lesson:l.id,at:now()});}}
 return async function api(url,input={}){
  if(url==='/api/state')return {state,token:'browser-only',javaAvailable:false,javaTarget:25};
  if(url==='/api/tutor/status')return {online:false,models:[],defaultModel:'',error:'Ollama chat runs in the local app. The online academy keeps your lesson progress in this browser.'};
  if(url==='/api/tutor/chat')throw new Error('Start the local Biome app to chat with your Ollama model.');
  if(url==='/api/run'||url==='/api/workshop/run')return {ok:false,phase:'setup',tests:[],output:'Java execution needs the local Biome app and Java 25. You can edit and save your code here, then use the local app to run it.'};
  if(url==='/api/project'){const p=projects.find(p=>p.id===input.id);if(!p||!Array.isArray(input.checks)||input.checks.some(i=>!Number.isInteger(i)||i<0||i>=p.checks.length))throw new Error('Invalid project checklist.');state.projects[p.id]=[...new Set(input.checks)];return persist();}
  if(url.startsWith('/api/workshop/')){const c=workshopChapters.find(c=>c.id===input.id);if(!c)throw new Error('Unknown chapter.');const r=state.workshop[c.id]??={step:0,checks:{},code:c.exercise?.starter||'',codePassed:false,completed:false};
   if(url.endsWith('/save')){if(input.step!==undefined){if(!Number.isInteger(input.step)||!c.steps[input.step])throw new Error('Unknown step.');r.step=input.step;}if(input.code!==undefined)r.code=String(input.code).slice(0,20000);state.lastWorkshop=c.id;r.updatedAt=now();return persist();}
   if(url.endsWith('/check')){const step=c.steps[input.step];if(step?.kind!=='predict'||!Number.isInteger(input.answer)||!step.options[input.answer])throw new Error('Choose a checkpoint answer.');const passed=input.answer===step.answer;if(passed)r.checks[input.step]=true;r.completed=workshopComplete(c,r);return {passed,explanation:step.feedback[input.answer],...persist()};}
  }
  if(url.startsWith('/api/studio/')){const l=lessons.find(l=>l.id===input.id),c=workshopChapters.find(c=>c.id===input.id),free={'free-press':'press','free-model':'model','free-texture':'texture'};const kind=l?.activity?.kind||c?.activity?.kind||free[input.id]||(c?'press':null);if(kind!==input.kind||!kind)throw new Error('Activity does not match this lesson.');const goal=l?.activity?.goal||c?.activity?.goal||(kind==='model'?'small-base':'');const entry=state.studios[input.id]??={kind,completed:false};
   if(url.endsWith('/save')){validateActivity(kind,input.draft,goal);entry.draft=structuredClone(input.draft);entry.updatedAt=now();return persist();}
   if(url.endsWith('/test')){const result=validateActivity(kind,input.payload,goal);entry.checks=result.checks;if(result.passed){entry.completed=true;if(l){const r=row(l.id);r.activityPassed=true;complete(l,r);}if(c?.activity){const r=state.workshop[c.id]??={step:0,checks:{},codePassed:false,completed:false};r.activityPassed=true;r.completed=workshopComplete(c,r);}}return {...result,...persist()};}
  }
  const l=lessons.find(l=>l.id===input.id);if(!l)throw new Error('Unknown lesson.');const r=row(l.id);
  if(url==='/api/progress'){for(const k of ['note','document','code'])if(typeof input[k]==='string')r[k]=input[k].slice(0,k==='code'?20000:30000);if(typeof input.bookmarked==='boolean')r.bookmarked=input.bookmarked;r.updatedAt=now();state.lastLesson=l.id;return persist();}
  if(url==='/api/quiz'){if(!Number.isInteger(input.answer)||input.answer<0||input.answer>=l.quiz.options.length)throw new Error('Choose an answer.');const passed=input.answer===l.quiz.answer;r.attempts++;if(passed)r.quizPassed=true;complete(l,r);return {passed,explanation:l.quiz.explanation,...persist()};}
  throw new Error('Unsupported browser action.');
 };
}
