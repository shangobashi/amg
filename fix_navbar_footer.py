#!/usr/bin/env python3
"""Propagate landing page navbar/footer to all internal pages + fix brand text."""

import re
import os

# ─── Page → active nav link mapping ───────────────────────────────────────────
ACTIVE_MAP = {
    'index.html':                'index.html',
    'opportunities.html':       'opportunities.html',
    'responsible-sourcing.html': 'responsible-sourcing.html',
    'data-room.html':           'data-room.html',
    'contact.html':             'contact.html',
    'beryllium.html':           'opportunities.html',
    'tungsten.html':            'opportunities.html',
    'gold.html':                'opportunities.html',
    'lithium.html':             'opportunities.html',
    'privacy.html':             'contact.html',
}

NAV_LINKS = [
    ('index.html',                'nav.overview',              'Overview'),
    ('opportunities.html',       'nav.opportunities',        'Opportunities'),
    ('responsible-sourcing.html', 'nav.responsible-sourcing', 'Responsible Sourcing'),
    ('data-room.html',           'nav.data-room',           'Data Room'),
    ('contact.html',             'nav.contact',             'Contact'),
]

def make_nav_html(filename):
    """Build nav HTML string with active class on the correct link."""
    active_href = ACTIVE_MAP.get(filename, 'index.html')
    links = []
    for href, i18n_key, label in NAV_LINKS:
        cls = 'nav__link active' if href == active_href else 'nav__link'
        links.append('        <li><a href="%s" class="%s" data-i18n="%s">%s</a></li>' % (href, cls, i18n_key, label))

    links_str = '\n'.join(links)
    nav = '''<nav class="nav">
  <div class="container">
    <div class="nav__inner">
      <a href="index.html" class="nav__brand" aria-label="Afriplan Global Solution home">
        <img class="nav__brand-symbol" src="assets/brand/afriplan-global-symbol-256.png" alt="" aria-hidden="true">
        <img class="nav__brand-wordmark" src="assets/brand/afriplan-global-wordmark.png" alt="Afriplan Global Solution">
      </a>
      <ul class="nav__links">
%s
      </ul>
      <div class="nav__controls">
        <div class="lang-toggle" role="group" aria-label="Language / Langue">
          <button class="lang-toggle__btn" data-lang="en">EN</button>
          <button class="lang-toggle__btn" data-lang="fr">FR</button>
        </div>
        <div class="nav__cta">
          <a href="contact.html" class="btn btn--secondary btn--sm" data-i18n="nav.request-access">Request Access</a>
        </div>
      </div>
      <button class="nav__mobile-toggle" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>
''' % links_str
    return nav

FOOTER_TEMPLATE = '''<footer class="footer reveal-fade-up">
  <div class="container">
    <div class="footer__inner">
      <div class="footer__brand">
        <img class="footer__brand-symbol" src="assets/brand/afriplan-global-footer-symbol.png" alt="" aria-hidden="true">
        <div class="footer__brand-text">
          <strong>Afriplan Global Solution</strong>
          <div class="footer__brand-desc">
            DRC multi-mineral asset. Four critical minerals at varying stages of verification.
            Lab-confirmed assays, field indications, and responsible sourcing documentation
            available for qualified offtake and JV partners.
          </div>
        </div>
      </div>

      <div class="footer__links">
        <div class="footer__links-group">
          <div class="footer__links-group-title">Portfolio</div>
          <a href="beryllium.html" class="footer__link">Beryllium</a>
          <a href="tungsten.html" class="footer__link">Tungsten</a>
          <a href="gold.html" class="footer__link">Gold</a>
          <a href="lithium.html" class="footer__link">Lithium</a>
        </div>
        <div class="footer__links-group">
          <div class="footer__links-group-title">Company</div>
          <a href="index.html" class="footer__link">Overview</a>
          <a href="opportunities.html" class="footer__link">Opportunities</a>
          <a href="responsible-sourcing.html" class="footer__link">Responsible Sourcing</a>
          <a href="data-room.html" class="footer__link">Data Room</a>
          <a href="contact.html" class="footer__link">Contact</a>
        </div>
        <div class="footer__links-group">
          <div class="footer__links-group-title">Legal</div>
          <a href="privacy.html" class="footer__link">Privacy Policy</a>
        </div>
      </div>
    </div>
    <div class="footer__bottom">
      <p>&copy; 2026 Afriplan Global Solution. All rights reserved.</p>
    </div>
  </div>
</footer>
'''

PAGE_TITLES = {
    'index.html':                'Afriplan Global Solution — DRC Multi-Mineral Asset',
    'opportunities.html':        'Opportunities — Afriplan Global Solution',
    'responsible-sourcing.html': 'Responsible Sourcing — Afriplan Global Solution',
    'data-room.html':           'Data Room — Afriplan Global Solution',
    'contact.html':             'Contact — Afriplan Global Solution',
    'beryllium.html':           'Beryllium — Afriplan Global Solution',
    'tungsten.html':            'Tungsten — Afriplan Global Solution',
    'gold.html':                'Gold — Afriplan Global Solution',
    'lithium.html':             'Lithium — Afriplan Global Solution',
    'privacy.html':             'Privacy Policy — Afriplan Global Solution',
}

def replace_nav(html, new_nav):
    """Replace the old nav with new nav, handling various old nav structures."""
    # Pattern: find <nav ...> ... </nav> block
    # The old nav can have various structures (nav__logo, BM text, etc.)
    # We find the first <nav and replace through its closing </nav>
    start = html.find('<nav')
    if start == -1:
        return html
    # Find the end: first </nav> after start
    end = html.find('</nav>', start)
    if end == -1:
        return html
    end += len('</nav>')
    return html[:start] + new_nav + html[end:]

def replace_footer(html, new_footer):
    """Replace the old footer with new footer."""
    start = html.find('<footer')
    if start == -1:
        return html
    end = html.find('</footer>', start)
    if end == -1:
        return html
    end += len('</footer>')
    return html[:start] + new_footer + html[end:]

def fix_title(html, filename):
    """Update page title."""
    new_title = PAGE_TITLES.get(filename)
    if not new_title:
        return html
    return re.sub(r'<title>[^<]*</title>', '<title>%s</title>' % new_title, html)

def fix_brand_text(html):
    """Fix visible brand text: Afriplan → Afriplan Global Solution.
    Only replaces text content, not attribute values.
    Skips copyright line since FOOTER_TEMPLATE already has correct text."""
    # Replace visible text Afriplan (not in src/href/title attributes)
    # Use negative lookbehind/ahead to avoid matching inside tags
    replacements = [
        # Match >Afriplan< (text node content between tags) but NOT the copyright
        # The copyright has >Afriplan Global Solution< so it won't match
        (r'(?<=>)Afriplan(?!\s+Global Solution)(?=[\s<])', 'Afriplan Global Solution'),
    ]
    for pattern, replacement in replacements:
        html = re.sub(pattern, replacement, html)
    return html

# ─── Process pages ──────────────────────────────────────────────────────────────
INTERNAL_PAGES = [
    'opportunities.html', 'responsible-sourcing.html', 'data-room.html',
    'contact.html', 'beryllium.html', 'tungsten.html', 'gold.html',
    'lithium.html', 'privacy.html'
]

print('Processing internal pages...')
for filename in INTERNAL_PAGES:
    if not os.path.exists(filename):
        print('  SKIP (not found): %s' % filename)
        continue

    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    original = html

    new_nav = make_nav_html(filename)
    html = replace_nav(html, new_nav)
    html = replace_footer(html, FOOTER_TEMPLATE)
    html = fix_title(html, filename)
    html = fix_brand_text(html)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)

    changed = html != original
    print('  %s: %s' % ('UPDATED' if changed else 'UNCHANGED', filename))

print('Done.')
