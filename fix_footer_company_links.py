"""
Fix footer Company section links to use data-i18n nav.* keys.
Also fix the "Overview" link in footer (should point to index.html).
"""

import re

pages = ["index.html", "opportunities.html", "responsible-sourcing.html",
         "data-room.html", "contact.html", "beryllium.html",
         "tungsten.html", "gold.html", "lithium.html", "privacy.html"]

for page in pages:
    try:
        with open(page, "r", encoding="utf-8") as f:
            html = f.read()

        original = html

        # Company section links — these are page nav links, use nav.* keys
        # Note: the "Overview" link in footer should point to index.html
        # and use nav.overview key

        # Fix "Overview" link (currently has wrong text and href)
        # The footer has: <a href="opportunities.html" class="footer__link">Overview</a>
        # Should be: <a href="index.html" class="footer__link" data-i18n="nav.overview">Overview</a>
        html = html.replace(
            '<a href="opportunities.html" class="footer__link">Overview</a>',
            '<a href="index.html" class="footer__link" data-i18n="nav.overview">Overview</a>'
        )

        html = html.replace(
            '<a href="responsible-sourcing.html" class="footer__link">Responsible Sourcing</a>',
            '<a href="responsible-sourcing.html" class="footer__link" data-i18n="nav.responsible-sourcing">Responsible Sourcing</a>'
        )

        html = html.replace(
            '<a href="data-room.html" class="footer__link">Data Room</a>',
            '<a href="data-room.html" class="footer__link" data-i18n="nav.data-room">Data Room</a>'
        )

        # Note: "Contact" is the same in both EN and FR
        html = html.replace(
            '<a href="contact.html" class="footer__link">Contact</a>',
            '<a href="contact.html" class="footer__link" data-i18n="nav.contact">Contact</a>'
        )

        if html != original:
            with open(page, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  {page}: footer company links fixed")
        else:
            print(f"  {page}: no changes")
    except Exception as e:
        print(f"  {page}: ERROR - {e}")

print("\nFooter company links fixed.")
