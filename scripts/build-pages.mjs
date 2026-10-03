import {cp,mkdir,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {originalAssets} from './original-assets.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),output=path.join(root,'dist');await mkdir(output,{recursive:true});
await cp(path.join(root,'public'),output,{recursive:true,filter:src=>{const relative=path.relative(path.join(root,'public'),src).replaceAll('\\','/');return !relative.startsWith('vendor/blockbench/dist')&&!(relative.startsWith('minecraft/')&&(/\.png$/.test(relative)||relative.endsWith('reference-data.mjs')||relative.endsWith('provenance.json')));}});
await originalAssets(path.join(output,'minecraft'));
try{await access(path.join(root,'public/minecraft/reference-data.mjs'));}catch{await originalAssets(path.join(root,'public/minecraft'));}
// Project Pages paths also work when the custom domain is still waiting for DNS.
const files=['index.html','minecraft-ui.mjs','studios.mjs','minecraft-ui.css','app.mjs','integrations/biome_blockbench.js'];
for(const file of files){let s=await readFile(path.join(output,file),'utf8');if(file==='integrations/biome_blockbench.js')s=s.replace("location.pathname.startsWith('/vendor/blockbench/')","location.pathname.includes('/vendor/blockbench/')").replace("location.origin+'/minecraft/copper_block.png'","new URL('../../minecraft/copper_block.png',location.href).href");else s=s.replace(/(["'`(=])\/(minecraft|vendor|integrations)\//g,'$1./$2/');if(file==='index.html')s=s.replace(/(href|src)="\/(?!\/)/g,'$1="./');await writeFile(path.join(output,file),s);}
const wrapper=path.join(output,'vendor/blockbench/index.html');await writeFile(wrapper,(await readFile(wrapper,'utf8')).replace('src="/integrations/biome_blockbench.js"','src="../../integrations/biome_blockbench.js"'));
await writeFile(path.join(output,'.nojekyll'),'');await writeFile(path.join(output,'CNAME'),'biomeofminecraftmodding.esmp.app\n');
console.log('Built GitHub Pages academy in dist/ with original assets and browser progress.');
