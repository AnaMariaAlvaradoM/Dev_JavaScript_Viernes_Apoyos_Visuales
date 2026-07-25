/* ============================================================================
   ana-clase.js
   © 2026 Ana Alvarado — Educadora Tech & Desarrolladora Full Stack
   Lógica compartida para libros de clase interactivos.
   ============================================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var themeButton = document.getElementById('temaBtn');
  var presentButton = document.getElementById('presentBtn');
  var progressBar = document.getElementById('progressBar');
  var slideStatus = document.getElementById('slideStatus');
  var sections = Array.from(document.querySelectorAll('.seccion'));
  var navItems = Array.from(document.querySelectorAll('.nav-item'));
  var currentSlide = 0;
  var scrollBeforePresentation = 0;

  function setTheme(theme) {
    var isLight = theme === 'claro';
    if (isLight) root.setAttribute('data-tema', 'claro');
    else root.removeAttribute('data-tema');

    if (themeButton) {
      themeButton.querySelector('span').textContent = isLight ? '☾' : '☀';
      themeButton.setAttribute('aria-label', isLight ? 'Activar tema oscuro' : 'Activar tema claro');
    }
    localStorage.setItem('ana-tema', isLight ? 'claro' : 'oscuro');
  }

  setTheme(localStorage.getItem('ana-tema') === 'claro' ? 'claro' : 'oscuro');
  if (themeButton) {
    themeButton.addEventListener('click', function () {
      setTheme(root.getAttribute('data-tema') === 'claro' ? 'oscuro' : 'claro');
    });
  }

  document.querySelectorAll('.copy-btn').forEach(function (button) {
    button.addEventListener('click', async function () {
      var code = button.closest('.code-block')?.querySelector('code')?.innerText;
      if (!code) return;
      var originalText = button.textContent;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(code);
        } else {
          var textarea = document.createElement('textarea');
          textarea.value = code;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        }
        button.textContent = 'Copiado ✓';
      } catch (error) {
        button.textContent = 'No se pudo copiar';
      }

      window.setTimeout(function () { button.textContent = originalText; }, 1800);
    });
  });

  document.querySelectorAll('.ver-explicacion').forEach(function (button) {
    button.addEventListener('click', function () {
      var explanation = button.nextElementSibling;
      if (!explanation) return;
      var open = explanation.classList.toggle('abierta');
      explanation.setAttribute('aria-hidden', String(!open));
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Ocultar explicación' : 'Mostrar explicación';
    });
  });

  function updateProgress() {
    if (!progressBar || body.classList.contains('presentacion')) return;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
  }

  function setActiveNavigation(sectionId) {
    navItems.forEach(function (item) {
      var active = item.getAttribute('href') === '#' + sectionId;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      var visible = entries
        .filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (visible) setActiveNavigation(visible.target.id);
    }, { rootMargin: '-18% 0px -62% 0px', threshold: [0.05, 0.2, 0.5] });
    sections.forEach(function (section) { observer.observe(section); });
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  function updateSlide() {
    sections.forEach(function (section, index) {
      section.classList.toggle('slide-activa', index === currentSlide);
    });
    var contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'instant' });
    if (slideStatus) slideStatus.textContent = String(currentSlide + 1).padStart(2, '0') + ' / ' + String(sections.length).padStart(2, '0');
  }

  function enterPresentation() {
    if (!sections.length || body.classList.contains('presentacion')) return;
    scrollBeforePresentation = window.scrollY;
    var activeIndex = navItems.findIndex(function (item) { return item.classList.contains('active'); });
    currentSlide = activeIndex >= 0 ? activeIndex : 0;
    body.classList.add('presentacion');
    if (progressBar) progressBar.style.width = '0%';
    updateSlide();

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
  }

  function exitPresentation() {
    if (!body.classList.contains('presentacion')) return;
    body.classList.remove('presentacion');
    sections.forEach(function (section) { section.classList.remove('slide-activa'); });
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
    window.scrollTo({ top: scrollBeforePresentation, behavior: 'instant' });
    updateProgress();
  }

  function moveSlide(delta) {
    var next = currentSlide + delta;
    if (next < 0 || next >= sections.length) return;
    currentSlide = next;
    updateSlide();
  }

  if (presentButton) presentButton.addEventListener('click', enterPresentation);

  document.addEventListener('keydown', function (event) {
    var target = event.target;
    var isTyping = target && /INPUT|TEXTAREA|SELECT/.test(target.tagName);
    if (isTyping) return;

    if ((event.key === 'p' || event.key === 'P') && !body.classList.contains('presentacion')) {
      enterPresentation();
      return;
    }
    if (!body.classList.contains('presentacion')) return;

    if (event.key === 'Escape') exitPresentation();
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      moveSlide(1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      moveSlide(-1);
    }
    if (event.key === 'Home') { currentSlide = 0; updateSlide(); }
    if (event.key === 'End') { currentSlide = sections.length - 1; updateSlide(); }
  });

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && body.classList.contains('presentacion')) {
      exitPresentation();
    }
  });

  document.addEventListener('contextmenu', function (event) {
    if (!event.target.closest('.code-block')) event.preventDefault();
  });

  var accent = getComputedStyle(root).getPropertyValue('--brand').trim() || '#6018F0';
  console.log('%c© 2026 Ana Alvarado', 'color:' + accent + ';font-weight:700;font-size:16px');
  console.log('Educadora Tech & Desarrolladora Full Stack — Todos los derechos reservados.');
  console.log('Este material es de autoría exclusiva. Prohibida su reproducción o redistribución sin autorización.');
})();
