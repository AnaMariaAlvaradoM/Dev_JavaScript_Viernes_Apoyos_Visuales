/* ============================================================================
   ANA LEARNING EXPERIENCE SYSTEM · CONTROLADOR v4.0
   © 2026 Ana Alvarado · Educadora Tech & Desarrolladora Full Stack
   ============================================================================ */
(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const format = body.dataset.formato || root.dataset.formato || 'spa';
  const themeButton = document.getElementById('temaBtn');
  const fullscreenButton = document.getElementById('fullscreenBtn');
  const progressBar = document.getElementById('progressBar');

  function setTheme(theme) {
    const normalized = theme === 'oscuro' ? 'oscuro' : 'claro';
    root.dataset.tema = normalized;
    localStorage.setItem('ana-tema', normalized);
    if (themeButton) {
      const dark = normalized === 'oscuro';
      themeButton.textContent = dark ? '☀' : '☾';
      themeButton.setAttribute('aria-label', dark ? 'Activar tema claro' : 'Activar tema oscuro');
    }
  }

  const saved = localStorage.getItem('ana-tema');
  setTheme(saved || (root.dataset.temaBase === 'oscuro' ? 'oscuro' : 'claro'));
  themeButton?.addEventListener('click', () => setTheme(root.dataset.tema === 'oscuro' ? 'claro' : 'oscuro'));

  fullscreenButton?.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  });

  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.closest('.code-block')?.querySelector('code')?.innerText;
      if (!code) return;
      const original = button.textContent;
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(code);
        else {
          const textarea = document.createElement('textarea');
          textarea.value = code;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        }
        button.textContent = 'Copiado ✓';
      } catch (_) {
        button.textContent = 'No se pudo copiar';
      }
      window.setTimeout(() => { button.textContent = original; }, 1600);
    });
  });

  document.querySelectorAll('.reveal-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const content = button.nextElementSibling;
      if (!content) return;
      const open = content.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Ocultar explicación' : 'Mostrar explicación';
    });
  });

  function initSpa() {
    const sections = Array.from(document.querySelectorAll('.spa-section[id]'));
    const navItems = Array.from(document.querySelectorAll('.nav-item'));

    function updateProgress() {
      if (!progressBar) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }

    function setActive(id) {
      navItems.forEach((item) => {
        const active = item.getAttribute('href') === `#${id}`;
        item.classList.toggle('active', active);
        if (active) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
    }

    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      }, { rootMargin: '-22% 0px -62% 0px', threshold: [0.05, 0.2, 0.45] });
      sections.forEach((section) => observer.observe(section));
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  function initSlides() {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const prevButtons = Array.from(document.querySelectorAll('[data-slide-action="prev"]'));
    const nextButtons = Array.from(document.querySelectorAll('[data-slide-action="next"]'));
    const statusNodes = Array.from(document.querySelectorAll('[data-slide-status]'));
    const progressNodes = Array.from(document.querySelectorAll('[data-slide-progress]'));
    const dotContainers = Array.from(document.querySelectorAll('[data-slide-dots]'));
    let current = 0;

    dotContainers.forEach((container) => {
      container.innerHTML = slides.map((_, index) => `<button class="slide-dot" type="button" data-slide-index="${index}" aria-label="Ir a diapositiva ${index + 1}"></button>`).join('');
    });

    function fragmentsFor(index) {
      return Array.from(slides[index]?.querySelectorAll('.fragment') || []);
    }

    function render() {
      slides.forEach((slide, index) => {
        const active = index === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });

      const label = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      const percentage = slides.length ? ((current + 1) / slides.length) * 100 : 0;
      statusNodes.forEach((node) => { node.textContent = label; });
      progressNodes.forEach((node) => { node.style.width = `${percentage}%`; });
      if (progressBar) progressBar.style.width = `${percentage}%`;
      document.querySelectorAll('.slide-dot').forEach((dot) => dot.classList.toggle('is-active', Number(dot.dataset.slideIndex) === current));
    }

    function next() {
      const nextFragment = fragmentsFor(current).find((item) => !item.classList.contains('is-visible'));
      if (nextFragment) { nextFragment.classList.add('is-visible'); return; }
      if (current < slides.length - 1) { current += 1; render(); }
    }

    function previous() {
      const visible = fragmentsFor(current).filter((item) => item.classList.contains('is-visible'));
      if (visible.length) { visible[visible.length - 1].classList.remove('is-visible'); return; }
      if (current > 0) { current -= 1; render(); }
    }

    prevButtons.forEach((button) => button.addEventListener('click', previous));
    nextButtons.forEach((button) => button.addEventListener('click', next));
    document.addEventListener('click', (event) => {
      const dot = event.target.closest('.slide-dot');
      if (!dot) return;
      current = Number(dot.dataset.slideIndex) || 0;
      render();
    });

    document.addEventListener('keydown', (event) => {
      const typing = event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName);
      if (typing) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); previous(); }
      if (event.key === 'Home') { current = 0; render(); }
      if (event.key === 'End') { current = slides.length - 1; render(); }
      if ((event.key === 'f' || event.key === 'F') && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    });

    render();
  }

  if (format === 'slides') initSlides();
  else initSpa();

  const accent = getComputedStyle(root).getPropertyValue('--brand').trim() || '#6018F0';
  console.log('%c© 2026 Ana Alvarado', `color:${accent};font-weight:800;font-size:16px`);
  console.log('Ana Learning Experience System v4.0 · Material de autoría exclusiva.');
})();
