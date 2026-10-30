document.addEventListener('DOMContentLoaded', () => {
  // ---------- Sticky header shadow + back to top ----------
  const header = document.getElementById('header');
  const toTop = document.getElementById('toTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    toTop.classList.toggle('show', y > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ---------- Mobile menu ----------
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  // ---------- Active nav link on scroll ----------
  const links = [...nav.querySelectorAll('.nav__link')];
  const sections = links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  // ---------- Reveal on scroll ----------
  const revealer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealer.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => revealer.observe(el));

  // ---------- Animated counters ----------
  const animateCounter = el => {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const comma = el.dataset.format === 'comma';
    const duration = 2000;
    const start = performance.now();
    const fmt = v => {
      const s = v.toFixed(decimals);
      return comma ? Number(s).toLocaleString('en-US') : s;
    };
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(c => counterObs.observe(c));

  // ---------- Testimonial carousel ----------
  // Looping like the live Swiper: one dot per review, clones fill the view at the end.
  const carousel = document.getElementById('carousel');
  const track = carousel.querySelector('.carousel__track');
  const slides = [...track.children];
  const count = slides.length;
  const dotsWrap = carousel.querySelector('.carousel__dots');
  let index = 0;
  let timer;

  slides.forEach(s => {
    const c = s.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    track.appendChild(c);
  });

  const step = () => slides[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 0);
  const place = (i, animate) => {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translateX(${-i * step()}px)`;
  };

  const buildDots = () => {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Go to slide ${i + 1}`);
      b.addEventListener('click', () => { goTo(i); restart(); });
      dotsWrap.appendChild(b);
    }
  };
  const goTo = i => {
    if (i < 0) { place(count, false); track.offsetWidth; i = count - 1; }
    index = i;
    place(index, true);
    [...dotsWrap.children].forEach((d, n) => d.classList.toggle('active', n === index % count));
  };
  track.addEventListener('transitionend', () => {
    if (index >= count) { index -= count; place(index, false); }
  });
  const restart = () => {
    clearInterval(timer);
    if (count > 1) timer = setInterval(() => goTo(index + 1), 5000);
  };

  carousel.querySelector('.carousel__btn--prev').addEventListener('click', () => { goTo(index - 1); restart(); });
  carousel.querySelector('.carousel__btn--next').addEventListener('click', () => { goTo(index + 1); restart(); });

  // Touch swipe
  let startX = null;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { goTo(index + (dx < 0 ? 1 : -1)); restart(); }
    startX = null;
  });

  window.addEventListener('resize', () => place(index, false));
  buildDots();
  goTo(0);
  restart();

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-item__q');
    const a = item.querySelector('.faq-item__a');
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open);
      a.style.maxHeight = open ? a.scrollHeight + 'px' : null;
    });
  });

  // ---------- Contact form (front-end validation only) ----------
  const form = document.getElementById('contactForm');
  const msg = document.getElementById('formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(input => {
      const valid = input.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
        : input.value.trim() !== '';
      input.parentElement.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      msg.textContent = 'Please fill in the required fields correctly.';
      msg.className = 'form-msg err';
      return;
    }
    // TODO: hook up to a backend (e.g. PHP mail, Formspree, EmailJS) to actually send.
    msg.textContent = 'Thank you! Your message has been sent. Our experts will get in touch shortly.';
    msg.className = 'form-msg ok';
    form.reset();
  });
});
