#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def screenshot_drawer():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        
        await page.goto("https://am.issalabs.xyz/",
                       wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(500)
        
        # Open the hamburger menu
        hamburger = page.locator('.nav__mobile-toggle')
        if await hamburger.is_visible():
            await hamburger.click()
            await page.wait_for_timeout(500)
        
        # Screenshot the drawer open
        await page.screenshot(path="mobile_shots/drawer_open_before.png")
        print("Drawer open screenshot saved")
        
        # Also get the bounding boxes of the drawer elements
        elements = await page.evaluate("""() => {
          const drawer = document.querySelector('.nav__controls');
          const langToggle = drawer ? drawer.querySelector('.lang-toggle') : null;
          const cta = drawer ? drawer.querySelector('.nav__cta') : null;
          const links = drawer ? drawer.querySelector('.nav__links') : null;
          const drawerRect = drawer ? drawer.getBoundingClientRect() : null;
          const langRect = langToggle ? langToggle.getBoundingClientRect() : null;
          const ctaRect = cta ? cta.getBoundingClientRect() : null;
          const linksRect = links ? links.getBoundingClientRect() : null;
          return {
            drawer: drawerRect ? {top: Math.round(drawerRect.top), bottom: Math.round(drawerRect.bottom), height: Math.round(drawerRect.height)} : null,
            langToggle: langRect ? {top: Math.round(langRect.top), bottom: Math.round(langRect.bottom), height: Math.round(langRect.height)} : null,
            cta: ctaRect ? {top: Math.round(ctaRect.top), bottom: Math.round(ctaRect.bottom), height: Math.round(ctaRect.height)} : null,
            links: linksRect ? {top: Math.round(linksRect.top), bottom: Math.round(linksRect.bottom), height: Math.round(linksRect.height)} : null,
          };
        }""")
        
        print(f"Drawer: {elements.get('drawer')}")
        print(f"Nav links: {elements.get('links')}")
        print(f"Lang toggle: {elements.get('langToggle')}")
        print(f"CTA: {elements.get('cta')}")
        
        if elements.get('langToggle') and elements.get('cta'):
            gap = elements['cta']['top'] - elements['langToggle']['bottom']
            print(f"Gap between lang-toggle bottom and CTA top: {gap}px")
        
        await browser.close()

asyncio.run(screenshot_drawer())
