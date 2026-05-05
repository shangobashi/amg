#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def detailed_diagnose():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()
        
        await page.goto("https://am.issalabs.xyz/responsible-sourcing.html",
                       wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(500)
        
        # Get ALL elements that might overflow
        data = await page.evaluate("""() => {
          const vw = window.innerWidth;
          const all = [...document.querySelectorAll('body *')]
            .map(el => {
              const r = el.getBoundingClientRect();
              if (r.width < 1 || r.height < 1) return null;
              const cls = typeof el.className === 'string' ? el.className.slice(0, 100) : '';
              const style = el.style ? el.getAttribute('style') || '' : '';
              return {
                tag: el.tagName,
                cls,
                style: style.slice(0, 100),
                left: Math.round(r.left),
                right: Math.round(r.right),
                width: Math.round(r.width),
                vw: vw,
                overflowX: r.right > vw + 1,
                underflowX: r.left < -1
              };
            })
            .filter(x => x && (x.overflowX || x.underflowX));
          return { vw, count: all.length, items: all.slice(0, 40) };
        }""")
        
        print(f"Viewport: {data['vw']}x844")
        print(f"Overflow count: {data['count']}")
        for o in data['items']:
            print(f"  [{o['tag']}] .{o['cls'][:60]} | style={o['style'][:60]} | L={o['left']} R={o['right']} W={o['width']}")
        
        await browser.close()

asyncio.run(detailed_diagnose())
