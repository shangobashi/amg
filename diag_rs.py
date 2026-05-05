#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def diagnose():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()
        
        await page.goto("https://am.issalabs.xyz/responsible-sourcing.html",
                       wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1500)
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(500)
        
        data = await page.evaluate("""() => {
          const offenders = [...document.querySelectorAll('body *')]
            .map(el => {
              const r = el.getBoundingClientRect();
              const cls = typeof el.className === 'string' ? el.className.slice(0, 100) : '';
              return { tag: el.tagName, cls, id: el.id || '', left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
            })
            .filter(x => x.right > 391 || x.left < -1);
          return { count: offenders.length, viewport: window.innerWidth, offenders: offenders.slice(0, 30) };
        }""")
        
        print(f"Viewport: {data['viewport']}x844")
        print(f"Overflow count: {data['count']}")
        for o in data['offenders']:
            print(f"  [{o['tag']}] .{o['cls'][:60]} | left={o['left']} right={o['right']} w={o['width']}")
        
        await browser.close()

asyncio.run(diagnose())
