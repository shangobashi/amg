#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def drawer_after():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        
        await page.goto("https://am.issalabs.xyz/",
                       wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(500)
        
        # Open hamburger
        await page.locator('.nav__mobile-toggle').click()
        await page.wait_for_timeout(600)
        
        # Screenshot
        await page.screenshot(path="mobile_shots/drawer_open_after.png")
        print("After screenshot saved")
        
        # Measure gap
        elements = await page.evaluate("""() => {
          const drawer = document.querySelector('.nav__controls');
          const langToggle = drawer ? drawer.querySelector('.lang-toggle') : null;
          const cta = drawer ? drawer.querySelector('.nav__cta') : null;
          const langRect = langToggle ? langToggle.getBoundingClientRect() : null;
          const ctaRect = cta ? cta.getBoundingClientRect() : null;
          return {
            langToggle: langRect ? {top: Math.round(langRect.top), bottom: Math.round(langRect.bottom), height: Math.round(langRect.height)} : null,
            cta: ctaRect ? {top: Math.round(ctaRect.top), bottom: Math.round(ctaRect.bottom), height: Math.round(ctaRect.height)} : null,
          };
        }""")
        
        print(f"Lang toggle: {elements.get('langToggle')}")
        print(f"CTA: {elements.get('cta')}")
        
        if elements.get('langToggle') and elements.get('cta'):
            gap = elements['cta']['top'] - elements['langToggle']['bottom']
            print(f"Gap between lang-toggle bottom and CTA top: {gap}px")
            if gap >= 20:
                print(f"GOOD - breathing room increased from 13px to {gap}px")
            else:
                print(f"NOTE - gap is {gap}px")
        
        # Also test FR language
        await page.locator('[data-lang="fr"]').first.click()
        await page.wait_for_timeout(300)
        await page.screenshot(path="mobile_shots/drawer_open_fr_after.png")
        print("FR drawer screenshot saved")
        
        await browser.close()

asyncio.run(drawer_after())
