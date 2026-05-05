"""
Targeted responsive CSS fixes for the Afriplan site.
Addresses: form inputs (iOS zoom), overflow, footer tablet, hero mobile, CTA buttons.
Does NOT change the hero-bg-3d.js or approved desktop layout.
"""

import os

WEBSITE_DIR = "C:/Users/Shango/Documents/Code/bisimwamines/website"
CSS_PATH = os.path.join(WEBSITE_DIR, "styles.css")


FIXES = [
    # =====================================================================
    # FIX 1: FORM INPUTS — iOS 16px zoom prevention
    # =====================================================================
    # Form inputs at desktop are 0.9375rem (15px) which triggers iOS zoom on focus.
    # Change to 16px on mobile (< 768px) to prevent zoom.
    {
        "at": "  .form-input:focus,\n  .form-select:focus,\n  .form-textarea:focus {\n    border-color: var(--accent-muted);\n    box-shadow: 0 0 0 3px var(--accent-dim);\n  }",
        "insert_after": "  .form-input:focus,\n  .form-select:focus,\n  .form-textarea:focus {\n    border-color: var(--accent-muted);\n    box-shadow: 0 0 0 3px var(--accent-dim);\n  }",
        "new_block": """  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: var(--accent-muted);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  /* iOS zoom prevention: inputs must be >= 16px */
  @media (max-width: 768px) {
    .form-input,
    .form-select,
    .form-textarea {
      font-size: 16px !important;
      min-height: 44px;
    }

    .form-textarea {
      min-height: 120px;
    }

    /* Submit button full-width on small phones */
    button[type="submit"],
    .form-section button[type="submit"] {
      width: 100%;
      min-height: 48px;
    }
  }""",
    },

    # =====================================================================
    # FIX 2: STAT BLOCKS — prevent overflow on mid-size tablets
    # =====================================================================
    # The stats-row uses repeat(4, 1fr) which can overflow at ~900px tablets.
    # Add a tablet breakpoint at 900px.
    {
        "at": "@media (max-width: 768px) {",
        "insert_at": "@media (max-width: 1024px) {",
        "new_block": """/* Tablet: 4-col stats becomes 2-col */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {""",
    },

    # =====================================================================
    # FIX 3: FOOTER TABLET — explicit column wrapping
    # =====================================================================
    # At tablet (768px-1024px), footer columns should wrap more gracefully.
    # The existing CSS has flex-wrap:wrap but no explicit column widths.
    {
        "at": "@media (max-width: 768px) {\n  /* ── FOOTER MOBILE ───────────────────────────────────────────────────────── */\n\n  .footer {\n    padding: var(--space-10) 0 var(--space-6) !important;\n  }\n\n  .footer__inner {\n    flex-direction: column !important;\n    gap: var(--space-8) !important;\n    align-items: flex-start !important;\n  }\n\n  .footer__links {\n    flex-wrap: wrap !important;\n    gap: var(--space-3) var(--space-5) !important;\n  }\n\n  .footer__bottom {\n    flex-direction: column !important;\n    gap: var(--space-3) !important;\n    align-items: flex-start !important;\n  }",
        "insert_after": """@media (max-width: 768px) {
  /* ── FOOTER MOBILE ───────────────────────────────────────────────────────── */

  .footer {
    padding: var(--space-10) 0 var(--space-6) !important;
  }

  .footer__inner {
    flex-direction: column !important;
    gap: var(--space-8) !important;
    align-items: flex-start !important;
  }

  /* Footer brand first on mobile */
  .footer__brand {
    max-width: 100% !important;
  }

  /* Footer links: 2-column grid on mobile */
  .footer__links {
    display: grid !important;
    grid-template-columns: repeat(2, auto) !important;
    gap: var(--space-3) var(--space-8) !important;
    flex-wrap: unset !important;
  }

  .footer__bottom {
    flex-direction: column !important;
    gap: var(--space-3) !important;
    align-items: flex-start !important;
  }""",
    },

    # =====================================================================
    # FIX 4: HERO MOBILE HEIGHT — ensure minimum 720px on all mobile
    # =====================================================================
    {
        "at": "@media (max-width: 768px) {",
        "insert_at": "  /* Hero minimum height on mobile: prevent too-short heroes on mobile browsers */\n  .hero {\n    min-height: min(760px, 100svh) !important;\n  }\n\n@media (max-width: 768px) {",
    },

    # =====================================================================
    # FIX 5: BUTTON MIN-HEIGHT — 44px tap target on mobile
    # =====================================================================
    {
        "at": "@media (max-width: 768px) {\n  /* ── BUTTONS MOBILE ─────────────────────────────────────────────────────── */\n\n  .btn {\n    padding: 11px var(--space-5) !important;\n    font-size: 0.9375rem !important;\n  }",
        "insert_after": """@media (max-width: 768px) {
  /* ── BUTTONS MOBILE ─────────────────────────────────────────────────────── */

  .btn {
    padding: 12px var(--space-5) !important;
    font-size: 0.9375rem !important;
    min-height: 44px !important;
  }

  .btn--lg {
    padding: 14px var(--space-6) !important;
    min-height: 48px !important;
  }

  .btn--primary,
  .btn--secondary {
    min-height: 46px !important;
  }""",
    },

    # =====================================================================
    # FIX 6: MINERAL TILES — prevent overflow, ensure readable widths
    # =====================================================================
    {
        "at": "@media (max-width: 768px) {\n  /* ── MINERAL GRID MOBILE ─────────────────────────────────────────────────── */\n\n  .mineral-grid {\n    grid-template-columns: 1fr !important;\n    gap: var(--space-4) !important;\n  }",
        "insert_after": """@media (max-width: 768px) {
  /* ── MINERAL GRID MOBILE ─────────────────────────────────────────────────── */

  .mineral-grid {
    grid-template-columns: 1fr !important;
    gap: var(--space-4) !important;
  }

  /* Prevent mineral tiles from overflowing */
  .mineral-tile {
    overflow: hidden;
    word-break: break-word;
  }

  .mineral-tile__grade {
    font-size: 1.125rem !important;
  }

  .mineral-tile__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }""",
    },

    # =====================================================================
    # FIX 7: CONTAINER — prevent overflow on very small phones
    # =====================================================================
    {
        "at": "@media (max-width: 768px) {\n  .container,\n  .container--narrow {\n    padding: 0 var(--space-5) !important;\n  }",
        "insert_after": """@media (max-width: 768px) {
  /* Ensure containers never overflow viewport */
  .container,
  .container--narrow {
    padding: 0 var(--space-5) !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  /* Root overflow prevention */
  html {
    overflow-x: hidden;
  }""",
    },

    # =====================================================================
    # FIX 8: OPPORTUNITIES PAGE — tablet grid fix
    # =====================================================================
    # The opportunities grid should go 2-col -> 1-col on tablet -> mobile
    {
        "at": "@media (max-width: 768px) {\n  /* ── RESPONSIBLE SOURCING MOBILE ──────────────────────────────────────────── */\n\n  .commitment-grid {\n    grid-template-columns: 1fr !important;\n    gap: var(--space-4) !important;\n  }",
        "insert_after": """/* Tablet: opportunity/mineral grids go 2-col */
@media (max-width: 1024px) {
  .mineral-grid,
  .opportunities-grid,
  .esg-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {
  /* ── RESPONSIBLE SOURCING MOBILE ──────────────────────────────────────────── */

  .commitment-grid {
    grid-template-columns: 1fr !important;
    gap: var(--space-4) !important;
  }

  /* Opportunity tiles collapse on mobile */
  .mineral-grid,
  .opportunities-grid {
    grid-template-columns: 1fr !important;
  }""",
    },

    # =====================================================================
    # FIX 9: CONTACT PAGE — form field widths on mobile
    # =====================================================================
    {
        "at": "@media (max-width: 768px) {\n  /* ── FORMS MOBILE ─────────────────────────────────────────────────────────── */\n\n  .form-group {\n    margin-bottom: var(--space-4) !important;\n  }\n\n  input[type=\"text\"],\n  input[type=\"email\"],\n  input[type=\"tel\"],\n  input[type=\"url\"],\n  select,\n  textarea {\n    width: 100% !important;\n    padding: 10px var(--space-3) !important;\n    font-size: 0.9375rem !important;\n  }",
        "insert_after": """@media (max-width: 768px) {
  /* ── FORMS MOBILE ─────────────────────────────────────────────────────────── */

  .form-group {
    margin-bottom: var(--space-4) !important;
  }

  /* Ensure form inputs never exceed viewport */
  .form-input,
  .form-select,
  .form-textarea,
  input[type="text"],
  input[type="email"],
  input[type="tel"],
  input[type="url"],
  select,
  textarea {
    width: 100% !important;
    max-width: 100% !important;
    font-size: 16px !important;  /* iOS zoom prevention */
    min-height: 44px;
    padding: 11px var(--space-3) !important;
  }

  textarea {
    min-height: 120px !important;
  }

  /* Form layout: 1-col on mobile */
  .form-grid,
  .form-row {
    grid-template-columns: 1fr !important;
  }""",
    },
]


def apply_fixes():
    with open(CSS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    applied = 0

    for fix in FIXES:
        at_str = fix["at"]
        new_block = fix["new_block"]

        if at_str in content:
            # Check if the new block is already present
            if new_block in content:
                print(f"  SKIP (already present): {at_str[:60]}...")
                continue

            # Check if the fix's "insert_after" marker is present
            insert_after = fix.get("insert_after", at_str)
            if fix.get("insert_at") and (fix["insert_at"] in content):
                # Insert at a different location
                insert_at = fix["insert_at"]
                content = content.replace(insert_at, new_block + "\n" + insert_at, 1)
                print(f"  APPLIED (insert_at): {insert_at[:60]}...")
            elif at_str in content and fix.get("insert_after") and (fix["insert_after"] not in content):
                # Replace the "at" block with itself + new block after
                content = content.replace(at_str, at_str + "\n" + new_block, 1)
                print(f"  APPLIED (append after at): {at_str[:60]}...")
            elif fix.get("insert_after") and (fix["insert_after"] in content):
                # Insert after the insert_after marker
                marker = fix["insert_after"]
                content = content.replace(marker, marker + "\n" + new_block, 1)
                print(f"  APPLIED (insert_after): {marker[:60]}...")
            else:
                # Replace the "at" block
                content = content.replace(at_str, new_block, 1)
                print(f"  APPLIED (replace): {at_str[:60]}...")
            applied += 1
        else:
            print(f"  SKIP (not found): {at_str[:60]}...")

    if content != original:
        with open(CSS_PATH, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n  WROTE: {CSS_PATH}")
        return True
    else:
        print("\n  NO CHANGES - CSS already up to date")
        return False


def main():
    print("=" * 60)
    print("TARGETED RESPONSIVE CSS FIXES")
    print("=" * 60)
    print()
    apply_fixes()
    print()
    print("Done.")


if __name__ == "__main__":
    main()
