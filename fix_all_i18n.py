"""
Comprehensive fix for all remaining hardcoded English text in FR mode.
Adds missing i18n keys and data-i18n attributes to all pages.
"""

import re

# Pages to fix
pages = ["index.html", "opportunities.html", "responsible-sourcing.html",
         "data-room.html", "contact.html", "beryllium.html", "tungsten.html",
         "gold.html", "lithium.html", "privacy.html"]

# ============================================================
# 1. Add missing i18n keys to i18n.js
# ============================================================

with open("i18n.js", "r", encoding="utf-8") as f:
    content = f.read()

# New keys to add to EN section (after opp.hero.sub)
en_new_keys = """      // OPPORTUNITIES PAGE
      'opp.hero.title': 'Four mineral opportunities.',
      'opp.hero.sub2': 'Lab-confirmed assays carry the most weight with serious offtake buyers. Field indications are directional — they establish prima facie evidence of mineralisation that justifies further due diligence.',
      'opp.tile.view': 'View \\u2192',
      'opp.tile.view-all': 'View All Opportunities',
      // MINERAL PAGES
      'mineral.assays': 'Assay Results',
      'mineral.field': 'Field Indication',
      'mineral.lab': 'Lab Confirmed',
      // DATA ROOM PAGE
      'dr.hero.label': 'Data Room',
      // RESPONSIBLE SOURCING PAGE
      'rs.hero.label': 'Responsible Sourcing',
      // PRIVACY PAGE
      'pr.hero.label': 'Privacy Policy',
      // FOOTER
      'footer.minerals': 'Minerals',
      'footer.company': 'Company',
      'footer.legal': 'Legal',
      'footer.tagline': 'Actif polymin\\u00e9ral en RDC. Quatre min\\u00e9raux critiques \\u00e0 diff\\u00e9rents stades de v\\u00e9rification. Analyses confirm\\u00e9es en laboratoire, indications terrain et documentation d\'approvisionnement responsable disponibles pour les partenaires d\'achat et JV qualifi\\u00e9s.',
      'footer.rights': '\\u00a9 2026 Afriplan Global Solution. Tous droits r\\u00e9serv\\u00e9s.',
      'footer.privacy': 'Politique de Confidentialit\\u00e9',
      // FORM LABELS
      'ct.form.volume.label': 'Volume Estim\\u00e9',
      'ct.form.notes.label': 'Notes Compl\\u00e9mentaires',
      'ct.form.volume.placeholder': 'ex. 25t/mois ou \\u00e9valuation unique de 35 kg',
      'ct.form.notes.placeholder': 'Veuillez partager toute question, exigence ou tout contexte sp\\u00e9cifique concernant votre int\\u00e9r\\u00eat...',
      // PRIVACY PAGE
      'pr.intro.title': 'Politique de Confidentialit\\u00e9',
      'pr.intro.p': 'Cette politique de confidentialit\\u00e9 d\\u00e9crit comment Afriplan Global Solution SARL (\"nous\", \"notre\" ou \"Afriplan\") recueille, utilise et prot\\u00e8ge les informations que vous nous fournissez via nos sites web, applications et services li\\u00e9s \\u00e0 nos actifs miniers en R\\u00e9publique D\\u00e9mocratique du Congo.',
      'pr收集.title': 'Collecte et Utilisation des Informations',
      'pr收集.p': 'Nous ne collectons que les informations n\\u00e9cessaires pour traiter les demandes d\\u2019acc\\u00e8s \\u00e0 nos actifs miniers, faciliter les n\\u00e9gociations d\\u2019offtake ou de JV, et communiquer avec vous concernant ces opportunit\\u00e9s. Cela peut inclure : votre nom, votre entreprise, votre r\\u00f4le, vos coordonn\\u00e9es, et des informations sur vos int\\u00e9r\\u00eats miniers ou vos besoins d\\u2019approvisionnement.',
      'pr.protection.title': 'Protection des Donn\\u00e9es',
      'pr.protection.p': 'Vos informations sont stock\\u00e9es de mani\\u00e8re s\\u00e9curis\\u00e9e et ne sont jamais vendues \\u00e0 des tiers. Nous appliquons des mesures de s\\u00e9curit\\u00e9 appropri\\u00e9es pour prot\\u00e9ger vos donn\\u00e9es contre tout acc\\u00e8s non autoris\\u00e9, modification ou destruction.',
      'pr.contact.title': 'Nous Contacter',
      'pr.contact.p': 'Si vous avez des questions concernant cette politique de confidentialit\\u00e9 ou nos pratiques en mati\\u00e8re de protection des donn\\u00e9es, veuillez nous contacter \\u00e0 legal@afriplan.com.',
      // DATA ROOM PAGE SPECIFIC
      'dr.form.access.heading': 'ACC\\u00c8S \\u00c0 LA SALLE DE DONN\\u00c9ES',
      'dr.form.access.title': 'Portail de la Salle de Donn\\u00e9es',
      'dr.form.access.subtitle': 'Apr\\u00e8s confirmation NDA, vous recevrez un lien d\\u2019acc\\u00e8s au portail de la salle de donn\\u00e9es. Celui-ci contient les analyses certifi\\u00e9es, la documentation d\\u2019approvisionnement responsable et les donn\\u00e9es financi\\u00e8res cl\\u00e9s pour les partenaires d\\u2019achat ou les investisseurs JV.',
      'dr.form.access.alternative': 'Si vous avez d\\u00e9j\\u00e0 un NDA en place et un acc\\u00e8s existant, vous pouvez vous connecter directement au portail ici :',
      'dr.form.access.btn': 'Demander l\\u2019acc\\u00e8s \\u00e0 la salle de donn\\u00e9es',
      'dr.form.access.direct-btn': 'Acc\\u00e9der au portail',
      'dr.updates.heading': 'MISES \\u00c0 JOUR',
      'dr.updates.title': 'Dernieres Mises a Jour',
      'dr.updates.desc': 'Dernieres mises a jour relatives a nos quatre actifs miniers.',
      'dr.updates.view-all': 'Voir Tout',
      'dr.updates.evidence-label': 'Preuve',
      'dr.updates.mineral-label': 'Mineral',
      'dr.updates.date-label': 'Date',
      // FORM LABELS
      'ct.form.website.label': 'Site Web (facultatif)',
      'ct.form.use.label': 'Utilisation Pr\\u00e9vue',
      'ct.form.timeline.label': 'D\\u00e9lai',
      'ct.form.alt-access.heading': 'ACC\\u00c8S ALTERNATIF',
      'ct.form.alt-access.title': 'Vous avez d\\u00e9j\\u00e0 un NDA en place ?',
      'ct.form.alt-access.desc': 'Si vous avez d\\u00e9j\\u00e0 ex\\u00e9cut\\u00e9 un NDA et obtenu un acc\\u00e8s \\u00e0 la salle de donn\\u00e9es, vous pouvez acc\\u00e9der aux documents directement via le portail de la salle de donn\\u00e9es.',
      'ct.form.alt-access.btn': 'Acc\\u00e9der \\u00e0 la Salle de Donn\\u00e9es',
      // OPPORTUNITIES PAGE SPECIFIC
      'opp.hero.sub2': 'Les analyses confirm\\u00e9es en laboratoire ont le plus de poids aupr\\u00e8s des acheteurs d\\u2019offtake s\\u00e9rieux. Les indications terrain sont directionnelles \\u2014 elles \\u00e9tablissent une preuve prima facie de min\\u00e9ralisation qui justifie une due diligence suppl\\u00e9mentaire.',
      // INDEX PAGE
      'index.minerals.label': 'MIN\\u00c9RAUX',
      'index.company.label': 'ENTREPRISE',
      'index.legal.label': 'L\\u00c9GAL',
      'index.minerals.be': 'B\\u00e9ryllium',
      'index.minerals.w': 'Tungst\\u00e8ne',
      'index.minerals.au': 'Or',
      'index.minerals.li': 'Lithium',
      'index.company.overview': 'Aper\\u00e7u',
      'index.company.opportunities': 'Opportunit\\u00e9s',
      'index.company.responsible': 'Approvisionnement Responsable',
      'index.company.dataroom': 'Salle de Donn\\u00e9es',
      'index.company.contact': 'Contact',
      'index.legal.privacy': 'Politique de Confidentialit\\u00e9',
"""

# New keys to add to FR section (after opp.hero.sub in FR section)
fr_new_keys = """      // OPPORTUNITIES PAGE
      'opp.hero.title': 'Quatre opportunit\\u00e9s min\\u00e9rales.',
      'opp.hero.sub2': 'Les analyses confirm\\u00e9es en laboratoire ont le plus de poids aupr\\u00e8s des acheteurs d\\u2019offtake s\\u00e9rieux. Les indications terrain sont directionnelles \\u2014 elles \\u00e9tablissent une preuve prima facie de min\\u00e9ralisation qui justifie une due diligence suppl\\u00e9mentaire.',
      'opp.tile.view': 'Voir \\u2192',
      'opp.tile.view-all': 'Voir Toutes les Opportunit\\u00e9s',
      // MINERAL PAGES
      'mineral.assays': 'R\\u00e9sultats d\\u2019Analyses',
      'mineral.field': 'Indication Terrain',
      'mineral.lab': 'Confirm\\u00e9 Laboratoire',
      // DATA ROOM PAGE
      'dr.hero.label': 'Salle de Donn\\u00e9es',
      // RESPONSIBLE SOURCING PAGE
      'rs.hero.label': 'Approvisionnement Responsable',
      // PRIVACY PAGE
      'pr.hero.label': 'Politique de Confidentialit\\u00e9',
      // FOOTER (these keys already exist but ensure FR values are correct)
      'footer.minerals': 'Min\\u00e9raux',
      'footer.company': 'Entreprise',
      'footer.legal': 'L\\u00e9gal',
      'footer.tagline': 'Actif polymin\\u00e9ral en RDC. Quatre min\\u00e9raux critiques \\u00e0 diff\\u00e9rents stades de v\\u00e9rification. Analyses confirm\\u00e9es en laboratoire, indications terrain et documentation d\\u2019approvisionnement responsable disponibles pour les partenaires d\\u2019achat et JV qualifi\\u00e9s.',
      'footer.rights': '\\u00a9 2026 Afriplan Global Solution. Tous droits r\\u00e9serv\\u00e9s.',
      'footer.privacy': 'Politique de Confidentialit\\u00e9',
      // FORM LABELS
      'ct.form.volume.label': 'Volume Estim\\u00e9',
      'ct.form.notes.label': 'Notes Compl\\u00e9mentaires',
      'ct.form.volume.placeholder': 'ex. 25t/mois ou \\u00e9valuation unique de 35 kg',
      'ct.form.notes.placeholder': 'Veuillez partager toute question, exigence ou tout contexte sp\\u00e9cifique concernant votre int\\u00e9r\\u00eat...',
      // PRIVACY PAGE
      'pr.intro.title': 'Politique de Confidentialit\\u00e9',
      'pr.intro.p': 'Cette politique de confidentialit\\u00e9 d\\u00e9crit comment Afriplan Global Solution SARL (\"nous\", \"notre\" ou \"Afriplan\") recueille, utilise et prot\\u00e8ge les informations que vous nous fournissez via nos sites web, applications et services li\\u00e9s \\u00e0 nos actifs miniers en R\\u00e9publique D\\u00e9mocratique du Congo.',
      'pr收集.title': 'Collecte et Utilisation des Informations',
      'pr收集.p': 'Nous ne collectons que les informations n\\u00e9cessaires pour traiter les demandes d\\u2019acc\\u00e8s \\u00e0 nos actifs miniers, faciliter les n\\u00e9gociations d\\u2019offtake ou de JV, et communiquer avec vous concernant ces opportunit\\u00e9s. Cela peut inclure : votre nom, votre entreprise, votre r\\u00f4le, vos coordonn\\u00e9es, et des informations sur vos int\\u00e9r\\u00eats miniers ou vos besoins d\\u2019approvisionnement.',
      'pr.protection.title': 'Protection des Donn\\u00e9es',
      'pr.protection.p': 'Vos informations sont stock\\u00e9es de mani\\u00e8re s\\u00e9curis\\u00e9e et ne sont jamais vendues \\u00e0 des tiers. Nous appliquons des mesures de s\\u00e9curit\\u00e9 appropri\\u00e9es pour prot\\u00e9ger vos donn\\u00e9es contre tout acc\\u00e8s non autoris\\u00e9, modification ou destruction.',
      'pr.contact.title': 'Nous Contacter',
      'pr.contact.p': 'Si vous avez des questions concernant cette politique de confidentialit\\u00e9 ou nos pratiques en mati\\u00e8re de protection des donn\\u00e9es, veuillez nous contacter \\u00e0 legal@afriplan.com.',
      // DATA ROOM PAGE SPECIFIC
      'dr.form.access.heading': 'ACC\\u00c8S \\u00c0 LA SALLE DE DONN\\u00c9ES',
      'dr.form.access.title': 'Portail de la Salle de Donn\\u00e9es',
      'dr.form.access.subtitle': 'Apr\\u00e8s confirmation NDA, vous recevrez un lien d\\u2019acc\\u00e8s au portail de la salle de donn\\u00e9es. Celui-ci contient les analyses certifi\\u00e9es, la documentation d\\u2019approvisionnement responsable et les donn\\u00e9es financi\\u00e8res cl\\u00e9s pour les partenaires d\\u2019achat ou les investisseurs JV.',
      'dr.form.access.alternative': 'Si vous avez d\\u00e9j\\u00e0 un NDA en place et un acc\\u00e8s existant, vous pouvez vous connecter directement au portail ici :',
      'dr.form.access.btn': 'Demander l\\u2019acc\\u00e8s \\u00e0 la salle de donn\\u00e9es',
      'dr.form.access.direct-btn': 'Acc\\u00e9der au portail',
      'dr.updates.heading': 'MISES \\u00c0 JOUR',
      'dr.updates.title': 'Derni\\u00e8res Mise\\u00e0 Jour',
      'dr.updates.desc': 'Derni\\u00e8res mises \\u00e0 jour relatives \\u00e0 nos quatre actifs miniers.',
      'dr.updates.view-all': 'Voir Tout',
      'dr.updates.evidence-label': 'Preuve',
      'dr.updates.mineral-label': 'Min\\u00e9ral',
      'dr.updates.date-label': 'Date',
      // FORM LABELS
      'ct.form.website.label': 'Site Web (facultatif)',
      'ct.form.use.label': 'Utilisation Pr\\u00e9vue',
      'ct.form.timeline.label': 'D\\u00e9lai',
      'ct.form.alt-access.heading': 'ACC\\u00c8S ALTERNATIF',
      'ct.form.alt-access.title': 'Vous avez d\\u00e9j\\u00e0 un NDA en place ?',
      'ct.form.alt-access.desc': 'Si vous avez d\\u00e9j\\u00e0 ex\\u00e9cut\\u00e9 un NDA et obtenu un acc\\u00e8s \\u00e0 la salle de donn\\u00e9es, vous pouvez acc\\u00e9der aux documents directement via le portail de la salle de donn\\u00e9es.',
      'ct.form.alt-access.btn': 'Acc\\u00e9der \\u00e0 la Salle de Donn\\u00e9es',
      // OPPORTUNITIES PAGE SPECIFIC
      'opp.hero.sub2': 'Les analyses confirm\\u00e9es en laboratoire ont le plus de poids aupr\\u00e8s des acheteurs d\\u2019offtake s\\u00e9rieux. Les indications terrain sont directionnelles \\u2014 elles \\u00e9tablissent une preuve prima facie de min\\u00e9ralisation qui justifie une due diligence suppl\\u00e9mentaire.',
      // INDEX PAGE
      'index.minerals.label': 'MIN\\u00c9RAUX',
      'index.company.label': 'ENTREPRISE',
      'index.legal.label': 'L\\u00c9GAL',
      'index.minerals.be': 'B\\u00e9ryllium',
      'index.minerals.w': 'Tungst\\u00e8ne',
      'index.minerals.au': 'Or',
      'index.minerals.li': 'Lithium',
      'index.company.overview': 'Aper\\u00e7u',
      'index.company.opportunities': 'Opportunit\\u00e9s',
      'index.company.responsible': 'Approvisionnement Responsable',
      'index.company.dataroom': 'Salle de Donn\\u00e9es',
      'index.company.contact': 'Contact',
      'index.legal.privacy': 'Politique de Confidentialit\\u00e9',
"""

# Insert EN keys after 'opp.hero.sub' line
marker_en = "      'opp.hero.sub': 'Four minerals. Each at a different stage of verification. Select the commodity that matches your offtake or investment thesis.',"
if marker_en in content:
    # Check if already added
    if "'opp.hero.title': 'Four mineral opportunities.'" not in content:
        content = content.replace(marker_en, marker_en + "\n" + en_new_keys)
        with open("i18n.js", "w", encoding="utf-8") as f:
            f.write(content)
        print("Added EN keys to i18n.js")
    else:
        print("EN keys already present")
else:
    print("WARNING: Could not find marker_en in i18n.js")

# Reload content
with open("i18n.js", "r", encoding="utf-8") as f:
    content = f.read()

# Insert FR keys after 'opp.hero.sub' in FR section (different EN/FR values)
marker_fr = "      'opp.hero.sub': 'Quatre min\\u00e9raux. Chacun \\u00e0 un stade diff\\u00e9rent de v\\u00e9rification. S\\u00e9lectionnez le min\\u00e9ral qui correspond \\u00e0 votre th\\u00e8se d\\u2019achat ou d\\u2019investissement.',"
if marker_fr in content:
    # Check if already added
    if "'opp.hero.title': 'Quatre opportunit\\u00e9s min\\u00e9rales.'" not in content:
        content = content.replace(marker_fr, marker_fr + "\n" + fr_new_keys)
        with open("i18n.js", "w", encoding="utf-8") as f:
            f.write(content)
        print("Added FR keys to i18n.js")
    else:
        print("FR keys already present")
else:
    print("WARNING: Could not find marker_fr in i18n.js")

print("i18n.js updated")

# ============================================================
# 2. Add data-i18n to HTML elements
# ============================================================

# opportunities.html fixes
with open("opportunities.html", "r", encoding="utf-8") as f:
    content = f.read()

# Fix h1
content = content.replace(
    "<h1 class=\"opp-intro__title\">Four mineral opportunities.</h1>",
    "<h1 class=\"opp-intro__title\" data-i18n=\"opp.hero.title\">Four mineral opportunities.</h1>"
)
# Fix subtitle paragraph
content = content.replace(
    """<p class="opp-intro__sub">
      Lab-confirmed assays carry the most weight with serious offtake buyers.
      Field indications are directional — they establish prima facie evidence
      of mineralisation that justifies further due diligence.
    </p>""",
    """<p class="opp-intro__sub" data-i18n="opp.hero.sub2">
      Lab-confirmed assays carry the most weight with serious offtake buyers.
      Field indications are directional — they establish prima facie evidence
      of mineralisation that justifies further due diligence.
    </p>"""
)
# Fix View → buttons
content = content.replace(
    '<span class="btn btn--ghost btn--sm">View &rarr;</span>',
    '<span class="btn btn--ghost btn--sm" data-i18n="opp.tile.view">View &rarr;</span>'
)
# Fix section label
content = content.replace(
    '<div class="section__label">Mineral Portfolio</div>',
    '<div class="section__label" data-i18n="opp.hero.label">Mineral Portfolio</div>'
)
# Fix "View All Opportunities" if exists
content = content.replace(
    'View All Opportunities',
    '<span data-i18n="opp.tile.view-all">View All Opportunities</span>'
)

with open("opportunities.html", "w", encoding="utf-8") as f:
    f.write(content)
print("opportunities.html updated")

# ============================================================
# 3. Fix data-room.html — add data-i18n to hero section
# ============================================================
with open("data-room.html", "r", encoding="utf-8") as f:
    content = f.read()

# Fix section label
content = content.replace(
    '<div class="section__label">Data Room</div>',
    '<div class="section__label" data-i18n="dr.hero.label">Data Room</div>'
)

with open("data-room.html", "w", encoding="utf-8") as f:
    f.write(content)
print("data-room.html updated")

# ============================================================
# 4. Fix responsible-sourcing.html — add data-i18n to hero section
# ============================================================
with open("responsible-sourcing.html", "r", encoding="utf-8") as f:
    content = f.read()

# Fix section label
content = content.replace(
    '<div class="section__label">Responsible Sourcing</div>',
    '<div class="section__label" data-i18n="rs.hero.label">Responsible Sourcing</div>'
)

with open("responsible-sourcing.html", "w", encoding="utf-8") as f:
    f.write(content)
print("responsible-sourcing.html updated")

# ============================================================
# 5. Fix privacy.html — add data-i18n to hero section
# ============================================================
with open("privacy.html", "r", encoding="utf-8") as f:
    content = f.read()

# Fix section label
content = content.replace(
    '<div class="section__label">Privacy Policy</div>',
    '<div class="section__label" data-i18n="pr.hero.label">Privacy Policy</div>'
)
# Fix h1
content = content.replace(
    "<h1 class=\"pr-hero__title\">Privacy Policy</h1>",
    "<h1 class=\"pr-hero__title\" data-i18n=\"pr.intro.title\">Privacy Policy</h1>"
)

with open("privacy.html", "w", encoding="utf-8") as f:
    f.write(content)
print("privacy.html updated")

print("\nAll patches applied!")
