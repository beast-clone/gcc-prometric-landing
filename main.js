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
  // No webinar is open right now: 12 Nov is over, the rest are planned.
  const OPEN = '';
  const CLOSED = ['Thursday, 12th November 2026'];
  const SESSIONS = {
    'MBBS (India)': ['Thursday, 12th November 2026', 'Thursday, 3rd December 2026'],
    'MBBS (Abroad, FMG)': ['Thursday, 12th November 2026', 'Thursday, 3rd December 2026'],
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

  /* ---------- WhatsApp number verification ---------- */
  const OTP_URL = 'https://n8n.srv1046538.hstgr.cloud/webhook/gcc-web-otp';
  const phoneField = form.querySelector('[data-phone-field]');
  const phoneInput = form.querySelector('input[name="contact_number"]');
  const otpSend = form.querySelector('[data-otp-send]');
  const otpBox = form.querySelector('[data-otp]');
  const otpCode = form.querySelector('[data-otp-code]');
  const otpVerify = form.querySelector('[data-otp-verify]');
  const otpMsg = form.querySelector('[data-otp-msg]');
  const otpToken = form.querySelector('[data-otp-token]');
  let cooldown = null;
  const say = (text, kind) => { otpMsg.textContent = text; otpMsg.className = 'otp__msg' + (kind ? ' is-' + kind : ''); };
  const ccSelect = form.querySelector('[data-cc]');
  const ccShow = form.querySelector('[data-cc-show]');
  const phoneErr = form.querySelector('[data-phone-err]');
  const cc = () => ccSelect.value;
  // India: 10 digits starting 6-9. Elsewhere: 6 to 12 digits after the code. Junk like 0000000 is refused.
  const phoneOk = v => (cc() === '91' ? /^[6-9]\d{9}$/.test(v) : /^\d{6,12}$/.test(v)) && !/^(\d)\1{5}/.test(v);
  const fullPhone = () => cc() + phoneInput.value;
  /* custom country picker (themed list over the hidden select) */
  const ccBtn = form.querySelector('[data-cc-btn]');
  const ccPanel = form.querySelector('[data-cc-panel]');
  const ccSearch = form.querySelector('[data-cc-search]');
  const ccList = form.querySelector('[data-cc-list]');
  const ccFlag = form.querySelector('[data-cc-flag]');
  const flagOf = iso => iso.replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
  const ccItems = [...ccSelect.options].map(o => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option'); li.tabIndex = -1; li.dataset.value = o.value;
    li.innerHTML = `<span class="cc__flag">${flagOf(o.dataset.iso)}</span><span class="cc__name">${o.textContent}</span><span class="cc__code">+${o.value}</span>`;
    li.addEventListener('click', () => pickCc(o.value));
    ccList.append(li);
    return { li, value: o.value, text: (o.textContent + ' ' + o.value + ' +' + o.value).toLowerCase(), iso: o.dataset.iso };
  });
  const markCc = () => ccItems.forEach(it => it.li.setAttribute('aria-selected', String(it.value === ccSelect.value)));
  function openCc() {
    if (ccSelect.disabled) return;
    ccPanel.hidden = false; ccBtn.setAttribute('aria-expanded', 'true');
    ccSearch.value = ''; ccItems.forEach(it => { it.li.hidden = false; });
    markCc(); ccSearch.focus();
    const cur = ccItems.find(it => it.value === ccSelect.value); if (cur) cur.li.scrollIntoView({ block: 'nearest' });
  }
  function closeCc() { ccPanel.hidden = true; ccBtn.setAttribute('aria-expanded', 'false'); }
  function pickCc(v) {
    ccSelect.value = v; ccSelect.dispatchEvent(new Event('change'));
    const it = ccItems.find(x => x.value === v); if (it) ccFlag.textContent = flagOf(it.iso);
    closeCc(); phoneInput.focus();
  }
  ccBtn.addEventListener('click', () => (ccPanel.hidden ? openCc() : closeCc()));
  ccSearch.addEventListener('input', () => {
    const q = ccSearch.value.trim().toLowerCase().replace(/^\+/, '');
    ccItems.forEach(it => { it.li.hidden = q && !it.text.includes(q); });
  });
  ccSearch.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCc(); ccBtn.focus(); }
    if (e.key === 'Enter') { e.preventDefault(); const first = ccItems.find(it => !it.li.hidden); if (first) pickCc(first.value); }
  });
  document.addEventListener('click', e => { if (!ccPanel.hidden && !e.target.closest('[data-cc-picker]')) closeCc(); });

  ccSelect.addEventListener('change', () => {
    ccShow.textContent = '+' + cc();
    phoneErr.textContent = cc() === '91' ? 'Please enter a valid 10-digit mobile number.' : 'Please enter a valid mobile number, without the country code.';
    phoneInput.maxLength = cc() === '91' ? 10 : 12;
    if (otpToken.value || !otpBox.hidden) resetOtp();
  });
  const otpCall = async params => {
    try {
      const r = await fetch(OTP_URL, { method: 'POST', body: new URLSearchParams(params) });
      return await r.json();
    } catch { return { ok: false, error: 'Could not reach the server. Please check your connection and try again.' }; }
  };
  function resetOtp() {
    otpToken.value = ''; otpBox.hidden = true; otpCode.value = '';
    phoneField.classList.remove('is-verified'); phoneInput.readOnly = false; ccSelect.disabled = false; ccBtn.disabled = false;
    otpSend.textContent = 'Send code'; otpSend.disabled = false;
    clearInterval(cooldown); say('');
  }
  function startCooldown() {
    let left = 30; otpSend.disabled = true; otpSend.textContent = 'Resend in 30s';
    clearInterval(cooldown);
    cooldown = setInterval(() => {
      left -= 1;
      if (left <= 0) { clearInterval(cooldown); otpSend.disabled = false; otpSend.textContent = 'Resend code'; }
      else otpSend.textContent = 'Resend in ' + left + 's';
    }, 1000);
  }
  phoneInput.addEventListener('input', () => {
    let clean = phoneInput.value.replace(/\D/g, '');
    if (cc() !== '91') clean = clean.replace(/^0+/, '');
    clean = clean.slice(0, cc() === '91' ? 10 : 12);
    if (clean !== phoneInput.value) phoneInput.value = clean;
    if (otpToken.value || !otpBox.hidden) resetOtp();
  });
  otpSend.addEventListener('click', async () => {
    if (phoneField.classList.contains('is-verified')) { resetOtp(); phoneInput.focus(); return; }
    const v = phoneInput.value;
    if (!phoneOk(v)) { phoneField.classList.add('is-invalid'); say(''); phoneInput.focus(); return; }
    phoneField.classList.remove('is-invalid');
    otpSend.disabled = true; otpSend.textContent = 'Sending…'; say('');
    const res = await otpCall({ action: 'send', phone: fullPhone() });
    if (res.ok) {
      otpBox.hidden = false; otpCode.focus();
      say('We sent a 6-digit code to +' + cc() + ' ' + v + ' on WhatsApp.', '');
      startCooldown();
    } else {
      otpSend.disabled = false; otpSend.textContent = 'Send code';
      say(res.error || 'Could not send the code. Please try again.', 'bad');
    }
  });
  async function verifyOtp() {
    const code = otpCode.value.replace(/\D/g, '');
    if (code.length !== 6) { say('Please enter the 6-digit code from WhatsApp.', 'bad'); return; }
    otpVerify.disabled = true; otpVerify.textContent = 'Checking…';
    const res = await otpCall({ action: 'verify', phone: fullPhone(), code });
    otpVerify.disabled = false; otpVerify.textContent = 'Verify';
    if (res.ok && res.token) {
      otpToken.value = res.token; otpBox.hidden = true;
      phoneField.classList.add('is-verified'); phoneInput.readOnly = true; ccSelect.disabled = true; ccBtn.disabled = true;
      clearInterval(cooldown); otpSend.disabled = false; otpSend.textContent = 'Change';
      say('✓ WhatsApp number verified', 'ok');
    } else {
      say(res.error || 'Wrong code. Please try again.', 'bad');
    }
  }
  otpVerify.addEventListener('click', verifyOtp);
  otpCode.addEventListener('input', () => { otpCode.value = otpCode.value.replace(/\D/g, '').slice(0, 6); });
  otpCode.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); verifyOtp(); } });

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
    if (!first && stepEl.contains(otpToken) && !otpToken.value) {
      if (!phoneField.classList.contains('is-invalid')) say('Please verify your WhatsApp number to continue.', 'bad');
      (otpBox.hidden ? otpSend : otpCode).focus();
      return false;
    }
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
    const hasOpen = !!OPEN && list.includes(OPEN);
    dates.replaceChildren(...list.map(d => {
      if (d === OPEN) {
        const label = document.createElement('label');
        label.className = 'choice';
        label.innerHTML = `<input type="radio" name="webinar_date" value="${d}, 4 PM to 5 PM IST" required checked><span>${d}</span>`;
        return label;
      }
      const closed = CLOSED.includes(d);
      const row = document.createElement('div');
      row.className = 'choice--planned' + (closed ? ' is-closed' : '');
      row.setAttribute('aria-disabled', 'true');
      row.innerHTML = closed ? `<span>${d}</span><em class="date-tag date-tag--closed">Closed</em>` : `<span>${d}</span><em class="date-tag">Planned</em>`;
      return row;
    }));
    if (!hasOpen && list.length) {
      // Nothing bookable yet: keep the interest, tell them we will message once registration opens.
      const keep = document.createElement('input');
      keep.type = 'hidden'; keep.name = 'webinar_date'; keep.value = list.find(d => !CLOSED.includes(d)) || list[0];
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
    data.set('contact_number', '+' + fullPhone());
    data.delete('country_code');
    const picked = (data.get('webinar_date') || '').replace(', 4 PM to 5 PM IST', '');
    submit.disabled = true; status.textContent = 'Registering you…';
    let res = null;
    try {
      const r = await fetch(endpoint, { method: 'POST', body: data });
      res = await r.json();
    } catch {
      // n8n unreachable: still save the lead to the sheet so nobody is lost.
      try {
        await fetch(fallback, { method: 'POST', mode: 'no-cors', body: data });
        done(null, picked);
      } catch {
        status.textContent = 'Could not send. Please check your connection and try again.';
      }
      submit.disabled = false;
      return;
    }
    if (res && res.ok) {
      done(res, picked);
    } else if (res && res.error === 'verify') {
      resetOtp(); show(0);
      say('Please verify your WhatsApp number again to continue.', 'bad');
    } else {
      status.textContent = 'Please check your details and try again.';
    }
    submit.disabled = false;
  });

  show(0);
})();
