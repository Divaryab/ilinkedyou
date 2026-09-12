(() => {
  'use strict';
  const form = document.querySelector('#consultation-form');
  if (!form) return;
  const endpoint = form.dataset.endpoint;
  const steps = [...form.querySelectorAll('[data-step]')];
  const progress = [...document.querySelectorAll('.consultation-progress li')];
  const next = form.querySelector('[data-next]');
  const back = form.querySelector('[data-back]');
  const submit = form.querySelector('[data-submit]');
  const error = form.querySelector('[data-error]');
  const deposit = form.querySelector('[data-deposit]');
  const contact = form.elements.contact;
  let step = 0, busy = false, token = '', widget, setup;
  const requestId = crypto.randomUUID();
  const message = text => { error.textContent = text; error.hidden = !text; };
  const normalizeDigits = value => value.replace(/[۰-۹٠-٩]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 1776 : 1632)));
  const value = name => form.elements[name].value;
  function conditional() {
    const installments = value('payment') === 'installments';
    deposit.hidden = !installments;
    deposit.querySelectorAll('input').forEach(input => { input.disabled = !installments; input.required = installments; });
    const email = value('contact_method') === 'email';
    contact.type = email ? 'email' : 'tel';
    contact.autocomplete = email ? 'email' : 'tel';
    contact.placeholder = email ? 'name@example.com' : '+995 5XX XXX XXX';
    document.querySelector('[data-contact-label]').textContent = email ? 'آدرس ایمیل' : 'شماره واتساپ با کد کشور';
    document.querySelector('[data-contact-hint]').textContent = email ? 'پاسخ را به همین آدرس ارسال می‌کنیم.' : 'شماره را با + و کد کشور وارد کنید؛ مثلاً +995…';
    contact.setCustomValidity('');
  }
  function validate() {
    if (step === 2) {
      contact.value = normalizeDigits(contact.value.trim());
      if (value('contact_method') === 'whatsapp') {
        contact.value = contact.value.replace(/[\s()-]/g, '');
        contact.setCustomValidity(/^\+[1-9]\d{7,14}$/.test(contact.value) ? '' : 'شماره را با + و کد کشور وارد کنید.');
      }
      form.elements.full_name.value = form.elements.full_name.value.trim();
    }
    const invalid = [...steps[step].querySelectorAll('input, select, textarea')].find(input => !input.disabled && !input.checkValidity());
    if (invalid) { invalid.reportValidity(); return false; }
    return true;
  }
  function summary() {
    const entries = [['goal','هدف'],['timeline','زمان خرید'],['budget','بودجه کل'],['payment','پرداخت']];
    if (value('payment') === 'installments') entries.push(['deposit','پیش‌پرداخت']);
    const box = form.querySelector('[data-summary]'); box.replaceChildren();
    entries.forEach(([name, label]) => {
      const input = form.querySelector(`input[name="${name}"]:checked`);
      const p = document.createElement('p'); p.textContent = `${label}: ${input?.parentElement.textContent.trim() || ''}`; box.append(p);
    });
  }
  function show(index, focus = true) {
    step = index;
    steps.forEach((el, i) => { el.hidden = i !== step; });
    progress.forEach((el, i) => { if (i === step) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current'); });
    back.hidden = step === 0; next.hidden = step === 2; submit.hidden = step !== 2;
    message('');
    if (step === 2) { summary(); setupVerification(); }
    if (focus) { steps[step].querySelector('h3').focus(); }
  }
  async function setupVerification() {
    if (setup) return setup;
    setup = (async () => {
      try {
        const response = await fetch(endpoint, { credentials: 'omit', signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw new Error();
        const config = await response.json();
        if (!config.siteKey) throw new Error();
        if (!window.turnstile) await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          const timer = setTimeout(() => { script.remove(); reject(new Error()); }, 15000);
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.onload = () => { clearTimeout(timer); resolve(); };
          script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error()); };
          document.head.append(script);
        });
        widget = window.turnstile.render(form.querySelector('[data-verification]'), {
          sitekey: config.siteKey, action: 'consultation', language: 'fa', size: 'flexible',
          callback: result => { token = result; message(''); },
          'expired-callback': () => { token = ''; },
          'error-callback': () => { token = ''; message('بررسی امنیتی انجام نشد. دوباره تلاش کنید یا در واتساپ پیام بدهید.'); },
        });
        return true;
      } catch { setup = null; message('ثبت آنلاین فعلاً در دسترس نیست. پاسخ‌ها حفظ شده‌اند؛ دوباره تلاش کنید یا در واتساپ پیام بدهید.'); return false; }
    })();
    return setup;
  }
  form.addEventListener('input', () => { contact.setCustomValidity(''); });
  form.addEventListener('change', conditional);
  next.addEventListener('click', () => { if (validate()) show(step + 1); });
  back.addEventListener('click', () => { if (!busy) show(step - 1); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !validate()) return;
    if (step < 2) { show(step + 1); return; }
    if (!await setupVerification()) return;
    if (!token) { message('لطفاً بررسی امنیتی را تکمیل کنید و دوباره ارسال کنید.'); return; }
    busy = true; submit.disabled = true; back.disabled = true; submit.textContent = 'در حال ارسال…'; message('');
    const data = Object.fromEntries(new FormData(form));
    const payload = { id: requestId, locale: 'fa', goal: data.goal, timeline: data.timeline, budget: data.budget,
      payment: data.payment, deposit: data.payment === 'installments' ? data.deposit : null,
      full_name: data.full_name, contact_method: data.contact_method, contact: data.contact,
      notes: data.notes, consent: form.elements.consent.checked, website: data.website, token };
    try {
      const response = await fetch(endpoint, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || result.id !== requestId) throw new Error(result.error || 'unavailable');
      form.hidden = true; document.querySelector('.consultation-progress').hidden = true;
      const success = document.querySelector('[data-success]'); success.hidden = false;
      success.querySelector('[data-reference]').textContent = requestId;
      const lines = [...form.querySelector('[data-summary]').children].map(p => p.textContent);
      const text = `سلام علی، درخواست مشاوره خرید من در سایت ثبت شد.\nنام: ${payload.full_name}\n${lines.join('\n')}\nکد پیگیری: ${requestId}`;
      success.querySelector('a').href = 'https://wa.me/995598088750?text=' + encodeURIComponent(text);
      success.querySelector('h3').focus();
    } catch (e) {
      message(e.message === 'verification' ? 'بررسی امنیتی منقضی شده است. آن را تکمیل کنید و دوباره ارسال کنید.' : 'تأیید ثبت دریافت نشد. پاسخ‌ها حفظ شده‌اند؛ دوباره ارسال کنید یا در واتساپ پیام بدهید.');
      token = ''; if (widget !== undefined) window.turnstile.reset(widget);
    } finally { busy = false; submit.disabled = false; back.disabled = false; submit.textContent = 'ارسال درخواست مشاوره'; }
  });
  form.noValidate = true;
  form.hidden = false;
  conditional(); show(0, false);
})();
