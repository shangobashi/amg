// ==========================================================================
// BISIMWA MINES — Global JavaScript
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initNav()
  initScrollAnimations()
  initContactForm()
  initDataRoomForm()
  initTabNav()
  initMobileNav()
  initCountUp()
})

// --------------------------------------------------------------------------
// NAV — scroll state + active link + hide on scroll-down
// --------------------------------------------------------------------------
function initNav() {
  const nav = document.querySelector('.nav')
  if (!nav) return

  let lastY = 0
  const THRESHOLD = 80   // px before nav starts hiding
  const HIDDEN_CLASS = 'nav--hidden'
  const VISIBLE_CLASS = 'nav--visible'

  const onScroll = () => {
    const y = window.scrollY

    // Always show at top
    if (y <= 20) {
      nav.classList.remove(HIDDEN_CLASS)
      nav.classList.add(VISIBLE_CLASS)
      lastY = y
      return
    }

    // Scrolled state (backdrop opacity)
    nav.classList.toggle('nav--scrolled', y > 10)

    // Scroll down — hide
    if (y > lastY + 4 && y > THRESHOLD) {
      nav.classList.add(HIDDEN_CLASS)
      nav.classList.remove(VISIBLE_CLASS)
    }
    // Scroll up — show
    else if (y < lastY - 4) {
      nav.classList.remove(HIDDEN_CLASS)
      nav.classList.add(VISIBLE_CLASS)
    }

    lastY = y
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // Active link highlight
  const links = nav.querySelectorAll('.nav__link')
  links.forEach(link => {
    const href = link.getAttribute('href')
    if (href && window.location.pathname.endsWith(href)) {
      link.classList.add('active')
    }
  })
}

// --------------------------------------------------------------------------
// SCROLL ANIMATIONS — IntersectionObserver for fade-up on scroll
// --------------------------------------------------------------------------
function initScrollAnimations() {
  const els = document.querySelectorAll('.mineral-tile, .stat-block, .nda-step')
  if (!els.length) return

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1'
        entry.target.style.transform = 'translateY(0)'
        obs.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

  els.forEach((el, i) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(16px)'
    el.style.transition = `opacity 0.45s ease ${i * 0.07}s, transform 0.45s ease ${i * 0.07}s`
    obs.observe(el)
  })
}

// --------------------------------------------------------------------------
// MOBILE NAV TOGGLE
// --------------------------------------------------------------------------
function initMobileNav() {
  const toggle = document.querySelector('.nav__mobile-toggle')
  const nav = document.querySelector('.nav')
  if (!toggle || !nav) return

  toggle.addEventListener('click', () => {
    nav.classList.toggle('nav--open')
    const isOpen = nav.classList.contains('nav--open')
    toggle.setAttribute('aria-expanded', isOpen)
  })
}

// --------------------------------------------------------------------------
// CONTACT FORM
// --------------------------------------------------------------------------
function initContactForm() {
  const form = document.getElementById('contactForm')
  if (!form) return

  form.addEventListener('submit', e => {
    e.preventDefault()
    const btn = form.querySelector('button[type="submit"]')
    const original = btn.textContent
    btn.disabled = true
    btn.textContent = 'Redirecting...'
    window.location.href = 'mailto:afriplansolar@yahoo.fr?subject=Afriplan%20Contact%20Form&body=' + encodeURIComponent('Name: ' + (document.getElementById('contactName')?.value || '') + '\nCompany: ' + (document.getElementById('contactCompany')?.value || '') + '\nCountry: ' + (document.getElementById('contactCountry')?.value || '') + '\n\nMessage:\n' + (document.getElementById('contactMessage')?.value || ''))
  })
}

// --------------------------------------------------------------------------
// DATA ROOM FORM (NDA request multi-step)
// --------------------------------------------------------------------------
function initDataRoomForm() {
  const form = document.getElementById('ndaForm')
  if (!form) return

  form.addEventListener('submit', e => {
    e.preventDefault()
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    const lang = document.documentElement.lang === 'fr' ? 'fr' : 'en'
    const copy = {
      en: {
        subject: 'Afriplan Data Room / NDA Request',
        heading: 'Afriplan Global Solution — Data Room / NDA Request',
        fullName: 'Full legal name',
        company: 'Company',
        title: 'Title / Position',
        email: 'Business email',
        phone: 'Phone',
        country: 'Country',
        mineralInterest: 'Mineral interest',
        engagementType: 'Intended engagement',
        notes: 'Additional notes',
        none: '(none provided)',
        opening: 'Opening email...'
      },
      fr: {
        subject: 'Afriplan — Demande NDA / Salle de Données',
        heading: 'Afriplan Global Solution — Demande NDA / Salle de Données',
        fullName: 'Nom légal complet',
        company: 'Entreprise',
        title: 'Titre / Poste',
        email: 'Email professionnel',
        phone: 'Téléphone',
        country: 'Pays',
        mineralInterest: 'Intérêt minéral',
        engagementType: 'Engagement prévu',
        notes: 'Notes complémentaires',
        none: '(aucune note fournie)',
        opening: 'Ouverture de l’email...'
      }
    }[lang]

    const getValue = name => (form.elements[name]?.value || '').trim()
    const getSelectText = name => {
      const field = form.elements[name]
      return field?.selectedOptions?.[0]?.textContent.trim() || getValue(name)
    }
    const body = [
      copy.heading,
      '',
      `${copy.fullName}: ${getValue('fullName')}`,
      `${copy.company}: ${getValue('company')}`,
      `${copy.title}: ${getValue('title')}`,
      `${copy.email}: ${getValue('email')}`,
      `${copy.phone}: ${getValue('phone')}`,
      `${copy.country}: ${getSelectText('country')}`,
      `${copy.mineralInterest}: ${getSelectText('mineralInterest')}`,
      `${copy.engagementType}: ${getSelectText('engagementType')}`,
      '',
      `${copy.notes}:`,
      getValue('notes') || copy.none
    ].join('\n')

    const btn = form.querySelector('button[type="submit"]')
    if (btn) {
      btn.disabled = true
      btn.textContent = copy.opening
    }

    const mailto = 'mailto:afriplansolar@yahoo.fr'
      + '?subject=' + encodeURIComponent(copy.subject)
      + '&body=' + encodeURIComponent(body)

    window.__afriplanLastMailto = mailto
    window.location.href = mailto

    setTimeout(() => {
      form.style.display = 'none'
      const success = document.getElementById('ndaSuccess')
      if (success) success.style.display = 'block'
    }, 350)
  })
}

// --------------------------------------------------------------------------
// TAB NAVIGATION (inner pages)
// --------------------------------------------------------------------------
function initTabNav() {
  document.querySelectorAll('[data-tab-group]').forEach(group => {
    const tabs = group.querySelectorAll('[data-tab]')
    const panels = document.querySelectorAll(`[data-panel-group="${group.dataset.tabGroup}"]`)

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        panels.forEach(p => {
          p.style.display = p.dataset.panel === tab.dataset.tab ? 'block' : 'none'
        })
      })
    })
  })
}

// --------------------------------------------------------------------------
// COUNT-UP ANIMATION for stat numbers
// --------------------------------------------------------------------------
function initCountUp() {
  const stats = document.querySelectorAll('[data-count-up]')
  if (!stats.length) return

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const el = entry.target
      const target = parseFloat(el.dataset.countUp)
      const duration = 1200
      const start = performance.now()
      const update = (now) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        el.textContent = (eased * target).toFixed(target % 1 === 0 ? 0 : 2)
        if (progress < 1) requestAnimationFrame(update)
      }
      requestAnimationFrame(update)
      obs.unobserve(el)
    })
  }, { threshold: 0.5 })

  stats.forEach(s => obs.observe(s))
}
