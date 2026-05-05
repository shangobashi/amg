#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def screenshot_rs():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()
        
        await page.goto("https://am.issalabs.xyz/responsible-sourcing.html",
                       wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(500)
        
        # Take screenshots at different scroll positions
        positions = [
            (0, "rs_top"),
            (844, "rs_mercury"),
            (1688, "rs_esg"),
            (2532, "rs_trace"),
            (3376, "rs_cta"),
        ]
        
        for scroll_y, name in positions:
            await page.evaluate(f"window.scrollTo(0, {scroll_y})")
            await page.wait_for_timeout(300)
            path = f"mobile_shots/{name}_fresh.png"
            await page.screenshot(path=path)
            print(f"Saved: {path}")
        
        await browser.close()
        print("Done!")

asyncio.run(screenshot_rs())
