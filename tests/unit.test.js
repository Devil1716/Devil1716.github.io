const test = require('node:test');
const assert = require('node:assert');
const Core = require('../assistant/core.js');
const kb = require('../assistant/knowledge.json');
const ix = Core.buildIndex(kb);
const ask = q => Core.groundedAnswer(ix, [{ role:'user', content:q }]);

test('knowledge base never contains phone or enrollment numbers', () => {
  const s = JSON.stringify(kb);
  assert.doesNotMatch(s, /(\+91[\s-]?)?\b[6-9]\d{9}\b/);
  assert.doesNotMatch(s, /enrol?ment|A\d{6,}/i);
});
test('every entry has id, type and title; empty text only with a todo', () => {
  for (const e of kb.entries) { assert.ok(e.id && e.type && e.title); if (!e.text) assert.ok(e.todo, e.id); }
});
test('suggested prompts are answered from the KB', () => {
  assert.match(ask('Who am I?'), /Amity/);
  assert.match(ask('Explore my projects.'), /bluetooth-manet-android/);
  assert.match(ask('What technologies do I use?'), /Kotlin/);
  assert.match(ask('Tell me about my experience.'), /Quickoo/);
  assert.match(ask('Contact me.'), /mailto:/);
});
test('specific project questions return that project', () => {
  assert.match(ask('Tell me about the bluetooth mesh project'), /^\*\*bluetooth-manet-android/);
});
test('unknown facts are admitted, not invented', () => {
  assert.match(ask('What is his favourite food?'), /don't have/);
  assert.match(ask('What awards has he won?'), /don't have verified/);
});
test('markdown is sanitized', () => {
  const h = Core.renderMarkdown('<img src=x onerror=alert(1)> [x](javascript:alert(1)) <script>bad()</script> [ok](https://a.b)');
  assert.doesNotMatch(h, /<img|<script|href="javascript/i);
  assert.match(h, /<a href="https:\/\/a\.b" target="_blank" rel="noopener noreferrer">ok<\/a>/);
  assert.match(Core.renderMarkdown('```\n<b>\n```'), /<pre><code>&lt;b&gt;<\/code><\/pre>/);
});
test('server validation rejects bad input', () => {
  const { validate, LIMITS } = require('../server.js');
  assert.equal(typeof validate({}), 'string');
  assert.equal(typeof validate({ messages:[{ role:'system', content:'x' }] }), 'string');
  assert.equal(typeof validate({ messages:[{ role:'user', content:'x'.repeat(LIMITS.messageChars + 1) }] }), 'string');
  assert.equal(typeof validate({ messages:[{ role:'user', content:'hi' }, { role:'assistant', content:'yo' }] }), 'string');
  assert.ok(validate({ messages:[{ role:'user', content:'hi' }] }).messages);
});
test('rate limiter blocks after the window budget', () => {
  const { rateLimited, LIMITS } = require('../server.js');
  for (let i = 0; i < LIMITS.perWindow; i++) assert.equal(rateLimited('t1'), 0);
  assert.ok(rateLimited('t1') > 0);
});
test('api: health, chat stream, size limit, path traversal', async () => {
  const { server } = require('../server.js');
  await new Promise(r => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.deepEqual((await (await fetch(base + '/api/health')).json()).ok, true);
    const r = await fetch(base + '/api/chat', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ messages:[{ role:'user', content:'Who am I?' }] }) });
    const text = await r.text();
    assert.match(text, /event: meta/); assert.match(text, /event: done/);
    const big = await fetch(base + '/api/chat', { method:'POST', headers:{'content-type':'application/json'}, body:'{"messages":"' + 'x'.repeat(20000) + '"}' }).catch(() => ({ status:413 }));
    assert.equal(big.status, 413);
    assert.equal((await fetch(base + '/%2e%2e/%2e%2e/etc/passwd')).status, 404);
    assert.equal((await fetch(base + '/server.js')).status, 200); // public source is fine; secrets live in env only
    assert.equal((await fetch(base + '/.gitignore')).status, 404);
  } finally { server.close(); require('fs').unwatchFile(require('path').join(__dirname, '..', 'assistant', 'knowledge.json')); }
});

test('no old product names in shipped files', () => {
  const fs = require('fs'), path = require('path');
  const root = path.join(__dirname, '..');
  const files = ['index.html', 'manifest.webmanifest', 'README.md', 'docs/ASSISTANT.md', 'server.js', 'package.json',
    ...fs.readdirSync(path.join(root, 'assistant')).map(f => 'assistant/' + f), ...fs.readdirSync(path.join(root, 'assets')).filter(f => f.endsWith('.svg')).map(f => 'assets/' + f)];
  const OLD = /\b(Sable|SABLE|Arya|ARYA|Sharanix|SHARANIX|Bose|BOSE|DevilOS|DEVILOS|Devil OS|Trinity|TRINITY)\b/;
  for (const f of files) { const m = fs.readFileSync(path.join(root, f), 'utf8').match(OLD); assert.equal(m, null, `${f} still says ${m && m[0]}`); }
});
test('brand names come from one constant', () => {
  assert.equal(Core.BRAND.os, 'Shard');
  assert.ok(Core.BRAND.assistant);
  assert.ok(Core.systemPrompt(kb).includes(`You are ${Core.BRAND.assistant},`));
});
