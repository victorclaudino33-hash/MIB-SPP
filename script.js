/**
 * MIB SPP — script.js
 * Cobre todas as funcionalidades do index.html + style.css
 *
 * Módulos:
 *  1. Header scroll (scrolled + padding)
 *  2. Menu hamburger mobile (open / close / fechar ao clicar em link)
 *  3. Smooth-scroll nos links internos com offset do header
 *  4. Active nav link conforme seção visível (IntersectionObserver)
 *  5. Animações de entrada [data-animate] (IntersectionObserver)
 *  6. Counter animado nos números da seção .authority
 *  7. Hover-audio nos vídeos com [data-hover-audio]
 *      — Galeria, depoimentos (.dep-video-card) e qualquer .video-card
 *  8. Galeria — tabs Fotos / Vídeos (.gallery__tab)
 *  9. Vídeo de Box — play/pause com botão (.video-card__play)
 * 10. Formulário de contato — validação + sucesso
 * 11. Lazy-load images (fallback para browsers sem loading="lazy")
 */

'use strict';

/* ─────────────────────────────────────────────
   UTILITÁRIOS
───────────────────────────────────────────── */

/**
 * Aguarda o DOM estar pronto antes de executar o callback.
 */
function ready(fn) {
  if (document.readyState !== 'loading') { fn(); return; }
  document.addEventListener('DOMContentLoaded', fn);
}

/**
 * Cria um IntersectionObserver com opções e callback.
 */
function createObserver(callback, options = {}) {
  return new IntersectionObserver(callback, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px',
    ...options,
  });
}

/* ─────────────────────────────────────────────
   1. HEADER SCROLL
   Adiciona .scrolled quando a página rolar
   (CSS: fundo escuro + blur + padding menor)
───────────────────────────────────────────── */

function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  const THRESHOLD = 60;

  function toggle() {
    header.classList.toggle('scrolled', window.scrollY > THRESHOLD);
  }

  window.addEventListener('scroll', toggle, { passive: true });
  toggle(); // estado inicial caso a página já esteja scrollada
}

/* ─────────────────────────────────────────────
   2. MENU HAMBURGER
   Abre/fecha o menu mobile (.nav__menu.open)
   Anima as três barras para X (.nav__hamburger.active)
   Bloqueia scroll do body enquanto o menu está aberto
───────────────────────────────────────────── */

function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');
  if (!hamburger || !navMenu) return;

  function openMenu() {
    navMenu.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-label', 'Fechar menu');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    navMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Fechar ao clicar em qualquer link do menu
  navMenu.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Fechar com tecla Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) closeMenu();
  });

  // Fechar ao clicar fora do menu (no overlay)
  navMenu.addEventListener('click', e => {
    if (e.target === navMenu) closeMenu();
  });
}

/* ─────────────────────────────────────────────
   3. SMOOTH-SCROLL COM OFFSET DO HEADER
   Intercepta todos os <a href="#..."> e aplica
   scroll suave descontando a altura do header fixo
───────────────────────────────────────────── */

function initSmoothScroll() {
  const header = document.getElementById('header');

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const headerH  = header ? header.getBoundingClientRect().height : 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerH - 12;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────
   4. ACTIVE NAV LINK (IntersectionObserver)
   Marca .nav__link com a classe "active" conforme
   a seção correspondente estiver visível
───────────────────────────────────────────── */

function initActiveNav() {
  const sections = document.querySelectorAll('main > section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const sectionMap = {};
  navLinks.forEach(link => {
    const id = link.getAttribute('href').replace('#', '');
    sectionMap[id] = link;
  });

  const observer = createObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id   = entry.target.id;
      const link = sectionMap[id];
      if (!link) return;

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });

  sections.forEach(section => observer.observe(section));
}

/* ─────────────────────────────────────────────
   5. ANIMAÇÕES DE ENTRADA [data-animate]
   O CSS define opacity:0 + translateY(24px);
   o JS adiciona .visible para acionar a transition
───────────────────────────────────────────── */

function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');
  if (!elements.length) return;

  // Respeita a preferência do usuário por menos movimento
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = createObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Pequeno delay escalonado baseado no índice do elemento no pai
        const siblings = Array.from(entry.target.parentElement.children);
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 80, 400); // máx 400ms
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  });

  elements.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────
   6. COUNTER ANIMADO — SEÇÃO .authority
   Anima os números de 0 até o valor alvo
   Detecta os sufixos (h, +, etc.) que estão no <em>
───────────────────────────────────────────── */

function initCounters() {
  const items = document.querySelectorAll('.authority__item[data-animate]');
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function animateCounter(el) {
    const numberEl = el.querySelector('.authority__number');
    if (!numberEl) return;

    // Preserva o <em> de sufixo (ex.: "+", "h")
    const emEl = numberEl.querySelector('em');
    const suffix = emEl ? emEl.textContent : '';

    // Extrai apenas os dígitos do texto
    const rawText = numberEl.childNodes[0]?.nodeValue || '';
    const target  = parseInt(rawText.replace(/\D/g, ''), 10);
    if (isNaN(target)) return;

    const duration = 1800; // ms
    const start    = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cúbico
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      numberEl.textContent = current;
      if (emEl) numberEl.appendChild(emEl);

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // Dispara o counter quando o elemento entra na viewport
  const observer = createObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  items.forEach(item => observer.observe(item));
}

/* ─────────────────────────────────────────────
   7. HOVER-AUDIO NOS VÍDEOS [data-hover-audio]
   — Depoimentos (.dep-video-card): CLIQUE para
     ativar/desativar áudio (política de autoplay
     do browser bloqueia som sem interação direta)
   — Galeria (.video-card): CLIQUE no badge de som
───────────────────────────────────────────── */

function initHoverAudio() {

  /* ── 7a. Vídeos de depoimentos (.dep-video-card) ──
     Browser não permite desmutar via hover em vídeos
     autoplay. A solução é exigir um clique.          */
  document.querySelectorAll('.dep-video-card').forEach(card => {
    const video = card.querySelector('video[data-hover-audio]');
    if (!video) return;

    // Garante que começa mutado e tocando
    video.muted = true;
    video.play().catch(() => {});

    function unmute() {
      // Pausa todos os outros vídeos de depoimento antes
      document.querySelectorAll('.dep-video-card video').forEach(v => {
        if (v !== video) {
          v.muted = true;
          v.closest('.dep-video-card').classList.remove('is-unmuted');
        }
      });

      const isMuted = video.muted;
      video.muted = !isMuted;

      if (!video.muted) {
        // Garante que o vídeo está tocando antes de desmutar
        video.play().then(() => {
          card.classList.add('is-unmuted');
        }).catch(() => {
          // Se ainda bloqueado, força mute de volta
          video.muted = true;
          card.classList.remove('is-unmuted');
        });
      } else {
        card.classList.remove('is-unmuted');
      }
    }

    // Desktop: clique no card
    card.addEventListener('click', unmute);

    // Ao sair do card, muta novamente
    card.addEventListener('mouseleave', () => {
      video.muted = true;
      card.classList.remove('is-unmuted');
    });
  });

  /* ── 7b. Vídeos da galeria (.video-card com data-hover-audio) ── */
  document.querySelectorAll('.video-card').forEach(card => {
    const video = card.querySelector('video[data-hover-audio]');
    if (!video) return;

    const badge = card.querySelector('.video-card__sound-badge');

    // Garante muted no início
    video.muted = true;

    function toggleAudio(e) {
      if (e.target.closest('.video-card__play')) return;

      const isMuted = video.muted;
      video.muted = !isMuted;

      if (!video.muted) {
        video.play().then(() => {
          if (badge) badge.style.color = 'var(--gold)';
          // Muta outros vídeos da galeria
          document.querySelectorAll('.video-card video[data-hover-audio]').forEach(v => {
            if (v !== video) {
              v.muted = true;
              const b = v.closest('.video-card')?.querySelector('.video-card__sound-badge');
              if (b) b.style.color = '';
            }
          });
        }).catch(() => {
          video.muted = true;
          if (badge) badge.style.color = '';
        });
      } else {
        if (badge) badge.style.color = '';
      }
    }

    card.addEventListener('click', toggleAudio);

    // Muta ao sair do card
    card.addEventListener('mouseleave', () => {
      video.muted = true;
      if (badge) badge.style.color = '';
    });
  });
}

/* ─────────────────────────────────────────────
   8. GALERIA — TABS FOTOS / VÍDEOS
   .gallery__tab[data-tab] controla qual
   .gallery__panel[data-panel] é exibido
───────────────────────────────────────────── */

function initGalleryTabs() {
  const tabs   = document.querySelectorAll('.gallery__tab');
  const panels = document.querySelectorAll('.gallery__panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Atualiza abas
      tabs.forEach(t => t.classList.toggle('active', t === tab));

      // Mostra/oculta painéis
      panels.forEach(panel => {
        const isTarget = panel.dataset.panel === target;
        if (isTarget) {
          panel.removeAttribute('hidden');
          // Reobserva animações de elementos dentro do painel
          panel.querySelectorAll('[data-animate]:not(.visible)').forEach(el => {
            el.classList.add('visible');
          });
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    });
  });
}

/* ─────────────────────────────────────────────
   9. VÍDEO DE BOX — PLAY / PAUSE COM BOTÃO
   O card de treino na seção #box tem
   um .video-card__play; clicar alterna play/pause
   e adiciona/remove .is-playing no card
───────────────────────────────────────────── */

function initBoxVideo() {
  const cards = document.querySelectorAll('.boxing__media-single.video-card');
  if (!cards.length) return;

  cards.forEach(card => {
    const video   = card.querySelector('video');
    const playBtn = card.querySelector('.video-card__play');
    if (!video || !playBtn) return;

    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        card.classList.add('is-playing');
      } else {
        video.pause();
        card.classList.remove('is-playing');
      }
    });

    video.addEventListener('ended', () => {
      card.classList.remove('is-playing');
    });

    // Clique no card (fora do botão) pausa se estiver tocando
    card.addEventListener('click', e => {
      if (e.target.closest('.video-card__play')) return;
      if (!video.paused) {
        video.pause();
        card.classList.remove('is-playing');
      }
    });
  });
}

/* ─────────────────────────────────────────────
   10. FORMULÁRIO DE CONTATO
   Validação dos campos obrigatórios + exibição
   de mensagem de sucesso (#formSuccess)
   Aplica borda dourada em campos inválidos
───────────────────────────────────────────── */

function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form || !success) return;

  const GOLD_FOCUS   = 'rgba(201,168,76,0.45)';
  const ERROR_COLOR  = 'rgba(239,68,68,0.6)';

  function setValid(field) {
    field.style.borderColor = '';
    field.style.boxShadow   = '';
  }

  function setInvalid(field) {
    field.style.borderColor = ERROR_COLOR;
    field.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.12)';
  }

  // Reseta estilo ao digitar
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => setValid(field));
    field.addEventListener('change', () => setValid(field));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;

    requiredFields.forEach(field => {
      const empty = field.value.trim() === '';
      if (empty) {
        setInvalid(field);
        valid = false;
      } else {
        setValid(field);
      }
    });

    // Validação extra: campo telefone deve ter pelo menos 10 dígitos
    const phoneField = form.querySelector('#phone');
    if (phoneField && phoneField.value.replace(/\D/g, '').length < 10) {
      setInvalid(phoneField);
      valid = false;
    }

    if (!valid) {
      // Foca no primeiro campo inválido
      const firstInvalid = form.querySelector('[required]:invalid, [style*="rgba(239"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    /* ── Simulação de envio (substitua por fetch real) ── */
    const submitBtn = form.querySelector('.contact__submit');
    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviando…';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        form.reset();

        // Exibe mensagem de sucesso
        success.classList.add('show');

        // Oculta após 6 segundos
        setTimeout(() => success.classList.remove('show'), 6000);
      }, 1200);
    }
  });

  /* ── Máscara de telefone ── */
  const phoneInput = form.querySelector('#phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      let v = phoneInput.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) {
        v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
      } else if (v.length > 2) {
        v = `(${v.slice(0,2)}) ${v.slice(2)}`;
      }
      phoneInput.value = v;
    });
  }
}

/* ─────────────────────────────────────────────
   11. LAZY-LOAD DE IMAGENS
   Fallback para browsers que não suportam
   loading="lazy" nativamente
───────────────────────────────────────────── */

function initLazyImages() {
  // A maioria dos browsers modernos já suporta loading="lazy"
  if ('loading' in HTMLImageElement.prototype) return;

  const images = document.querySelectorAll('img[loading="lazy"]');
  if (!images.length) return;

  const observer = createObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px 0px' });

  images.forEach(img => observer.observe(img));
}

/* ─────────────────────────────────────────────
   INICIALIZAÇÃO
───────────────────────────────────────────── */

ready(() => {
  initHeaderScroll();
  initHamburger();
  initSmoothScroll();
  initActiveNav();
  initScrollAnimations();
  initCounters();
  initHoverAudio();
  initGalleryTabs();
  initBoxVideo();
  initContactForm();
  initLazyImages();
});
