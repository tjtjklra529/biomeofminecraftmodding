import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMarkdown,checkDocument,markdownTemplate} from '../public/markdown.mjs';
test('Markdown supports structured authoring and escapes unsafe content',()=>{
 const html=renderMarkdown('# Title\n\n**Bold** and `code`\n\n- [x] Done\n- [ ] Pending\n\n```java\nint count = 3;\n```');
 assert.match(html,/<h1>Title<\/h1>/);assert.match(html,/<strong>Bold<\/strong>/);assert.match(html,/<code>code<\/code>/);assert.match(html,/Checked/);assert.match(html,/<pre><code>int count = 3;/);
 const malicious=renderMarkdown('<img src=x onerror=alert(1)>\n\n[bad](javascript:alert)\n\n[good](https://example.com)');
 assert.ok(!malicious.includes('<img'));assert.ok(!malicious.includes('href="javascript:'));assert.match(malicious,/href="https:\/\/example.com"/);
});
test('document feedback distinguishes a draft from finished structure',()=>{
 const initial=checkDocument(markdownTemplate);assert.equal(initial.find(c=>c.label==='Draft placeholders replaced').passed,false);
 assert.equal(checkDocument('# Title\n```java\nint n=1;').find(c=>c.label==='Code fences balanced').passed,false);
 assert.equal(checkDocument('# A\n# B').find(c=>c.label==='One document title').passed,false);
});
