"""
Fix footer translations: add data-i18n to footer elements and add missing FR translations.
Also add the footer__brand-desc and copyright translations.
"""

# Add missing footer FR translations
with open("i18n.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add FR footer brand-desc and copyright keys
new_footer_fr = """
      // FOOTER (additional)
      'footer.brand-desc': 'Actif polymin\u00e9ral en RDC. Quatre min\u00e9raux critiques \u00e0 diff\u00e9rents stades de v\u00e9rification. Analyses confirm\u00e9es en laboratoire, indications terrain et documentation d\u2019approvisionnement responsable disponibles pour les partenaires d\u2019achat et JV qualifi\u00e9s.',
      'footer.copyright': '\u00a9 2026 Afriplan Global Solution. Tous droits r\u00e9serv\u00e9s.',
"""

# Add EN footer brand-desc and copyright keys
new_footer_en = """
      // FOOTER (additional)
      'footer.brand-desc': 'DRC multi-mineral asset. Four critical minerals at varying stages of verification. Lab-confirmed assays, field indications, and responsible sourcing documentation available for qualified offtake and JV partners.',
      'footer.copyright': '\u00a9 2026 Afriplan Global Solution. All rights reserved.',
"""

# Insert into EN section (before "    }" closing en:)
# Find the closing of en: — it's right before "    fr: {"
if "'footer.brand-desc'" not in content.split("fr:")[0]:
    en_close = content.split("fr:")[0]
    last_key_en = [l for l in en_close.split("\n") if l.strip().startswith("'") and ":" in l][-1]
    if last_key_en:
        content = content.replace(last_key_en, last_key_en + new_footer_en)
        print("EN footer keys added")
else:
    print("EN footer keys already present")

# Insert into FR section (before closing "    }" of fr:)
# Find the footer.brand-desc position to check if already present
if "'footer.brand-desc'" not in content.split("fr:")[1]:
    # Find the last key in FR section
    fr_section = content.split("fr:")[1]
    fr_lines = [l for l in fr_section.split("\n") if l.strip().startswith("'") and ":" in l]
    if fr_lines:
        last_key_fr = fr_lines[-1]
        content = content.replace(last_key_fr, last_key_fr + new_footer_fr)
        print("FR footer keys added")
else:
    print("FR footer keys already present")

with open("i18n.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Footer translations added.")

# Now update footer HTML in all pages to use data-i18n
pages = ["index.html", "opportunities.html", "responsible-sourcing.html",
         "data-room.html", "contact.html", "beryllium.html",
         "tungsten.html", "gold.html", "lithium.html", "privacy.html"]

for page in pages:
    try:
        with open(page, "r", encoding="utf-8") as f:
            html = f.read()

        original = html

        # Footer links-group-title translations
        html = html.replace(
            '<div class="footer__links-group-title">Portfolio</div>',
            '<div class="footer__links-group-title" data-i18n="footer.minerals">Portfolio</div>'
        )
        html = html.replace(
            '<div class="footer__links-group-title">Company</div>',
            '<div class="footer__links-group-title" data-i18n="footer.company">Company</div>'
        )
        html = html.replace(
            '<div class="footer__links-group-title">Legal</div>',
            '<div class="footer__links-group-title" data-i18n="footer.legal">Legal</div>'
        )

        # Privacy Policy link
        html = html.replace(
            '<a href="privacy.html" class="footer__link">Privacy Policy</a>',
            '<a href="privacy.html" class="footer__link" data-i18n="footer.privacy">Privacy Policy</a>'
        )

        # Footer brand description
        if '<div class="footer__brand-desc">' in html:
            # Find and replace the whole div with its content
            import re
            html = re.sub(
                r'<div class="footer__brand-desc">.*?</div>',
                '<div class="footer__brand-desc" data-i18n="footer.brand-desc">DRC multi-mineral asset. Four critical minerals at varying stages of verification. Lab-confirmed assays, field indications, and responsible sourcing documentation available for qualified offtake and JV partners.</div>',
                html,
                flags=re.DOTALL
            )

        # Copyright
        if "<p>&copy; 2026 Afriplan Global Solution. All rights reserved.</p>" in html:
            html = html.replace(
                "<p>&copy; 2026 Afriplan Global Solution. All rights reserved.</p>",
                '<p data-i18n="footer.copyright">&copy; 2026 Afriplan Global Solution. All rights reserved.</p>'
            )

        if html != original:
            with open(page, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  {page}: footer patched")
        else:
            print(f"  {page}: no footer changes needed")
    except Exception as e:
        print(f"  {page}: ERROR - {e}")

print("\nFooter fix complete.")
