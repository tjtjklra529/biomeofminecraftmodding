import {cp,mkdir,readFile,writeFile,access,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),output=path.join(root,'dist');await mkdir(output,{recursive:true});
await access(path.join(root,'public/minecraft/provenance.json'));
await cp(path.join(root,'public'),output,{recursive:true,filter:src=>!path.relative(path.join(root,'public'),src).replaceAll('\\','/').startsWith('vendor/blockbench/dist')});
// Project Pages paths also work when the custom domain is still waiting for DNS.
const files=['index.html','minecraft-ui.mjs','studios.mjs','minecraft-ui.css','app.mjs','integrations/biome_blockbench.js'];
for(const file of files){let s=await readFile(path.join(output,file),'utf8');if(file==='integrations/biome_blockbench.js')s=s.replace("location.pathname.startsWith('/vendor/blockbench/')","location.pathname.includes('/vendor/blockbench/')").replace("location.origin+'/minecraft/copper_block.png'","new URL('../../minecraft/copper_block.png',location.href).href");else s=s.replace(/(["'`(=])\/(minecraft|vendor|integrations)\//g,'$1./$2/');if(file==='index.html')s=s.replace(/(href|src)="\/(?!\/)/g,'$1="./');await writeFile(path.join(output,file),s);}
const wrapper=path.join(output,'vendor/blockbench/index.html');await writeFile(wrapper,(await readFile(wrapper,'utf8')).replace('src="/integrations/biome_blockbench.js"','src="../../integrations/biome_blockbench.js"'));
// New releases must not mix cached modules or placeholder textures with new code.
async function sourceFiles(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())result.push(...await sourceFiles(file));else if(/\.(mjs|js|css|png|svg)$/.test(file))result.push(file);}return result;}
const sources=(await sourceFiles(output)).sort(),hash=createHash('sha256');for(const file of sources)hash.update(await readFile(file));const version=hash.digest('hex').slice(0,12);
for(const file of sources.filter(f=>/\.(mjs|js|css)$/.test(f))){let s=await readFile(file,'utf8');s=s.replace(/((?:from\s*|import\s*)['"])(\.[^'"]+\.(?:mjs|js))(['"])/g,`$1$2?v=${version}$3`).replace(/(minecraft\/[^'"\s)]+\.(?:png|svg))(?=['"\s)])/g,`$1?v=${version}`);if(file.endsWith('voxel-preview.mjs'))s=s.replace("new URL('./minecraft/'+name,import.meta.url)",`new URL('./minecraft/'+name+'?v=${version}',import.meta.url)`);await writeFile(file,s);}
const index=path.join(output,'index.html');await writeFile(index,(await readFile(index,'utf8')).replace(/((?:href|src)="\.\/[^"?]+\.(?:css|mjs))"/g,`$1?v=${version}"`));
await writeFile(path.join(output,'.nojekyll'),'');await writeFile(path.join(output,'CNAME'),'biomeofminecraftmodding.esmp.app\n');
console.log('Built GitHub Pages academy with original Minecraft reference textures and browser progress.');
