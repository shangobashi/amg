"""
Fix all contact CTAs to redirect to mailto:afriplansolar@yahoo.fr

CTAs to change (href from contact.html -> mailto:):
  - Navbar "Request Access" buttons: every page, class="btn btn--secondary btn--sm"
  - Hero "Request Data Room Access" on index.html
  - Hero "Contact Us" on opportunities.html, responsible-sourcing.html
  - Mineral page "Request Data Room Access" on beryllium.html, tungsten.html
  - Mineral page "Register Interest" links on gold.html, lithium.html
  - privacy.html inline "contact form" text link

NOT changed (page nav links, not CTAs):
  - Nav links to contact.html (navbar nav__link items)
  - Footer links to contact.html
  - Footer links to data-room.html
  - "Request Data Room Access" buttons that go to data-room.html

Also fix contact.html form submit to redirect to mailto via app.js.
"""

import re
import os

MAILTO = "mailto:afriplansolar@yahoo.fr"
WEBSITE_DIR = "C:/Users/Shango/Documents/Code/bisimwamines/website"

# Files and their specific changes
# Format: (filename, [(old_href, new_href, description), ...])

CHANGES = {
    "index.html": [
        # Navbar Request Access CTA button (line ~34, class "btn btn--secondary btn--sm")
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
        # Hero CTA "Request Data Room Access" (line ~295)
        ('<a href="contact.html" class="btn btn--primary" data-i18n="trans.cta">Request Data Room Access</a>',
         f'<a href="{MAILTO}" class="btn btn--primary" data-i18n="trans.cta">Request Data Room Access</a>',
         "Hero CTA Request Data Room Access"),
    ],
    "opportunities.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
        # Hero "Contact Us" ghost button
        ('<a href="contact.html" class="btn btn--ghost btn--lg" data-i18n="opp.cta.contact">Contact Us</a>',
         f'<a href="{MAILTO}" class="btn btn--ghost btn--lg" data-i18n="opp.cta.contact">Contact Us</a>',
         "Hero Contact Us button"),
    ],
    "responsible-sourcing.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
        # Hero "Contact Us" ghost button
        ('<a href="contact.html" class="btn btn--ghost btn--lg" data-i18n="rs.cta.btn-contact">Contact Us</a>',
         f'<a href="{MAILTO}" class="btn btn--ghost btn--lg" data-i18n="rs.cta.btn-contact">Contact Us</a>',
         "Hero Contact Us button"),
    ],
    "contact.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
    ],
    "data-room.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
    ],
    "privacy.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
        # Inline contact form text link
        ('<a href="contact.html" style="color: var(--accent);">contact form</a>',
         f'<a href="{MAILTO}" style="color: var(--accent);">contact form</a>',
         "Inline contact form text link"),
    ],
    "beryllium.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
        # CTA "Request Data Room Access" for Be
        ('<a href="contact.html?mineral=beryllium" class="btn btn--primary btn--lg" data-i18n="be.cta1">Request Data Room Access</a>',
         f'<a href="{MAILTO}?subject=Afriplan%20Beryllium%20Data%20Room%20Request" class="btn btn--primary btn--lg" data-i18n="be.cta1">Request Data Room Access</a>',
         "Beryllium Request Data Room Access"),
    ],
    "tungsten.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
        # CTA "Request Data Room Access" for W
        ('<a href="contact.html?mineral=tungsten" class="btn btn--primary btn--lg" data-i18n="w.cta1">Request Data Room Access</a>',
         f'<a href="{MAILTO}?subject=Afriplan%20Tungsten%20Data%20Room%20Request" class="btn btn--primary btn--lg" data-i18n="w.cta1">Request Data Room Access</a>',
         "Tungsten Request Data Room Access"),
        # CTA "Request Offtake Discussion" for W
        ('<a href="contact.html?mineral=tungsten&type=offtake" class="btn btn--secondary btn--lg" data-i18n="w.cta2">Request Offtake Discussion</a>',
         f'<a href="{MAILTO}?subject=Afriplan%20Tungsten%20Offtake%20Discussion" class="btn btn--secondary btn--lg" data-i18n="w.cta2">Request Offtake Discussion</a>',
         "Tungsten Request Offtake Discussion"),
    ],
    "gold.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
        # CTA "Register Interest for Gold"
        ('<a href="contact.html?mineral=gold" class="btn btn--primary btn--lg" data-i18n="au.cta.button.interested">Register Interest for Gold</a>',
         f'<a href="{MAILTO}?subject=Afriplan%20Gold%20Interest" class="btn btn--primary btn--lg" data-i18n="au.cta.button.interested">Register Interest for Gold</a>',
         "Gold Register Interest"),
    ],
    "lithium.html": [
        # Navbar Request Access CTA
        ('href="contact.html" class="btn btn--secondary btn--sm"',
         f'href="{MAILTO}" class="btn btn--secondary btn--sm"',
         "Navbar Request Access button"),
        # CTA "Register Interest" for Li
        ('<a href="contact.html?mineral=lithium" class="btn btn--primary btn--lg" data-i18n="li.cta2">Register Interest</a>',
         f'<a href="{MAILTO}?subject=Afriplan%20Lithium%20Interest" class="btn btn--primary btn--lg" data-i18n="li.cta2">Register Interest</a>',
         "Lithium Register Interest"),
    ],
}


def process_file(filepath, changes):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    report = []

    for old_str, new_str, description in changes:
        if old_str in content:
            content = content.replace(old_str, new_str)
            report.append(f"  CHANGED: {description}")
            # Verify the new string is there
            if new_str not in content:
                print(f"  ERROR: replacement failed for {description}")
        else:
            # Try more flexible matching
            print(f"  WARNING: exact match not found for: {old_str[:80]}")
            # Try partial matching based on href pattern
            partial_pattern = old_str.split('href="')[1].split('"')[0] if 'href="' in old_str else None
            if partial_pattern:
                print(f"  Trying to find href containing: {partial_pattern}")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  WROTE: {filepath}")
    else:
        print(f"  NO CHANGE: {filepath}")

    return report


def fix_app_js(filepath):
    """Fix the contact form submit handler to redirect to mailto."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Replace the fake submit handler with mailto redirect
    old_handler = """  form.addEventListener('submit', e => {
    e.preventDefault()
    const btn = form.querySelector('button[type="submit"]')
    const original = btn.textContent
    btn.disabled = true
    btn.textContent = 'Sending...'

    // Simulate submission (replace with real HubSpot/api call)
    setTimeout(() => {
      form.style.display = 'none'
      const success = document.getElementById('contactSuccess')
      if (success) {
        success.style.display = 'block'
        success.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 1200)
  })"""

    new_handler = """  form.addEventListener('submit', e => {
    e.preventDefault()
    const btn = form.querySelector('button[type="submit"]')
    const original = btn.textContent
    btn.disabled = true
    btn.textContent = 'Redirecting...'
    window.location.href = 'mailto:afriplansolar@yahoo.fr?subject=Afriplan%20Contact%20Form&body=' + encodeURIComponent('Name: ' + (document.getElementById('contactName')?.value || '') + '\\nCompany: ' + (document.getElementById('contactCompany')?.value || '') + '\\nCountry: ' + (document.getElementById('contactCountry')?.value || '') + '\\n\\nMessage:\\n' + (document.getElementById('contactMessage')?.value || ''))
  })"""

    if old_handler in content:
        content = content.replace(old_handler, new_handler)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  WROTE: {filepath} (contact form submit handler updated)")
        return ["  CHANGED: contact.html form submit handler -> mailto redirect"]
    else:
        print(f"  WARNING: could not find exact form handler in app.js")
        print(f"  Checking for submit handler pattern...")
        # Try partial match
        if "Simulate submission" in content:
            print(f"  Found 'Simulate submission' comment - handler structure may differ")
        if "contactForm" in content:
            print(f"  Found 'contactForm' reference in app.js")
        return []


def main():
    print("=" * 60)
    print("CTA EMAIL REDIRECT PASS")
    print("Target: mailto:afriplansolar@yahoo.fr")
    print("=" * 60)

    total_changes = 0

    # Process HTML files
    for filename, changes in CHANGES.items():
        filepath = os.path.join(WEBSITE_DIR, filename)
        print(f"\n--- {filename} ---")
        report = process_file(filepath, changes)
        total_changes += len(report)
        for r in report:
            print(r)

    # Fix app.js form handler
    print(f"\n--- app.js (contact form) ---")
    app_changes = fix_app_js(os.path.join(WEBSITE_DIR, "app.js"))
    total_changes += len(app_changes)
    for c in app_changes:
        print(c)

    print(f"\n{'=' * 60}")
    print(f"DONE. Total items changed: {total_changes}")
    print(f"MAILTO: {MAILTO}")


if __name__ == "__main__":
    main()
