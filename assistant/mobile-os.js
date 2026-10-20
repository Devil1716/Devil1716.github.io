/* DevilOS Mobile: an original One UI-inspired phone shell (own icons; no vendor assets).
   Large reachable titles, grouped rounded cards, quick panel, drawer, recents, gesture handle. */
(function(){
  'use strict';
  const S = (p, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra||''}>${p}</svg>`;
  const G = {
    sable:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.5" fill="#ff8d6e"/><circle cx="15" cy="9.4" r="4.8" fill="#2c2c35"/></svg>',
    projects:S('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
    skills:S('<path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5"/>'),
    about:S('<circle cx="12" cy="8.5" r="3.6"/><path d="M5 19.5c1.3-3.2 4-4.8 7-4.8s5.7 1.6 7 4.8"/>'),
    contact:S('<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/>'),
    oss:S('<circle cx="7" cy="6" r="2.2"/><circle cx="7" cy="18" r="2.2"/><circle cx="17" cy="8" r="2.2"/><path d="M7 8.2v7.6M17 10.2c0 4-5 3.2-9 6"/>'),
    github:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.6-.2.6-.5v-1.6c-2.6.6-3.2-1.2-3.2-1.2-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .8 1.5 2.3 1 2.8.8.1-.6.3-1 .6-1.3-2.1-.2-4.3-1-4.3-4.7 0-1 .4-1.9 1-2.6-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.5 1 2.6 0 3.7-2.2 4.5-4.3 4.7.3.3.6.8.6 1.6v2.4c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z"/></svg>',
    sketch:S('<path d="M5 4.5h11.5a2 2 0 0 1 2 2V19.5H7a2 2 0 0 1-2-2z"/><path d="M5 17.5a2 2 0 0 1 2-2h11.5M9 8.5h6"/>'),
    settings:S('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2"/><circle cx="12" cy="12" r="7"/>')
  };
  const U = {
    back:S('<path d="m15 5-7 7 7 7"/>','stroke-width="2.2"'), chev:S('<path d="m9 6 6 6-6 6"/>'),
    plus:S('<path d="M12 5v14M5 12h14"/>','stroke-width="2.1"'), arrow:S('<path d="M5 12h14M13 6l6 6-6 6"/>','stroke-width="2.2"'),
    search:S('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>','stroke-width="2.1"'),
    moon:S('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'), motion:S('<path d="M4 12h3l2-5 4 10 2-5h5"/>'),
    sun:S('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
    recents:S('<rect x="4" y="5" width="7" height="14" rx="2"/><rect x="13" y="5" width="7" height="14" rx="2"/>'),
    mail:S('<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/>'),
    link:S('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    wifi:S('<path d="M2.5 9a14 14 0 0 1 19 0M6 12.5a9 9 0 0 1 12 0M9.3 16a4.5 4.5 0 0 1 5.4 0"/><circle cx="12" cy="19.3" r=".9" fill="currentColor"/>','stroke-width="2.2"'),
    bat:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="7" width="17" height="10" rx="2.5"/><rect x="4.5" y="9" width="10" height="6" rx="1.2" fill="currentColor" stroke="none"/><path d="M21.5 10.5v3"/></svg>'
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PALETTE = ['#b35c10','#2f5fcc','#1f7a50','#b8432f','#5d45c4','#a33d72','#1f6f80','#6e5530','#4a5868','#9a4230','#2f6b4c'];

  const APPS = {
    sable:{ name:'Sable', color:'#2c2c35', glyph:G.sable },
    projects:{ name:'Projects', color:'#d4701a', glyph:G.projects },
    skills:{ name:'Skills', color:'#3f6fdc', glyph:G.skills },
    about:{ name:'About', color:'#23885a', glyph:G.about },
    contact:{ name:'Contact', color:'#d4513c', glyph:G.contact },
    oss:{ name:'Open source', color:'#6c50dc', glyph:G.oss },
    github:{ name:'GitHub', color:'#26262b', glyph:G.github, href:'https://github.com/Devil1716' },
    sketch:{ name:'Sketchbook', color:'#b2467e', glyph:G.sketch },
    settings:{ name:'Settings', color:'#55657a', glyph:G.settings }
  };
  const SUBS = { sable:'Ask anything about Sharan', projects:'10 projects', skills:'What he builds with', about:'Agents · Android · Backend', contact:'Email, GitHub, LinkedIn', oss:'27 merged PRs', settings:'Display and accessibility' };
  const PAGE1 = ['projects','skills','about','oss'], DOCK = ['sable','contact','github','settings'], PAGE2 = ['sketch'];

  let kb = null, root = null, chat = null, opts = {}, ignorePop = 0, recents = [];
  const stack = [];
  const $ = s => root.querySelector(s);
  const loadKb = async () => { if (!kb) { const r = await fetch('assistant/knowledge.json'); if (!r.ok) throw new Error('Couldn\'t load content'); kb = await r.json(); } return kb; };
  const prefs = { get(k,d){ try { const v = localStorage.getItem('devilos.m.'+k); return v===null?d:JSON.parse(v); } catch { return d; } }, set(k,v){ try { localStorage.setItem('devilos.m.'+k, JSON.stringify(v)); } catch {} } };

  const icon = (id, size) => `<span class="ou-ico" style="background:${APPS[id].color}${size?`;width:${size}px;height:${size}px`:''}">${APPS[id].glyph}</span>`;
  const tile = id => `<button class="ou-app" data-app="${id}" aria-label="${esc(APPS[id].name)}">${icon(id)}<span class="lbl" aria-hidden="true">${esc(APPS[id].name)}</span></button>`;
  const row = o => `<${o.href?`a href="${esc(o.href)}" ${/^http/.test(o.href)?'target="_blank" rel="noopener noreferrer"':''}`:'button'} class="ou-row${o.ico?' has-ico':''}" ${o.attrs||''}>${o.ico?`<span class="ri" aria-hidden="true" style="background:${o.color||'#55657a'}">${o.ico}</span>`:''}<span class="rt"><b>${esc(o.title)}</b>${o.sub?`<span>${esc(o.sub)}</span>`:''}</span>${o.right!==undefined?o.right:U.chev.replace('<svg','<svg class="chev"')}</${o.href?'a':'button'}>`;
  const group = (rows, cap) => `${cap?`<h3 class="ou-cap">${esc(cap)}</h3>`:''}<div class="ou-group">${rows.join('')}</div>`;
  const textCard = (html, cap) => `${cap?`<h3 class="ou-cap">${esc(cap)}</h3>`:''}<div class="ou-group ou-text">${html}</div>`;
  const askBtn = q => `<button class="ou-btn" data-ask="${esc(q)}">Ask Sable about this</button>`;
  const firstSentence = t => t.split(/(?<=\.)\s/)[0].replace(/\.$/,'');
  const projOf = e => { const m = e.text.match(/^(.*?)(?: Stack: (.*?)\.)?(?: Highlights: (.*))?$/s) || []; return { summary:m[1]||e.text, stack:(m[2]||'').split(/\s*[·,]\s*/).filter(Boolean), points:(m[3]||'').replace(/\.$/,'').split('; ').filter(Boolean) }; };

  /* ---------- app views: {title, sub, html} ---------- */
  const VIEWS = {
    projects: k => { const ps = k.entries.filter(e=>e.type==='project');
      return { title:'Projects', sub:`${ps.length} projects, all open on GitHub`, html: group(ps.map((e,i)=>row({ title:e.title, sub:firstSentence(projOf(e).summary), ico:esc(e.title[0].toUpperCase()), color:PALETTE[i%PALETTE.length], attrs:`data-sub="${esc(e.id)}"` }))) + `<div class="ou-actions">${askBtn('Explore my projects.')}</div>` }; },
    project: (k, id) => { const e = k.entries.find(x=>x.id===id); const p = projOf(e);
      return { title:e.title, sub:p.stack.slice(0,3).join(' · '), html: textCard(`<p>${esc(p.summary)}</p>`) + (p.points.length?`<h3 class="ou-cap">Highlights</h3><div class="ou-group"><ul class="ou-bullets" style="padding-top:16px">${p.points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'') + (p.stack.length?`<h3 class="ou-cap">Built with</h3><div class="ou-group"><div class="ou-chips" style="padding-top:16px">${p.stack.map(s=>`<span class="ou-chip">${esc(s)}</span>`).join('')}</div></div>`:'') + `<div class="ou-actions">${(e.links||[]).map(([t,u])=>`<a class="ou-btn primary" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`).join('')}${askBtn('Tell me about '+e.title)}</div>` }; },
    skills: k => ({ title:'Skills', sub:'What Sharan builds with', html: k.entries.filter(e=>e.type==='skill').map(e=>`<h3 class="ou-cap">${esc(e.title)}</h3><div class="ou-group"><div class="ou-chips" style="padding-top:16px">${e.text.split(': ')[1].replace(/\.$/,'').split(', ').map(s=>`<span class="ou-chip">${esc(s)}</span>`).join('')}</div></div>`).join('') + `<div class="ou-actions">${askBtn('What are my skills?')}</div>` }),
    about: k => { const p=k.profile, f=id=>k.entries.find(e=>e.id===id);
      return { title:'About', sub:p.role, html: `<div class="ou-group ou-profile"><span class="ou-avatar" aria-hidden="true">${esc(p.name[0])}</span><b>${esc(p.name)}</b><span>${esc(p.location)} · @${esc(p.handle)}</span></div>`
        + textCard(`<p>${esc(f('bio').text)}</p>`, 'Bio')
        + group([row({ title:'Amity University Bengaluru', sub:'B.Tech, AI & ML · 7th semester · graduating May 2027', ico:G.about, color:'#23885a', right:'' })], 'Education')
        + group([row({ title:'Technical Lead, Quickoo', sub:'Dates and details coming soon', ico:G.projects, color:'#d4701a', right:'' }), row({ title:'Open-source contributor', sub:'27 merged PRs across 14 projects', ico:G.oss, color:'#6c50dc', attrs:'data-app="oss"' })], 'Experience')
        + textCard(`<p>${esc(f('belief').text)}</p>`, 'How he works')
        + group([row({ title:'Achievements', sub:'Coming soon', right:'' }), row({ title:'Interests', sub:'Coming soon', right:'' })], 'More')
        + `<div class="ou-actions">${askBtn('Who am I?')}</div>` }; },
    oss: k => { const e = k.entries.find(x=>x.id==='exp-oss'); const L = e.links.slice(1);
      return { title:'Open source', sub:'27 merged pull requests to projects he doesn\'t own', html: group(L.map(([r,u],i)=>row({ title:r, sub:(e.text.split(r+': ')[1]||'').split(';')[0].replace(/\.$/,''), href:u, ico:esc(r.split('/')[1][0].toUpperCase()), color:PALETTE[(i+4)%PALETTE.length] }))) + `<div class="ou-actions"><a class="ou-btn primary" href="${esc(e.links[0][1])}" target="_blank" rel="noopener noreferrer">See every merged PR</a></div>` }; },
    contact: k => { const p=k.profile;
      return { title:'Contact', sub:p.lookingFor, html: group([row({ title:'Email', sub:p.email, href:'mailto:'+p.email, ico:U.mail, color:'#d4513c' }), row({ title:'GitHub', sub:'@'+p.handle, href:p.github, ico:G.github, color:'#26262b' }), row({ title:'LinkedIn', sub:'sharan-s-171816s', href:p.linkedin, ico:U.link, color:'#2e6fb8' })])
        + `<div class="ou-actions"><a class="ou-btn primary" href="mailto:${esc(p.email)}">Send an email</a>${askBtn('Contact me.')}</div>` }; },
    settings: () => { const t = window.Sable.Theme.get(), sys = !localStorage.getItem('sable.theme');
      return { title:'Settings', sub:'This phone runs in your browser', html: group(['light','dark'].map(m=>row({ title:m==='light'?'Light':'Dark', ico:m==='light'?U.sun:U.moon, color:m==='light'?'#e5a52c':'#4b4f8f', attrs:`role="radio" aria-checked="${t===m}" data-theme="${m}"`, right:'<span class="radio" aria-hidden="true"></span>' })), 'Display')
        + group([row({ title:'Reduce motion', sub:'Turn off animations in this shell', ico:U.motion, color:'#2e8fa3', attrs:`role="switch" aria-checked="${!!prefs.get('reduce',false)}" data-toggle="reduce"`, right:`<span class="radio" aria-hidden="true"></span>` })], 'Accessibility')
        + group([row({ title:'DevilOS Mobile', sub:'Built by Sharan S · vanilla JavaScript, no framework', right:'' }), row({ title:'Sketchbook portfolio', sub:'The classic one-page portfolio', attrs:'data-app="sketch"' })], 'About this phone') }; }
  };

  /* ---------- build ---------- */
  function build(){
    root = document.getElementById('mobile-os');
    root.dataset.sbTheme = window.Sable.Theme.get();
    root.style.setProperty('--ou-bright', prefs.get('bright', 1));
    root.classList.toggle('reduce', !!prefs.get('reduce', false));
    root.innerHTML = `
      <button class="ou-status"><span class="ou-time"></span><span class="sr">, open quick panel</span><span aria-hidden="true">${U.wifi}${U.bat}</span></button>
      <section class="ou-home" aria-label="Home screen">
        <div class="ou-wall" aria-hidden="true"><i></i><i></i></div>
        <div class="ou-pages">
          <div class="ou-page" aria-label="Home page 1">
            <div class="ou-widget"><div class="t ou-time"></div><div class="d ou-date"></div></div>
            <button class="ou-widget who" data-app="about">${icon('about',48)}<span><b>Sharan S</b><span>Agents · Android · Backend</span></span></button>
            <nav class="ou-grid" aria-label="Apps">${PAGE1.map(tile).join('')}</nav>
          </div>
          <div class="ou-page" aria-label="Home page 2">
            <h3 class="ou-cap" style="padding:8px 6px 8px">Featured projects</h3>
            <div class="ou-group ou-feat"></div>
            <nav class="ou-grid" aria-label="More apps">${PAGE2.map(tile).join('')}</nav>
          </div>
        </div>
        <div class="ou-home-foot">
          <button class="ou-ask" data-app="sable"><svg class="orb" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#2c2c35"/><circle cx="16" cy="16" r="7.5" fill="#ff8d6e"/><circle cx="19.5" cy="13" r="5.5" fill="#2c2c35"/></svg>Ask Sable about Sharan<span class="go" aria-hidden="true">${U.arrow}</span></button>
          <div class="ou-dots" role="tablist" aria-label="Home pages"><button role="tab" aria-label="Page 1" aria-current="true" data-page="0"></button><button role="tab" aria-label="Page 2" data-page="1"></button></div>
          <nav class="ou-dock" aria-label="Dock">${DOCK.map(tile).join('')}</nav>
        </div>
      </section>
      <section class="ou-drawer" aria-label="Apps" aria-hidden="true">
        <label class="ou-search">${U.search}<span class="sr">Search apps</span><input type="search" placeholder="Search apps" autocomplete="off" enterkeyhint="search"></label>
        <nav class="ou-grid ou-all" aria-label="All apps"></nav>
      </section>
      <section class="ou-win" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="ou-wt">
        <div class="ou-bar"><button class="ou-iconbtn" data-back aria-label="Back">${U.back}</button><h2 id="ou-wt"></h2><span class="ou-baract"></span></div>
        <div class="ou-scroll"></div>
      </section>
      <section class="ou-recents" aria-label="Recent apps" aria-hidden="true"><div class="ou-rlist"></div><div class="ou-rfoot"><button class="ou-btn" data-close-all>Close all</button></div></section>
      <div class="ou-scrim" aria-hidden="true"></div>
      <section class="ou-qp" aria-label="Quick panel" aria-hidden="true">
        <div class="ou-qp-head"><span class="t ou-time"></span><span class="d ou-date"></span></div>
        <div class="ou-tiles">
          <button class="ou-tile" data-qp="theme"><span class="ti">${U.moon}</span><span><b>Dark mode</b><small></small></span></button>
          <button class="ou-tile" data-qp="reduce"><span class="ti">${U.motion}</span><span><b>Less motion</b><small></small></span></button>
          <button class="ou-tile" data-qp="recents" aria-pressed="false"><span class="ti">${U.recents}</span><span><b>Recent apps</b><small>Switch apps</small></span></button>
          <button class="ou-tile" data-qp="mail" aria-pressed="false"><span class="ti">${U.mail}</span><span><b>Email</b><small>Write to Sharan</small></span></button>
        </div>
        <label class="ou-slider">${U.sun}<span class="sr">Brightness</span><input type="range" min="55" max="100" value="${Math.round(prefs.get('bright',1)*100)}" aria-label="Brightness"></label>
        <button class="ou-qp-grip" aria-label="Close quick panel"></button>
      </section>
      <button class="ou-handle" aria-label="Home. Swipe up and hold for recent apps"></button>`;
    $('.ou-all').innerHTML = Object.keys(APPS).map(tile).join('');
    loadKb().then(k => { $('.ou-feat').innerHTML = k.entries.filter(e=>e.type==='project').slice(0,4).map((e,i)=>row({ title:e.title, sub:firstSentence(projOf(e).summary), ico:esc(e.title[0].toUpperCase()), color:PALETTE[i], attrs:`data-app="projects" data-sub="${esc(e.id)}"` })).join(''); }).catch(()=>{});
    paintQP();
    const tick = () => { const d = new Date(); root.querySelectorAll('.ou-time').forEach(n => n.textContent = d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}).replace(/\s?[AP]M/i,'')); root.querySelectorAll('.ou-date').forEach(n => n.textContent = d.toLocaleDateString([], {weekday:'short', month:'long', day:'numeric'})); };
    tick(); setInterval(tick, 15000);

    // page dots follow scroll-snap pages
    const pages = $('.ou-pages');
    pages.addEventListener('scroll', () => { const i = Math.round(pages.scrollLeft / pages.clientWidth); root.querySelectorAll('.ou-dots button').forEach((b,j)=>b.setAttribute('aria-current', String(i===j))); }, {passive:true});
    // collapsing large title
    const sc = $('.ou-scroll'); let raf = 0;
    sc.addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const hero = sc.querySelector('.ou-hero'); const h = hero ? hero.offsetHeight - 70 : 1; $('.ou-win').style.setProperty('--ou-p', Math.max(0, Math.min(1, sc.scrollTop / h)).toFixed(3)); }); }, {passive:true});
    // drawer search
    const inp = $('.ou-search input');
    inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); const ids = Object.keys(APPS).filter(id => APPS[id].name.toLowerCase().includes(q)); $('.ou-all').innerHTML = ids.length ? ids.map(tile).join('') : `<p class="ou-none">No apps match “${esc(inp.value)}”</p>`; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const f = $('.ou-all .ou-app'); if (f) f.click(); } });
    $('.ou-slider input').addEventListener('input', e => { const v = e.target.value/100; root.style.setProperty('--ou-bright', v); prefs.set('bright', v); });

    root.addEventListener('click', onClick);
    // focus/scrollIntoView must never scroll the fixed shell itself
    const pin = n => n.addEventListener('scroll', () => { if (n.scrollTop || n.scrollLeft) { n.scrollTop = 0; n.scrollLeft = 0; } });
    pin(root); root.querySelectorAll('.ou-win, .ou-home, .ou-drawer').forEach(pin);
    gestures();
    addEventListener('keydown', e => { if (root.classList.contains('on') && e.key === 'Escape') back(); });
    addEventListener('popstate', () => { if (ignorePop) { ignorePop--; return; } if (root.classList.contains('on') && stack.length) back(true); });
    // keep layouts above the on-screen keyboard
    if (window.visualViewport) { const vv = window.visualViewport; const fit = () => root.style.setProperty('--ou-vh', vv.height + 'px'); vv.addEventListener('resize', fit); fit(); }
    // theme changes from anywhere (Settings, chat, quick panel)
    new MutationObserver(() => { root.dataset.sbTheme = window.Sable.Theme.get(); paintQP(); }).observe(document.documentElement, { attributes:true, attributeFilter:['data-sb-theme'] });
  }

  function onClick(e){
    const t = e.target;
    const ask = t.closest('[data-ask]'); if (ask) { openApp('sable', null, ask); setTimeout(() => chat.ask(ask.dataset.ask), 60); return; }
    const th = t.closest('[data-theme]'); if (th) { localStorage.setItem('sable.theme', th.dataset.theme); window.Sable.Theme.set(th.dataset.theme); return rerender(); }
    const tg = t.closest('[data-toggle="reduce"]'); if (tg) { toggleReduce(); return rerender(); }
    const sub = t.closest('[data-sub]'); if (sub && !sub.dataset.app) return push({ kind:'app', id:'project', sub:sub.dataset.sub, from:'projects' });
    const a = t.closest('[data-app]'); if (a) { if (a.dataset.sub) { openApp('projects', a); return push({ kind:'app', id:'project', sub:a.dataset.sub }); } return openApp(a.dataset.app, null, a); }
    if (t.closest('[data-back]')) return back();
    if (t.closest('.ou-status')) return openQP();
    if (t.closest('.ou-scrim') || t.closest('.ou-qp-grip')) return back();
    if (t.closest('.ou-handle')) return home();
    if (t.closest('[data-close-all]')) { recents = []; return home(); }
    const rc = t.closest('[data-recent]'); if (rc) { home(); return openApp(rc.dataset.recent); }
    const dots = t.closest('[data-page]'); if (dots) { const p = $('.ou-pages'); p.scrollTo({ left: p.clientWidth * +dots.dataset.page, behavior: reduced() ? 'auto' : 'smooth' }); return; }
    const q = t.closest('[data-qp]');
    if (q) { const k = q.dataset.qp;
      if (k === 'theme') { const n = window.Sable.Theme.get()==='dark'?'light':'dark'; window.Sable.Theme.set(n); }
      if (k === 'reduce') toggleReduce();
      if (k === 'recents') { back(); setTimeout(openRecents, 50); }
      if (k === 'mail') location.href = 'mailto:sharan071718@gmail.com';
      paintQP(); }
  }
  const reduced = () => root.classList.contains('reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toggleReduce(){ const v = !prefs.get('reduce', false); prefs.set('reduce', v); root.classList.toggle('reduce', v); paintQP(); }
  function paintQP(){
    if (!root) return;
    const dark = window.Sable.Theme.get() === 'dark', red = !!prefs.get('reduce', false);
    const t1 = root.querySelector('[data-qp="theme"]'), t2 = root.querySelector('[data-qp="reduce"]');
    if (!t1) return;
    t1.setAttribute('aria-pressed', String(dark)); t1.querySelector('small').textContent = dark ? 'On' : 'Off';
    t2.setAttribute('aria-pressed', String(red)); t2.querySelector('small').textContent = red ? 'On' : 'Off';
  }

  /* ---------- navigation stack ---------- */
  function push(entry){ stack.push(entry); history.pushState({ ou:stack.length }, ''); render(); }
  function back(fromPop){ if (!stack.length) return; stack.pop(); if (!fromPop) { ignorePop++; history.back(); } render(); }
  function home(){ const n = stack.length; if (!n) return render(); stack.length = 0; ignorePop++; history.go(-n); render(); }
  function rerender(){ render(true); }
  function top(kind){ for (let i = stack.length - 1; i >= 0; i--) if (!kind || stack[i].kind === kind) return stack[i]; return null; }

  function setOn(sel, on){ const n = $(sel); n.classList.toggle('on', on); n.setAttribute('aria-hidden', String(!on)); if ('inert' in n) n.inert = !on; }
  async function render(keepScroll){
    const t = stack[stack.length - 1];
    const appEntry = top('app');
    setOn('.ou-qp', t && t.kind === 'qp'); $('.ou-scrim').classList.toggle('on', !!(t && t.kind === 'qp'));
    setOn('.ou-drawer', !!stack.find(s => s.kind === 'drawer') && !appEntry);
    setOn('.ou-recents', !!(t && t.kind === 'recents'));
    const winOn = !!appEntry && !(t && t.kind === 'recents');
    setOn('.ou-win', winOn);
    $('.ou-home').classList.toggle('behind', winOn || !!(t && t.kind === 'drawer'));
    $('.ou-home').inert = !!t;
    if (winOn && (!t || t.kind === 'app' || keepScroll === true)) await paintWin(appEntry, keepScroll === true);
    if (t && t.kind === 'drawer') setTimeout(() => $('.ou-search input').focus({ preventScroll:true }), 300);
    if (!t) { const inp = $('.ou-search input'); if (inp.value) { inp.value = ''; inp.dispatchEvent(new Event('input')); } }
  }
  async function paintWin(entry, keepScroll){
    const win = $('.ou-win'), sc = $('.ou-scroll'), act = $('.ou-baract');
    const key = entry.id + ':' + (entry.sub || '');
    if (win.dataset.key === key && !keepScroll && entry.id === 'sable') return;
    const prevTop = sc.scrollTop;
    win.dataset.key = key; win.classList.toggle('chat', entry.id === 'sable'); act.innerHTML = '';
    if (entry.id === 'sable') {
      $('#ou-wt').textContent = 'Sable';
      if (!chat) { const host = document.createElement('div'); host.className = 'ou-chatwrap'; chat = window.Sable.mountChat(host, { variant:'compact', resume:true }); }
      sc.innerHTML = ''; sc.appendChild(chat.el.parentNode);
      act.innerHTML = `<button class="ou-iconbtn" aria-label="New conversation">${U.plus}</button>`;
      act.firstChild.onclick = () => chat.el.querySelector('[data-act="new"]').click();
      win.style.setProperty('--ou-p', 1);
      return;
    }
    sc.innerHTML = '<div class="ou-hero"><h1>&nbsp;</h1></div>';
    try {
      const k = await loadKb();
      const v = entry.id === 'project' ? VIEWS.project(k, entry.sub) : VIEWS[entry.id](k);
      $('#ou-wt').textContent = v.title;
      sc.innerHTML = `<header class="ou-hero"><h1>${esc(v.title)}</h1>${v.sub?`<p>${esc(v.sub)}</p>`:''}</header><div class="ou-content">${v.html}</div>`;
    } catch (err) {
      sc.innerHTML = `<header class="ou-hero"><h1>${esc(APPS[entry.id]?.name || 'App')}</h1></header><div class="ou-content"><div class="ou-group ou-err" role="alert">${esc(err.message)}. <button class="ou-btn" data-app="${entry.id}">Try again</button></div></div>`;
    }
    sc.scrollTop = keepScroll ? prevTop : 0;
    win.style.setProperty('--ou-p', keepScroll ? win.style.getPropertyValue('--ou-p') : 0);
    if (!keepScroll) $('[data-back]').focus({ preventScroll:true });
  }

  function openApp(id, _p, from){
    const A = APPS[id]; if (!A) return;
    if (A.href) return window.open(A.href, '_blank', 'noopener');
    if (id === 'sketch') return opts.onSite && opts.onSite();
    if (from && from.getBoundingClientRect) { const r = from.getBoundingClientRect(); const w = $('.ou-win'); w.style.setProperty('--ou-ox', (r.left + r.width/2) + 'px'); w.style.setProperty('--ou-oy', (r.top + r.height/2) + 'px'); }
    recents = [id].concat(recents.filter(x => x !== id)).slice(0, 6);
    // opening an app replaces whatever is on top (like launching from home)
    if (stack.length) { stack.length = 0; stack.push({ kind:'app', id }); history.replaceState({ ou:1 }, ''); return render(); }
    push({ kind:'app', id });
  }
  function openQP(){ if (top() && top().kind === 'qp') return; push({ kind:'qp' }); }
  function openDrawer(){ if (!stack.length) push({ kind:'drawer' }); }
  function openRecents(){
    $('.ou-rlist').innerHTML = recents.length ? recents.map(id => `<button class="ou-rcard" data-recent="${id}" aria-label="Open ${esc(APPS[id].name)}"><span class="rh"><span class="ri" style="background:${APPS[id].color}">${APPS[id].glyph}</span>${esc(APPS[id].name)}</span><span class="rb" aria-hidden="true"><b>${esc(APPS[id].name)}</b><small>${esc(SUBS[id]||'')}</small><i></i><i></i><i></i></span></button>`).join('') : '<p class="ou-rempty">No recent apps</p>';
    $('.ou-rfoot').hidden = !recents.length;
    push({ kind:'recents' });
  }

  /* ---------- gestures ---------- */
  function gestures(){
    let sx=0, sy=0, st=0, zone='';
    root.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now();
      zone = sy < 56 ? 'top' : sy > innerHeight - 44 ? 'bottom' : sx < 20 ? 'edge' : ''; }, { passive:true });
    root.addEventListener('touchend', e => {
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
      const cur = stack[stack.length - 1];
      if (zone === 'bottom' && dy < -50) return dt > 450 ? openRecents() : home();
      if (zone === 'edge' && dx > 70 && Math.abs(dy) < 60) return back();
      if (cur && cur.kind === 'qp') { if (dy < -50) back(); return; }
      if (zone === 'top' && dy > 50) return openQP();
      if (cur && cur.kind === 'drawer') { const g = $('.ou-all'); if (dy > 80 && g.scrollTop <= 0 && Math.abs(dx) < 60) back(); return; }
      if (!cur && dt < 700 && dy < -70 && Math.abs(dx) < Math.abs(dy) * .6) return openDrawer();
      if (!cur && dt < 700 && dy > 70 && Math.abs(dx) < Math.abs(dy) * .6) return openQP();
    }, { passive:true });
  }

  window.MobileOS = {
    show(o){ opts = o || {}; if (!root || !root.firstChild) build(); root.classList.add('on'); root.setAttribute('aria-hidden','false'); if (o && o.openChat) openApp('sable'); },
    hide(){ if (root) { root.classList.remove('on'); root.setAttribute('aria-hidden','true'); } },
    openApp, openQP, openDrawer, openRecents
  };
})();
