#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def screenshot_rs_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=[
            '--disable-web-security',
            '--force-device-scale-factor=1',
        ])
        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=1,
            is_mobile=True,
            has_touch=True,
        )
        page = await ctx.new_page()
        
        await page.goto("https://am.issalabs.xyz/responsible-sourcing.html",
                       wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        
        # Take full page screenshot
        await page.screenshot(path="mobile_shots/rs_fullpage_playwright.png", full_page=True)
        print("Full page screenshot saved")
        
        # Also check specific elements that might overflow
        await page.set_viewport_size({"width": 390, "height": 844})
        
        # Check the policy-card checklist items
        checks = await page.evaluate("""() => {
          const items = [...document.querySelectorAll('.checklist__item, .check-list__item, .checklist li')]
            .map(el => {
              const r = el.getBoundingClientRect();
              return {
                text: el.textContent.trim().slice(0, 50),
                left: Math.round(r.left),
                right: Math.round(r.right),
                width: Math.round(r.width)
              };
            });
          return items;
        }""")
        
        print(f"\\nChecklist items ({len(checks)} total):")
        for item in checks[:10]:
            print(f"  '{item['text']}' L={item['left']} R={item['right']} W={item['width']}")
        
        # Check the document card spans
        spans = await page.evaluate("""() => {
          const items = [...document.querySelectorAll('.section span')]
            .map(el => {
              const r = el.getBoundingClientRect();
              if (r.width < 1 || r.height < 1) return null;
              return {
                text: el.textContent.trim().slice(0, 60),
                left: Math.round(r.left),
                right: Math.round(r.right),
                width: Math.round(r.width)
              };
            })
            .filter(x => x && x.right > 391)
            .slice(0, 10);
          return items;
        }""")
        
        if spans:
            print(f"\\nSpans overflowing (right > 391):")
            for s in spans:
                print(f"  '{s['text']}' L={s['left']} R={s['right']} W={s['width']}")
        else:
            print("\\nNo overflowing spans found.")
        
        await browser.close()

asyncio.run(screenshot_rs_all())
