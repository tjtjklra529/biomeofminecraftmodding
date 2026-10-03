const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(text){
 const pattern=/`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^\s)]+)\)/g;let out='',last=0;
 for(const m of text.matchAll(pattern)){out+=escape(text.slice(last,m.index));
  if(m[1])out+='<code>'+escape(m[1])+'</code>';
  else if(m[2])out+='<strong>'+escape(m[2])+'</strong>';
  else {let allowed=false;try{allowed=['http:','https:'].includes(new URL(m[4]).protocol);}catch{}out+=allowed?`<a href="${escape(m[4])}" target="_blank" rel="noreferrer">${escape(m[3])}</a>`:escape(m[0]);}
  last=m.index+m[0].length;
 }return out+escape(text.slice(last));
}
export function renderMarkdown(source){
 const lines=source.replace(/\r\n/g,'\n').split('\n');let html='',paragraph=[],list=null,fence=false,code=[];
 const flush=()=>{if(paragraph.length){html+='<p>'+inline(paragraph.join(' '))+'</p>';paragraph=[];}if(list){html+=`</${list}>`;list=null;}};
 for(const line of lines){
  if(/^\s*```/.test(line)){flush();if(fence){html+='<pre><code>'+escape(code.join('\n'))+'</code></pre>';code=[];}fence=!fence;continue;}
  if(fence){code.push(line);continue;}
  if(!line.trim()){flush();continue;}
  const heading=line.match(/^(#{1,6})\s+(.+)$/);if(heading){flush();html+=`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;continue;}
  const item=line.match(/^\s*(?:([-*])|\d+\.)\s+(.+)$/);if(item){if(paragraph.length){html+='<p>'+inline(paragraph.join(' '))+'</p>';paragraph=[];}const type=item[1]?'ul':'ol';if(list!==type){if(list)html+=`</${list}>`;html+=`<${type}>`;list=type;}const task=item[2].match(/^\[([ xX])\]\s+(.+)$/);html+='<li>'+(task?`<span aria-label="${task[1]===' '?'Unchecked':'Checked'}">${task[1]===' '?'☐':'☑'}</span> `+inline(task[2]):inline(item[2]))+'</li>';continue;}
  if(list){html+=`</${list}>`;list=null;}paragraph.push(line);
 }
 flush();if(fence)html+='<pre><code>'+escape(code.join('\n'))+'</code></pre>';return html||'<p class="muted">Your Markdown preview will appear here.</p>';
}
export function checkDocument(text){const count=(text.match(/^\s*```/gm)||[]).length;return [
 {label:'One document title',passed:(text.match(/^#\s+\S/gm)||[]).length===1,detail:'Use one top-level # title.'},
 {label:'Compatibility section',passed:/^##\s+Compatibility\s*$/im.test(text),detail:'State the exact game, loader, and Java requirements.'},
 {label:'Dependency section',passed:/^##\s+Dependencies\s*$/im.test(text),detail:'Distinguish required dependencies from optional integrations.'},
 {label:'Ordered installation steps',passed:/^##\s+Installation\s*$/im.test(text)&&/^\d+\.\s+\S/m.test(text),detail:'Give readers a concrete installation sequence.'},
 {label:'Limitations documented',passed:/^##\s+Known limitations\s*$/im.test(text),detail:'Explain what is not supported or verified.'},
 {label:'Code fences balanced',passed:count%2===0,detail:'Every opening triple-backtick fence needs a closing fence.'},
 {label:'Draft placeholders replaced',passed:!/(\[project name\]|\[describe|\[list|\[state|TODO|TBD)/i.test(text),detail:'Replace bracketed prompts before distributing the document.'},
 ];}
export const markdownTemplate='# [Project name]\n\n[Describe the actual gameplay in one sentence.]\n\n## Compatibility\n\nMinecraft 26.3 · Fabric · Java 25\n\n## Dependencies\n\n[List required dependencies and supported versions.]\n\n## Installation\n\n1. Install the matching Fabric Loader.\n2. Add the verified runtime JAR and required dependencies.\n3. Launch a disposable test world.\n\n## First use\n\n[Describe acquisition, interaction, and expected feedback.]\n\n## Known limitations\n\n[State unsupported or unverified behavior.]\n';
