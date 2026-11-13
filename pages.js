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

const params = new URLSearchParams(window.location.search);
const catalogGrid = $('#shop-products');
let activeFilter = params.get('brand') || params.get('category') || 'all';
let activeQuery = (params.get('q') || '').trim().toLowerCase();

function applyCatalogFilters() {
  const cards = $$('.product-card[data-category]');
  cards.forEach(card => {
    const filterMatch = activeFilter === 'all' || card.dataset.brand === activeFilter || card.dataset.category === activeFilter;
    const searchText = `${card.dataset.search || ''} ${card.textContent}`.toLowerCase();
    const visible = filterMatch && (!activeQuery || searchText.includes(activeQuery));
    card.classList.toggle('is-hidden', !visible);
  });
  const shown = cards.filter(card => !card.classList.contains('is-hidden')).length;
  const count = $('#catalog-result-count');
  if (count) count.textContent = activeQuery || activeFilter !== 'all' ? `${shown} ${shown === 1 ? 'PRODUCT' : 'PRODUCTS'} FOUND` : `${cards.length} PRODUCTS`;
  let empty = $('.catalog-empty', catalogGrid || document);
  if (cards.length && shown === 0 && !empty) {
    empty = document.createElement('p');
    empty.className = 'catalog-empty';
    empty.textContent = 'No products match this search. Try another model or brand.';
    catalogGrid?.append(empty);
  } else if (shown && empty) empty.remove();
}

$$('.filter-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.filter-tab').forEach(item => item.classList.toggle('is-selected', item === tab));
  activeFilter = tab.dataset.filter;
  applyCatalogFilters();
}));

async function loadProductCatalog() {
  if (!catalogGrid) return;
  try {
    const products = window.PRODUCT_CATALOG;
    if (!Array.isArray(products) || !products.length) throw new Error('Product collection could not be loaded.');
    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    catalogGrid.innerHTML = products.map(product => {
      const detailLines = String(product.details || '').split('\n').map(line => line.trim()).filter(line => line && !['Full details', 'Download item', 'Copy details', 'Show details', 'Hide details'].includes(line));
      const detailText = detailLines.join('\n');
      const categoryLabel = product.category === 'gaming' ? 'GAMING LAPTOP' : product.category === 'workstations' ? 'MOBILE WORKSTATION' : 'LAPTOP';
      const condition = product.condition ? `<span>${escapeHTML(product.condition)}</span>` : '';
      return `<article class="product-card" data-category="${escapeHTML(product.category)}" data-brand="${escapeHTML(product.brand)}" data-search="${escapeHTML(detailText)}">
        <div class="product-visual"><span class="product-tag">${escapeHTML(product.brand)} · ${categoryLabel}</span><img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.alt || product.title)}" loading="lazy" width="220" height="220" /><button class="quick-add" data-product="${escapeHTML(product.title)}" aria-label="Add ${escapeHTML(product.title)} to bag">+</button></div>
        <div class="product-info"><div><p class="product-type">${escapeHTML(product.description || product.brand)}</p><h3>${escapeHTML(product.title)}</h3></div><span class="product-price">${escapeHTML(product.priceLabel || product.price)}</span></div>
        <div class="product-rating">${condition}<small>${condition ? 'Product condition' : 'Ask us to confirm condition'}</small></div>
        <details class="product-specs"><summary>Full specifications & ordering</summary><pre>${escapeHTML(detailText)}</pre></details>
      </article>`;
    }).join('');
    catalogGrid.setAttribute('aria-busy', 'false');
    applyCatalogFilters();
    if (window.gsap && window.ScrollTrigger && products.length) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from($$('.product-card', catalogGrid), { y: 14, autoAlpha: 0, duration: .42, stagger: .045, ease: 'power2.out', scrollTrigger: { trigger: catalogGrid, start: 'top 88%', once: true } });
      });
    }
  } catch (error) {
    catalogGrid.setAttribute('aria-busy', 'false');
    catalogGrid.innerHTML = '<p class="catalog-empty">The product collection could not load. Please refresh the page.</p>';
    console.error(error);
  }
}
loadProductCatalog();

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
document.addEventListener('click', event => {
  const button = event.target.closest('.quick-add');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  bagItems.push(button.dataset.product);
  sessionStorage.setItem('primendowned-bag-v2', JSON.stringify(bagItems));
  updateBag();
  showToast(`${button.dataset.product} added to your bag`);
});

$('.search-panel')?.addEventListener('submit', event => {
  event.preventDefault();
  const query = $('#site-search').value.trim().toLowerCase();
  if (!query) return $('#site-search').focus();
  const cards = $$('.product-card[data-category]');
  if (cards.length) {
    activeQuery = query;
    applyCatalogFilters();
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
