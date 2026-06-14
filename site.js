/* ============================================================
   Haile Teshome — site interactions
   ============================================================ */
(function () {
  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const stored = localStorage.getItem('ht-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));

  function setTheme(t) {
    root.setAttribute('data-theme', t);
    localStorage.setItem('ht-theme', t);
    paintToggle();
  }
  function paintToggle() {
    const t = root.getAttribute('data-theme');
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.innerHTML = t === 'dark'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    });
  }
  document.addEventListener('click', e => {
    const tog = e.target.closest('[data-theme-toggle]');
    if (tog) setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  paintToggle();

  /* ---------- Nav scroll state + mobile menu ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('click', e => {
    if (e.target.closest('.menu-btn')) {
      document.querySelector('.nav-links')?.classList.toggle('open');
    } else if (!e.target.closest('.nav-links')) {
      document.querySelector('.nav-links')?.classList.remove('open');
    }
  });

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Command palette ---------- */
  const PAGES = [
    { t: 'Home', d: 'Intro, news & contact', u: 'index.html', g: 'Pages', ic: 'home' },
    { t: 'Portfolio', d: 'Papers & projects', u: 'research.html', g: 'Pages', ic: 'doc' },
    { t: 'Experience', d: 'Roles, talks & teaching', u: 'experience.html', g: 'Pages', ic: 'brief' },
    { t: 'Hobbies', d: 'Life outside research', u: 'hobbies.html', g: 'Pages', ic: 'pen' },
    { t: 'Email Haile', d: 'haile.teshome@ucsf.edu', u: 'mailto:haile.teshome@ucsf.edu', g: 'Connect', ic: 'mail' },
    { t: 'LinkedIn', d: 'in/haile-teshome', u: 'https://www.linkedin.com/in/haile-teshome', g: 'Connect', ic: 'link' },
    { t: 'Download CV', d: '.docx', u: 'assets/Haile_Teshome_CV.docx', g: 'Connect', ic: 'down' },
    { t: 'Toggle theme', d: 'Light / dark', u: '#theme', g: 'Actions', ic: 'sun' },
  ];
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5"/>',
    flask: '<path d="M9 3h6M10 3v6.5L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19l-5-9.5V3"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    down: '<path d="M12 3v12M7 11l5 5 5-5M5 21h14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  };

  const cmdk = document.createElement('div');
  cmdk.className = 'cmdk';
  cmdk.innerHTML = `
    <div class="cmdk-panel" role="dialog" aria-modal="true">
      <div class="cmdk-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
        <input type="text" placeholder="Jump to a page, or search…" aria-label="Command search" />
        <span class="esc">ESC</span>
      </div>
      <div class="cmdk-list"></div>
    </div>`;
  document.body.appendChild(cmdk);
  const input = cmdk.querySelector('input');
  const list = cmdk.querySelector('.cmdk-list');
  let sel = 0, filtered = [];

  function renderList() {
    const q = input.value.trim().toLowerCase();
    filtered = PAGES.filter(p => !q || (p.t + ' ' + p.d + ' ' + p.g).toLowerCase().includes(q));
    if (sel >= filtered.length) sel = Math.max(0, filtered.length - 1);
    if (!filtered.length) { list.innerHTML = '<div class="cmdk-empty">No matches</div>'; return; }
    let html = '', lastG = '';
    filtered.forEach((p, i) => {
      if (p.g !== lastG) { html += `<div class="cmdk-group-label">${p.g}</div>`; lastG = p.g; }
      html += `<div class="cmdk-item${i === sel ? ' sel' : ''}" data-i="${i}">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[p.ic] || ''}</svg></div>
        <div class="t"><b>${p.t}</b><small>${p.d}</small></div>
        <span class="go">↵</span>
      </div>`;
    });
    list.innerHTML = html;
  }
  function exec(p) {
    if (!p) return;
    closeCmdk();
    if (p.u === '#theme') { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); return; }
    if (p.u.startsWith('http') || p.u.startsWith('mailto') || p.u.endsWith('.docx')) { window.open(p.u, p.u.startsWith('http') ? '_blank' : '_self'); return; }
    window.location.href = p.u;
  }
  function openCmdk() { cmdk.classList.add('open'); input.value = ''; sel = 0; renderList(); setTimeout(() => input.focus(), 30); }
  function closeCmdk() { cmdk.classList.remove('open'); }

  input.addEventListener('input', () => { sel = 0; renderList(); });
  list.addEventListener('mousemove', e => { const it = e.target.closest('.cmdk-item'); if (it) { sel = +it.dataset.i; renderList(); } });
  list.addEventListener('click', e => { const it = e.target.closest('.cmdk-item'); if (it) exec(filtered[+it.dataset.i]); });
  cmdk.addEventListener('click', e => { if (e.target === cmdk) closeCmdk(); });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.classList.contains('open') ? closeCmdk() : openCmdk(); return; }
    if (!cmdk.classList.contains('open')) {
      if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openCmdk(); }
      return;
    }
    if (e.key === 'Escape') closeCmdk();
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); renderList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); renderList(); }
    else if (e.key === 'Enter') { e.preventDefault(); exec(filtered[sel]); }
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-cmdk-open]')) openCmdk(); });
})();
