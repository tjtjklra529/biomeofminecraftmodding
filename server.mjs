import http from 'node:http';
import {readFile,writeFile,mkdir,rename,rm,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {lessons,projects} from './public/course.mjs';
import {workshopChapters,workshopComplete} from './public/workshop-course.mjs';
import {validateActivity,validElements} from './public/studio-core.mjs';
import {tutorStatus,chatTutor} from './ollama-tutor.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4320);
const publicDir=process.env.BIOME_PUBLIC_DIR||(!existsSync(path.join(root,'public/minecraft/reference-data.mjs'))&&existsSync(path.join(root,'dist/index.html'))?'dist':'public');
const dataDir=path.resolve(process.env.BIOME_DATA_DIR||path.join(root,'data'));
await mkdir(dataDir,{recursive:true});
const savePath=path.join(dataDir,'progress.json');
let state={version:1,lessons:{},projects:{},history:[],lastLesson:null};
try { const saved=JSON.parse(await readFile(savePath,'utf8')); if(saved.version!==1) throw new Error('Unsupported saved progress version'); state=saved; }
catch(e) { if(e.code!=='ENOENT') { console.error('Cannot read saved progress. Original file preserved.',e.message); process.exit(1); } }
let queue=Promise.resolve();
function persist(){const snapshot=JSON.stringify(state,null,2); queue=queue.then(async()=>{await writeFile(savePath+'.tmp',snapshot);await rename(savePath+'.tmp',savePath);});return queue;}
const token=randomBytes(32).toString('hex');
const now=()=>new Date().toISOString();
function row(id){return state.lessons[id]??={id,quizPassed:false,codePassed:false,completed:false,attempts:0,bookmarked:false,note:'',code:'',updatedAt:now()};}
function complete(lesson,r){const was=r.completed;r.completed=Boolean(r.quizPassed&&(!lesson.exercise||r.codePassed)&&(!lesson.activity||r.activityPassed));r.updatedAt=now();if(r.completed&&!was){r.completedAt=now();state.history.push({lesson:lesson.id,at:now()});}state.lastLesson=lesson.id;}
async function javaHome(){
 const choices=[process.env.BIOME_JAVA_HOME,process.env.JAVA_HOME,'C:/Program Files/Eclipse Adoptium/jdk-25.0.3.9-hotspot'].filter(Boolean);
 try {for(const d of await readdir('C:/Program Files/Eclipse Adoptium')) if(d.startsWith('jdk-25')) choices.unshift('C:/Program Files/Eclipse Adoptium/'+d);}catch{}
 return choices.find(p=>existsSync(path.join(p,'bin',process.platform==='win32'?'javac.exe':'javac'))) || null;
}
const jdk=await javaHome();
function processOutput(command,args,cwd,timeout){return new Promise(resolve=>{
 let output='',finished=false,timedOut=false;
 const child=spawn(command,args,{cwd,windowsHide:true,stdio:['ignore','pipe','pipe']});
 const timer=setTimeout(()=>{timedOut=true;child.kill();},timeout);
 function collect(chunk){output+=chunk.toString();if(output.length>32000){output=output.slice(0,32000)+'\n[Output limit reached]';child.kill();}}
 child.stdout.on('data',collect);child.stderr.on('data',collect);
 function end(code,error){if(finished)return;finished=true;clearTimeout(timer);resolve({code,output:output+(error?'\n'+error:''),timedOut});}
 child.on('error',e=>end(-1,e.message));child.on('close',c=>end(c));
});}
function literal(value){if(Array.isArray(value))return 'new int[]{'+value.join(',')+'}';return String(value);}
let running=false;
export async function runExercise(lesson,code){
 if(!jdk) return {ok:false,phase:'setup',output:'A JDK is required. Install Java 25 and set BIOME_JAVA_HOME to its folder.',tests:[]};
 if(code.length>20000) throw new Error('Keep exercise source under 20,000 characters.');
 const dir=path.join(root,'.runs',randomUUID());await mkdir(dir,{recursive:true});
 const exercise=lesson.exercise;
 const calls=exercise.tests.map((t,i)=>`try { Object actual = ${exercise.method}(${t.args.map(literal).join(',')}); boolean ok = ${typeof t.expected==='boolean'?`actual instanceof Boolean && ((Boolean)actual) == ${t.expected}`:`actual instanceof Number && Math.abs(((Number)actual).doubleValue() - (${t.expected})) < 0.000000001`}; System.out.println("BIOME_${i}::"+ok+"::"+java.util.Base64.getEncoder().encodeToString(String.valueOf(actual).getBytes(java.nio.charset.StandardCharsets.UTF_8))); } catch (Throwable error) { System.out.println("BIOME_${i}::false::"+java.util.Base64.getEncoder().encodeToString(error.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8))); }`).join('\n');
 const source='import java.util.*;\npublic class Exercise {\n'+code+'\npublic static void main(String[] args) {\n'+calls+'\n}\n}\n';
 try{
  await writeFile(path.join(dir,'Exercise.java'),source);
  const bin=name=>path.join(jdk,'bin',name+(process.platform==='win32'?'.exe':''));
  const compiled=await processOutput(bin('javac'),['--release','25','-encoding','UTF-8','Exercise.java'],dir,15000);
  if(compiled.code!==0)return {ok:false,phase:'compile',output:compiled.timedOut?'Compilation timed out.':compiled.output.replaceAll(dir,'[exercise]').replace(/Exercise\.java:(\d+):/g,(_,line)=>'Editor line '+Math.max(1,Number(line)-2)+':'),tests:[]};
  const result=await processOutput(bin('java'),['-Xmx64m','-XX:ActiveProcessorCount=2','-cp',dir,'Exercise'],dir,4000);
  const tests=exercise.tests.map((t,i)=>{const match=result.output.match(new RegExp('^BIOME_'+i+'::(true|false)::([^\\r\\n]*)','m'));return {...t,passed:match?.[1]==='true',actual:match?Buffer.from(match[2],'base64').toString('utf8'):'No result'};});
  return {ok:result.code===0&&tests.every(t=>t.passed),phase:'run',tests,output:result.timedOut?'Execution stopped after 4 seconds. Check for a loop that never terminates.':result.output.split('\n').filter(s=>!s.startsWith('BIOME_')).join('\n').trim()||'Compiled with Java 25. Test cases executed in a local JVM.'};
 }finally{await rm(dir,{recursive:true,force:true});}
}
const mime={'.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.png':'image/png','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>2000000)throw new Error('Request too large');}return JSON.parse(text||'{}');}
const server=http.createServer(async(req,res)=>{
 try{
  const host=req.headers.host;if(host!==`127.0.0.1:${port}`&&host!==`localhost:${port}`)return send(res,403,{error:'Local access only.'});
  const url=new URL(req.url,`http://${host}`);
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',url.pathname.startsWith('/vendor/blockbench/')?"default-src 'self' https: data: blob:; script-src 'self' https://web.blockbench.net 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' https:; worker-src 'self' blob:; object-src 'none'; frame-ancestors 'self'":"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self' https://piskelapp.github.io https://web.blockbench.net; object-src 'none'; frame-ancestors 'none'");
  if(req.method==='POST'){
   if(req.headers['x-biome-token']!==token)return send(res,403,{error:'Refresh the app before saving.'});
   if(req.headers.origin && req.headers.origin!==`http://${host}`)return send(res,403,{error:'Cross-origin requests are not allowed.'});
   const input=await body(req);
   if(url.pathname==='/api/tutor/chat'){try{return send(res,200,await chatTutor(input,state));}catch(e){return send(res,503,{error:e.message});}}
   if(url.pathname.startsWith('/api/studio/')){
    const lesson=lessons.find(l=>l.id===input.id),chapter=workshopChapters.find(c=>c.id===input.id);
    if(!lesson&&!chapter&&!['free-press','free-model','free-texture'].includes(input.id))return send(res,400,{error:'Choose a lesson or a studio workspace.'});
    const expected=lesson?.activity?.kind||chapter?.activity?.kind||(chapter?'press':input.id?.slice(5));
    if(!['press','model','texture'].includes(input.kind)||input.kind!==expected)return send(res,400,{error:'This activity does not match the lesson.'});
    const goal=lesson?.activity?(lesson.activity.goal||''):chapter?.activity?(chapter.activity.goal||''):(input.kind==='model'?'small-base':'');
    state.studios??={};
    const entry=state.studios[input.id]??={kind:input.kind,completed:false};
    if(url.pathname==='/api/studio/save'){
     const draft=input.draft;
     if(!draft||typeof draft!=='object')return send(res,400,{error:'Provide workspace data.'});
     if(input.kind==='model'&&!validElements(draft.elements))return send(res,400,{error:'Model bounds must be positive and inside 0–16.'});
     if(input.kind==='texture')validateActivity(input.kind,draft,goal);
     if(input.kind==='press'){
      validateActivity(input.kind,draft,goal);
      if(!Number.isInteger(draft.input)||draft.input<0||draft.input>64||!Number.isInteger(draft.output)||draft.output<0||draft.output>128||typeof draft.enabled!=='boolean')return send(res,400,{error:'Invalid machine inventory.'});
      if(draft.inventory&&(!Array.isArray(draft.inventory)||draft.inventory.length!==36||draft.inventory.some(stack=>stack!==null&&(!['copper_ingot','iron_ingot','coal','redstone','diamond','copper_plate'].includes(stack.item)||!Number.isInteger(stack.count)||stack.count<1||stack.count>64))))return send(res,400,{error:'Player inventory needs 36 slots and valid item stacks.'});
     }
     entry.draft=input.kind==='texture'?{pixels:draft.pixels,history:[]}:input.kind==='model'?{elements:draft.elements,selected:Math.min(draft.elements.length-1,Math.max(0,Number(draft.selected)||0)),bbmodel:draft.bbmodel,rotated:!!draft.rotated}:{input:draft.input,output:draft.output,enabled:draft.enabled,rules:draft.rules,message:String(draft.message||'').slice(0,500)};
     if(input.kind==='press'&&draft.inventory)entry.draft.inventory=draft.inventory;if(input.kind==='press'&&draft.layout){entry.draft.layout=draft.layout;entry.draft.editorTab=draft.editorTab;}
     entry.updatedAt=now();await persist();return send(res,200,{state});
    }
    if(url.pathname==='/api/studio/test'){
     let result;try{result=validateActivity(input.kind,input.payload,goal);}catch(error){return send(res,400,{error:error.message});}
     entry.checks=result.checks;entry.updatedAt=now();if(result.passed)entry.completed=true;
     if(result.passed&&lesson?.activity){const record=row(lesson.id);record.activityPassed=true;complete(lesson,record);}
     if(result.passed&&chapter?.activity){state.workshop??={};const record=state.workshop[chapter.id]??={step:0,checks:{},codePassed:false,completed:false};record.activityPassed=true;record.completed=workshopComplete(chapter,record);}
     await persist();return send(res,200,{...result,state});
    }
    return send(res,404,{error:'Unknown studio endpoint.'});
   }
   if(url.pathname.startsWith('/api/workshop/')){
    const chapter=workshopChapters.find(c=>c.id===input.id);
    if(!chapter)return send(res,400,{error:'Unknown guided chapter.'});
    state.workshop??={};
    const record=state.workshop[chapter.id]??={step:0,checks:{},code:chapter.exercise?.starter||'',codePassed:false,completed:false};
    if(url.pathname==='/api/workshop/save'){
     if(input.step!==undefined&&(!Number.isInteger(input.step)||input.step<0||input.step>=chapter.steps.length))return send(res,400,{error:'Unknown chapter step.'});
     if(input.code!==undefined&&(typeof input.code!=='string'||input.code.length>20000))return send(res,400,{error:'Keep source under 20,000 characters.'});
     if(input.step!==undefined)record.step=input.step;
     if(input.code!==undefined)record.code=input.code;
     state.lastWorkshop=chapter.id;record.updatedAt=now();await persist();return send(res,200,{state});
    }
    if(url.pathname==='/api/workshop/check'){
     const checkpoint=chapter.steps[input.step];
     if(!Number.isInteger(input.step)||checkpoint?.kind!=='predict'||!Number.isInteger(input.answer)||input.answer<0||input.answer>=checkpoint.options.length)return send(res,400,{error:'Choose an answer for a reasoning checkpoint.'});
     const passed=input.answer===checkpoint.answer;
     if(passed)record.checks[input.step]=true;
     record.completed=workshopComplete(chapter,record);record.updatedAt=now();state.lastWorkshop=chapter.id;
     await persist();return send(res,200,{passed,explanation:checkpoint.feedback[input.answer],state});
    }
    if(url.pathname==='/api/workshop/run'){
     if(!chapter.exercise)return send(res,400,{error:'This workshop uses the visual activity rather than a Java exercise.'});
     if(typeof input.code!=='string'||input.code.length>20000)return send(res,400,{error:'Provide Java source under 20,000 characters.'});
     if(running)return send(res,409,{error:'Another Java exercise is running. Try again shortly.'});
     running=true;let result;try{result=await runExercise(chapter,input.code);}finally{running=false;}
     record.code=input.code;if(result.ok)record.codePassed=true;
     record.completed=workshopComplete(chapter,record);record.updatedAt=now();state.lastWorkshop=chapter.id;
     await persist();return send(res,200,{...result,state});
    }
    return send(res,404,{error:'Unknown workshop endpoint.'});
   }
   if(url.pathname==='/api/project'){
    const project=projects.find(p=>p.id===input.id);if(!project)return send(res,400,{error:'Unknown project.'});
    if(!Array.isArray(input.checks)||input.checks.some(i=>!Number.isInteger(i)||i<0||i>=project.checks.length))return send(res,400,{error:'Invalid checklist.'});
    state.projects[project.id]=[...new Set(input.checks)];await persist();return send(res,200,{state});
   }
   const lesson=lessons.find(l=>l.id===input.id);if(!lesson)return send(res,400,{error:'Unknown lesson.'});
   const r=row(lesson.id);
   if(url.pathname==='/api/progress'){
    if(typeof input.note==='string')r.note=input.note.slice(0,30000);
    if(typeof input.document==='string')r.document=input.document.slice(0,30000);
    if(typeof input.code==='string')r.code=input.code.slice(0,20000);
    if(typeof input.bookmarked==='boolean')r.bookmarked=input.bookmarked;
    r.updatedAt=now();state.lastLesson=lesson.id;await persist();return send(res,200,{state});
   }
   if(url.pathname==='/api/quiz'){
    if(!Number.isInteger(input.answer)||input.answer<0||input.answer>=lesson.quiz.options.length)return send(res,400,{error:'Choose an answer.'});
    const passed=input.answer===lesson.quiz.answer;r.attempts++;if(passed)r.quizPassed=true;complete(lesson,r);await persist();
    return send(res,200,{passed,explanation:lesson.quiz.explanation,state});
   }
   if(url.pathname==='/api/run'){
    if(!lesson.exercise||typeof input.code!=='string')return send(res,400,{error:'Choose a coding lab.'});
    if(running)return send(res,409,{error:'Another Java exercise is running. Try again shortly.'});
    running=true;let result;try{result=await runExercise(lesson,input.code);}finally{running=false;}
    r.code=input.code;r.attempts++;if(result.ok)r.codePassed=true;complete(lesson,r);await persist();return send(res,200,{...result,state});
   }
   return send(res,404,{error:'Unknown endpoint.'});
  }
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed.'});
  if(url.pathname==='/api/tutor/status')return send(res,200,await tutorStatus());
  if(url.pathname==='/api/state')return send(res,200,{state,token,javaAvailable:!!jdk,javaTarget:25});
  if(url.pathname==='/api/export'){res.setHeader('Content-Disposition','attachment; filename="biome-progress.json"');return send(res,200,state);}
  const relative=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  const file=path.resolve(root,publicDir,relative);const base=path.join(root,publicDir)+path.sep;
  if(!file.startsWith(base))return send(res,403,{error:'Invalid path.'});
  const contents=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(contents);
 }catch(e){send(res,e.code==='ENOENT'?404:500,{error:e.code==='ENOENT'?'Not found.':e.message});}
});
if(process.env.BIOME_TEST_NO_SERVER!=='1')server.listen(port,'127.0.0.1',()=>console.log(`The Biome of Minecraft Modding\nhttp://127.0.0.1:${port}\nJava exercises: ${jdk?'JDK available':'set BIOME_JAVA_HOME'}\nProgress: ${savePath}`));
