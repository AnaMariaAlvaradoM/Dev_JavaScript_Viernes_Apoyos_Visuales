/* ============================================================================
   ANA LEARNING EXPERIENCE SYSTEM · CONTROLADOR v5.0 "SIGNAL"
   © 2026 Ana Alvarado · Educadora Tech & Desarrolladora Full Stack

   Novedad v5: animación de gráficos (barras, columnas, donut, línea) cuando
   entran en viewport. Los gráficos se declaran con su valor final en un
   atributo data-* y el JS los revela. Todo lo demás (tema, fullscreen, copiar,
   navegación SPA/Slides) se conserva de v4.
   ============================================================================ */
(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const format = body.dataset.formato || root.dataset.formato || 'spa';
  const themeButton = document.getElementById('temaBtn');
  const fullscreenButton = document.getElementById('fullscreenBtn');
  const progressBar = document.getElementById('progressBar');

  /* ---- Tema claro/oscuro con memoria ---- */
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

  /* ---- Pantalla completa ---- */
  fullscreenButton?.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  });

  /* ---- Copiar código ---- */
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.closest('.code-block')?.querySelector('code')?.innerText;
      if (!code) return;
      const original = button.textContent;
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(code);
        else {
          const textarea = document.createElement('textarea');
          textarea.value = code; textarea.style.position = 'fixed'; textarea.style.opacity = '0';
          document.body.appendChild(textarea); textarea.select();
          document.execCommand('copy'); textarea.remove();
        }
        button.textContent = 'Copiado ✓';
      } catch (_) { button.textContent = 'No se pudo copiar'; }
      window.setTimeout(() => { button.textContent = original; }, 1600);
    });
  });

  /* ---- Revelar explicación (opcional) ---- */
  document.querySelectorAll('.reveal-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const content = button.nextElementSibling;
      if (!content) return;
      const open = content.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Ocultar explicación' : 'Mostrar explicación';
    });
  });

  /* ---- Animación de gráficos al entrar en viewport (v5) ----
     Uso en HTML:
       .bar-fill    con  style="width:0"   y  data-target="72"
       .col-bar     con  style="height:0"  y  data-target="60"   (porcentaje de la altura)
       .donut circle segmento con data-dash="62" (longitud del arco sobre 100)
     El JS aplica el valor final cuando el elemento es visible.            */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateChart(container) {
    container.querySelectorAll('.bar-fill[data-target]').forEach((el) => {
      el.style.width = el.dataset.target + '%';
    });
    container.querySelectorAll('.col-bar[data-target]').forEach((el) => {
      el.style.height = el.dataset.target + '%';
    });
    container.querySelectorAll('.donut circle[data-dash]').forEach((el) => {
      const dash = parseFloat(el.dataset.dash);
      el.style.strokeDasharray = `${dash} ${100 - dash}`;
    });
  }

  const chartTargets = document.querySelectorAll('.chart-panel, .donut-panel, .columns, .bars, .line-chart');
  if (chartTargets.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      chartTargets.forEach(animateChart);
    } else {
      const chartObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { animateChart(entry.target); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.35 });
      chartTargets.forEach((t) => chartObserver.observe(t));
    }
  }

  /* ---- SPA: navegación activa + progreso ---- */
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
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      }, { rootMargin: '-22% 0px -62% 0px', threshold: [0.05, 0.2, 0.45] });
      sections.forEach((s) => observer.observe(s));
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* ---- Slides: navegación, fragmentos, teclado ---- */
  function initSlides() {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const prevButtons = Array.from(document.querySelectorAll('[data-slide-action="prev"]'));
    const nextButtons = Array.from(document.querySelectorAll('[data-slide-action="next"]'));
    const statusNodes = Array.from(document.querySelectorAll('[data-slide-status]'));
    const progressNodes = Array.from(document.querySelectorAll('[data-slide-progress]'));
    const dotContainers = Array.from(document.querySelectorAll('[data-slide-dots]'));
    let current = 0;

    dotContainers.forEach((container) => {
      container.innerHTML = slides.map((_, i) => `<button class="slide-dot" type="button" data-slide-index="${i}" aria-label="Ir a diapositiva ${i + 1}"></button>`).join('');
    });
    function fragmentsFor(i) { return Array.from(slides[i]?.querySelectorAll('.fragment') || []); }

    function render() {
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        if (active) animateChart(slide);
      });
      const label = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      const percentage = slides.length ? ((current + 1) / slides.length) * 100 : 0;
      statusNodes.forEach((n) => { n.textContent = label; });
      progressNodes.forEach((n) => { n.style.setProperty('--slide-progress', `${percentage}%`); });
      if (progressBar) progressBar.style.width = `${percentage}%`;
      document.querySelectorAll('.slide-dot').forEach((dot) => dot.classList.toggle('is-active', Number(dot.dataset.slideIndex) === current));
    }
    function next() {
      const nf = fragmentsFor(current).find((it) => !it.classList.contains('is-visible'));
      if (nf) { nf.classList.add('is-visible'); return; }
      if (current < slides.length - 1) { current += 1; render(); }
    }
    function previous() {
      const vis = fragmentsFor(current).filter((it) => it.classList.contains('is-visible'));
      if (vis.length) { vis[vis.length - 1].classList.remove('is-visible'); return; }
      if (current > 0) { current -= 1; render(); }
    }
    prevButtons.forEach((b) => b.addEventListener('click', previous));
    nextButtons.forEach((b) => b.addEventListener('click', next));
    document.addEventListener('click', (e) => {
      const dot = e.target.closest('.slide-dot');
      if (!dot) return;
      current = Number(dot.dataset.slideIndex) || 0; render();
    });
    document.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); previous(); }
      if (e.key === 'Home') { current = 0; render(); }
      if (e.key === 'End') { current = slides.length - 1; render(); }
      if ((e.key === 'f' || e.key === 'F') && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    });
    render();
  }

  if (format === 'slides') initSlides();
  else initSpa();

  const accent = getComputedStyle(root).getPropertyValue('--brand').trim() || '#5418CC';
  console.log('%c© 2026 Ana Alvarado', `color:${accent};font-weight:800;font-size:16px`);
  console.log('Ana Learning Experience System v5.0 "Signal" · Material de autoría exclusiva.');
})();
