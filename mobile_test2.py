#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

PAGES = [
    "https://am.issalabs.xyz/beryllium.html",
    "https://am.issalabs.xyz/tungsten.html",
    "https://am.issalabs.xyz/gold.html",
    "https://am.issalabs.xyz/lithium.html",
    "https://am.issalabs.xyz/privacy.html",
]

async def test_pages():
    results = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for url in PAGES:
            page_name = url.split("/")[-1]
            print(f"\n=== Testing {page_name} ===", flush=True)
            
            ctx = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await ctx.new_page()
            
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(1500)
                
                # Mobile viewport meta
                await page.evaluate("document.querySelector('meta[name=viewport]').setAttribute('content', 'width=390, initial-scale=1.0')")
                await page.wait_for_timeout(500)
                
                # Force resize to 390
                await page.set_viewport_size({"width": 390, "height": 844})
                await page.wait_for_timeout(500)
                
                data = await page.evaluate("""() => {
                  const offenders = [...document.querySelectorAll('body *')]
                    .map(el => {
                      const r = el.getBoundingClientRect();
                      return { tag: el.tagName, cls: (el.className||'').slice(0,80), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
                    })
                    .filter(x => x.right > 391 || x.left < -1);
                  return { count: offenders.length, viewport: window.innerWidth, items: offenders.slice(0, 15) };
                }""")
                
                count = data['count']
                vw = data['viewport']
                
                print(f"  Viewport reported: {vw}x844")
                print(f"  Overflow count: {count}")
                
                if count > 0:
                    for item in data['items']:
                        print(f"  OFFENDER: {item['tag']} .{item['cls'][:50]} left={item['left']} right={item['right']} w={item['width']}")
                    results[page_name] = "FAIL"
                else:
                    results[page_name] = "PASS"
                    print(f"  PASS - no overflow")
                    
            except Exception as e:
                print(f"  Error: {e}")
                results[page_name] = "ERROR"
            finally:
                await ctx.close()
        
        await browser.close()
    
    print("\n\n=== FINAL SUMMARY ===")
    for page, status in results.items():
        mark = "PASS" if status == "PASS" else "FAIL"
        print(f"  [{mark}] {page}: {status}")
    
    return results

if __name__ == "__main__":
    asyncio.run(test_pages())
