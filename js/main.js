/* ==========================================================================
   MAIN INTERACTIONS CONTROLLER
   - Bilingual ES / EN switching (persisted in localStorage)
   - Fluid interactive ASCII Hero background
   - Real-time Buenos Aires, Argentina clock (America/Argentina/Buenos_Aires)
   - Sticky right-edge section stepper (01-04) + navbar active highlight
   - Work Tabs: TODOS -> SOCIAL MEDIA (fading drag+arrow carousel) -> BRANDING -> UX/UI
   - UX/UI project blocks + rich modal with screen switcher & Tools Used
   - Smart Monstro tonal check + One-click email copy + mobile drawer
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_LANG_KEY = 'nnp_portfolio_lang';
  let currentLang = localStorage.getItem(STORAGE_LANG_KEY) || 'es';
  if (!window.TRANSLATIONS || !window.TRANSLATIONS[currentLang]) {
    currentLang = 'es';
  }

  function getDictValue(dict, path) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), dict);
  }

  // =========================================================================
  // 1. LANGUAGE SWITCHING (ES / EN)
  // =========================================================================
  function applyLanguage(lang) {
    const dict = window.TRANSLATIONS && window.TRANSLATIONS[lang];
    if (!dict) return;

    currentLang = lang;
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.title = dict.pageTitle;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = getDictValue(dict, key);
      if (typeof value === 'string') {
        el.textContent = value;
      }
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const isMatch = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-pressed', String(isMatch));
    });
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang && lang !== currentLang) {
        applyLanguage(lang);
      }
    });
  });

  // =========================================================================
  // 2. FLUID INTERACTIVE ASCII BACKGROUND (HERO)
  // =========================================================================
  const asciiCanvas = document.getElementById('ascii-bg');
  const heroSection = document.getElementById('home');
  if (asciiCanvas && heroSection && window.FluidAsciiBackground) {
    new window.FluidAsciiBackground(asciiCanvas, heroSection);
  }

  // =========================================================================
  // 3. REAL-TIME BUENOS AIRES, ARGENTINA CLOCK
  // =========================================================================
  const baClockEl = document.getElementById('ba-clock');
  if (baClockEl) {
    const baFormatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    function updateClock() {
      const timeStr = baFormatter.format(new Date());
      baClockEl.textContent = `LIVE · BA, AR · ${timeStr}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  // =========================================================================
  // 4. FLOATING NAVBAR + STICKY SECTION STEPPER (01-04) TRACKING
  // =========================================================================
  const navbarWrap = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const stepperEl = document.getElementById('section-stepper');
  const stepperItems = document.querySelectorAll('.stepper-item');
  const footerEl = document.getElementById('contact');

  const sectionIds = ['home', 'about', 'work', 'experience'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  function setActiveSection(activeId) {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('data-section') === activeId);
    });

    stepperItems.forEach((item) => {
      const isActive = item.getAttribute('data-section') === activeId;
      item.classList.toggle('is-active', isActive);
      if (isActive) {
        item.setAttribute('aria-current', 'true');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }

  function updateScrollState() {
    if (navbarWrap) {
      navbarWrap.classList.toggle('is-scrolled', window.scrollY > 36);
    }

    const probeY = window.innerHeight * 0.42;
    let activeId = sectionIds[0];

    for (let i = 0; i < sections.length; i++) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top <= probeY) {
        activeId = sections[i].id;
      }
    }
    setActiveSection(activeId);

    if (stepperEl && footerEl) {
      const fRect = footerEl.getBoundingClientRect();
      const sRect = stepperEl.getBoundingClientRect();
      const stepperMid = sRect.top + sRect.height * 0.5;
      stepperEl.classList.toggle('is-on-dark', stepperMid >= fRect.top);
    }
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  // =========================================================================
  // 5. WORK TABS (TODOS -> SOCIAL MEDIA -> BRANDING -> UX/UI & WEB)
  // =========================================================================
  const tabBtns = document.querySelectorAll('[role="tab"][data-tab]');
  const workPanels = {
    all: document.getElementById('panel-all'),
    social: document.getElementById('panel-social'),
    branding: document.getElementById('panel-branding'),
    uxui: document.getElementById('panel-uxui')
  };

  function activateWorkTab(target) {
    if (!workPanels[target]) return;

    tabBtns.forEach((b) => {
      const active = b.getAttribute('data-tab') === target;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });

    Object.keys(workPanels).forEach((key) => {
      const panel = workPanels[key];
      if (!panel) return;
      const show = key === target;
      panel.hidden = !show;
      panel.classList.toggle('is-active', show);
    });

    requestAnimationFrame(() => {
      updateScrollState();
      if (target === 'social' && typeof updateSocialCarouselUI === 'function') {
        updateSocialCarouselUI();
      }
    });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => activateWorkTab(btn.getAttribute('data-tab')));
  });

  // Overview cards inside TODOS jump directly to the chosen discipline tab
  document.querySelectorAll('[data-jump-tab]').forEach((card) => {
    const go = () => {
      const target = card.getAttribute('data-jump-tab');
      activateWorkTab(target);
      const workSec = document.getElementById('work');
      if (workSec) workSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    });
  });

  // =========================================================================
  // 6. SOCIAL MEDIA DRAGGABLE & ARROW-NAVIGABLE CAROUSEL + LIGHTBOX (36 items)
  // =========================================================================
  const socialTrack = document.getElementById('social-track');
  const socialPrev = document.getElementById('social-prev');
  const socialNext = document.getElementById('social-next');
  const socialCounter = document.getElementById('social-counter');
  const socialItems = (window.PORTFOLIO_ASSETS && window.PORTFOLIO_ASSETS.socialMedia) || [];
  let updateSocialCarouselUI = null;

  const lightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let lightboxIndex = 0;

  function openLightbox(idx) {
    if (!lightbox || !socialItems.length) return;
    lightboxIndex = (idx + socialItems.length) % socialItems.length;
    const item = socialItems[lightboxIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.title;
    lightboxCaption.textContent = `${String(lightboxIndex + 1).padStart(2, '0')} / ${String(socialItems.length).padStart(2, '0')} — ${item.title}`;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => openLightbox(lightboxIndex - 1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => openLightbox(lightboxIndex + 1));
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  if (socialTrack && socialItems.length) {
    const frag = document.createDocumentFragment();
    socialItems.forEach((item, idx) => {
      const slide = document.createElement('div');
      slide.className = 'social-slide';
      slide.dataset.index = String(idx);

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      if (item.w) img.width = item.w;
      if (item.h) img.height = item.h;
      img.loading = idx < 5 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.draggable = false;

      const zoomBtn = document.createElement('button');
      zoomBtn.type = 'button';
      zoomBtn.className = 'social-slide-zoom';
      zoomBtn.setAttribute('aria-label', `Ver ${item.title}`);
      zoomBtn.textContent = '↗';
      zoomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(idx);
      });

      slide.appendChild(img);
      slide.appendChild(zoomBtn);
      frag.appendChild(slide);
    });
    socialTrack.appendChild(frag);

    updateSocialCarouselUI = function () {
      const maxScroll = Math.max(0, socialTrack.scrollWidth - socialTrack.clientWidth);
      if (socialPrev) socialPrev.disabled = socialTrack.scrollLeft <= 6;
      if (socialNext) socialNext.disabled = socialTrack.scrollLeft >= maxScroll - 6;

      if (socialCounter) {
        const slides = socialTrack.children;
        const leftEdge = socialTrack.scrollLeft + 48;
        let currentIdx = 1;
        for (let i = 0; i < slides.length; i++) {
          if (slides[i].offsetLeft <= leftEdge) {
            currentIdx = i + 1;
          } else {
            break;
          }
        }
        socialCounter.textContent = `${String(currentIdx).padStart(2, '0')} / ${String(socialItems.length).padStart(2, '0')}`;
      }
    };

    function scrollByStep(direction) {
      const step = Math.max(280, Math.round(socialTrack.clientWidth * 0.68));
      socialTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
    }

    if (socialPrev) socialPrev.addEventListener('click', () => scrollByStep(-1));
    if (socialNext) socialNext.addEventListener('click', () => scrollByStep(1));

    let isPointerDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let draggedDistance = 0;
    let lastX = 0;
    let velocity = 0;
    let momentumRaf = null;

    function stopMomentum() {
      if (momentumRaf) {
        cancelAnimationFrame(momentumRaf);
        momentumRaf = null;
      }
    }

    socialTrack.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.target.closest('.social-slide-zoom')) return;

      stopMomentum();
      isPointerDown = true;
      draggedDistance = 0;
      startX = e.clientX;
      lastX = e.clientX;
      startScrollLeft = socialTrack.scrollLeft;
      velocity = 0;
      socialTrack.classList.add('is-dragging');
      socialTrack.setPointerCapture(e.pointerId);
    });

    socialTrack.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      draggedDistance = Math.max(draggedDistance, Math.abs(dx));
      velocity = e.clientX - lastX;
      lastX = e.clientX;
      socialTrack.scrollLeft = startScrollLeft - dx;
    });

    function endDrag(e) {
      if (!isPointerDown) return;
      isPointerDown = false;
      socialTrack.classList.remove('is-dragging');
      if (e && socialTrack.hasPointerCapture(e.pointerId)) {
        socialTrack.releasePointerCapture(e.pointerId);
      }

      if (draggedDistance < 8 && e) {
        const slide = e.target.closest('.social-slide');
        if (slide && slide.dataset.index !== undefined) {
          openLightbox(Number(slide.dataset.index));
          return;
        }
      }

      let v = velocity * 1.15;
      function glide() {
        if (Math.abs(v) < 0.4) return;
        socialTrack.scrollLeft -= v;
        v *= 0.92;
        momentumRaf = requestAnimationFrame(glide);
      }
      if (Math.abs(v) > 1.2) {
        momentumRaf = requestAnimationFrame(glide);
      }
    }

    socialTrack.addEventListener('pointerup', endDrag);
    socialTrack.addEventListener('pointercancel', endDrag);

    socialTrack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollByStep(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollByStep(-1);
      }
    });

    socialTrack.addEventListener('scroll', updateSocialCarouselUI, { passive: true });
    window.addEventListener('resize', updateSocialCarouselUI, { passive: true });
    updateSocialCarouselUI();
  }

  // =========================================================================
  // 7. BRANDING NUMBERED LOGO GRID (Directly on white, optically equal sizes)
  // =========================================================================
  const brandingGrid = document.getElementById('branding-grid');
  const brandingLogos = (window.PORTFOLIO_ASSETS && window.PORTFOLIO_ASSETS.brandingLogos) || [];

  function checkLightLogoSource(imgEl) {
    if (window.location.protocol === 'file:') return;
    try {
      const size = 48;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let lumSum = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 80) {
          lumSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          count++;
        }
      }
      if (count > 0 && lumSum / count > 195) {
        imgEl.classList.add('is-light-source');
      }
    } catch (_err) {
      // Safe fallback
    }
  }

  if (brandingGrid && brandingLogos.length) {
    const frag = document.createDocumentFragment();
    brandingLogos.forEach((logo) => {
      const cell = document.createElement('div');
      cell.className = 'brand-cell';

      const top = document.createElement('div');
      top.className = 'brand-cell-top';
      top.innerHTML = `<span>${logo.id}</span><span class="brand-cell-name">${logo.name}</span>`;

      const box = document.createElement('div');
      box.className = 'brand-logo-box';

      const img = document.createElement('img');
      img.src = logo.src;
      img.alt = `${logo.name} — Logo`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      img.style.setProperty('--logo-scale', String(logo.scale || 1));

      if (logo.mode === 'monstro') {
        img.className = 'brand-logo-img brand-logo-img--monstro';
        img.addEventListener('load', () => checkLightLogoSource(img));
      } else if (logo.mode === 'tonal') {
        img.className = 'brand-logo-img brand-logo-img--tonal';
      } else {
        img.className = 'brand-logo-img brand-logo-img--ink';
      }

      box.appendChild(img);
      cell.appendChild(top);
      cell.appendChild(box);
      frag.appendChild(cell);
    });
    brandingGrid.appendChild(frag);
  }

  // =========================================================================
  // 8. UX/UI & WEB ORGANIZED PROJECTS + RICH MODAL (with screen gallery & tools)
  // =========================================================================
  const uxListEl = document.getElementById('uxui-projects-list');
  const uxProjects = (window.PORTFOLIO_ASSETS && window.PORTFOLIO_ASSETS.uxuiProjects) || [];

  const modal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close');
  const modalPreviewImg = document.getElementById('modal-preview-img');
  const modalThumbs = document.getElementById('modal-thumbs');
  const modalEyebrow = document.getElementById('modal-eyebrow');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalTools = document.getElementById('modal-tools');
  const modalTags = document.getElementById('modal-tags');

  function openUxProjectModal(project, initialImgIdx) {
    const tData = getDictValue(window.TRANSLATIONS[currentLang], `work.ux.${project.key}`);
    if (!tData || !modal) return;

    modalEyebrow.textContent = `${tData.role} · ${project.year}`;
    modalTitle.textContent = tData.title;
    modalBody.textContent = tData.full;

    // Populate Tools Used
    modalTools.innerHTML = '';
    project.tools.forEach((tool) => {
      const li = document.createElement('li');
      li.textContent = tool;
      modalTools.appendChild(li);
    });

    // Populate Deliverables
    modalTags.innerHTML = '';
    tData.deliverables.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      modalTags.appendChild(li);
    });

    // Populate Preview Image + Screen Switcher Thumbnails
    const startIdx = Math.max(0, Math.min(project.images.length - 1, initialImgIdx || 0));
    function setPreview(idx) {
      const pic = project.images[idx];
      modalPreviewImg.src = pic.src;
      modalPreviewImg.alt = pic.alt;
      modalThumbs.querySelectorAll('.modal-thumb-btn').forEach((btn, bIdx) => {
        btn.classList.toggle('is-active', bIdx === idx);
      });
    }

    modalThumbs.innerHTML = '';
    if (project.images.length > 1) {
      project.images.forEach((pic, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'modal-thumb-btn';
        btn.setAttribute('aria-label', pic.alt);
        const tImg = document.createElement('img');
        tImg.src = pic.src;
        tImg.alt = '';
        btn.appendChild(tImg);
        btn.addEventListener('click', () => setPreview(idx));
        modalThumbs.appendChild(btn);
      });
    }
    setPreview(startIdx);

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  if (uxListEl && uxProjects.length) {
    const frag = document.createDocumentFragment();
    uxProjects.forEach((project) => {
      const block = document.createElement('article');
      block.className = 'ux-project-block';

      const head = document.createElement('div');
      head.className = 'ux-project-head';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'ux-project-title-wrap';
      titleWrap.innerHTML = `
        <div class="ux-project-meta-top">
          <span class="ux-project-num">${project.num}</span>
          <span data-i18n="work.ux.${project.key}.role"></span>
          <span>· ${project.year}</span>
        </div>
        <h3 class="ux-project-title" data-i18n="work.ux.${project.key}.title"></h3>
        <p class="ux-project-short" data-i18n="work.ux.${project.key}.short"></p>
      `;

      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'ux-project-open-btn';
      openBtn.setAttribute('data-i18n', 'work.viewDetailsHint');
      openBtn.addEventListener('click', () => openUxProjectModal(project, 0));

      head.appendChild(titleWrap);
      head.appendChild(openBtn);

      const grid = document.createElement('div');
      const countClass = project.images.length === 1 ? 'ux-screens-grid--1' : project.images.length === 2 ? 'ux-screens-grid--2' : 'ux-screens-grid--3';
      grid.className = `ux-screens-grid ${countClass}`;

      project.images.forEach((pic, imgIdx) => {
        const card = document.createElement('div');
        card.className = 'ux-screen-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `${pic.alt} — Ver detalle`);

        const img = document.createElement('img');
        img.src = pic.src;
        img.alt = pic.alt;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.draggable = false;

        const badge = document.createElement('span');
        badge.className = 'ux-screen-badge';
        badge.setAttribute('data-i18n', 'work.viewDetailsHint');

        card.appendChild(img);
        card.appendChild(badge);

        const trigger = () => openUxProjectModal(project, imgIdx);
        card.addEventListener('click', trigger);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            trigger();
          }
        });

        grid.appendChild(card);
      });

      block.appendChild(head);
      block.appendChild(grid);
      frag.appendChild(block);
    });
    uxListEl.appendChild(frag);
  }

  if (modalClose) modalClose.addEventListener('click', closeProjectModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProjectModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && !modal.hidden) closeProjectModal();
      if (lightbox && !lightbox.hidden) closeLightbox();
    } else if (lightbox && !lightbox.hidden) {
      if (e.key === 'ArrowLeft') openLightbox(lightboxIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(lightboxIndex + 1);
    }
  });

  // =========================================================================
  // 9. MOBILE MENU DRAWER
  // =========================================================================
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  function setMobileMenu(open) {
    if (!mobileToggle || !mobileDrawer) return;
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileDrawer.hidden = !open;
  }

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileToggle.getAttribute('aria-expanded') === 'true';
      setMobileMenu(!isOpen);
    });

    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMobileMenu(false));
    });

    document.addEventListener('click', (e) => {
      if (
        !mobileDrawer.hidden &&
        !mobileDrawer.contains(e.target) &&
        !mobileToggle.contains(e.target)
      ) {
        setMobileMenu(false);
      }
    });
  }

  // =========================================================================
  // 10. COPY EMAIL TO CLIPBOARD + TOAST (niebas.n@gmail.com)
  // =========================================================================
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2600);
  }

  async function copyEmail(email) {
    try {
      await navigator.clipboard.writeText(email);
    } catch (_err) {
      const temp = document.createElement('textarea');
      temp.value = email;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }

    const msg = getDictValue(window.TRANSLATIONS[currentLang], 'toast.copied') || `Copied: ${email}`;
    showToast(msg);
  }

  [document.getElementById('copy-email-btn'), document.getElementById('footer-copy-btn')]
    .filter(Boolean)
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email') || 'niebas.n@gmail.com';
        copyEmail(email);
      });
    });

  // =========================================================================
  // 11. SCROLL REVEAL & DYNAMIC YEAR
  // =========================================================================
  const yearEl = document.getElementById('year-now');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-inview'));
  }

  // Initialize language on load (runs AFTER dynamic UX/UI blocks are mounted so all data-i18n hydrate!)
  applyLanguage(currentLang);
})();
