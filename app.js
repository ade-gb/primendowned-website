const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Small UI feedback that keeps actions clear without interrupting browsing.
const toast = $('.toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

const searchPanel = $('.search-panel');
$('.search-toggle')?.addEventListener('click', () => {
  const open = searchPanel.classList.toggle('is-open');
  if (open) $('#site-search').focus();
});

const menuToggle = $('.menu-toggle');
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  let mobileNav = $('.mobile-nav');
  if (!mobileNav) {
    mobileNav = document.createElement('nav');
    mobileNav.className = 'mobile-nav';
    mobileNav.setAttribute('aria-label', 'Mobile navigation');
    mobileNav.innerHTML = '<a href="index.html">Home</a><a href="shop.html">Shop</a><a href="our-picks.html">Our picks</a><a href="our-story.html">Our story</a>';
    $('.site-header').append(mobileNav);
    $$('a', mobileNav).forEach(link => link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    }));
  }
  mobileNav.classList.toggle('is-open', open);
});

$$('.filter-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.filter-tab').forEach(item => item.classList.toggle('is-selected', item === tab));
  const filter = tab.dataset.filter;
  $$('.category-card').forEach(card => {
    const visible = filter === 'all' || card.dataset.room === filter;
    card.classList.toggle('is-hidden', !visible);
    if (visible && window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(card, { y: 9, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .34, ease: 'power2.out', clearProps: 'all' });
    }
  });
}));

let bagItems = [];
try { bagItems = JSON.parse(sessionStorage.getItem('primendowned-bag-v2') || '[]'); } catch { bagItems = []; }
const updateBag = () => {
  const count = bagItems.length;
  $('.bag-count').textContent = count;
  $('.bag-button').setAttribute('aria-label', `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
};
updateBag();
$('.bag-button')?.addEventListener('click', () => {
  const summary = bagItems.length
    ? `Your bag has ${bagItems.length} ${bagItems.length === 1 ? 'item' : 'items'}: ${bagItems.join(', ')}. Contact us to confirm pricing and availability.`
    : 'Your bag is empty. Explore the shop to find a solution.';
  showToast(summary);
});
$$('.quick-add').forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  bagItems.push(button.dataset.product);
  sessionStorage.setItem('primendowned-bag-v2', JSON.stringify(bagItems));
  updateBag();
  showToast(`${button.dataset.product} added to your bag`);
}));

$('.search-panel').addEventListener('submit', event => {
  event.preventDefault();
  const query = $('#site-search').value.trim();
  if (!query) return $('#site-search').focus();
  const match = $$('.category-card').find(card => card.textContent.toLowerCase().includes(query.toLowerCase()));
  if (match) {
    $$('.filter-tab').forEach(tab => tab.classList.toggle('is-selected', tab.dataset.filter === 'all'));
    $$('.category-card').forEach(card => card.classList.toggle('is-hidden', card !== match));
    $('#categories').scrollIntoView({ behavior: 'smooth' });
    searchPanel.classList.remove('is-open');
  } else {
    showToast(`No quick matches for “${query}” — try browsing the collection.`);
  }
});

$('.email-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#promo-email');
  if (!input.reportValidity()) return;
  showToast('You’re on the list. Check your inbox for your welcome offer.');
  input.value = '';
});

const testimonials = [
  { quote: 'The kettle is beautiful and works like a dream. It has made our kitchen feel more like us.', name: 'Jasmine D.', place: 'Verified customer · Brooklyn, NY', initials: ['JD', 'MC', 'AK'] },
  { quote: 'The delivery was so smooth, and our new air purifier is the quietest thing in the room.', name: 'Marcus R.', place: 'Verified customer · Austin, TX', initials: ['MR', 'SL', 'CT'] },
  { quote: 'Finally, pieces that look lovely on the counter and make the everyday routine easier.', name: 'Sophie L.', place: 'Verified customer · Portland, OR', initials: ['SL', 'JD', 'MR'] }
];
let quoteIndex = 0;
function setQuote(direction) {
  quoteIndex = (quoteIndex + direction + testimonials.length) % testimonials.length;
  const data = testimonials[quoteIndex];
  const quote = $('.quote-text');
  const name = $('.quote-name');
  const place = $('.quote-location');
  const content = [quote, name, place];
  const change = () => {
    quote.textContent = data.quote;
    name.textContent = data.name;
    place.textContent = data.place;
    $$('.avatar-stack span').forEach((avatar, i) => avatar.textContent = data.initials[i]);
    $('.quote-current').textContent = String(quoteIndex + 1).padStart(2, '0');
    $('.progress-line i').style.width = `${((quoteIndex + 1) / testimonials.length) * 100}%`;
  };
  if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.to(content, { autoAlpha: 0, y: 5, duration: .16, onComplete: () => {
      change();
      gsap.to(content, { autoAlpha: 1, y: 0, duration: .28, stagger: .04, ease: 'power2.out' });
    } });
  } else change();
}
$('.quote-prev').addEventListener('click', () => setQuote(-1));
$('.quote-next').addEventListener('click', () => setQuote(1));
let carouselIndex = 0;
const productCards = $$('.product-grid .product-card');
function moveProductFocus(direction) {
  if (!productCards.length) return;
  carouselIndex = (carouselIndex + direction + productCards.length) % productCards.length;
  productCards[carouselIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}
$('.carousel-prev')?.addEventListener('click', () => moveProductFocus(-1));
$('.carousel-next')?.addEventListener('click', () => moveProductFocus(1));

let introDelay = document.documentElement.classList.contains('has-preloader') ? 1.5 : 0;
const sitePreloader = $('.site-preloader');
if (sitePreloader) {
  if (document.documentElement.classList.contains('has-preloader') && window.gsap && window.SplitText) {
    gsap.registerPlugin(SplitText);
    if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
    const startPreloader = () => {
      if (!sitePreloader.isConnected) return;
      const split = SplitText.create('.preloader-title', {
        type: 'words, chars',
        ignore: '.preloader-ignore',
        aria: 'none'
      });
      const loaderTimeline = gsap.timeline({
        onComplete: () => {
          split.revert();
          document.documentElement.classList.remove('has-preloader');
          sitePreloader.remove();
        }
      });
      loaderTimeline.from(split.chars, {
        yPercent: 110,
        autoAlpha: 0,
        duration: .42,
        stagger: .018,
        ease: 'power3.out'
      });
      loaderTimeline.fromTo('.preloader-ignore img', { scale: .72, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .58, ease: 'back.out(1.8)' }, '<.12');
      loaderTimeline.to('.preloader-progress span', { scaleX: 1, duration: .45, ease: 'power2.inOut' }, '<');
      loaderTimeline.to(sitePreloader, { autoAlpha: 0, duration: .45, ease: 'power2.inOut' }, '+=.18');
    };
    if (document.fonts?.ready) document.fonts.ready.then(startPreloader);
    else startPreloader();
  } else {
    document.documentElement.classList.remove('has-preloader');
    sitePreloader.remove();
  }
}

// GSAP motion is progressive enhancement: every section stays readable without it.
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const motion = gsap.matchMedia();
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from('.brand-mark img', { scale: .78, autoAlpha: 0, duration: .55, stagger: .06, ease: 'back.out(1.6)', delay: .2 });
    const galleryArrowPath = $('.gallery-scroll-icon path');
    if (window.DrawSVGPlugin && galleryArrowPath) {
      gsap.registerPlugin(DrawSVGPlugin);
      gsap.fromTo(galleryArrowPath, { drawSVG: '0%' }, { drawSVG: '100%', duration: .72, ease: 'power2.out', delay: .3 });
    }
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: introDelay });
    intro.from('.hero-copy > .eyebrow', { y: 12, autoAlpha: 0, duration: .45 })
      .from('.hero h1', { y: 22, autoAlpha: 0, duration: .72 }, '-=.22')
      .from('.hero-aside', { y: 16, autoAlpha: 0, duration: .55 }, '-=.42')
      .from('.hero-image', { clipPath: 'inset(8% 0 8% 0)', autoAlpha: .6, duration: .9 }, '-=.3');

    $$('.section-heading, .story-content, .promo-card, .quote-layout, .service-item').forEach((element) => {
      gsap.from(element, {
        y: 16, autoAlpha: 0, duration: .55, ease: 'power2.out',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true }
      });
    });
    const categoryCards = $$('.category-grid .category-card');
    if (categoryCards.length) {
      gsap.from(categoryCards, {
        y: 14, autoAlpha: 0, duration: .42, stagger: { each: .07, from: 'start', grid: 'auto' }, ease: 'power2.out',
        scrollTrigger: { trigger: '.category-grid', start: 'top 88%', once: true }
      });
    }
    const productCards = $$('.product-grid .product-card');
    if (productCards.length) {
      gsap.from(productCards, {
        y: 14, autoAlpha: 0, duration: .42, stagger: { each: .08, from: 'start', grid: 'auto' }, ease: 'power2.out',
        scrollTrigger: { trigger: '.product-grid', start: 'top 88%', once: true }
      });
    }
  });

  motion.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
    const section = $('.room-gallery-section');
    const windowEl = $('.room-gallery-window');
    const track = $('.room-gallery-track');
    const progress = $('.gallery-progress');
    const progressFill = $('.gallery-progress span');
    const current = $('.gallery-progress-current');
    if (!section || !windowEl || !track) return;
    section.classList.add('is-pinned');

    const distance = () => Math.max(0, track.scrollWidth - windowEl.clientWidth);
    const setProgress = value => {
      const percent = Math.round(value * 100);
      progressFill.style.transform = `scaleX(${value})`;
      progress.setAttribute('aria-valuenow', String(percent));
      current.textContent = String(Math.min(4, Math.floor(value * 4) + 1)).padStart(2, '0');
    };

    const horizontalTween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: .7,
        invalidateOnRefresh: true,
        onUpdate: self => setProgress(self.progress)
      }
    });
    return () => {
      horizontalTween.scrollTrigger?.kill();
      section.classList.remove('is-pinned');
    };
  });

  motion.add('(min-width: 801px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const frames = $$('.hero-image, .shop-hero-image, .picks-hero-image, .story-cover');
    const cleanups = [];
    frames.forEach(frame => {
      const image = $('img', frame);
      if (!image) return;
      gsap.set(image, { transformPerspective: 900, transformOrigin: '50% 50%', willChange: 'transform' });
      const tiltX = gsap.quickTo(image, 'rotationY', { duration: .45, ease: 'power2.out' });
      const tiltY = gsap.quickTo(image, 'rotationX', { duration: .45, ease: 'power2.out' });
      const scale = gsap.quickTo(image, 'scale', { duration: .5, ease: 'power2.out' });
      const onMove = event => {
        const bounds = frame.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        tiltX((x - .5) * 7);
        tiltY((.5 - y) * 5);
        scale(1.035);
      };
      const onLeave = () => { tiltX(0); tiltY(0); scale(1); };
      frame.addEventListener('pointermove', onMove, { passive: true });
      frame.addEventListener('pointerleave', onLeave, { passive: true });
      cleanups.push(() => {
        frame.removeEventListener('pointermove', onMove);
        frame.removeEventListener('pointerleave', onLeave);
      });
    });
    return () => cleanups.forEach(cleanup => cleanup());
  });
}

const galleryWindow = $('.room-gallery-window');
if (galleryWindow) {
  galleryWindow.addEventListener('scroll', () => {
    const progress = $('.gallery-progress');
    const fill = $('.gallery-progress span');
    const current = $('.gallery-progress-current');
    const maxScroll = galleryWindow.scrollWidth - galleryWindow.clientWidth;
    const value = maxScroll > 0 ? galleryWindow.scrollLeft / maxScroll : 0;
    const percent = Math.round(value * 100);
    fill.style.transform = `scaleX(${value})`;
    progress.setAttribute('aria-valuenow', String(percent));
    current.textContent = String(Math.min(4, Math.floor(value * 4) + 1)).padStart(2, '0');
  }, { passive: true });
}
