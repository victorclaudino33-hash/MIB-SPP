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
   Validação + EmailJS + feedback descritivo
   + contador de caracteres + máscara de telefone
───────────────────────────────────────────── */

function initContactForm() {
  // Inicializa EmailJS com a chave pública
  if (window.emailjs) {
    emailjs.init({ publicKey: 'mKipnyk8gseSW272E' });
  }

  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form || !success) return;

  const ERROR_COLOR = 'rgba(239,68,68,0.6)';

  /* ── Helpers de estado de campo ── */
  function getErrorEl(field) {
    return field.parentElement.querySelector('.contact__field-error');
  }

  function setValid(field) {
    field.style.borderColor = '';
    field.style.boxShadow   = '';
    const err = getErrorEl(field);
    if (err) err.textContent = '';
  }

  function setInvalid(field, msg) {
    field.style.borderColor = ERROR_COLOR;
    field.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.12)';
    const err = getErrorEl(field);
    if (err) err.textContent = msg || 'Campo obrigatório';
  }

  /* ── Cria spans de erro abaixo de cada campo ── */
  form.querySelectorAll('input, select, textarea').forEach(field => {
    const span = document.createElement('span');
    span.className = 'contact__field-error';
    field.parentElement.appendChild(span);

    field.addEventListener('input',  () => setValid(field));
    field.addEventListener('change', () => setValid(field));
  });

  /* ── Validação de e-mail ── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ── Submissão ── */
  form.addEventListener('submit', e => {
    e.preventDefault();

    let valid = true;

    // Nome
    const nameField = form.querySelector('#name');
    if (nameField) {
      if (nameField.value.trim() === '') {
        setInvalid(nameField, 'Por favor, informe seu nome completo');
        valid = false;
      } else {
        setValid(nameField);
      }
    }

    // E-mail
    const emailField = form.querySelector('#email');
    if (emailField) {
      if (emailField.value.trim() === '') {
        setInvalid(emailField, 'Por favor, informe seu e-mail');
        valid = false;
      } else if (!isValidEmail(emailField.value.trim())) {
        setInvalid(emailField, 'E-mail inválido (ex: nome@email.com)');
        valid = false;
      } else {
        setValid(emailField);
      }
    }

    // Telefone
    const phoneField = form.querySelector('#phone');
    if (phoneField) {
      const digits = phoneField.value.replace(/\D/g, '');
      if (digits.length < 10) {
        setInvalid(phoneField, 'Telefone deve ter pelo menos 10 dígitos');
        valid = false;
      } else {
        setValid(phoneField);
      }
    }

    // Serviço
    const serviceField = form.querySelector('#service');
    if (serviceField && serviceField.value === '') {
      setInvalid(serviceField, 'Selecione o tipo de serviço');
      valid = false;
    } else if (serviceField) {
      setValid(serviceField);
    }

    if (!valid) {
      const firstInvalid = form.querySelector('[style*="rgba(239"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    /* ── Envio via EmailJS ── */
    const submitBtn = form.querySelector('.contact__submit');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviando… <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="60" stroke-dashoffset="15"/></svg>';
    }

    const templateParams = {
      from_name:    form.querySelector('#name')?.value    || '',
      from_email:   form.querySelector('#email')?.value   || '',
      phone:        form.querySelector('#phone')?.value   || '',
      service:      form.querySelector('#service')?.value || '',
      message:      form.querySelector('#message')?.value || '',
    };

    emailjs.send('service_fv6ww8c', 'template_zvccxma', templateParams)
      .then(() => {
        // Envia confirmação para o cliente
        return emailjs.send('service_fv6ww8c', 'template_xxk48xw', templateParams);
      })
      .then(() => {
        form.reset();
        if (charCountEl) charCountEl.textContent = '0/500';

        success.classList.add('show');
        setTimeout(() => success.classList.remove('show'), 6000);

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }
      })
      .catch(err => {
        console.error('EmailJS error:', err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }
        alert('Erro ao enviar mensagem. Tente novamente ou nos contate pelo WhatsApp.');
      });
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

  /* ── Contador de caracteres (mensagem) ── */
  const messageInput = form.querySelector('#message');
  const charCountEl  = document.getElementById('charCount');
  if (messageInput && charCountEl) {
    messageInput.addEventListener('input', () => {
      const len = messageInput.value.length;
      charCountEl.textContent = `${len}/500`;
      charCountEl.style.color = len > 450 ? 'rgba(239,68,68,0.8)' : '';
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
   12. GALERIA — VER MAIS / VER MENOS
   Exibe INITIAL_SHOW itens por padrão em cada
   painel (fotos e vídeos). O botão expande ou
   recolhe os itens restantes com animação suave.
───────────────────────────────────────────── */

function initGalleryToggle() {
  const INITIAL_SHOW = 6; // quantos itens aparecem por padrão

  /**
   * Configura o "ver mais / ver menos" para um painel específico.
   * @param {string} panelSelector  - seletor do painel (data-panel)
   * @param {string} itemSelector   - seletor dos itens dentro do painel
   * @param {string} btnId          - id do botão toggle
   * @param {string} countId        - id do span de contagem
   * @param {string} wrapId         - id do wrapper do botão
   * @param {string} labelMore      - texto "ver mais"
   * @param {string} labelLess      - texto "ver menos"
   */
  function setupToggle({ panelSelector, itemSelector, btnId, countId, wrapId, labelMore, labelLess }) {
    const panel = document.querySelector(panelSelector);
    const btn   = document.getElementById(btnId);
    const countEl = document.getElementById(countId);
    const wrap  = document.getElementById(wrapId);
    if (!panel || !btn) return;

    const items = Array.from(panel.querySelectorAll(itemSelector));
    const total = items.length;
    const hidden = total - INITIAL_SHOW;

    // Se não há itens extras, esconde o botão inteiro
    if (hidden <= 0) {
      if (wrap) wrap.style.display = 'none';
      return;
    }

    // Esconde os itens além do limite inicial
    items.slice(INITIAL_SHOW).forEach(el => el.classList.add('gallery__item--hidden'));

    // Mostra contagem no badge (+25, etc.)
    if (countEl) countEl.textContent = `+${hidden}`;

    let expanded = false;

    btn.addEventListener('click', () => {
      expanded = !expanded;

      if (expanded) {
        // Expande: mostra tudo
        items.slice(INITIAL_SHOW).forEach(el => {
          el.classList.remove('gallery__item--hidden');
          // Garante que a animação de entrada dispare nos itens recém-exibidos
          if (!el.classList.contains('visible')) el.classList.add('visible');
        });
        btn.querySelector('.gallery__toggle-label').textContent = labelLess;
        if (countEl) countEl.textContent = '';
        btn.setAttribute('aria-expanded', 'true');
      } else {
        // Recolhe: volta ao estado inicial e rola suave até o topo da galeria
        items.slice(INITIAL_SHOW).forEach(el => el.classList.add('gallery__item--hidden'));
        btn.querySelector('.gallery__toggle-label').textContent = labelMore;
        if (countEl) countEl.textContent = `+${hidden}`;
        btn.setAttribute('aria-expanded', 'false');

        // Rola de volta ao topo da seção galeria
        const section = document.getElementById('galeria');
        if (section) {
          const header = document.getElementById('header');
          const headerH = header ? header.getBoundingClientRect().height : 0;
          const top = section.getBoundingClientRect().top + window.scrollY - headerH - 12;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  }

  // Fotos
  setupToggle({
    panelSelector: '.gallery__panel[data-panel="fotos"]',
    itemSelector:  '.photo-grid__item',
    btnId:         'toggleFotos',
    countId:       'toggleFotosCount',
    wrapId:        'toggleFotosWrap',
    labelMore:     'Ver mais fotos',
    labelLess:     'Ver menos fotos',
  });

  // Vídeos — o wrapper começa oculto; o módulo de tabs o exibe ao mudar de aba
  setupToggle({
    panelSelector: '.gallery__panel[data-panel="videos"]',
    itemSelector:  '.video-card',
    btnId:         'toggleVideos',
    countId:       'toggleVideosCount',
    wrapId:        'toggleVideosWrap',
    labelMore:     'Ver mais vídeos',
    labelLess:     'Ver menos vídeos',
  });

  // Sincroniza a visibilidade do botão de vídeos com as abas
  document.querySelectorAll('.gallery__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const activeTab   = tab.dataset.tab;
      const fotosWrap   = document.getElementById('toggleFotosWrap');
      const videosWrap  = document.getElementById('toggleVideosWrap');
      if (fotosWrap)  fotosWrap.style.display  = activeTab === 'fotos'   ? 'flex' : 'none';
      if (videosWrap) videosWrap.style.display  = activeTab === 'videos'  ? 'flex' : 'none';
    });
  });
}

/* ─────────────────────────────────────────────
   INICIALIZAÇÃO
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   13. SCROLL-TO-TOP
   Botão aparece após 400px de scroll
───────────────────────────────────────────── */

function initScrollToTop() {
  const btn = document.createElement('button');
  btn.className   = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Voltar ao topo');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────────
   14. VALIDAÇÃO DE NOME (bloqueia números)
───────────────────────────────────────────── */

function initNameField() {
  const nameInput = document.getElementById('name');
  if (!nameInput) return;
  nameInput.addEventListener('input', () => {
    nameInput.value = nameInput.value.replace(/[0-9]/g, '');
  });
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
  initGalleryToggle();
  initBoxVideo();
  initContactForm();
  initLazyImages();
  initScrollToTop();
  initNameField();
});
