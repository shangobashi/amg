"""Add data-i18n to remaining footer company links in all pages."""

import re

pages = ["opportunities.html", "responsible-sourcing.html", "data-room.html",
         "beryllium.html", "tungsten.html", "gold.html", "lithium.html", "privacy.html"]

for page in pages:
    try:
        with open(page, "r", encoding="utf-8") as f:
            html = f.read()

        original = html

        # Fix Overview link in footer
        html = re.sub(
            r'<a href="index\.html" class="footer__link">Overview</a>',
            '<a href="index.html" class="footer__link" data-i18n="nav.overview">Overview</a>',
            html
        )

        # Fix Opportunities link in footer
        html = re.sub(
            r'<a href="opportunities\.html" class="footer__link">Opportunities</a>',
            '<a href="opportunities.html" class="footer__link" data-i18n="nav.opportunities">Opportunities</a>',
            html
        )

        if html != original:
            with open(page, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  {page}: fixed")
        else:
            print(f"  {page}: no changes")
    except Exception as e:
        print(f"  {page}: ERROR - {e}")

print("\nDone.")
