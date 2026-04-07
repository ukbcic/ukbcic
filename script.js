/* ============================================================
   UK BCI CONSORTIUM — SHARED JAVASCRIPT
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Active nav link ─────────────────────────────────── */
  function setActiveNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    $$('.navbar-links a, .navbar-mobile a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === page || (page === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  }

  /* ── Mobile hamburger ────────────────────────────────── */
  function initMobileNav() {
    const btn = $('.navbar-hamburger');
    const menu = $('.navbar-mobile');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      // Animate bars
      const bars = $$('span', btn);
      if (open) {
        bars[0].style.transform = 'translateY(7px) rotate(45deg)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
      }
    });

    // Close on link click
    $$('a', menu).forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      $$('span', btn).forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
    }));
  }

  /* ── Scroll fade-in ──────────────────────────────────── */
  function initScrollFade() {
    const els = $$('.fade-in');
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => io.observe(el));
  }

  /* ── Carousel ────────────────────────────────────────── */
  function initCarousel(wrapper) {
    const track      = $('.carousel-track',     wrapper);
    const slides     = $$('.carousel-slide',    wrapper);
    const dotsWrap   = $('.carousel-dots',      wrapper);
    const btnPrev    = $('.carousel-btn--prev', wrapper);
    const btnNext    = $('.carousel-btn--next', wrapper);

    if (!track || !slides.length) return;

    let current  = 0;
    let autoTimer = null;
    const total   = slides.length;

    /* Build dots */
    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `Slide ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsWrap && dotsWrap.appendChild(d);
      return d;
    });

    function goTo(idx) {
      slides[current].querySelector('video')?.pause();
      current = (idx + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      const vid = slides[current].querySelector('video');
      if (vid) { vid.currentTime = 0; vid.play().catch(() => {}); }
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => goTo(current + 1), 5000);
    }

    function stopAuto() {
      clearInterval(autoTimer);
    }

    btnPrev?.addEventListener('click', () => { goTo(current - 1); startAuto(); });
    btnNext?.addEventListener('click', () => { goTo(current + 1); startAuto(); });

    /* Keyboard navigation */
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { goTo(current - 1); startAuto(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); startAuto(); }
    });

    /* Pause on hover */
    wrapper.addEventListener('mouseenter', stopAuto);
    wrapper.addEventListener('mouseleave', startAuto);

    /* Touch / swipe */
    let touchX = null;
    wrapper.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    wrapper.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) { goTo(current + (dx < 0 ? 1 : -1)); startAuto(); }
      touchX = null;
    });

    startAuto();
  }

  function initAllCarousels() {
    $$('.carousel-wrapper').forEach(initCarousel);
  }

  /* ── Filter tabs ─────────────────────────────────────── */
  function initFilterTabs() {
    $$('.filter-tabs').forEach(tabGroup => {
      const tabs    = $$('.filter-tab', tabGroup);
      const section = tabGroup.closest('section') || tabGroup.parentElement;
      const items   = $$('[data-category]', section);

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const filter = tab.dataset.filter;
          items.forEach(item => {
            const show = filter === 'all' || item.dataset.category === filter;
            item.style.display = show ? '' : 'none';

            /* Re-animate revealed items */
            if (show && item.classList.contains('fade-in')) {
              item.classList.remove('visible');
              requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add('visible')));
            }
          });
        });
      });
    });
  }

  /* ── Contact form (no-op submit) ─────────────────────── */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      const orig = btn.textContent;
      btn.textContent = '✓ Message sent!';
      btn.disabled = true;
      btn.style.background = '#1a8a4a';
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
        btn.style.background = '';
        form.reset();
      }, 3500);
    });
  }

  /* ── Smooth counter animation ────────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => io.observe(c));
  }

  /* ── Init ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    initMobileNav();
    initScrollFade();
    initAllCarousels();
    initFilterTabs();
    initContactForm();
    initCounters();
  });

})();
