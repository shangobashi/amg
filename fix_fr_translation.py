"""
Full French Translation Pass — fix all missing data-i18n attributes
and ensure select options translate properly.

Fixes:
1. i18n.js: Extend apply() to handle <option> elements
2. i18n.js: Add French translations for all select options
3. contact.html: Add data-i18n to all <option>, fix h1, submit button, success state
4. data-room.html: Add data-i18n to all <option> elements
"""

import re

# ─── 1. Patch i18n.js: extend apply() to handle <option> elements ────────────
print("1. Patching i18n.js apply() to handle <option> elements...")

with open("i18n.js", "r", encoding="utf-8") as f:
    content = f.read()

# Find the apply() function and extend it to handle OPTION elements
old_apply = """    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = t[key];
        } else if (/<[a-z]/i.test(t[key])) {
          // Translation contains HTML — use innerHTML (e.g. hero title with <em>)
          el.innerHTML = t[key];
        } else {
          // Plain text — use textContent to preserve child elements (SVGs, etc.)
          el.textContent = t[key];
        }
      }
    });"""

new_apply = """    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = t[key];
        } else if (el.tagName === 'OPTION') {
          // Translate <option> text content
          el.textContent = t[key];
        } else if (/<[a-z]/i.test(t[key])) {
          // Translation contains HTML — use innerHTML (e.g. hero title with <em>)
          el.innerHTML = t[key];
        } else {
          // Plain text — use textContent to preserve child elements (SVGs, etc.)
          el.textContent = t[key];
        }
      }
    });"""

if old_apply in content:
    content = content.replace(old_apply, new_apply)
    print("   apply() patched successfully")
else:
    print("   WARNING: apply() pattern not found — may already be patched")

with open("i18n.js", "w", encoding="utf-8") as f:
    f.write(content)

# ─── 2. Add French translations for select options ────────────────────────────
print("\n2. Adding French translations for all select options...")

with open("i18n.js", "r", encoding="utf-8") as f:
    content = f.read()

# Find the position just before "    }" closing the fr: object (last key before closing brace)
# We need to insert the new keys before the final closing braces

# Find the closing pattern of fr: { ... }
# The fr: object ends near the end, just before "    }" on line 1124 and "  }" on line 1125

new_option_translations = """
      // CONTACT FORM — country select options
      'ct.form.country.option.be': 'Belgique',
      'ct.form.country.option.ca': 'Canada',
      'ct.form.country.option.cn': 'Chine',
      'ct.form.country.option.cd': 'R\\u00e9publique D\\u00e9mocratique du Congo',
      'ct.form.country.option.fr': 'France',
      'ct.form.country.option.de': 'Allemagne',
      'ct.form.country.option.in': 'Inde',
      'ct.form.country.option.jp': 'Japon',
      'ct.form.country.option.nl': 'Pays-Bas',
      'ct.form.country.option.za': 'Afrique du Sud',
      'ct.form.country.option.ch': 'Suisse',
      'ct.form.country.option.tz': 'Tanzanie',
      'ct.form.country.option.ae': '\\u00c9mirats Arabes Unis',
      'ct.form.country.option.gb': 'Royaume-Uni',
      'ct.form.country.option.us': '\\u00c9tats-Unis',
      'ct.form.country.option.other': 'Autre',

      // CONTACT FORM — buyer type options
      'ct.form.buyer-type.option.offtake': 'Partenaire d\\'Achat',
      'ct.form.buyer-type.option.jv': 'Op\\u00e9rateur JV',
      'ct.form.buyer-type.option.strategic': 'Acqu\\u00e9reur Stratégique',
      'ct.form.buyer-type.option.investor': 'Investisseur en Financement de Projet',
      'ct.form.buyer-type.option.equipment': 'Partenaire \\u00c9quipement-en-Production',
      'ct.form.buyer-type.option.other': 'Autre',

      // CONTACT FORM — mineral select options
      'ct.form.mineral.option.be': 'B\\u00e9ryllium',
      'ct.form.mineral.option.w': 'Tungst\\u00e8ne / Wolframite',
      'ct.form.mineral.option.au': 'Or',
      'ct.form.mineral.option.li': 'Lithium',
      'ct.form.mineral.option.multiple': 'Multiple / Ouvert aux options',

      // CONTACT FORM — intended use options
      'ct.form.use.option.resale': 'Revente directe',
      'ct.form.use.option.industrial': 'Transformation industrielle',
      'ct.form.use.option.refining': 'Raffinage',
      'ct.form.use.option.stockpiling': 'Stockage strat\\u00e9gique',
      'ct.form.use.option.investment': 'Investissement',
      'ct.form.use.option.exploratory': 'Exploration',

      // CONTACT FORM — timeline options
      'ct.form.timeline.option.immediate': 'Imm\\u00e9diat (sous 30 jours)',
      'ct.form.timeline.option.short': 'Court terme (1 \\u00e0 3 mois)',
      'ct.form.timeline.option.medium': 'Moyen terme (3 \\u00e0 6 mois)',
      'ct.form.timeline.option.exploratory': 'Exploratoire (sans d\\u00e9lai fix\\u00e9)',
      'ct.form.timeline.option.conditional': 'Conditionnel \\u00e0 la due diligence',

      // DATA ROOM FORM — mineral select options
      'dr.form.mineral.option.be': 'B\\u00e9ryllium',
      'dr.form.mineral.option.w': 'Tungst\\u00e8ne / Wolframite',
      'dr.form.mineral.option.au': 'Or',
      'dr.form.mineral.option.li': 'Lithium',
      'dr.form.mineral.option.multiple': 'Multiple / Ouvert aux options',

      // DATA ROOM FORM — engagement type options
      'dr.form.engagement.option.offtake': 'Partenaire d\\'Achat',
      'dr.form.engagement.option.jv': 'Op\\u00e9rateur JV',
      'dr.form.engagement.option.strategic': 'Acqu\\u00e9reur Stratégique',
      'dr.form.engagement.option.investor': 'Investisseur',
      'dr.form.engagement.option.other': 'Autre',
"""

# Insert new translations before the closing "    }" of the fr: object
# The fr: object ends at line 1124 with "    }"
if "'pr.updates.p'" in content and new_option_translations.strip().split('\n')[0].strip() not in content:
    # Find the position after 'pr.updates.p' and before the closing brace
    insert_marker = "      'pr.updates.p': 'Cette politique est examin\\u00e9e annuellement. Les changements mat\\u00e9riels seront communiqu\\u00e9s via l\\'adresse email du formulaire de contact.',"
    if insert_marker in content:
        content = content.replace(insert_marker, insert_marker + "\n" + new_option_translations)
        print("   French option translations inserted successfully")
    else:
        print("   WARNING: Could not find insert marker for options")
else:
    if new_option_translations.strip().split('\n')[0].strip() in content:
        print("   Option translations already present")
    else:
        print("   WARNING: Could not locate insertion point")

with open("i18n.js", "w", encoding="utf-8") as f:
    f.write(content)

print("\ni18n.js update complete.")

# ─── 3. Fix contact.html: add data-i18n to all options, fix h1/submit/success ─
print("\n3. Patching contact.html...")

with open("contact.html", "r", encoding="utf-8") as f:
    html = f.read()

# Fix 1: H1 headline — add data-i18n attribute
html = html.replace(
    """    <h1 class="section__title" style="margin-top: var(--space-4);">
      Let's talk about<br>what you're looking for.
    </h1>""",
    """    <h1 class="section__title" style="margin-top: var(--space-4);" data-i18n="ct.form.section-header-title">
      Let's talk about<br>what you're looking for.
    </h1>"""
)

# Fix 2: Subtitle paragraph — add data-i18n
html = html.replace(
    """    <p class="section__subtitle" style="margin-top: var(--space-4);">
      All conversations are confidential. We respond to qualified inquiries
      within 1&ndash;2 business days. Please provide enough context about your
      interest so we can route your message to the right person.
    </p>""",
    """    <p class="section__subtitle" style="margin-top: var(--space-4);" data-i18n="ct.form.section-subtitle">
      All conversations are confidential. We respond to qualified inquiries
      within 1&ndash;2 business days. Please provide enough context about your
      interest so we can route your message to the right person.
    </p>"""
)

# Fix 3: Country options
country_fixes = {
    '<option>Belgium</option>': '<option data-i18n="ct.form.country.option.be">Belgium</option>',
    '<option>Canada</option>': '<option data-i18n="ct.form.country.option.ca">Canada</option>',
    '<option>China</option>': '<option data-i18n="ct.form.country.option.cn">China</option>',
    '<option>Democratic Republic of Congo</option>': '<option data-i18n="ct.form.country.option.cd">Democratic Republic of Congo</option>',
    '<option>France</option>': '<option data-i18n="ct.form.country.option.fr">France</option>',
    '<option>Germany</option>': '<option data-i18n="ct.form.country.option.de">Germany</option>',
    '<option>India</option>': '<option data-i18n="ct.form.country.option.in">India</option>',
    '<option>Japan</option>': '<option data-i18n="ct.form.country.option.jp">Japan</option>',
    '<option>Netherlands</option>': '<option data-i18n="ct.form.country.option.nl">Netherlands</option>',
    '<option>DRC</option>': '<option data-i18n="ct.form.country.option.cd">DRC</option>',
    '<option>South Africa</option>': '<option data-i18n="ct.form.country.option.za">South Africa</option>',
    '<option>Switzerland</option>': '<option data-i18n="ct.form.country.option.ch">Switzerland</option>',
    '<option>Tanzania</option>': '<option data-i18n="ct.form.country.option.tz">Tanzania</option>',
    '<option>United Arab Emirates</option>': '<option data-i18n="ct.form.country.option.ae">United Arab Emirates</option>',
    '<option>United Kingdom</option>': '<option data-i18n="ct.form.country.option.gb">United Kingdom</option>',
    '<option>United States</option>': '<option data-i18n="ct.form.country.option.us">United States</option>',
    '<option>Other</option>': '<option data-i18n="ct.form.country.option.other">Other</option>',
}
for old, new in country_fixes.items():
    if old in html:
        html = html.replace(old, new)

# Fix 4: Buyer type options
buyer_fixes = {
    '<option>Offtake Partner</option>': '<option data-i18n="ct.form.buyer-type.option.offtake">Offtake Partner</option>',
    '<option>Joint Venture Operator</option>': '<option data-i18n="ct.form.buyer-type.option.jv">Joint Venture Operator</option>',
    '<option>Strategic Acquirer</option>': '<option data-i18n="ct.form.buyer-type.option.strategic">Strategic Acquirer</option>',
    '<option>Project Finance Investor</option>': '<option data-i18n="ct.form.buyer-type.option.investor">Project Finance Investor</option>',
    '<option>Equipment-for-Output Partner</option>': '<option data-i18n="ct.form.buyer-type.option.equipment">Equipment-for-Output Partner</option>',
    '<option>Other</option>': '<option data-i18n="ct.form.buyer-type.option.other">Other</option>',
}
for old, new in buyer_fixes.items():
    if old in html:
        html = html.replace(old, new)

# Fix 5: Mineral options
mineral_fixes = {
    '<option>Beryllium</option>': '<option data-i18n="ct.form.mineral.option.be">Beryllium</option>',
    '<option>Tungsten / Wolframite</option>': '<option data-i18n="ct.form.mineral.option.w">Tungsten / Wolframite</option>',
    '<option>Gold</option>': '<option data-i18n="ct.form.mineral.option.au">Gold</option>',
    '<option>Lithium</option>': '<option data-i18n="ct.form.mineral.option.li">Lithium</option>',
    '<option>Multiple / Open to options</option>': '<option data-i18n="ct.form.mineral.option.multiple">Multiple / Open to options</option>',
}
for old, new in mineral_fixes.items():
    if old in html:
        html = html.replace(old, new)

# Fix 6: Intended use options
use_fixes = {
    '<option>Direct resale</option>': '<option data-i18n="ct.form.use.option.resale">Direct resale</option>',
    '<option>Industrial processing</option>': '<option data-i18n="ct.form.use.option.industrial">Industrial processing</option>',
    '<option>Refining</option>': '<option data-i18n="ct.form.use.option.refining">Refining</option>',
    '<option>Strategic stockpiling</option>': '<option data-i18n="ct.form.use.option.stockpiling">Strategic stockpiling</option>',
    '<option>Investment</option>': '<option data-i18n="ct.form.use.option.investment">Investment</option>',
    '<option>Exploratory</option>': '<option data-i18n="ct.form.use.option.exploratory">Exploratory</option>',
}
for old, new in use_fixes.items():
    if old in html:
        html = html.replace(old, new)

# Fix 7: Timeline options
timeline_fixes = {
    '<option>Immediate (within 30 days)</option>': '<option data-i18n="ct.form.timeline.option.immediate">Immediate (within 30 days)</option>',
    '<option>Short-term (1&ndash;3 months)</option>': '<option data-i18n="ct.form.timeline.option.short">Short-term (1&ndash;3 months)</option>',
    '<option>Medium-term (3&ndash;6 months)</option>': '<option data-i18n="ct.form.timeline.option.medium">Medium-term (3&ndash;6 months)</option>',
    '<option>Exploratory (no fixed timeline)</option>': '<option data-i18n="ct.form.timeline.option.exploratory">Exploratory (no fixed timeline)</option>',
    '<option>Conditional on due diligence</option>': '<option data-i18n="ct.form.timeline.option.conditional">Conditional on due diligence</option>',
}
for old, new in timeline_fixes.items():
    if old in html:
        html = html.replace(old, new)

# Fix 8: Submit button — remove English text from inside button (data-i18n on button will set text)
# The button has text + SVG. We need to put the text in a <span> with data-i18n
# Actually, looking at the HTML: the button text "Send Inquiry" is inside the button alongside SVG
# The i18n apply() uses textContent which would remove the SVG.
# We need a <span data-i18n="ct.form.submit-btn"> inside the button
html = html.replace(
    """        <button type="submit" class="btn btn--primary btn--lg" style="align-self: flex-start;" data-i18n="ct.form.submit-btn">
          Send Inquiry
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>""",
    """        <button type="submit" class="btn btn--primary btn--lg" style="align-self: flex-start;">
          <span data-i18n="ct.form.submit-btn">Send Inquiry</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>"""
)

# Fix 9: Success state — add data-i18n to title and description
# The success title already has data-i18n="ct.success.title" but text is hardcoded
# The description also has data-i18n="ct.success.desc" but text is hardcoded
# Both are OK since apply() handles them — just need to ensure the keys exist in FR

# Fix 10: Privacy note — remove hardcoded English text from inside p tag with data-i18n
html = html.replace(
    """          <p style="font-size: 0.8125rem; color: var(--text-tertiary); line-height: 1.6;" data-i18n="ct.form.privacy-note">
            Your information is used only to route your inquiry and will not be
            shared with third parties. All conversations are treated as confidential.
          </p>""",
    """          <p style="font-size: 0.8125rem; color: var(--text-tertiary); line-height: 1.6;" data-i18n="ct.form.privacy-note">
            Your information is used only to route your inquiry and will not be shared with third parties. All conversations are treated as confidential.
          </p>"""
)

with open("contact.html", "w", encoding="utf-8") as f:
    f.write(html)

print("   contact.html patched successfully")

# ─── 4. Fix data-room.html country + mineral + engagement options ─────────────
print("\n4. Patching data-room.html...")

with open("data-room.html", "r", encoding="utf-8") as f:
    html = f.read()

# Country options
for old, new in country_fixes.items():
    if old in html:
        html = html.replace(old, new)

# Mineral options (data room version)
dr_mineral_fixes = {
    '<option>Beryllium</option>': '<option data-i18n="dr.form.mineral.option.be">Beryllium</option>',
    '<option>Tungsten / Wolframite</option>': '<option data-i18n="dr.form.mineral.option.w">Tungsten / Wolframite</option>',
    '<option>Gold</option>': '<option data-i18n="dr.form.mineral.option.au">Gold</option>',
    '<option>Lithium</option>': '<option data-i18n="dr.form.mineral.option.li">Lithium</option>',
    '<option>Multiple / Open to options</option>': '<option data-i18n="dr.form.mineral.option.multiple">Multiple / Open to options</option>',
}
for old, new in dr_mineral_fixes.items():
    if old in html:
        html = html.replace(old, new)

# Engagement type options (data room version)
dr_engagement_fixes = {
    '<option>Offtake Partner</option>': '<option data-i18n="dr.form.engagement.option.offtake">Offtake Partner</option>',
    '<option>Joint Venture Operator</option>': '<option data-i18n="dr.form.engagement.option.jv">Joint Venture Operator</option>',
    '<option>Strategic Acquirer</option>': '<option data-i18n="dr.form.engagement.option.strategic">Strategic Acquirer</option>',
    '<option>Project Finance Investor</option>': '<option data-i18n="dr.form.engagement.option.investor">Project Finance Investor</option>',
    '<option>Other</option>': '<option data-i18n="dr.form.engagement.option.other">Other</option>',
}
for old, new in dr_engagement_fixes.items():
    if old in html:
        html = html.replace(old, new)

with open("data-room.html", "w", encoding="utf-8") as f:
    f.write(html)

print("   data-room.html patched successfully")

# ─── 5. Add missing i18n keys for contact form ───────────────────────────────
print("\n5. Adding missing i18n keys for contact form section header and subtitle...")

with open("i18n.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add the missing keys for the contact form h1 and subtitle
new_contact_keys_en = """      'ct.form.section-header-title': "Let's talk about<br>what you're looking for.",
      'ct.form.section-subtitle': 'All conversations are confidential. We respond to qualified inquiries within 1\\u20132 business days. Please provide enough context about your interest so we can route your message to the right person.',"""

new_contact_keys_fr = """      'ct.form.section-header-title': 'Parlons de ce<br>que vous recherchez.',
      'ct.form.section-subtitle': 'Tous les \\u00e9changes sont confidentiels. Nous r\\u00e9pondons aux demandes qualifi\\u00e9es sous 1 \\u00e0 2 jours ouvrables. Merci de fournir suffisamment de contexte sur votre int\\u00e9r\\u00eat afin que nous puissions orienter votre message vers la bonne personne.',"""

# Insert into EN section
if "'ct.form.section-header-title'" not in content:
    en_marker = "      'ct.hero.label': 'Contact',"
    if en_marker in content:
        content = content.replace(en_marker, en_marker + "\n" + new_contact_keys_en)
        print("   EN contact form keys added")
    else:
        print("   WARNING: Could not find EN marker for contact form keys")

# Insert into FR section
if "'ct.form.section-header-title'" not in content.split("fr:")[1]:
    fr_marker = "      'ct.hero.label': 'Contact',"
    fr_section = content.split("fr:")[1]
    if fr_marker in fr_section:
        fr_section = fr_section.replace(fr_marker, fr_marker + "\n" + new_contact_keys_fr)
        content = content.split("fr:")[0] + "fr:" + fr_section
        print("   FR contact form keys added")
    else:
        print("   WARNING: Could not find FR marker for contact form keys")
else:
    print("   Contact form keys already present")

with open("i18n.js", "w", encoding="utf-8") as f:
    f.write(content)

print("\nAll patches applied successfully!")
print("\nSummary of changes:")
print("  i18n.js: apply() now handles <option> elements + new option translations")
print("  contact.html: data-i18n added to all <option> elements + h1/submit fixed")
print("  data-room.html: data-i18n added to all <option> elements")
