import {spawn} from 'node:child_process';
import {openSync,closeSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(fileURLToPath(import.meta.url));
const url='http://127.0.0.1:4320/';
async function ready(){try{const response=await fetch(url+'api/state',{signal:AbortSignal.timeout(800)});const data=await response.json();return response.ok&&data.javaTarget===25&&typeof data.token==='string';}catch{return false;}}
try{
 try{await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(800)});}catch{
  const exe=path.join(process.env.LOCALAPPDATA||'', 'Programs','Ollama','ollama.exe');
  if(existsSync(exe)){const log=openSync(path.join(root,'ollama.log'),'a');const ollama=spawn(exe,['serve'],{detached:true,windowsHide:true,stdio:['ignore',log,log]});ollama.on('error',e=>console.log('Start Ollama manually: '+e.message));ollama.unref();closeSync(log);}
 }
 if(!await ready()){
  const out=openSync(path.join(root,'server.log'),'a'),err=openSync(path.join(root,'server-error.log'),'a');
  const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',out,err],env:{...process.env,PORT:'4320'}});
  child.unref();closeSync(out);closeSync(err);
  let started=false;
  for(let attempt=0;attempt<30;attempt++){if(await ready()){started=true;break;}await new Promise(resolve=>setTimeout(resolve,250));}
  if(!started)throw new Error('The academy did not start. Read server-error.log in this folder for the reason.');
 }
 console.log('The Biome of Minecraft Modding is running at '+url);
 if(!process.argv.includes('--no-browser')){
  const browser=spawn('cmd.exe',['/d','/c','start','',url],{windowsHide:true,stdio:'ignore'});browser.on('error',()=>console.log('Open '+url+' in your browser.'));browser.unref();
 }
}catch(error){console.error(error.message);process.exitCode=1;}
