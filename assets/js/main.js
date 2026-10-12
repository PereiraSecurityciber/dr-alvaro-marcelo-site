import { SITE, whatsappUrl } from './config.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
if (SITE.horarios) {
  document.querySelector('[data-config="horarios"]').textContent = SITE.horarios;
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
['inicio', 'tratamentos', 'casos', 'contato'].forEach((id) => {
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
if (waFloat && heroActions && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    waFloat.classList.toggle('is-hidden', entry.isIntersecting);
  }).observe(heroActions);
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

/* Efeito 3D nas fotos: inclinação com reflexo (mouse) e entrada em 3D (toque) */
const photos3d = document.querySelectorAll('.g-item, .treatment-media, .portrait, .testimonial-video');
if (!reduceMotion) {
  photos3d.forEach((el) => {
    el.classList.add('fx3d');
    const glare = document.createElement('span');
    glare.className = 'fx3d-glare';
    glare.setAttribute('aria-hidden', 'true');
    el.append(glare);
  });

  if (finePointer) {
    photos3d.forEach((el) => {
      let frame = 0;
      el.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          el.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
          el.style.setProperty('--ry', `${(x - 0.5) * 12}deg`);
          el.style.setProperty('--gx', `${x * 100}%`);
          el.style.setProperty('--gy', `${y * 100}%`);
          el.classList.add('is-tilting');
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  } else if ('IntersectionObserver' in window) {
    const io3d = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('fx3d-in'); io3d.unobserve(entry.target); }
      });
    }, { threshold: 0.2 });
    photos3d.forEach((el) => { el.classList.add('fx3d-touch'); io3d.observe(el); });
  }
}
