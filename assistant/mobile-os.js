/* DevilOS Mobile: Android-inspired shell for phones (and touch tablets in portrait). */
(function(){
  'use strict';
  const I = {
    chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    proj:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7h7l2 2h9v10H3z"/></svg>',
    skills:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>',
    about:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    contact:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    oss:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M18 10.5c0 4-6 3-11 6"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>',
    theme:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    gh:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>',
    back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    wifi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/></svg>',
    bat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><rect x="4.5" y="9.5" width="11" height="5" rx="1" fill="currentColor"/><path d="M22 10.5v3"/></svg>'
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let kb = null, root = null, chat = null, mounted = false, opts = {};
  const stack = [];
  let ignorePop = 0;

  async function loadKb(){ if (!kb) { const r = await fetch('assistant/knowledge.json'); if (!r.ok) throw new Error('Could not load content'); kb = await r.json(); } return kb; }
  const links = e => (e.links||[]).map(([t,u]) => `<a class="m-pill" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`).join('');
  const askBtn = q => `<button class="m-ask" data-ask="${esc(q)}">Ask ${window.Sable.name} about this</button>`;

  const APPS = {
    chat:{ name:window.Sable?.name || 'Sable', icon:I.chat, accent:true },
    projects:{ name:'Projects', icon:I.proj, render: k => k.entries.filter(e=>e.type==='project').map(e=>`<article class="m-card"><h3>${esc(e.title)}</h3><p>${esc(e.text.split('. Stack')[0])}</p><div class="m-links">${links(e)}</div></article>`).join('') + askBtn('Explore my projects.') },
    skills:{ name:'Skills', icon:I.skills, render: k => k.entries.filter(e=>e.type==='skill').map(e=>`<article class="m-card"><h3>${esc(e.title)}</h3><div>${e.text.split(': ')[1].replace(/\.$/,'').split(', ').map(s=>`<span class="m-tag">${esc(s)}</span>`).join('')}</div></article>`).join('') + askBtn('What are my skills?') },
    about:{ name:'About', icon:I.about, render: k => ['bio','education','exp-quickoo','belief'].map(id=>k.entries.find(e=>e.id===id)).filter(Boolean).map(e=>`<article class="m-card"><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${e.todo?'<p class="m-todo">More details coming soon.</p>':''}</article>`).join('') + askBtn('Who am I?') },
    oss:{ name:'Open source', icon:I.oss, render: k => { const e=k.entries.find(x=>x.id==='exp-oss'); return `<article class="m-card"><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><div class="m-links">${links(e)}</div></article>`; } },
    contact:{ name:'Contact', icon:I.contact, render: k => { const p=k.profile; return `<article class="m-card"><h3>${esc(p.name)}</h3><p>${esc(p.lookingFor)}</p><div class="m-links"><a class="m-pill primary" href="mailto:${esc(p.email)}">Email ${esc(p.email)}</a><a class="m-pill" href="${esc(p.github)}" target="_blank" rel="noopener noreferrer">GitHub</a><a class="m-pill" href="${esc(p.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a></div></article>`; } },
    github:{ name:'GitHub', icon:I.gh, href:'https://github.com/Devil1716' },
    site:{ name:'Sketchbook', icon:I.book, action:() => opts.onSite && opts.onSite() },
    theme:{ name:'Theme', icon:I.theme, action:() => window.Sable.Theme.set(window.Sable.Theme.get()==='dark'?'light':'dark') }
  };
  const HOME = ['chat','projects','skills','about','contact','oss','github','theme'];

  const tile = id => `<button class="m-app" data-app="${id}" aria-label="${esc(APPS[id].name)}"><span class="m-ico${APPS[id].accent?' accent':''}">${APPS[id].icon}</span><span aria-hidden="true">${esc(APPS[id].name)}</span></button>`;

  function build(){
    root = document.getElementById('mobile-os');
    root.dataset.sbTheme = window.Sable.Theme.get();
    root.innerHTML = `
      <div class="m-status" aria-hidden="true"><span class="m-time"></span><span>${I.wifi}${I.bat}</span></div>
      <section class="m-home" aria-label="Home screen">
        <div class="m-clock m-time" aria-hidden="true"></div><p class="m-date"></p>
        <button class="m-search" data-app="chat"><svg class="sb-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--sb-text)"/><circle cx="16" cy="16" r="7.5" fill="var(--sb-accent)"/><circle cx="19.5" cy="13" r="5.5" fill="var(--sb-text)"/></svg>Ask ${esc(window.Sable.name)} about Sharan</button>
        <nav class="m-grid" aria-label="Apps">${HOME.map(tile).join('')}</nav>
        <p class="m-swipe-hint">Swipe up for all apps</p>
      </section>
      <section class="m-drawer" aria-label="All apps" aria-hidden="true"><h2>All apps</h2><nav class="m-grid">${Object.keys(APPS).map(tile).join('')}</nav></section>
      <section class="m-win" role="dialog" aria-modal="false" aria-hidden="true"><div class="m-bar"><button class="m-back" aria-label="Back">${I.back}</button><h1></h1></div><div class="m-body"></div></section>
      <button class="m-gesture" aria-label="Go home"></button>`;
    const $ = s => root.querySelector(s);
    const tick = () => { const d = new Date(); root.querySelectorAll('.m-time').forEach(n => n.textContent = d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}).replace(/\s?[AP]M/i,'')); $('.m-date').textContent = d.toLocaleDateString([], {weekday:'long', month:'long', day:'numeric'}); };
    tick(); setInterval(tick, 15000);

    root.addEventListener('click', e => {
      const ask = e.target.closest('[data-ask]'); if (ask) { openApp('chat'); chat.ask(ask.dataset.ask); return; }
      const a = e.target.closest('[data-app]'); if (a) return openApp(a.dataset.app);
      if (e.target.closest('.m-back')) return back();
      if (e.target.closest('.m-gesture')) return home();
    });
    // Gestures: swipe up on home opens the drawer, swipe down closes it; swipe from the left edge goes back; swipe up from the bottom goes home.
    let sx=0, sy=0, st=0, edge=false, bottom=false;
    root.addEventListener('touchstart', e => { const t=e.touches[0]; sx=t.clientX; sy=t.clientY; st=Date.now(); edge=sx<24; bottom=sy>innerHeight-40; }, {passive:true});
    root.addEventListener('touchend', e => {
      const t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy; if (Date.now()-st>700) return;
      const drawer=$('.m-drawer'), win=$('.m-win');
      if (bottom && dy<-60) return home();
      if (edge && dx>70 && Math.abs(dy)<60) return back();
      if (!win.classList.contains('on')) {
        if (!drawer.classList.contains('on') && dy<-70 && Math.abs(dx)<60 && !e.target.closest('.m-search')) setDrawer(true);
        else if (drawer.classList.contains('on') && dy>70 && drawer.scrollTop<=0) setDrawer(false);
      }
    }, {passive:true});
    addEventListener('keydown', e => { if (root.classList.contains('on') && e.key==='Escape') back(); });
    addEventListener('popstate', () => { if (ignorePop) { ignorePop--; return; } if (root.classList.contains('on') && stack.length) back(true); });
    mounted = true;
  }

  function setDrawer(on){ const d = root.querySelector('.m-drawer'); d.classList.toggle('on', on); d.setAttribute('aria-hidden', String(!on)); if (on) { stack.push('drawer'); history.pushState({m:'drawer'},''); d.querySelector('.m-app').focus({preventScroll:true}); } }

  async function openApp(id){
    const A = APPS[id]; if (!A) return;
    if (A.href) return window.open(A.href, '_blank', 'noopener');
    if (A.action) return A.action();
    const win = root.querySelector('.m-win'), body = win.querySelector('.m-body');
    win.classList.toggle('chat', id === 'chat');
    win.querySelector('h1').textContent = A.name;
    body.innerHTML = '';
    if (id === 'chat') {
      if (!chat) { const host = document.createElement('div'); host.style.height = '100%'; chat = window.Sable.mountChat(host, { variant:'compact', resume:true }); }
      body.appendChild(chat.el.parentNode);
    } else {
      body.innerHTML = '<p style="color:var(--sb-muted)">Loading…</p>';
      try { body.innerHTML = A.render(await loadKb()); }
      catch (err) { body.innerHTML = `<p class="sb-error" role="alert">${esc(err.message)}. <button class="m-pill" data-app="${id}">Try again</button></p>`; }
    }
    const wasOpen = win.classList.contains('on');
    win.classList.add('on'); win.setAttribute('aria-hidden','false');
    if (!wasOpen) { stack.push('win'); history.pushState({m:'win'},''); }
    (id==='chat' ? null : win.querySelector('.m-back'))?.focus({preventScroll:true});
  }
  function back(fromPop){
    const top = stack.pop(); if (!top) return;
    if (top === 'win') { const w = root.querySelector('.m-win'); w.classList.remove('on'); w.setAttribute('aria-hidden','true'); }
    if (top === 'drawer') setDrawerOff();
    if (!fromPop) { ignorePop++; history.back(); }
  }
  function setDrawerOff(){ const d = root.querySelector('.m-drawer'); d.classList.remove('on'); d.setAttribute('aria-hidden','true'); }
  function home(){ while (stack.length) back(); }

  window.MobileOS = {
    show(o){ opts = o || {}; if (!mounted) build(); root.classList.add('on'); root.setAttribute('aria-hidden','false'); if (o && o.openChat) openApp('chat'); },
    hide(){ if (root) { root.classList.remove('on'); root.setAttribute('aria-hidden','true'); } },
    openApp
  };
})();
