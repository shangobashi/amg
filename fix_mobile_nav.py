"""
Fix mobile navbar: Move .nav__mobile-toggle INSIDE .nav__controls in all HTML files.

CSS fix: At 768px, .nav__controls uses display:contents so it takes no space,
and .nav__controls .nav__mobile-toggle becomes flex with margin-left:auto to push right.

Also: at 768px, also hide .nav__controls .lang-toggle and .nav__controls .nav__cta
(which are NOT targeted by the .nav__inner > selector).
"""

import re
import os

WEBSITE_DIR = "C:/Users/Shango/Documents/Code/bisimwamines/website"
HTML_FILES = [
    "index.html", "opportunities.html", "responsible-sourcing.html",
    "data-room.html", "contact.html", "privacy.html",
    "beryllium.html", "tungsten.html", "gold.html", "lithium.html"
]


def fix_html_files():
    """Move mobile toggle inside nav__controls in all HTML files."""
    for filename in HTML_FILES:
        filepath = os.path.join(WEBSITE_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Current: </div><!-- end .nav__controls -->  followed by  <button class="nav__mobile-toggle">
        # Target:  </div><!-- end .nav__controls -->  (remove the toggle from here)
        #          <div class="nav__controls">
        #            ...existing content (lang-toggle + nav__cta)...
        #            <button class="nav__mobile-toggle">  <- INSERT HERE
        #          </div>
        # But we want the toggle INSIDE nav__controls, not as a sibling.

        # Pattern: close of nav__controls div followed by toggle button (siblings)
        # We need to find where nav__controls closes and toggle begins,
        # then move the toggle INSIDE nav__controls

        # The nav__controls div closes with: </div><!-- end .nav__controls -->
        # (or just </div> after nav__controls content)
        # Then immediately after is <button class="nav__mobile-toggle"

        old_pattern = re.compile(
            r'(</div><!--\s*end\s+\.nav__controls\s*-->)(\s*)(<button class="nav__mobile-toggle")',
            re.DOTALL
        )

        # Insert the toggle INSIDE nav__controls, right before its closing </div>
        # But wait - the toggle comes AFTER nav__controls closes.
        # We need to move the closing </div> of nav__controls to AFTER the toggle.
        # Actually: move the toggle BEFORE the closing </div> of nav__controls.

        replacement = r'''\1\2<div class="nav__mobile-toggle" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </div><!-- end .nav__controls --- FIXED: mobile-toggle moved inside -->
      <!-- REMOVED: <button class="nav__mobile-toggle" below was moved inside nav__controls -->'''

        content, n = old_pattern.subn(replacement, content)

        if n == 0:
            # Try simpler: just </div> followed by <button class="nav__mobile-toggle"
            old2 = re.compile(
                r'(</div>)(\s*)(<button class="nav__mobile-toggle")',
                re.DOTALL
            )
            def make_replacement_2(m):
                closing_div = m.group(1)
                whitespace = m.group(2)
                toggle = m.group(3)
                return closing_div + whitespace + toggle  # keep as-is, we'll handle differently
            content, n = old2.subn(make_replacement_2, content)

        # Now remove the standalone toggle button (it's been moved inside)
        # It looks like: <button class="nav__mobile-toggle" aria-label="Toggle menu" aria-expanded="false">
        #        <span></span><span></span><span></span>
        #      </button>
        standalone_toggle = re.compile(
            r'\s*<!--\s*REMOVED:[^-]*-->\s*<button class="nav__mobile-toggle"[^>]*>.*?</button>\s*',
            re.DOTALL
        )
        content, n2 = standalone_toggle.subn('', content)

        if n == 0 and n2 == 0:
            print(f"  SKIP: {filename} (toggle may already be inside nav__controls or pattern not found)")
            continue

        # Actually, let me just try the most reliable approach:
        # Find the nav__controls closing div and the toggle button that follows,
        # and put the toggle INSIDE nav__controls
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Use line-based approach for reliability
        lines = content.split('\n')
        new_lines = []
        i = 0
        toggle_block = []
        in_toggle = False
        found_toggle_after_controls = False

        while i < len(lines):
            line = lines[i]

            # Detect toggle block
            if '<button class="nav__mobile-toggle"' in line:
                in_toggle = True

            if in_toggle:
                toggle_block.append(line)
                if '</button>' in line:
                    in_toggle = False
                    # Skip this block - we'll insert it inside nav__controls later
                    toggle_html = '\n'.join(toggle_block)
                    toggle_block = []
                    found_toggle_after_controls = True
                    continue
            else:
                new_lines.append(line)

                # When we hit the closing div of nav__controls, insert the toggle inside
                if '</div>' in line and i > 0:
                    # Check if this is the nav__controls close
                    # Look at surrounding context
                    context = '\n'.join(new_lines[-5:])
                    if 'nav__controls' in context or 'nav__cta' in context:
                        # Insert toggle here (inside nav__controls)
                        indent = ' ' * (len(line) - len(line.lstrip()))
                        new_lines.append(indent + toggle_html)
                        toggle_html = ''
                        found_toggle_after_controls = False

            i += 1

        if toggle_block:
            # Toggle wasn't placed - append it (fallback)
            new_lines.extend(toggle_block)

        new_content = '\n'.join(new_lines)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"  FIXED: {filename}")
        else:
            print(f"  UNCHANGED: {filename}")


def fix_css():
    """Fix styles.css for mobile nav.

    Key changes:
    1. At 768px: .nav__controls { display: contents } so it takes no visual space
    2. At 768px: .nav__controls .nav__mobile-toggle { display: flex !important; margin-left: auto; }
       This makes the hamburger appear as a flex item pushed to the right.
    3. At 768px: .nav__controls .lang-toggle { display: none } and .nav__controls .nav__cta { display: none }
       (These should already be handled but let's be explicit)
    4. When nav--open: show .nav__controls .lang-toggle and .nav__controls .nav__cta
    """
    css_path = os.path.join(WEBSITE_DIR, "styles.css")
    with open(css_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # FIX 1: In the second @media (max-width: 768px) block,
    # add .nav__controls { display: contents; }
    # right before .nav__inner { flex-wrap: wrap; }
    old_nav_inner = """  .nav__inner {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  /* Logo + hamburger on same row */
  .nav__logo {
    order: 1;
    flex: 1;
  }

  .nav__mobile-toggle {
    display: flex !important;
    order: 2;
    margin-left: auto;
  }"""

    new_nav_inner = """  .nav__inner {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  /* Logo + hamburger on same row */
  .nav__logo {
    order: 1;
    flex: 1;
  }

  /* nav__controls takes no visual space at mobile; lang-toggle and nav__cta inside it are hidden */
  .nav__controls {
    display: contents;
  }

  .nav__controls .nav__mobile-toggle {
    display: flex !important;
    order: 2;
    margin-left: auto;
  }

  /* Hide lang-toggle and nav__cta inside nav__controls at mobile */
  .nav__controls .lang-toggle,
  .nav__controls .nav__cta {
    display: none;
  }

  /* Language toggle and CTA shown in open drawer */
  .nav--open .nav__controls .lang-toggle,
  .nav--open .nav__controls .nav__cta {
    display: flex;
  }

  /* nav__controls itself becomes visible when open (to show its contents) */
  .nav--open .nav__controls {
    display: flex;
    flex-direction: column;
    order: 3;
    width: 100%;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-subtle);
    margin-top: var(--space-2);
  }"""

    if old_nav_inner in content:
        content = content.replace(old_nav_inner, new_nav_inner)
        print("  CSS FIX 1: Added nav__controls { display: contents } + proper toggle/CTA drawer rules")
    else:
        print("  WARNING: Could not find old_nav_inner pattern in CSS")

    # FIX 2: Update the drawer open state to also show nav__controls
    old_open_state = """  /* Drawer: shown when open */
  .nav--open .nav__links,
  .nav--open .nav__cta,
  .nav--open .nav__inner > .lang-toggle {
    display: flex;
  }"""

    new_open_state = """  /* Drawer: shown when open */
  .nav--open .nav__links {
    display: flex;
  }

  /* nav__controls visible in open state (shows lang-toggle + CTA inside) */
  .nav--open .nav__controls {
    display: flex;
    flex-direction: column;
    order: 3;
    width: 100%;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-subtle);
    margin-top: var(--space-2);
    gap: var(--space-1);
  }

  .nav--open .nav__cta,
  .nav--open .nav__inner > .lang-toggle {
    display: flex;
  }"""

    if old_open_state in content:
        content = content.replace(old_open_state, new_open_state)
        print("  CSS FIX 2: Updated nav--open drawer state")
    else:
        print("  WARNING: Could not find old_open_state pattern")

    if content != original:
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    print("=" * 60)
    print("MOBILE NAV STRUCTURAL FIX")
    print("=" * 60)

    print("\n--- Fixing HTML ---")
    # The HTML fix is complex; let me do a simple targeted replacement
    for filename in HTML_FILES:
        filepath = os.path.join(WEBSITE_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Find the line with </div><!-- end .nav__controls --> and the following toggle
        new_lines = []
        i = 0
        toggle_lines = []
        in_toggle = False
        toggle_found = False
        nav_controls_closed = False

        while i < len(lines):
            line = lines[i]

            # Detect toggle block start
            if '<button class="nav__mobile-toggle"' in line and not in_toggle:
                in_toggle = True
                toggle_found = True

            if in_toggle:
                toggle_lines.append(line)
                if '</button>' in line:
                    in_toggle = False
                    # Skip adding this now - we'll add it inside nav__controls
                    i += 1
                    continue
            else:
                new_lines.append(line)

                # After we see </div> (closing nav__controls), insert toggle inside
                if '</div>' in line and i + 1 < len(lines):
                    next_line = lines[i + 1]
                    if 'nav__controls' in ''.join(new_lines[-3:]) or 'nav__cta' in ''.join(new_lines[-3:]):
                        if toggle_lines:
                            new_lines.extend(toggle_lines)
                            toggle_lines = []

            i += 1

        # Add any remaining toggle lines
        if toggle_lines:
            new_lines.extend(toggle_lines)

        if toggle_found:
            new_content = ''.join(new_lines)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"  FIXED: {filename}")
        else:
            print(f"  NO TOGGLE: {filename} (may already be inside)")

    print("\n--- Fixing CSS ---")
    fix_css()
    print("\nDone.")


if __name__ == "__main__":
    main()
