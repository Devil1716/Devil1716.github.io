/* DevilOS server: static files + the Sable assistant API.
   Run: node server.js   (see docs/ASSISTANT.md for configuration) */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const Core = require('./assistant/core.js');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const LLM = {
  key: process.env.LLM_API_KEY || '',
  base: (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
  model: process.env.LLM_MODEL || 'gpt-4o-mini',
  timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 30000
};
const LIMITS = {
  bodyBytes: 16 * 1024, messageChars: 1000, turns: 12,
  windowMs: Number(process.env.RATE_WINDOW_MS) || 5 * 60 * 1000,
  perWindow: Number(process.env.RATE_LIMIT) || 20
};
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const TRUST_PROXY = process.env.TRUST_PROXY === '1';

const KB_PATH = path.join(ROOT, 'assistant', 'knowledge.json');
let index = Core.buildIndex(JSON.parse(fs.readFileSync(KB_PATH, 'utf8')));
fs.watchFile(KB_PATH, { interval: 2000 }, () => {
  try { index = Core.buildIndex(JSON.parse(fs.readFileSync(KB_PATH, 'utf8'))); console.log('knowledge base reloaded'); }
  catch (e) { console.error('knowledge base reload failed:', e.message); }
});

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon'
};

/* ---------- rate limiting (fixed window per client) ---------- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  let h = hits.get(ip);
  if (!h || now - h.start > LIMITS.windowMs) { h = { start: now, n: 0 }; hits.set(ip, h); }
  h.n++;
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.start > LIMITS.windowMs) hits.delete(k);
  return h.n > LIMITS.perWindow ? Math.ceil((h.start + LIMITS.windowMs - now) / 1000) : 0;
}
function clientIp(req) {
  if (TRUST_PROXY && req.headers['x-forwarded-for']) return String(req.headers['x-forwarded-for']).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

/* ---------- validation ---------- */
function validate(body) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.messages)) return 'messages must be an array';
  const msgs = body.messages.slice(-LIMITS.turns);
  if (!msgs.length) return 'messages is empty';
  for (const m of msgs) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return 'each message needs role user or assistant';
    if (typeof m.content !== 'string' || !m.content.trim()) return 'each message needs text content';
    if (m.role === 'user' && m.content.length > LIMITS.messageChars) return `messages are limited to ${LIMITS.messageChars} characters`;
  }
  if (msgs[msgs.length - 1].role !== 'user') return 'the last message must be from the user';
  return { messages: msgs.map(m => ({ role: m.role, content: m.content.slice(0, 4000) })) };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > LIMITS.bodyBytes) { reject(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function cors(req, res) {
  const o = req.headers.origin;
  if (o && ALLOWED_ORIGINS.includes(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}
function json(res, code, obj, extra) {
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra || {}));
  res.end(JSON.stringify(obj));
}
function sse(res, event, data) { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }

/* ---------- model call (OpenAI-compatible /chat/completions, streaming) ---------- */
async function streamModel(messages, hitsFound, onToken, signal) {
  const ctx = Core.contextFor(index.kb, hitsFound);
  const res = await fetch(`${LLM.base}/chat/completions`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM.key}` },
    body: JSON.stringify({
      model: LLM.model, stream: true, temperature: 0.3, max_tokens: 600,
      messages: [{ role: 'system', content: Core.systemPrompt(index.kb) + '\n\nCONTEXT:\n' + ctx }, ...messages]
    })
  });
  if (!res.ok || !res.body) throw Object.assign(new Error(`model returned ${res.status}`), { upstream: res.status });
  const dec = new TextDecoder(); let buf = '';
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try { const t = JSON.parse(data).choices?.[0]?.delta?.content; if (t) onToken(t); } catch { /* ignore keep-alives */ }
    }
  }
}

async function handleChat(req, res) {
  const wait = rateLimited(clientIp(req));
  if (wait) return json(res, 429, { error: `Too many questions. Try again in ${wait}s.` }, { 'Retry-After': String(wait) });
  if (!/application\/json/.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'Send JSON.' });
  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch (e) { return json(res, e.code === 413 ? 413 : 400, { error: e.code === 413 ? 'Request too large.' : 'Invalid JSON.' }); }
  const v = validate(body);
  if (typeof v === 'string') return json(res, 400, { error: v });

  const { hits: found } = Core.retrieve(index, v.messages, 5);
  const sources = found.map(h => ({ id: h.entry.id, title: h.entry.title }));
  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), LLM.timeoutMs);
  res.on('close', () => ac.abort());

  const offline = async (reason) => {
    sse(res, 'meta', { mode: 'offline', reason, sources });
    const text = Core.groundedAnswer(index, v.messages);
    for (const part of text.match(/\S+\s*/g) || []) { sse(res, 'token', { t: part }); await new Promise(r => setTimeout(r, 12)); }
  };
  try {
    if (!LLM.key) await offline('no-key');
    else {
      sse(res, 'meta', { mode: 'live', model: LLM.model, sources });
      let any = false;
      try { await streamModel(v.messages, found, t => { any = true; sse(res, 'token', { t }); }, ac.signal); }
      catch (e) {
        console.error('model error:', e.message);
        if (any) { sse(res, 'error', { error: 'The answer was cut off. Please try again.' }); return; }
        await offline('model-error');
      }
    }
    sse(res, 'done', {});
  } finally { clearTimeout(timer); res.end(); }
}

/* ---------- static files ---------- */
function serveStatic(req, res) {
  let rel;
  try { rel = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end('Bad request'); }
  if (rel === '/') rel = '/index.html';
  const file = path.resolve(ROOT, '.' + path.posix.normalize(rel));
  const base = path.basename(file);
  if (!file.startsWith(ROOT + path.sep) || base.startsWith('.') || /node_modules|[\\/]\.git[\\/]|[\\/]tests?[\\/]/.test(file) || /\.env/.test(base)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not Found');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not Found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url.startsWith('/api/')) {
    cors(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (url === '/api/health' && req.method === 'GET') return json(res, 200, { ok: true, mode: LLM.key ? 'live' : 'offline', model: LLM.key ? LLM.model : null });
    if (url === '/api/chat' && req.method === 'POST') return handleChat(req, res).catch(e => { console.error(e); if (!res.headersSent) json(res, 500, { error: 'Something went wrong.' }); else res.end(); });
    return json(res, 404, { error: 'Not found' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res);
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => console.log(`DevilOS on http://localhost:${PORT} · assistant: ${LLM.key ? 'live (' + LLM.model + ')' : 'offline mode (no LLM_API_KEY)'}`));
}
module.exports = { server, validate, rateLimited, LIMITS };
