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
  // Only the 12 November webinar is open for registration; the rest are shown as "Planned".
  const OPEN = 'Thursday, 12th November 2026';
  const SESSIONS = {
    'MBBS (India)': [OPEN, 'Thursday, 3rd December 2026'],
    'MBBS (Abroad, FMG)': [OPEN, 'Thursday, 3rd December 2026'],
    'BDS (Dentist)': ['Thursday, 19th November 2026'],
    'BAMS (Ayurveda)': ['Thursday, 26th November 2026'],
    'BHMS (Homeopathy)': ['Thursday, 26th November 2026'],
    'BUMS (Unani)': ['Thursday, 26th November 2026'],
  };
  const dateNote = form.querySelector('[data-date-note]');
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
    const hasOpen = list.includes(OPEN);
    dates.replaceChildren(...list.map(d => {
      if (d === OPEN) {
        const label = document.createElement('label');
        label.className = 'choice';
        label.innerHTML = `<input type="radio" name="webinar_date" value="${d}, 4 PM to 5 PM IST" required checked><span>${d}</span>`;
        return label;
      }
      const row = document.createElement('div');
      row.className = 'choice--planned';
      row.setAttribute('aria-disabled', 'true');
      row.innerHTML = `<span>${d}</span><em class="date-tag">Planned</em>`;
      return row;
    }));
    if (!hasOpen && list.length) {
      // Nothing bookable yet: keep the interest, tell them we will message once registration opens.
      const keep = document.createElement('input');
      keep.type = 'hidden'; keep.name = 'webinar_date'; keep.value = list[0];
      dates.append(keep);
      dateNote.textContent = 'Registration for this webinar opens soon. Submit your details and we will message you on WhatsApp as soon as it opens.';
      dateNote.hidden = false;
    } else {
      dateNote.hidden = true;
    }
  }

  const thanksTitle = thanks.querySelector('[data-thanks-title]');
  const thanksText = thanks.querySelector('[data-thanks-text]');
  const thanksLink = thanks.querySelector('[data-thanks-link]');
  const thanksNote = thanks.querySelector('[data-thanks-note]');
  function done(res, picked) {
    form.hidden = true;
    if (res && res.registered && res.join_url) {
      thanksTitle.textContent = "You're registered!";
      thanksText.innerHTML = 'Your webinar is on <b>Thursday, 12th November 2026</b>, 4 PM to 5 PM IST.';
      thanksLink.href = res.join_url; thanksLink.hidden = false;
      thanksNote.textContent = "You'll also get this link on WhatsApp and by email from Zoom. Please save it for the day.";
    } else if (res && res.live && res.reg_url) {
      thanksTitle.textContent = 'One last step';
      thanksText.innerHTML = 'Complete your Zoom registration for <b>Thursday, 12th November 2026</b>, 4 PM to 5 PM IST.';
      thanksLink.href = res.reg_url; thanksLink.hidden = false;
      thanksLink.lastChild.textContent = 'Complete Zoom registration';
      thanksNote.textContent = 'Zoom will then email you your personal joining link.';
    } else if (res && res.live === false) {
      thanksTitle.textContent = 'Thank you, we have your details';
      thanksText.innerHTML = 'Your webinar on <b>' + picked + '</b> is planned.';
      thanksLink.hidden = true;
      thanksNote.textContent = 'We will message you on WhatsApp as soon as registration opens.';
    } else {
      thanksTitle.textContent = 'Thank you, we have your details';
      thanksText.textContent = 'Our team will send you the joining link for your webinar shortly.';
      thanksLink.hidden = true;
      thanksNote.textContent = 'Please keep an eye on WhatsApp and your email.';
    }
    thanks.hidden = false; thanks.focus();
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (at < path().length - 1) { go(1); return; }
    if (!path().every(valid)) return;
    const endpoint = (form.dataset.endpoint || '').trim();
    const fallback = (form.dataset.fallback || '').trim();
    const data = new URLSearchParams(new FormData(form));
    const picked = (data.get('webinar_date') || '').replace(', 4 PM to 5 PM IST', '');
    submit.disabled = true; status.textContent = 'Registering you…';
    try {
      const r = await fetch(endpoint, { method: 'POST', body: data });
      const res = await r.json();
      if (!res || !res.ok) throw new Error('not saved');
      done(res, picked);
    } catch {
      // n8n unreachable: still save the lead to the sheet so nobody is lost.
      try {
        await fetch(fallback, { method: 'POST', mode: 'no-cors', body: data });
        done(null, picked);
      } catch {
        status.textContent = 'Could not send. Please check your connection and try again.';
      }
    } finally { submit.disabled = false; }
  });

  show(0);
})();
