import asyncio
from playwright.async_api import async_playwright
import os
import json

SITE = "https://am.issalabs.xyz"
VP_WIDTH = 390
VP_HEIGHT = 844
OUT_DIR = "C:/Users/Shango/Documents/Code/bisimwamines/website/mobile_shots"

PAGES = [
    {"url": f"{SITE}/opportunities.html", "name": "opportunities"},
    {"url": f"{SITE}/responsible-sourcing.html", "name": "responsible-sourcing"},
    {"url": f"{SITE}/contact.html", "name": "contact"},
    {"url": f"{SITE}/data-room.html", "name": "data-room"},
    {"url": f"{SITE}/", "name": "homepage"},
]

async def run_test():
    os.makedirs(OUT_DIR, exist_ok=True)
    results = {}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": VP_WIDTH, "height": VP_HEIGHT},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        page = await context.new_page()
        
        for page_info in PAGES:
            name = page_info["name"]
            url = page_info["url"]
            print(f"\n{'='*60}")
            print(f"Testing: {name}")
            print(f"{'='*60}")
            
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(1.5)  # Let animations settle
                
                # Take full page screenshot
                full_path = f"{OUT_DIR}/{name}_full.png"
                await page.screenshot(path=full_path, full_page=True)
                print(f"  Full page screenshot: {full_path}")
                
                # Run overflow diagnostic
                overflow_detail = await page.evaluate("""
                    () => {
                        const getClass = (el) => {
                            try { return String(el.className || '').slice(0,80); } catch(e) { return ''; }
                        };
                        const offenders = [...document.querySelectorAll("body *")].map(el => { 
                            const r = el.getBoundingClientRect(); 
                            const style = window.getComputedStyle(el);
                            return { 
                                tag: el.tagName, 
                                cls: getClass(el), 
                                left: Math.round(r.left), 
                                right: Math.round(r.right), 
                                width: Math.round(r.width),
                                display: style.display.slice(0,20),
                                float: style.float.slice(0,10)
                            }; 
                        }).filter(x => x.right > 391 || x.left < -1);
                        return offenders;
                    }
                """)
                
                print(f"  Overflow elements: {len(overflow_detail)}")
                
                # Get element layout info
                layout_info = await page.evaluate("""
                    () => {
                        const info = {};
                        
                        // CTA buttons - find buttons in CTA areas
                        const ctaBtns = document.querySelectorAll('.cta-band__actions *, .cta-actions *, .cta a, .cta button, [class*="cta"] a, [class*="cta"] button');
                        info.cta_buttons = [];
                        ctaBtns.forEach(btn => {
                            const r = btn.getBoundingClientRect();
                            if (r.width > 0 && r.height > 0) {
                                info.cta_buttons.push({x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
                            }
                        });
                        
                        // Mineral tiles
                        const mineralTiles = document.querySelectorAll('.mineral-tile, .mineral-item, .mineral-grade-card, [class*="mineral-tile"], [class*="mineral_card"]');
                        info.mineral_tiles = [];
                        mineralTiles.forEach(tile => {
                            const r = tile.getBoundingClientRect();
                            if (r.width > 0 && r.height > 0) {
                                info.mineral_tiles.push({x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
                            }
                        });
                        
                        // Form fields
                        const fields = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
                        info.form_fields = [];
                        fields.forEach(fld => {
                            const r = fld.getBoundingClientRect();
                            if (r.width > 0 && r.height > 0) {
                                info.form_fields.push({x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
                            }
                        });
                        
                        // Policy cards
                        const cards = document.querySelectorAll('.policy-card, .esg-card, .card, [class*="policy-card"], [class*="esg-card"]');
                        info.policy_cards = [];
                        cards.forEach(card => {
                            const r = card.getBoundingClientRect();
                            if (r.width > 0 && r.height > 0) {
                                info.policy_cards.push({x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
                            }
                        });
                        
                        // Footer links
                        const footer = document.querySelector('footer');
                        if (footer) {
                            const r = footer.getBoundingClientRect();
                            info.footer = {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)};
                        }
                        
                        return info;
                    }
                """)
                
                # Take scroll screenshots
                page_height = await page.evaluate("document.body.scrollHeight")
                for pos in [0, page_height // 3, page_height * 2 // 3]:
                    await page.evaluate(f"window.scrollTo(0, {pos})")
                    await asyncio.sleep(0.3)
                    shot_path = f"{OUT_DIR}/{name}_scroll_{pos}.png"
                    await page.screenshot(path=shot_path)
                
                await page.evaluate("window.scrollTo(0, 0)")
                
                results[name] = {
                    "url": url,
                    "full_screenshot": full_path,
                    "overflow_count": len(overflow_detail),
                    "overflow_elements": overflow_detail[:15],
                    "layout_info": layout_info
                }
                
            except Exception as e:
                print(f"  ERROR: {e}")
                results[name] = {"url": url, "error": str(e)}
        
        await browser.close()
    
    # Save results
    results_path = f"{OUT_DIR}/test_results.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n\nResults saved to: {results_path}")
    
    return results

if __name__ == "__main__":
    results = asyncio.run(run_test())
    
    # Print summary
    print("\n" + "="*70)
    print("MOBILE TEST SUMMARY (390x844 - iPhone 12 Pro)")
    print("="*70)
    
    for name, data in results.items():
        print(f"\n{name.upper()}")
        print(f"  URL: {data.get('url', 'N/A')}")
        
        if "error" in data:
            print(f"  ERROR: {data['error']}")
            continue
            
        print(f"  Screenshot: {data.get('full_screenshot', 'N/A')}")
        print(f"  Overflow elements: {data.get('overflow_count', 'N/A')}")
        
        layout = data.get("layout_info", {})
        
        # Analyze CTA buttons
        cta_buttons = layout.get("cta_buttons", [])
        if cta_buttons:
            x_positions = sorted(set(b["x"] for b in cta_buttons))
            y_positions = sorted(set(b["y"] for b in cta_buttons))
            if len(y_positions) > 1:
                print(f"  CTA buttons: STACKED (y positions: {y_positions[:5]})")
            else:
                print(f"  CTA buttons: SIDE-BY-SIDE (x positions: {x_positions[:5]})")
        else:
            print(f"  CTA buttons: not found on page")
        
        # Analyze mineral tiles
        tiles = layout.get("mineral_tiles", [])
        if tiles:
            x_positions = sorted(set(t["x"] for t in tiles))
            y_positions = sorted(set(t["y"] for t in tiles))
            if len(x_positions) == 1 and len(y_positions) > 1:
                print(f"  Mineral tiles: 1-COLUMN ({len(tiles)} tiles)")
            elif len(x_positions) > 1:
                print(f"  Mineral tiles: 2-COLUMN (x: {x_positions[:4]})")
            else:
                print(f"  Mineral tiles: ambiguous ({len(tiles)} tiles at x: {x_positions})")
        else:
            print(f"  Mineral tiles: not found on page")
        
        # Analyze form fields
        fields = layout.get("form_fields", [])
        if fields:
            x_positions = sorted(set(f["x"] for f in fields))
            widths = sorted(set(f["w"] for f in fields))
            if len(x_positions) == 1:
                print(f"  Form fields: FULL WIDTH (x={x_positions[0]}, w={widths})")
            else:
                print(f"  Form fields: 2-COLUMN (x positions: {x_positions})")
        else:
            print(f"  Form fields: not found on page")
        
        # Analyze policy cards
        cards = layout.get("policy_cards", [])
        if cards:
            x_positions = sorted(set(c["x"] for c in cards))
            if len(x_positions) == 1:
                print(f"  Policy cards: 1-COLUMN")
            else:
                print(f"  Policy cards: 2-COLUMN (x: {x_positions})")
        else:
            print(f"  Policy cards: not found on page")
        
        # Overflow elements
        offenders = data.get("overflow_elements", [])
        if offenders:
            print(f"  Overflow details:")
            for o in offenders[:5]:
                print(f"    - {o['tag']}.{o['cls'][:40]} left={o['left']} right={o['right']} w={o['width']}")
        
        # Pass/Fail
        status = "PASS" if data.get("overflow_count", -1) == 0 else "FAIL"
        print(f"  Status: {status}")