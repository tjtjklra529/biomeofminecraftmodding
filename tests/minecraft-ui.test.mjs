import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {defaultInventory,insertFromInventory,collectToInventory,inventoryScreen,gameText} from '../public/minecraft-ui.mjs';
test('Minecraft inventory transfers preserve items across limits and rejected ingredients',()=>{
 const d={inventory:defaultInventory(),input:9,output:0};
 const count=item=>d.inventory.reduce((n,s)=>n+(s?.item===item?s.count:0),0);
 const initial=count('copper_ingot')+d.input;
 assert.equal(insertFromInventory(d,27).moved,3);assert.equal(d.input,12);assert.equal(count('copper_ingot')+d.input,initial);
 assert.equal(insertFromInventory(d,28,true).moved,0,'iron rejected without consuming');assert.equal(count('iron_ingot'),16);
 assert.equal(insertFromInventory(d,27,true).moved,52);assert.equal(d.input,64);assert.equal(count('copper_ingot')+d.input,initial);
 assert.equal(insertFromInventory(d,27).moved,0,'full input rejects');
 const moved=collectToInventory(d,'copper_ingot',d.input);d.input-=moved;assert.equal(count('copper_ingot')+d.input,initial);
 assert.equal(collectToInventory(d,'copper_plate',65),65);assert.equal(count('copper_plate'),65);assert.ok(d.inventory.filter(Boolean).every(s=>s.count<=64));
 const full={inventory:Array.from({length:36},()=>({item:'diamond',count:64}))};assert.equal(collectToInventory(full,'copper_plate',2),0,'full inventory retains machine output');
});
test('pixel sprites and bitmap font are available locally',async()=>{
 const source=JSON.parse(await readFile(new URL('../public/minecraft/provenance.json',import.meta.url),'utf8'));assert.equal(source.version,'26.3');
 for(const asset of ['iron_block.png','copper_ingot.png','copper_block.png','ascii.png']){const bytes=await readFile(new URL('../public/minecraft/'+asset,import.meta.url));assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');}
 const html=inventoryScreen({inventory:defaultInventory(),input:3,output:2});assert.equal((html.match(/class="game-slot /g)||[]).length,38);assert.match(html,/Copper Ingot/);assert.match(html,/draggable="true"/);assert.match(gameText('<script>'),/&lt;script&gt;/);
});
