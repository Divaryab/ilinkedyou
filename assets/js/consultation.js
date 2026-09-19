(() => {
  'use strict';

  const form = document.querySelector('#consultation-form');
  if (!form) return;

  const locale = form.dataset.locale === 'en' ? 'en' : 'fa';
  const endpoint = form.dataset.endpoint;
  const steps = [...form.querySelectorAll('[data-step]')];
  const progress = [...document.querySelectorAll('.consultation-progress li')];
  const next = form.querySelector('[data-next]');
  const back = form.querySelector('[data-back]');
  const submit = form.querySelector('[data-submit]');
  const error = form.querySelector('[data-error]');
  const contact = form.elements.contact;
  const copy = locale === 'en' ? {
    emailLabel: 'Email address', telegramLabel: 'Telegram username', phoneLabel: 'Phone number with country code', whatsappLabel: 'WhatsApp number with country code',
    emailHint: 'I will reply to this address.', telegramHint: 'Enter your username, for example @username.', phoneHint: 'Use + and the country code, for example +995…',
    invalidPhone: 'Enter a valid number with + and country code.', invalidTelegram: 'Use letters, numbers, or underscores for your Telegram username.',
    securityError: 'Security verification failed. Please try again or message me on WhatsApp.', unavailable: 'Online submission is temporarily unavailable. Your answers are kept; please try again or message me on WhatsApp.',
    securityRequired: 'Please complete the security check before submitting.', sending: 'Sending…', submit: 'Submit consultation request', submitted: 'Your request has been submitted',
    successMessage: 'I will review it and contact you within 24 hours through the method below:', edit: 'Edit', whatsapp: 'WhatsApp', phone: 'Phone', telegram: 'Telegram', email: 'Email',
    confirmationError: 'Submission could not be confirmed. Your answers are kept; please submit again or message me on WhatsApp.', verificationExpired: 'The security check expired. Please complete it again and resubmit.',
  } : {
    emailLabel: 'آدرس ایمیل', telegramLabel: 'نام کاربری تلگرام', phoneLabel: 'شماره تلفن با کد کشور', whatsappLabel: 'شماره واتساپ با کد کشور',
    emailHint: 'پاسخ را به همین آدرس ارسال می‌کنم.', telegramHint: 'نام کاربری حساب خودتان را وارد کنید؛ مثلاً @username.', phoneHint: 'شماره را با + و کد کشور وارد کنید؛ مثلاً +995…',
    invalidPhone: 'شماره را با + و کد کشور وارد کنید.', invalidTelegram: 'نام کاربری تلگرام را با حروف انگلیسی، عدد یا زیرخط وارد کنید.',
    securityError: 'بررسی امنیتی انجام نشد. دوباره تلاش کنید یا در واتساپ پیام بدهید.', unavailable: 'ثبت آنلاین فعلاً در دسترس نیست. پاسخ‌ها حفظ شده‌اند؛ دوباره تلاش کنید یا در واتساپ پیام بدهید.',
    securityRequired: 'لطفاً بررسی امنیتی را تکمیل کنید و دوباره ارسال کنید.', sending: 'در حال ارسال…', submit: 'ارسال درخواست مشاوره', submitted: 'درخواست شما ثبت شد',
    successMessage: 'بررسی می‌کنم و حداکثر طی ۲۴ ساعت از طریق زیر با شما در تماس خواهم بود:', edit: 'ویرایش', whatsapp: 'واتساپ', phone: 'تماس تلفنی', telegram: 'تلگرام', email: 'ایمیل',
    confirmationError: 'تأیید ثبت دریافت نشد. پاسخ‌ها حفظ شده‌اند؛ دوباره ارسال کنید یا در واتساپ پیام بدهید.', verificationExpired: 'بررسی امنیتی منقضی شده است. آن را تکمیل کنید و دوباره ارسال کنید.',
  };

  let step = 0, busy = false, token = '', widget, setup;
  const requestId = crypto.randomUUID();
  const editKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  let submitted = false;
  const message = text => { error.textContent = text; error.hidden = !text; };
  const normalizeDigits = value => value.replace(/[۰-۹٠-٩]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 1776 : 1632)));
  const value = name => form.elements[name]?.value || '';
  const methodLabel = method => copy[method] || method;

  function conditional() {
    const method = value('contact_method');
    const email = method === 'email', telegram = method === 'telegram';
    contact.type = email ? 'email' : telegram ? 'text' : 'tel';
    contact.autocomplete = email ? 'email' : telegram ? 'off' : 'tel';
    contact.placeholder = email ? 'name@example.com' : telegram ? '@username' : '+995 5XX XXX XXX';
    form.querySelector('[data-contact-label]').textContent = email ? copy.emailLabel : telegram ? copy.telegramLabel : method === 'phone' ? copy.phoneLabel : copy.whatsappLabel;
    form.querySelector('[data-contact-hint]').textContent = email ? copy.emailHint : telegram ? copy.telegramHint : copy.phoneHint;
    contact.setCustomValidity('');
  }

  function validate() {
    if (step === 1) {
      contact.value = normalizeDigits(contact.value.trim());
      if (['whatsapp', 'phone'].includes(value('contact_method'))) {
        contact.setCustomValidity(/^\+[1-9]\d{7,14}$/.test(contact.value.replace(/[\s()-]/g, '')) ? '' : copy.invalidPhone);
      }
      if (value('contact_method') === 'telegram') contact.setCustomValidity(/^@?[A-Za-z0-9_]{1,32}$/.test(contact.value) ? '' : copy.invalidTelegram);
      form.elements.full_name.value = form.elements.full_name.value.trim();
    }
    const invalid = [...steps[step].querySelectorAll('input, select, textarea')].find(input => !input.disabled && !input.checkValidity());
    if (invalid) { invalid.reportValidity(); return false; }
    return true;
  }

  function show(index, focus = true) {
    step = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((el, i) => { el.hidden = i !== step; });
    progress.forEach((el, i) => { if (i === step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
    back.hidden = submitted || step === 0; next.hidden = step === steps.length - 1; submit.hidden = step !== steps.length - 1;
    message('');
    if (step === steps.length - 1) setupVerification();
    if (focus) steps[step].querySelector('h3')?.focus();
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
          sitekey: config.siteKey, action: 'consultation', language: locale, size: 'flexible',
          callback: result => { token = result; message(''); },
          'expired-callback': () => { token = ''; },
          'error-callback': () => { token = ''; message(copy.securityError); },
        });
        return true;
      } catch { setup = null; message(copy.unavailable); return false; }
    })();
    return setup;
  }

  function tracking() {
    const params = new URLSearchParams(window.location.search);
    return {
      lead_source: 'website', landing_page: locale, referrer: document.referrer.slice(0, 2048) || null,
      ...Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map(key => [key, params.get(key)?.slice(0, 200) || null])),
    };
  }

  function showSuccess(payload) {
    form.hidden = true; document.querySelector('.consultation-progress').hidden = true;
    const success = document.querySelector('[data-success]'); success.hidden = false;
    success.querySelector('[data-success-title]').textContent = copy.submitted;
    success.querySelector('[data-success-message]').textContent = copy.successMessage;
    success.querySelector('[data-contact-method]').textContent = methodLabel(payload.contact_method);
    success.querySelector('[data-contact-value]').textContent = payload.contact;
    success.querySelector('[data-reference]').textContent = `ILY-${requestId.replace(/-/g, '').slice(-6).toUpperCase()}`;
    success.querySelector('[data-edit]').textContent = copy.edit;
    const whatsapp = success.querySelector('[data-whatsapp]');
    whatsapp.hidden = payload.contact_method !== 'whatsapp';
    whatsapp.href = 'https://wa.me/995598088750?text=' + encodeURIComponent(`Hello Ali, I submitted a consultation request on iLinkedYou.\nName: ${payload.full_name}\nContact: ${payload.contact}\nReference: ILY-${requestId.replace(/-/g, '').slice(-6).toUpperCase()}`);
    success.querySelector('h3').focus();
  }

  form.addEventListener('input', () => contact.setCustomValidity(''));
  form.addEventListener('change', conditional);
  next.addEventListener('click', () => { if (validate()) show(step + 1); });
  back.addEventListener('click', () => { if (!busy) show(step - 1); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !validate()) return;
    if (step === 0) { show(1); return; }
    busy = true;
    if (!await setupVerification()) { busy = false; return; }
    if (!token) { busy = false; message(copy.securityRequired); return; }
    busy = true; submit.disabled = true; back.disabled = true; submit.textContent = copy.sending; message('');
    const data = Object.fromEntries(new FormData(form));
    const payload = { id: requestId, edit_key: editKey, locale, goal: data.goal, timeline: data.timeline, budget: data.budget,
      payment: data.payment, deposit: null, full_name: data.full_name, contact_method: data.contact_method,
      contact: data.contact, notes: data.notes || '', consent: form.elements.consent.checked, website: data.website, token, ...tracking() };
    try {
      const response = await fetch(endpoint, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || result.id !== requestId) throw new Error(result.error || 'unavailable');
      submitted = true;
      showSuccess(payload);
    } catch (e) {
      message(e.message === 'verification' ? copy.verificationExpired : copy.confirmationError);
      token = ''; if (widget !== undefined) window.turnstile.reset(widget);
    } finally { busy = false; submit.disabled = false; back.disabled = false; submit.textContent = copy.submit; }
  });
  document.querySelector('[data-edit]')?.addEventListener('click', () => {
    document.querySelector('[data-success]').hidden = true;
    document.querySelector('.consultation-progress').hidden = false;
    form.hidden = false; show(1);
    if (widget !== undefined) { token = ''; window.turnstile.reset(widget); }
  });
  form.noValidate = true;
  form.hidden = false;
  conditional(); show(0, false);
})();
