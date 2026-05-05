#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def rs_after():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()
        
        await page.goto("https://am.issalabs.xyz/responsible-sourcing.html",
                       wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(500)
        
        # Scroll to specific sections and screenshot
        sections = [
            (0, "rs_final_hero"),
            (900, "rs_final_mercury"),
            (1800, "rs_final_esg"),
            (2700, "rs_final_trace"),
            (3600, "rs_final_cta"),
        ]
        
        for scroll_y, name in sections:
            await page.evaluate(f"window.scrollTo(0, {scroll_y})")
            await page.wait_for_timeout(300)
            path = f"mobile_shots/{name}.png"
            await page.screenshot(path=path)
            print(f"Saved: {path}")
        
        # Run overflow diagnostic
        data = await page.evaluate("""() => {
          const vw = window.innerWidth;
          const all = [...document.querySelectorAll('body *')]
            .map(el => {
              const r = el.getBoundingClientRect();
              if (r.width < 1 || r.height < 1) return null;
              const cls = typeof el.className === 'string' ? el.className.slice(0, 80) : '';
              return {
                tag: el.tagName, cls,
                left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
                overflowX: r.right > vw + 1, underflowX: r.left < -1
              };
            })
            .filter(x => x && (x.overflowX || x.underflowX));
          return { vw, count: all.length, items: all.slice(0, 10) };
        }""")
        
        print(f"\\nOverflow diagnostic: {data['count']} offenders at {data['vw']}px")
        for o in data['items']:
            print(f"  {o['tag']} .{o['cls'][:50]} L={o['left']} R={o['right']} W={o['width']}")
        
        await browser.close()

asyncio.run(rs_after())
