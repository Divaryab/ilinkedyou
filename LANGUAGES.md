# Adding another language to iLinkedYou

The site is currently configured for English (`/`) and Persian (`/fa/`).

To add another language, for example Russian:

1. Copy an existing language page to `/ru/index.html` and translate/adapt its content.
2. Set the HTML attributes: `<html lang="ru" dir="ltr">`.
3. Set the language switcher marker to `data-current-language="ru"`.
4. Add the language to `LANGUAGES` near the top of `assets/js/site.js`:
   `{ code: 'ru', label: 'Русский', path: '/ru/' },`
5. Add the corresponding `hreflang` link to each language page for SEO.

Direction:
- LTR: English, Russian, Turkish, Georgian, etc.
- RTL: Persian, Arabic, Hebrew.

The shared stylesheet uses logical CSS properties, so the same layout supports both LTR and RTL pages. The language dropdown is also shared and becomes a full-width touch-friendly control inside the mobile navigation.
