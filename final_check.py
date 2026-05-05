#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

PAGES = [
    "https://am.issalabs.xyz/",
    "https://am.issalabs.xyz/opportunities.html",
    "https://am.issalabs.xyz/responsible-sourcing.html",
    "https://am.issalabs.xyz/data-room.html",
    "https://am.issalabs.xyz/contact.html",
    "https://am.issalabs.xyz/beryllium.html",
    "https://am.issalabs.xyz/tungsten.html",
    "https://am.issalabs.xyz/gold.html",
    "https://am.issalabs.xyz/lithium.html",
    "https://am.issalabs.xyz/privacy.html",
]

DIAG = """() => {
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
  return { vw, count: all.length };
}"""

async def full_check():
    results = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for url in PAGES:
            page_name = url.split("/")[-1] or "index.html"
            print(f"Testing {page_name}...", end=" ", flush=True)
            
            ctx = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await ctx.new_page()
            
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(1500)
                await page.set_viewport_size({"width": 390, "height": 844})
                await page.wait_for_timeout(500)
                
                data = await page.evaluate(DIAG)
                status = "PASS" if data['count'] == 0 else f"FAIL ({data['count']} offenders)"
                print(status)
                results[page_name] = status
                
            except Exception as e:
                print(f"ERROR: {e}")
                results[page_name] = "ERROR"
            finally:
                await ctx.close()
        
        await browser.close()
    
    print("\n=== FINAL SUMMARY ===")
    all_pass = True
    for page, status in results.items():
        mark = "PASS" if status == "PASS" else "FAIL"
        print(f"  [{mark}] {page}: {status}")
        if status != "PASS":
            all_pass = False
    print(f"\nOverall: {'ALL 10 PASS' if all_pass else 'SOME FAILURES'}")

asyncio.run(full_check())
