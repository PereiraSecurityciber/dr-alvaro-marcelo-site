import { SITE, whatsappUrl } from './config.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* WhatsApp: todos os links [data-wa] usam a configuração central */
document.querySelectorAll('[data-wa]').forEach((link) => {
  const topic = link.dataset.waTopic;
  const msg = topic ? `${SITE.whatsapp.mensagem} Tenho interesse em: ${topic}.` : SITE.whatsapp.mensagem;
  link.href = whatsappUrl(msg);
});

/* Dados pendentes: só aparecem quando confirmados em config.js */
if (SITE.endereco) {
  const item = document.querySelector('[data-config="endereco-item"]');
  item.querySelector('address').textContent = SITE.endereco;
  item.hidden = false;
  document.querySelector('[data-config="endereco"]').textContent = SITE.endereco;
}
const horariosEl = document.querySelector('[data-config="horarios"]');
if (SITE.horarios && horariosEl) {
  horariosEl.textContent = SITE.horarios;
}
if (SITE.mapaEmbedUrl) {
  const map = document.querySelector('[data-config="mapa"]');
  const frame = document.createElement('iframe');
  frame.src = SITE.mapaEmbedUrl;
  frame.title = 'Localização do consultório no mapa';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer-when-downgrade';
  map.append(frame);
  map.hidden = false;
  if (SITE.mapaRotaUrl) {
    const route = document.createElement('a');
    route.className = 'map-route';
    route.href = SITE.mapaRotaUrl;
    route.target = '_blank';
    route.rel = 'noopener';
    route.textContent = 'Como chegar pelo Google Maps';
    map.after(route);
  }
}
document.getElementById('ano').textContent = String(new Date().getFullYear());

/* Header */
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* Menu mobile */
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('menu');
const setMenu = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  nav.classList.toggle('is-open', open);
};
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
});

/* Link ativo na navegação */
const navLinks = [...document.querySelectorAll('.nav ul a')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.setAttribute('aria-current', String(a.hash === `#${entry.target.id}`)));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['inicio', 'procedimentos', 'casos', 'contato'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});

/* Aparição suave */
const revealEls = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  // atraso escalonado entre irmãos
  revealEls.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 5) * 0.09}s`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));
}



/* Botão flutuante: oculto enquanto o CTA principal do hero está visível, para não sobrepô-lo */
const waFloat = document.querySelector('.wa-float');
const heroActions = document.querySelector('.hero-actions');
const heroSection = document.getElementById('inicio');
if (waFloat && heroActions && 'IntersectionObserver' in window) {
  // No celular o botão flutuante cobriria o título: fica oculto enquanto o topo está na tela
  const smallScreen = window.matchMedia('(max-width: 600px)');
  const target = () => (smallScreen.matches ? heroSection : heroActions);
  let observed = null;
  const io = new IntersectionObserver(([entry]) => {
    waFloat.classList.toggle('is-hidden', entry.isIntersecting && entry.intersectionRatio > (smallScreen.matches ? 0.15 : 0));
  }, { threshold: [0, 0.15, 0.5] });
  const watch = () => { if (observed) io.unobserve(observed); observed = target(); io.observe(observed); };
  watch();
  smallScreen.addEventListener('change', watch);
}

/* Galeria: carrossel com setas, arraste e encaixe por foto */
const track = document.querySelector('.carousel .gallery');
const carPrev = document.querySelector('.car-prev');
const carNext = document.querySelector('.car-next');
const updateNav = () => {
  if (!track) return;
  const max = track.scrollWidth - track.clientWidth - 2;
  carPrev.disabled = track.scrollLeft <= 2;
  carNext.disabled = track.scrollLeft >= max;
};
/* Contador e barra de progresso */
const carNow = document.querySelector('[data-car-now]');
const carTotal = document.querySelector('[data-car-total]');
const carFill = document.querySelector('[data-car-fill]');
const pad2 = (n) => String(n).padStart(2, '0');
const updateProgress = () => {
  if (!track) return;
  const items = [...track.querySelectorAll('.g-item:not([hidden])')];
  if (!items.length) return;
  const w = items[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
  const perView = Math.max(1, Math.round(track.clientWidth / w));
  const first = Math.min(items.length - 1, Math.round(track.scrollLeft / w));
  const max = track.scrollWidth - track.clientWidth;
  const last = max <= 2 ? items.length : Math.min(items.length, first + perView);
  carNow.textContent = pad2(last);
  carTotal.textContent = pad2(items.length);
  carFill.style.width = `${(last / items.length) * 100}%`;
};
const onTrackScroll = () => { updateNav(); updateProgress(); };

if (track) {
  const step = (dir) => {
    const item = track.querySelector('.g-item:not([hidden])');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const w = item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    track.scrollBy({ left: dir * w, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  carPrev.addEventListener('click', () => step(-1));
  carNext.addEventListener('click', () => step(1));
  track.addEventListener('keydown', (e) => {
    if (e.target !== track) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
  let drag = null;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; track.classList.add('is-dragging'); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    track.classList.remove('is-dragging');
    // o clique que vem logo após soltar não deve abrir a foto
    const eat = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    track.addEventListener('click', eat, { capture: true, once: true });
    setTimeout(() => track.removeEventListener('click', eat, { capture: true }), 0);
    // solta e encaixa na foto mais próxima
    const item = track.querySelector('.g-item:not([hidden])');
    const w = item ? item.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0) : 1;
    track.scrollTo({ left: Math.round(track.scrollLeft / w) * w, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  track.addEventListener('scroll', onTrackScroll, { passive: true });
  window.addEventListener('resize', onTrackScroll);
  onTrackScroll();

  /* Movimento automático: avança sozinho, volta ao início no fim e pausa
     quando o visitante interage, sai da tela ou pede menos movimento */
  if (!reduceMotion) {
    const carousel = track.closest('.carousel');
    let timer = 0;
    let hovering = false;
    let onScreen = false;
    let holdUntil = 0;
    const tick = () => {
      if (hovering || !onScreen || document.hidden || Date.now() < holdUntil) return;
      if (document.querySelector('.lightbox[open]')) return;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      if (atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
      else step(1);
    };
    const start = () => { clearInterval(timer); timer = setInterval(tick, 3200); };
    const hold = () => { holdUntil = Date.now() + 6000; };
    carousel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
    carousel.addEventListener('pointerleave', () => { hovering = false; });
    // pausa só com foco de teclado; foco deixado por clique não trava o movimento
    carousel.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) hovering = true; });
    carousel.addEventListener('focusout', () => { hovering = false; });
    track.addEventListener('touchstart', hold, { passive: true });
    [carPrev, carNext].forEach((b) => b.addEventListener('click', hold));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; }, { threshold: 0.4 }).observe(carousel);
    } else {
      onScreen = true;
    }
    start();
  }
}

/* Galeria: lightbox acessível com <dialog> */
const lightbox = document.getElementById('lightbox');
const galleryItems = [...document.querySelectorAll('.g-item')];
if (lightbox && galleryItems.length && typeof lightbox.showModal === 'function') {
  const lbImg = lightbox.querySelector('img');
  const lbCap = lightbox.querySelector('.lb-cap');
  let current = 0;
  let opener = null;
  // navega apenas pelas fotos visíveis no filtro atual
  const visibleItems = () => galleryItems.filter((item) => !item.hidden);
  const show = (i) => {
    const list = visibleItems();
    current = (i + list.length) % list.length;
    const img = list[current].querySelector('img');
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = `${list[current].querySelector('figcaption').textContent}, ${current + 1} de ${list.length}`;
  };
  galleryItems.forEach((item) => {
    item.querySelector('.g-open').addEventListener('click', (e) => {
      opener = e.currentTarget;
      show(visibleItems().indexOf(item));
      lightbox.showModal();
    });
  });

  /* Filtro por procedimento */
  const filterButtons = document.querySelectorAll('.g-filter');
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      galleryItems.forEach((item) => { item.hidden = f !== 'all' && item.dataset.proc !== f; });
      if (track) {
        track.scrollTo({ left: 0, behavior: 'instant' });
        onTrackScroll();
      }
    });
  });
  lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.lb-prev').addEventListener('click', () => show(current - 1));
  lightbox.querySelector('.lb-next').addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  lightbox.addEventListener('close', () => opener?.focus());
}

/* Vídeos do Instagram: incorporação oficial, carregada só após o clique */
let igScript = null;
const loadInstagram = () => {
  if (!igScript) {
    igScript = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = 'https://www.instagram.com/embed.js';
      el.async = true;
      el.onload = resolve;
      el.onerror = reject;
      document.body.append(el);
    });
  }
  return igScript;
};
document.querySelectorAll('.ig-embed').forEach((box) => {
  box.querySelector('.ig-embed-load').addEventListener('click', () => {
    const quote = document.createElement('blockquote');
    quote.className = 'instagram-media';
    quote.dataset.instgrmPermalink = box.dataset.permalink;
    quote.dataset.instgrmVersion = '14';
    const link = document.createElement('a');
    link.href = box.dataset.permalink;
    link.textContent = 'Ver no Instagram';
    quote.append(link);
    box.replaceChildren(quote);
    loadInstagram()
      .then(() => window.instgrm?.Embeds.process())
      .catch(() => { link.target = '_blank'; link.rel = 'noopener'; });
  });
});

/* Fotos: sem efeito 3D — o hover discreto fica a cargo do CSS. */
