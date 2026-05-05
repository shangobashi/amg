#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

PAGES = [
    ("https://am.issalabs.xyz/beryllium.html", "beryllium_mobile.png"),
    ("https://am.issalabs.xyz/gold.html", "gold_mobile.png"),
]

async def screenshot_pages():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for url, filename in PAGES:
            page_name = url.split("/")[-1]
            print(f"Screenshot: {page_name}", flush=True)
            
            ctx = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await ctx.new_page()
            
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(1000)
            await page.set_viewport_size({"width": 390, "height": 844})
            await page.wait_for_timeout(500)
            
            path = f"mobile_shots/{filename}"
            await page.screenshot(path=path, full_page=False)
            print(f"  Saved: {path}")
            
            await ctx.close()
        
        await browser.close()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(screenshot_pages())
