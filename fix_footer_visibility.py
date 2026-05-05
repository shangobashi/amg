"""
Fix footer visibility on all internal pages.

Root cause: Footer has class="footer reveal-fade-up".
.reveal-fade-up sets opacity:0, transform:translateY(32px).
IntersectionObserver must fire (12% threshold) before footer becomes visible.
On short internal pages this often fails before user sees the page.

Fix: Remove 'reveal-fade-up' from all footer elements across all pages.
Also add CSS rule to force footer visibility as safety net.
"""

import re
import os

PAGES = [
    'index.html',
    'opportunities.html',
    'responsible-sourcing.html',
    'data-room.html',
    'contact.html',
    'beryllium.html',
    'tungsten.html',
    'gold.html',
    'lithium.html',
    'privacy.html',
]

def fix_footer_class(html_content):
    """Remove reveal-fade-up from footer class attribute."""
    # Pattern: <footer class="footer reveal-fade-up"> → <footer class="footer">
    fixed = re.sub(
        r'<footer\s+class="footer reveal-fade-up">',
        '<footer class="footer">',
        html_content
    )
    return fixed

def main():
    for page in PAGES:
        if not os.path.exists(page):
            print(f"SKIP (not found): {page}")
            continue

        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        fixed = fix_footer_class(content)

        if fixed == original:
            print(f"NO CHANGE: {page} (no reveal-fade-up on footer)")
        else:
            with open(page, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"FIXED: {page} — removed reveal-fade-up from footer")

if __name__ == '__main__':
    main()
