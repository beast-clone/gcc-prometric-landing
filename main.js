(() => {
  /* ---------- mobile menu ---------- */
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('mobile-menu');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    menu.hidden = open;
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); } });

  /* ---------- reveal on scroll + hero bar ---------- */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) items.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }
  setTimeout(() => document.querySelectorAll('[data-fill]').forEach(b => { b.style.width = b.dataset.fill; }), 150);

  /* ---------- hero: GCC places slideshow ---------- */
  const cityShow = document.querySelector('.city-show');
  if (cityShow) {
    const slides = [...cityShow.querySelectorAll('.city')];
    const dots = [...cityShow.querySelectorAll('.city-dot')];
    const place = cityShow.querySelector('[data-city-place]');
    const auth = cityShow.querySelector('[data-city-auth]');
    const DUR = 4000;
    cityShow.style.setProperty('--dur', DUR + 'ms');
    let cur = 0, timer;
    const goCity = i => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === cur));
      dots.forEach((d, k) => { d.classList.remove('is-on'); d.classList.toggle('is-done', k < cur); });
      void dots[cur].offsetWidth; dots[cur].classList.add('is-on');
      place.textContent = slides[cur].dataset.place;
      auth.textContent = slides[cur].dataset.auth + ' licensing exam';
    };
    const play = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => goCity(cur + 1), DUR); };
    dots.forEach((d, i) => d.addEventListener('click', () => { goCity(i); play(); }));
    goCity(0); play();
  }

  /* ---------- authority rows switch the city photo ---------- */
  const rows = [...document.querySelectorAll('button.auth__row')];
  const photos = [...document.querySelectorAll('.auth__photo img')];
  const pick = i => {
    rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
    photos.forEach((p, k) => p.classList.toggle('is-on', k === i));
  };
  rows.forEach((r, i) => { r.addEventListener('mouseenter', () => pick(i)); r.addEventListener('focus', () => pick(i)); r.addEventListener('click', () => pick(i)); });

  /* ---------- registration form, one step at a time ---------- */
  const form = document.getElementById('register-form');
  if (!form) return;
  const steps = [...form.querySelectorAll('.step')];
  const fmgStep = form.querySelector('[data-fmg]');
  const dates = form.querySelector('[data-dates]');
  const back = form.querySelector('[data-back]');
  const next = form.querySelector('[data-next]');
  const submit = form.querySelector('[data-submit]');
  const status = form.querySelector('[data-status]');
  const count = form.querySelector('[data-count]');
  const bar = form.querySelector('[data-progress]');
  const thanks = document.querySelector('[data-thanks]');
  const SESSIONS = {
    'MBBS (India)': ['Thursday, 12th November 2026', 'Friday, 4th December 2026'],
    'MBBS (Abroad, FMG)': ['Thursday, 12th November 2026', 'Friday, 4th December 2026'],
    'BDS (Dentist)': ['Friday, 20th November 2026'],
    'BAMS (Ayurveda)': ['Friday, 27th November 2026'],
    'BHMS (Homeopathy)': ['Friday, 27th November 2026'],
    'BUMS (Unani)': ['Friday, 27th November 2026'],
  };
  let at = 0;
  const val = name => { const r = form.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
  const isFmg = () => val('profession') === 'MBBS (Abroad, FMG)';
  const path = () => steps.filter(s => s !== fmgStep || isFmg());

  // the error line that belongs to a field or a group of choices
  const errFor = input => {
    if (input.type !== 'radio') return input.closest('.field');
    let el = input.closest('.choices').nextElementSibling;
    while (el && !el.classList.contains('err')) el = el.nextElementSibling;
    return el;
  };
  function valid(stepEl) {
    let first = null;
    const seen = new Set();
    stepEl.querySelectorAll('input').forEach(input => {
      if (input.type === 'radio') { if (seen.has(input.name)) return; seen.add(input.name); }
      const ok = input.type === 'radio' ? !!val(input.name) : input.checkValidity();
      const holder = errFor(input);
      if (input.type === 'radio') holder && holder.classList.toggle('show', !ok);
      else holder && holder.classList.toggle('is-invalid', !ok);
      if (!ok && !first) first = input;
    });
    if (first) { first.focus(); status.textContent = 'Please complete the highlighted fields.'; return false; }
    status.textContent = '';
    return true;
  }
  form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-invalid'); });
  form.addEventListener('change', e => {
    if (e.target.type === 'radio') { const err = errFor(e.target); if (err) err.classList.remove('show'); }
    if (e.target.name === 'profession') { fmgStep.disabled = !isFmg(); fillDates(); show(at); }
  });

  function show(i) {
    const p = path();
    at = Math.max(0, Math.min(i, p.length - 1));
    steps.forEach(s => { s.hidden = s !== p[at]; });
    count.textContent = `Step ${at + 1} of ${p.length}`;
    bar.style.width = `${((at + 1) / p.length) * 100}%`;
    const last = at === p.length - 1;
    back.hidden = at === 0; next.hidden = last; submit.hidden = !last;
  }
  function go(dir) {
    if (dir > 0 && !valid(path()[at])) return;
    show(at + dir);
    const first = path()[at].querySelector('input:not([disabled])');
    if (first) first.focus({ preventScroll: true });
  }
  next.addEventListener('click', () => go(1));
  back.addEventListener('click', () => go(-1));

  function fillDates() {
    const list = SESSIONS[val('profession')] || [];
    dates.replaceChildren(...list.map((d, k) => {
      const label = document.createElement('label');
      label.className = 'choice';
      label.innerHTML = `<input type="radio" name="webinar_date" value="${d}, 4 PM to 5 PM IST" required${k === 0 ? ' checked' : ''}><span>${d}</span>`;
      return label;
    }));
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (at < path().length - 1) { go(1); return; }
    if (!path().every(valid)) return;
    const endpoint = (form.dataset.endpoint || '').trim();
    if (!endpoint) { status.textContent = 'Registration is not connected yet: the Google Sheet link still has to be added.'; return; }
    const data = new URLSearchParams(new FormData(form));
    const chosen = val('webinar_date').replace(', 4 PM to 5 PM IST', '');
    submit.disabled = true; status.textContent = 'Sending…';
    try {
      await fetch(endpoint, { method: 'POST', mode: 'no-cors', body: data });
      form.hidden = true;
      thanks.querySelector('[data-thanks-date]').textContent = chosen;
      thanks.hidden = false; thanks.focus();
    } catch {
      status.textContent = 'Could not send. Please check your connection and try again.';
    } finally { submit.disabled = false; }
  });

  show(0);
})();
