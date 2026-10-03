import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {boxUV,entityParts} from '../public/voxel-preview.mjs';

test('native Minecraft images match their recorded dimensions and source hashes',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/minecraft/provenance.json',import.meta.url)));
 for(const [name,info] of Object.entries(manifest.assets)){
  const bytes=await readFile(new URL('../public/minecraft/'+name,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),info.sha256,name+' retains original bytes');
  assert.equal(bytes.readUInt32BE(16),info.width);assert.equal(bytes.readUInt32BE(20),info.height);
  if(info.path.includes('/block/')||info.path.includes('/item/'))assert.deepEqual([info.width,info.height],[16,16],name+' stays 16×16');
 }
});
test('all six faces of every mob part fit within the actual skin atlas',()=>{
 for(const kind of ['creeper','zombie'])for(const p of entityParts(kind)){
  const faces=boxUV(...p.size,...p.uv);assert.equal(faces.length,6);
  for(const [x,y,w,h] of faces){assert.ok(w>0&&h>0);assert.ok(x>=0&&x+w<=64);assert.ok(y>=0&&y+h<=(kind==='creeper'?32:64),p.name+' atlas region');}
 }
 assert.equal(entityParts('creeper').filter(p=>p.name==='foot').length,4);
});
