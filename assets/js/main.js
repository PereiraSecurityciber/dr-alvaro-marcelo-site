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
['inicio', 'tratamentos', 'sobre', 'contato'].forEach((id) => {
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

/* Inclinação 3D nos cartões (somente mouse) */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(0)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* Dente 3D no hero */
const canvas = document.getElementById('tooth3d');
if (canvas) {
  import('./tooth3d.js')
    .then(({ initTooth }) => initTooth(canvas, { reduceMotion }))
    .catch(() => canvas.remove());
}

/* Botão flutuante: oculto enquanto o CTA principal do hero está visível, para não sobrepô-lo */
const waFloat = document.querySelector('.wa-float');
const heroActions = document.querySelector('.hero-actions');
if (waFloat && heroActions && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    waFloat.classList.toggle('is-hidden', entry.isIntersecting);
  }).observe(heroActions);
}
