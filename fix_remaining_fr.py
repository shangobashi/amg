"""Fix remaining FR translation issues on index.html and add missing FR keys."""

import re

# ============================================================
# 1. Fix i18n.js: Add missing FR keys
# ============================================================
with open("i18n.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add missing FR keys after trans.cta in FR section
trans_cta_fr = "      'trans.cta': 'Demander Acc\\u00e8s \\u00e0 la Salle de Donn\\u00e9es',"
trans_portfolio_fr = "      'trans.portfolio': 'Voir Toutes les Opportunit\\u00e9s',"
cta_ready_fr = "      'cta.ready': 'Pr\\u00eat \\u00e0 aller plus loin ?',"
cta_sub_fr = "      'cta.sub': 'Package complet de documentation \\u2014 certificats d\\u2019analyses, journaux d\\u2019op\\u00e9rations, pack ESG et mod\\u00e8le financier \\u2014 disponible sous NDA.',"
footer_rights_fr = "      'footer.rights': '\\u00a9 2026 Afriplan Global Solution. Tous droits r\\u00e9serv\\u00e9s.',"
footer_classification_fr = "      'footer.classification': 'Classification D \\u2014 NDA requis \\u2014 Non destin\\u00e9 \\u00e0 une diffusion publique',"
footer_brand_desc_fr = "      'footer.brand-desc': \"Actif polymin\\u00e9ral en RDC. Quatre min\\u00e9raux critiques \\u00e0 diff\\u00e9rents stades de v\\u00e9rification. Analyses confirm\\u00e9es en laboratoire, indications terrain et documentation d'approvisionnement responsable disponibles pour les partenaires d'achat et JV qualifi\\u00e9s.\","

# Find trans.cta in FR section and add after it
marker = "      'trans.cta': 'Demander Acc\\u00e8s \\u00e0 la Salle de Donn\\u00e9es',"
new_keys = f"""{marker}
{trans_portfolio_fr}
{cta_ready_fr}
{cta_sub_fr}
{footer_rights_fr}
{footer_classification_fr}
{footer_brand_desc_fr}"""

if marker in content:
    if "'trans.portfolio': 'Voir Toutes les Opportunit\\u00e9s'," not in content:
        content = content.replace(marker, new_keys)
        with open("i18n.js", "w", encoding="utf-8") as f:
            f.write(content)
        print("Added missing FR keys to i18n.js")
    else:
        print("FR keys already present")
else:
    print("WARNING: Could not find trans.cta marker in i18n.js")

print("i18n.js updated")

# ============================================================
# 2. Fix index.html: Add data-i18n to footer copyright/classification
# ============================================================
with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Fix footer copyright
content = content.replace(
    '<div class="footer__legal">&copy; 2026 Afriplan Global Solution. All rights reserved.</div>',
    '<div class="footer__legal" data-i18n="footer.rights">&copy; 2026 Afriplan Global Solution. All rights reserved.</div>'
)
# Fix footer classification notice
content = content.replace(
    '<div class="footer__legal">Classification D &mdash; NDA required &mdash; Not for public distribution</div>',
    '<div class="footer__legal" data-i18n="footer.classification">Classification D &mdash; NDA required &mdash; Not for public distribution</div>'
)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)
print("index.html updated")

# ============================================================
# 3. Fix footer brand-desc on all pages
# ============================================================
pages_to_fix = ["index.html", "opportunities.html", "responsible-sourcing.html",
                "data-room.html", "contact.html", "beryllium.html", "tungsten.html",
                "gold.html", "lithium.html", "privacy.html"]

for page in pages_to_fix:
    try:
        with open(page, "r", encoding="utf-8") as f:
            content = f.read()
        if 'data-i18n="footer.brand-desc"' not in content and 'footer__brand-desc' in content:
            # Add data-i18n to footer brand desc div
            old = '<div class="footer__brand-desc">'
            new = '<div class="footer__brand-desc" data-i18n="footer.brand-desc">'
            content = content.replace(old, new)
            with open(page, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Fixed footer brand-desc in {page}")
    except Exception as e:
        print(f"Error fixing {page}: {e}")

print("\nAll remaining fixes applied!")
