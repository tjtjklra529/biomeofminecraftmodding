Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing
$taskJar=Join-Path $env:USERPROFILE '.gradle\caches\fabric-loom\26.3\minecraft-client.jar'
$taskAssets=Join-Path (Get-Location) 'public\minecraft'
New-Item -ItemType Directory -Force -Path $taskAssets | Out-Null
$taskZip=[IO.Compression.ZipFile]::OpenRead($taskJar)
$taskFiles=@{
'furnace.png'='textures/gui/container/furnace.png';'inventory.png'='textures/gui/container/inventory.png';'crafting_table.png'='textures/gui/container/crafting_table.png';'ascii.png'='textures/font/ascii.png';'copper_ingot.png'='textures/item/copper_ingot.png';'iron_ingot.png'='textures/item/iron_ingot.png';'redstone.png'='textures/item/redstone.png';'coal.png'='textures/item/coal.png';'diamond.png'='textures/item/diamond.png';'copper_block.png'='textures/block/copper_block.png';'iron_block.png'='textures/block/iron_block.png';'stone.png'='textures/block/stone.png';'oak_planks.png'='textures/block/oak_planks.png';'dirt.png'='textures/block/dirt.png';'grass_block_top.png'='textures/block/grass_block_top.png';'furnace_front.png'='textures/block/furnace_front.png';'furnace_top.png'='textures/block/furnace_top.png';'furnace_side.png'='textures/block/furnace_side.png';'button.png'='textures/gui/sprites/widget/button.png';'button_highlighted.png'='textures/gui/sprites/widget/button_highlighted.png';'burn_progress.png'='textures/gui/sprites/container/furnace/burn_progress.png';'lit_progress.png'='textures/gui/sprites/container/furnace/lit_progress.png'
}
foreach($taskFile in $taskFiles.GetEnumerator()){
 $taskEntry=$taskZip.GetEntry('assets/minecraft/'+$taskFile.Value)
 if(!$taskEntry){throw ('Missing Minecraft texture: '+$taskFile.Value)}
 [IO.Compression.ZipFileExtensions]::ExtractToFile($taskEntry,(Join-Path $taskAssets $taskFile.Key),$true)
}
$taskZip.Dispose()
$taskBitmap=[Drawing.Bitmap]::new((Join-Path $taskAssets 'ascii.png'))
$taskWidths=@{}
foreach($taskCode in 32..126){$taskWidth=0; foreach($taskX in 0..7){foreach($taskY in 0..7){if($taskBitmap.GetPixel(($taskCode%16)*8+$taskX,[Math]::Floor($taskCode/16)*8+$taskY).A -gt 0){$taskWidth=[Math]::Max($taskWidth,$taskX+1)}}};$taskWidths[[string]$taskCode]=if($taskCode -eq 32){3}else{$taskWidth}}
$taskBitmap.Dispose()
$taskTextures=@{}
foreach($taskName in @('copper_block','iron_block','stone','oak_planks')){$taskBitmap=[Drawing.Bitmap]::new((Join-Path $taskAssets ($taskName+'.png')));$taskPixels=@();foreach($taskY in 0..15){foreach($taskX in 0..15){$taskColor=$taskBitmap.GetPixel($taskX,$taskY);$taskPixels+=('#{0:x2}{1:x2}{2:x2}' -f $taskColor.R,$taskColor.G,$taskColor.B)}};$taskTextures[$taskName]=$taskPixels;$taskBitmap.Dispose()}
[IO.File]::WriteAllText((Join-Path $taskAssets 'reference-data.mjs'),('export const glyphWidths='+($taskWidths|ConvertTo-Json -Compress)+';'+[Environment]::NewLine+'export const vanillaTextures='+($taskTextures|ConvertTo-Json -Compress)+';'))
[IO.File]::WriteAllText((Join-Path $taskAssets 'provenance.json'),(@{source=$taskJar;version='26.3';purpose='Local educational preview using the installed game assets';assets=$taskFiles;owner='Minecraft assets belong to Mojang/Microsoft; not original academy artwork'}|ConvertTo-Json -Depth 4))
Write-Output ('Imported '+$taskFiles.Count+' Minecraft 26.3 textures and bitmap font metrics.')
