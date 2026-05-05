// Diagnostic: find elements that overflow the viewport
(function() {
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var offenders = [];
  var el, r, rect;
  var all = document.querySelectorAll('body, body *');
  for (var i = 0; i < all.length; i++) {
    el = all[i];
    try {
      rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.right > vw + 4 || rect.left < -4) {
          offenders.push({
            tag: el.tagName,
            cls: (el.className || '').slice(0, 100),
            id: el.id || '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            vw: vw
          });
        }
      }
    } catch(e) {}
  }
  return { viewport: vw + 'x' + vh, count: offenders.length, offenders: offenders.slice(0, 25) };
})();
