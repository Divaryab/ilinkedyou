(() => {
  'use strict';

  /*
   * Add future languages here when their pages are ready.
   * Examples for later:
   * { code: 'ru', label: 'Русский', path: '/ru/' }
   * { code: 'tr', label: 'Türkçe', path: '/tr/' }
   * { code: 'ar', label: 'العربية', path: '/ar/' }
   * { code: 'he', label: 'עברית', path: '/he/' }
   * The header dropdown on every language page is generated from this list.
   */
  const LANGUAGES = [
    { code: 'en', label: 'English', path: '/' },
    { code: 'fa', label: 'فارسی', path: '/fa/' },
  ];

  const button = document.querySelector('.menu-button');
  const navigation = document.querySelector('#navigation');

  const closeMainMenu = () => {
    if (!button || !navigation) return;
    button.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  };

  if (button && navigation) {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      navigation.classList.toggle('open', open);
    });

    navigation.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (link && !link.closest('.language-switcher')) closeMainMenu();
    });
  }

  const globeIcon = `
    <svg class="language-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/>
      <path d="M3.5 12h17M12 3c2.1 2.45 3.2 5.45 3.2 9S14.1 18.55 12 21M12 3C9.9 5.45 8.8 8.45 8.8 12S9.9 18.55 12 21" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    </svg>`;

  document.querySelectorAll('[data-language-switcher]').forEach(switcher => {
    const currentCode = switcher.dataset.currentLanguage || document.documentElement.lang || 'en';
    const currentLanguage = LANGUAGES.find(language => language.code === currentCode) || LANGUAGES[0];
    const menuId = `language-menu-${Math.random().toString(36).slice(2, 8)}`;

    const languageButtonLabel = currentCode === 'fa'
      ? `انتخاب زبان، زبان فعلی: ${currentLanguage.label}`
      : `Choose language, current language: ${currentLanguage.label}`;

    switcher.innerHTML = `
      <button class="language-button" type="button" aria-label="${languageButtonLabel}" aria-expanded="false" aria-controls="${menuId}" aria-haspopup="true">
        ${globeIcon}
        <span>${currentLanguage.label}</span>
        <span class="language-chevron" aria-hidden="true">▾</span>
      </button>
      <ul class="language-menu" id="${menuId}" hidden></ul>`;

    const languageButton = switcher.querySelector('.language-button');
    const languageMenu = switcher.querySelector('.language-menu');

    languageMenu.innerHTML = LANGUAGES.map(language => {
      const current = language.code === currentCode;
      const langDir = ['fa', 'ar', 'he'].includes(language.code) ? 'rtl' : 'ltr';
      return `<li><a href="${language.path}" lang="${language.code}" dir="${langDir}"${current ? ' aria-current="page"' : ''}><span>${language.label}</span>${current ? '<span class="language-check" aria-hidden="true">✓</span>' : ''}</a></li>`;
    }).join('');

    const setOpen = open => {
      languageButton.setAttribute('aria-expanded', String(open));
      languageMenu.hidden = !open;
    };

    languageButton.addEventListener('click', event => {
      event.stopPropagation();
      setOpen(languageButton.getAttribute('aria-expanded') !== 'true');
    });

    switcher.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        setOpen(false);
        languageButton.focus();
      }
    });

    document.addEventListener('click', event => {
      if (!switcher.contains(event.target)) setOpen(false);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button?.getAttribute('aria-expanded') === 'true') {
      closeMainMenu();
      button.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMainMenu();
  });
})();
