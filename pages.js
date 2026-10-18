const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let bagItems = [];
try { bagItems = JSON.parse(sessionStorage.getItem('primendowned-bag-v2') || '[]'); } catch { bagItems = []; }
let toastTimer;
function showToast(message) {
  const toast = $('.toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

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

$('.search-toggle')?.addEventListener('click', () => {
  const panel = $('.search-panel');
  const open = panel.classList.toggle('is-open');
  if (open) $('#site-search').focus();
});

$$('.filter-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.filter-tab').forEach(item => item.classList.toggle('is-selected', item === tab));
  const filter = tab.dataset.filter;
  $$('.product-card[data-category]').forEach(card => {
    const visible = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-hidden', !visible);
  });
}));

const params = new URLSearchParams(window.location.search);
const requestedCategory = params.get('category');
if (requestedCategory) {
  const tab = $(`.filter-tab[data-filter="${CSS.escape(requestedCategory)}"]`);
  tab?.click();
}
const requestedSearch = params.get('q');
if (requestedSearch) {
  const cards = $$('.product-card[data-category]');
  cards.forEach(card => card.classList.toggle('is-hidden', !card.textContent.toLowerCase().includes(requestedSearch.toLowerCase())));
}

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

$('.search-panel')?.addEventListener('submit', event => {
  event.preventDefault();
  const query = $('#site-search').value.trim().toLowerCase();
  if (!query) return $('#site-search').focus();
  const cards = $$('.product-card[data-category]');
  if (cards.length) {
    cards.forEach(card => card.classList.toggle('is-hidden', !card.textContent.toLowerCase().includes(query)));
    $('.search-panel').classList.remove('is-open');
    $('#shop-grid')?.scrollIntoView({ behavior: 'smooth' });
    if (!cards.some(card => !card.classList.contains('is-hidden'))) showToast(`No quick matches for “${query}”.`);
  } else {
    window.location.href = `shop.html?q=${encodeURIComponent(query)}`;
  }
});

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const motion = gsap.matchMedia();
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const galleryArrowPath = $('.gallery-scroll-icon path');
    if (window.DrawSVGPlugin && galleryArrowPath) {
      gsap.registerPlugin(DrawSVGPlugin);
      gsap.fromTo(galleryArrowPath, { drawSVG: '0%' }, { drawSVG: '100%', duration: .72, ease: 'power2.out', delay: .3 });
    }
    $$('.values-list article, .manifesto-content, .picks-note-copy, .story-end-copy').forEach(element => {
      gsap.from(element, { y: 14, autoAlpha: 0, duration: .45, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 90%', once: true } });
    });
    const productGrid = $('.shop-product-grid, .picked-grid');
    const products = $$('.product-card', productGrid || document);
    if (productGrid && products.length) {
      gsap.from(products, {
        y: 14, autoAlpha: 0, duration: .42, stagger: { each: .08, from: 'start', grid: 'auto' }, ease: 'power2.out',
        scrollTrigger: { trigger: productGrid, start: 'top 88%', once: true }
      });
    }
  });
  motion.add('(min-width: 801px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const frames = $$('.shop-hero-image, .picks-hero-image, .story-cover');
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
