/* Sable chat UI. mountChat(el, {variant:'page'|'compact', nav}) — vanilla JS, no build step. */
(function(){
  'use strict';
  const Core = window.SableCore;
  const KEY = 'sable.convos.v1', THEME_KEY = 'sable.theme';
  const MAX_CONVOS = 30;
  const API = (document.querySelector('meta[name="sable-api"]')?.content || '/api').replace(/\/+$/,'');
  const NAME = 'Sable';
  const PROMPTS = [
    ['Who am I?', 'A quick introduction to Sharan'],
    ['Explore my projects.', 'Agents, Android, backend'],
    ['What technologies do I use?', 'Languages, frameworks, tools'],
    ['Tell me about my experience.', 'Roles and open source'],
    ['What are my skills?', 'Where he is strongest'],
    ['Contact me.', 'Email, GitHub, LinkedIn']
  ];
  const ICON = {
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    stop:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
    menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    x:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    os:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    cube:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>'
  };
  const MARK = '<svg class="sb-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--sb-text)"/><circle cx="16" cy="16" r="7.5" fill="var(--sb-accent)"/><circle cx="19.5" cy="13" r="5.5" fill="var(--sb-text)"/></svg>';

  /* ---------- theme ---------- */
  const Theme = {
    get(){ return localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); },
    set(t){ localStorage.setItem(THEME_KEY, t); document.documentElement.dataset.sbTheme = t; document.querySelectorAll('[data-sb-theme]').forEach(n=>n.dataset.sbTheme=t); listeners.forEach(f=>f()); }
  };
  document.documentElement.dataset.sbTheme = Theme.get();

  /* ---------- conversation store (shared by every mounted chat) ---------- */
  const listeners = new Set();
  const Store = {
    all(){ try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
    save(list){ try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_CONVOS))); } catch {} listeners.forEach(f=>f()); },
    get(id){ return this.all().find(c=>c.id===id); },
    upsert(c){ const l=this.all().filter(x=>x.id!==c.id); l.unshift(c); this.save(l); },
    remove(id){ this.save(this.all().filter(c=>c.id!==id)); }
  };

  /* ---------- backend + offline fallback ---------- */
  let offlineIndex = null, apiState = 'unknown';
  async function offlineIdx(){
    if (!offlineIndex) { const r = await fetch('assistant/knowledge.json', {cache:'no-cache'}); if (!r.ok) throw new Error('Could not load the knowledge base.'); offlineIndex = Core.buildIndex(await r.json()); }
    return offlineIndex;
  }
  async function* localStream(messages){
    const text = Core.groundedAnswer(await offlineIdx(), messages);
    yield { type:'meta', mode:'offline', reason:'no-server' };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const part of text.match(/\S+\s*/g) || []) { if (!reduce) await new Promise(r=>setTimeout(r,14)); yield { type:'token', t:part }; }
  }
  async function* ask(messages, signal){
    if (apiState !== 'absent') {
      let res;
      try { res = await fetch(API + '/chat', { method:'POST', signal, headers:{'Content-Type':'application/json'}, body:JSON.stringify({ messages }) }); }
      catch (e) { if (e.name === 'AbortError') throw e; res = null; }
      if (res && res.ok && /event-stream/.test(res.headers.get('content-type')||'')) {
        apiState = 'present';
        const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
        for (;;) {
          const { value, done } = await reader.read(); if (done) break;
          buf += dec.decode(value, { stream:true });
          let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const block = buf.slice(0, i); buf = buf.slice(i + 2);
            const ev = (block.match(/^event: (.*)$/m)||[])[1], data = (block.match(/^data: (.*)$/m)||[])[1];
            if (!ev || !data) continue;
            const d = JSON.parse(data);
            if (ev === 'error') throw new Error(d.error);
            yield Object.assign({ type: ev }, d);
          }
        }
        return;
      }
      if (res && [400,413,415,429,500].includes(res.status)) {
        let msg = 'Something went wrong.'; try { msg = (await res.json()).error || msg; } catch {}
        throw new Error(msg);
      }
      apiState = 'absent'; // static hosting (e.g. GitHub Pages): no API, use offline mode
    }
    yield* localStream(messages);
  }

  /* ---------- UI ---------- */
  function h(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

  function mountChat(el, opts){
    opts = opts || {};
    const compact = opts.variant === 'compact';
    const nav = opts.nav || {};
    const root = h(`<div class="sb sb-theme${compact?' compact':''}" data-sb-theme="${Theme.get()}">
      <aside class="sb-side" aria-label="Conversations">
        <div class="sb-brand">${MARK}<div><b>${NAME}</b><small>Sharan's assistant</small></div></div>
        <button class="sb-btn primary" data-act="new">${ICON.plus}New conversation</button>
        <div class="sb-label" id="sb-hl">History</div>
        <nav class="sb-hist" aria-labelledby="sb-hl"></nav>
        <div class="sb-label">Explore</div>
        ${nav.studio?`<button class="sb-studio" data-nav="studio" aria-label="Enter the 3D studio"><img src="retro_computer_closeup.png" alt="" loading="lazy" decoding="async" width="480" height="270"><span>3D studio — click the computer to boot DevilOS</span></button>`:''}
        ${nav.os?`<button class="sb-btn" data-nav="os">${ICON.os}Desktop OS</button>`:''}
        ${nav.site?`<button class="sb-btn" data-nav="site">${ICON.book}Sketchbook portfolio</button>`:''}
      </aside>
      <div class="sb-drawer-scrim" data-act="close-drawer"></div>
      <main class="sb-main">
        <header class="sb-top">
          ${compact?'':`<button class="sb-icon sb-menu" data-act="drawer" aria-label="Open conversations">${ICON.menu}</button>`}
          <h1>${NAME}</h1>
          <span class="sb-mode" role="status">Checking…</span>
          ${compact?`<button class="sb-icon" data-act="new" aria-label="New conversation">${ICON.plus}</button>`:''}
          <button class="sb-icon" data-act="theme" aria-label="Toggle light or dark theme"></button>
        </header>
        <div class="sb-scroll" tabindex="-1"><div class="sb-feed" aria-live="polite"></div></div>
        <form class="sb-compose">
          <div class="sb-box">
            <label class="sr" for="">Message ${NAME}</label>
            <textarea rows="1" maxlength="1000" placeholder="Ask about Sharan's work…" enterkeyhint="send" autocomplete="off"></textarea>
            <button class="sb-send" type="submit" aria-label="Send" disabled>${ICON.send}</button>
          </div>
          <p class="sb-hint">${NAME} answers only from Sharan's own notes and says when it doesn't know.</p>
        </form>
      </main></div>`);
    el.appendChild(root);
    const $ = s => root.querySelector(s);
    const ta = $('textarea'), send = $('.sb-send'), feed = $('.sb-feed'), scroller = $('.sb-scroll'), modeTag = $('.sb-mode');
    const taId = 'sb-ta-' + uid(); ta.id = taId; $('label.sr').htmlFor = taId;
    let convo = null, controller = null, lastMode = null;

    const setMode = (m) => {
      lastMode = m;
      modeTag.className = 'sb-mode' + (m === 'live' ? ' live' : '');
      modeTag.textContent = m === 'live' ? 'AI model' : m === 'offline' ? 'Offline mode' : 'Ready';
      modeTag.title = m === 'live' ? 'Answers come from a language model grounded in Sharan\'s notes' : 'No AI model is connected. Answers are assembled directly from Sharan\'s notes.';
    };
    fetch(API + '/health').then(r => r.ok ? r.json() : Promise.reject()).then(j => { apiState='present'; setMode(j.mode); }).catch(() => { apiState='absent'; setMode('offline'); });

    const paintTheme = () => { const t=Theme.get(); root.dataset.sbTheme=t; $('[data-act="theme"]').innerHTML = t==='dark'?ICON.sun:ICON.moon; };
    paintTheme();

    function renderHistory(){
      const box = $('.sb-hist'), list = Store.all();
      box.innerHTML = list.length ? '' : '<p class="sb-empty-hist">Your conversations stay in this browser.</p>';
      list.forEach(c => {
        const b = h(`<button class="sb-btn${convo&&convo.id===c.id?' on':''}" data-id="${c.id}"><span></span><span class="sb-del" role="button" tabindex="0" aria-label="Delete conversation">${ICON.x}</span></button>`);
        b.firstChild.textContent = c.title;
        if (convo && convo.id===c.id) b.setAttribute('aria-current','true');
        box.appendChild(b);
      });
    }
    const onStore = () => { renderHistory(); paintTheme(); };
    listeners.add(onStore);

    function welcome(){
      feed.innerHTML = '';
      const w = h(`<section class="sb-welcome">${MARK}<h2>Hi, I'm ${NAME}. Ask me anything about <em>Sharan</em>.</h2>
        <p>Sharan S is a B.Tech AI/ML student at Amity University Bengaluru who builds agents, Android tools and backend systems. I know his projects, stack and open-source work.</p>
        <div class="sb-chips"></div></section>`);
      PROMPTS.forEach(([q, sub]) => { const c = h(`<button type="button" class="sb-chip"></button>`); c.textContent = q; c.appendChild(h(`<small></small>`)).textContent = sub; c.onclick = () => submit(q); w.querySelector('.sb-chips').appendChild(c); });
      feed.appendChild(w);
    }
    function msgEl(m){
      if (m.role === 'user') { const n = h('<div class="sb-msg user"><div class="sb-body"></div></div>'); n.firstChild.textContent = m.content; return n; }
      const n = h(`<div class="sb-msg bot">${MARK}<div class="sb-body"></div></div>`);
      n.querySelector('.sb-body').innerHTML = Core.renderMarkdown(m.content);
      if (m.mode === 'offline') n.querySelector('.sb-body').appendChild(h('<div class="sb-meta">Offline mode · assembled from Sharan\'s notes, not generated by an AI model</div>'));
      return n;
    }
    function renderConvo(){
      if (!convo || !convo.messages.length) return welcome();
      feed.innerHTML = '<div class="sb-thread"></div>';
      convo.messages.forEach(m => feed.firstChild.appendChild(msgEl(m)));
      scroller.scrollTop = scroller.scrollHeight;
    }
    function open(id){ convo = id ? Store.get(id) : null; renderConvo(); renderHistory(); root.classList.remove('drawer'); }

    async function submit(text){
      text = (text || '').trim();
      if (!text || controller) return;
      if (!convo) convo = { id: uid(), title: text.slice(0, 60), messages: [], t: Date.now() };
      convo.messages.push({ role:'user', content:text });
      Store.upsert(convo);
      if (!feed.querySelector('.sb-thread')) feed.innerHTML = '<div class="sb-thread"></div>';
      const thread = feed.querySelector('.sb-thread');
      thread.appendChild(msgEl({ role:'user', content:text }));
      ta.value = ''; autosize(); updateSend();
      run(thread);
    }
    async function run(thread){
      const bot = h(`<div class="sb-msg bot">${MARK}<div class="sb-body"><span class="sb-typing" aria-label="${NAME} is thinking"><i></i><i></i><i></i></span></div></div>`);
      thread.appendChild(bot); scroller.scrollTop = scroller.scrollHeight;
      const body = bot.querySelector('.sb-body');
      controller = new AbortController(); setBusy(true);
      let text = '', mode = null, frame = 0;
      const paint = () => { frame = 0; body.innerHTML = Core.renderMarkdown(text); body.lastElementChild?.insertAdjacentHTML('beforeend','<span class="sb-caret" aria-hidden="true"></span>'); const near = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 120; if (near) scroller.scrollTop = scroller.scrollHeight; };
      try {
        const history = convo.messages.map(m => ({ role:m.role, content:m.content })).slice(-12);
        for await (const ev of ask(history, controller.signal)) {
          if (ev.type === 'meta') { mode = ev.mode; setMode(ev.mode); }
          if (ev.type === 'token') { text += ev.t; if (!frame) frame = requestAnimationFrame(paint); }
        }
        if (frame) cancelAnimationFrame(frame);
        if (!text) throw new Error('No answer came back.');
        const m = { role:'assistant', content:text, mode };
        convo.messages.push(m); Store.upsert(convo);
        bot.replaceWith(msgEl(m));
      } catch (e) {
        if (frame) cancelAnimationFrame(frame);
        if (e.name === 'AbortError') {
          if (text) { const m = { role:'assistant', content:text + '\n\n*(stopped)*', mode }; convo.messages.push(m); Store.upsert(convo); bot.replaceWith(msgEl(m)); }
          else bot.remove();
        } else {
          body.innerHTML = '';
          const err = h('<p class="sb-error" role="alert"></p>'); err.textContent = e.message || 'Something went wrong.';
          const retry = h('<button type="button" class="sb-retry">Try again</button>');
          retry.onclick = () => { bot.remove(); run(thread); };
          err.appendChild(retry); body.appendChild(err); scroller.scrollTop = scroller.scrollHeight;
        }
      } finally { controller = null; setBusy(false); }
    }
    function setBusy(b){ send.innerHTML = b ? ICON.stop : ICON.send; send.setAttribute('aria-label', b ? 'Stop answering' : 'Send'); send.type = b ? 'button' : 'submit'; updateSend(); }
    function updateSend(){ send.disabled = !controller && !ta.value.trim(); }
    function autosize(){ ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'; }

    ta.addEventListener('input', () => { autosize(); updateSend(); });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(ta.value); } });
    // Keep the composer visible above the on-screen keyboard
    ta.addEventListener('focus', () => setTimeout(() => ta.scrollIntoView({ block:'nearest' }), 250));
    $('form').addEventListener('submit', e => { e.preventDefault(); submit(ta.value); });
    send.addEventListener('click', e => { if (controller) { e.preventDefault(); controller.abort(); } });
    root.addEventListener('click', e => {
      const a = e.target.closest('[data-act],[data-nav],[data-id]'); if (!a || !root.contains(a)) return;
      if (e.target.closest('.sb-del')) { const id = a.dataset.id; Store.remove(id); if (convo && convo.id === id) open(null); return; }
      if (a.dataset.id) return open(a.dataset.id);
      if (a.dataset.nav) return nav[a.dataset.nav] && nav[a.dataset.nav]();
      ({ new: () => { if (!controller) { open(null); ta.focus(); } }, theme: () => Theme.set(Theme.get()==='dark'?'light':'dark'),
         drawer: () => root.classList.add('drawer'), 'close-drawer': () => root.classList.remove('drawer') })[a.dataset.act]?.();
    });
    root.addEventListener('keydown', e => { if (e.key === 'Escape') root.classList.remove('drawer'); if (e.target.classList?.contains('sb-del') && (e.key==='Enter'||e.key===' ')) { e.preventDefault(); e.target.click(); } });

    const recent = Store.all()[0];
    open(opts.resume && recent ? recent.id : null);
    return { el: root, ask: submit, focus: () => ta.focus(), destroy(){ listeners.delete(onStore); root.remove(); } };
  }

  window.Sable = { mountChat, Theme, Store, name: NAME };
})();
