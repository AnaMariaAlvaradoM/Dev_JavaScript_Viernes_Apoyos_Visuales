/* ========================================================================== 
   ANA LEARNING EXPERIENCE SYSTEM · CONTROLADOR v11.0 "CONSTRUCCIÓN ACTIVA"
   © 2026 Ana Alvarado · Educadora Tech & Desarrolladora Full Stack

   Una SPA real: portada y una sola sección visible a la vez.
   El contenido, los bloques de código y los componentes pedagógicos se
   conservan; este controlador solo cambia navegación, estado y presentación.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var themeButton = document.getElementById('temaBtn');
  var fullscreenButton = document.getElementById('fullscreenBtn');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var activeView = null;

  /* -----------------------------------------------------------------
     Contraste del acento
     ----------------------------------------------------------------- */
  function colorRgb(value) {
    var probe = document.createElement('span');
    probe.style.color = value;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    var match = getComputedStyle(probe).color.match(/[\d.]+/g);
    probe.remove();
    return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
  }

  function luminance(rgb) {
    var values = rgb.map(function (value) {
      value /= 255;
      return value <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4);
    });
    return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
  }

  function contrastRatio(foreground, background) {
    var a = luminance(colorRgb(foreground));
    var b = luminance(colorRgb(background));
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  }

  function guardAccentContrast() {
    root.removeAttribute('data-contraste-acento');
    var styles = getComputedStyle(root);
    var accent = styles.getPropertyValue('--a1-text').trim();
    var surface = styles.getPropertyValue('--surf-1').trim();
    if (accent && surface && contrastRatio(accent, surface) < 4.5) {
      root.dataset.contrasteAcento = 'fallback';
    }
  }

  /* -----------------------------------------------------------------
     Mermaid: solo se dibuja la escena visible para evitar anchos de cero.
     ----------------------------------------------------------------- */
  var mermaidReady = false;

  function mermaidThemeVars() {
    var styles = getComputedStyle(root);
    var token = function (name) { return styles.getPropertyValue(name).trim(); };
    return {
      theme: 'base',
      themeVariables: {
        darkMode: root.dataset.tema !== 'claro',
        background: token('--surf-2'),
        primaryColor: 'color-mix(in srgb, ' + token('--scene-accent') + ' 18%, ' + token('--surf-1') + ')',
        primaryBorderColor: token('--scene-accent'),
        primaryTextColor: token('--ink'),
        secondaryColor: 'color-mix(in srgb, ' + token('--scene-accent-2') + ' 18%, ' + token('--surf-1') + ')',
        tertiaryColor: 'color-mix(in srgb, ' + token('--a3') + ' 18%, ' + token('--surf-1') + ')',
        lineColor: token('--ink-mute'),
        fontFamily: token('--font-mono') || 'monospace',
        fontSize: '15px'
      }
    };
  }

  function mermaidBlocks(scope) {
    if (!scope) return [];
    var blocks = Array.prototype.slice.call(scope.querySelectorAll('.mermaid'));
    if (scope.matches && scope.matches('.mermaid')) blocks.unshift(scope);
    return blocks;
  }

  function mermaidFallback(blocks) {
    blocks.forEach(function (element) {
      if (!element.dataset.src) element.dataset.src = (element.textContent || '').trim();
      element.innerHTML = '';
      element.classList.add('mermaid--fallback');
      var note = document.createElement('p');
      note.className = 'mermaid-note';
      note.textContent = 'Diagrama interactivo — requiere conexión para dibujarse.';
      element.appendChild(note);
    });
  }

  function renderMermaid(scope) {
    var blocks = mermaidBlocks(scope || activeView || document);
    if (!blocks.length) return;
    if (typeof window.mermaid === 'undefined') {
      mermaidFallback(blocks);
      return;
    }

    blocks.forEach(function (element) {
      if (!element.dataset.src) element.dataset.src = (element.textContent || '').trim();
      element.classList.remove('mermaid--fallback');
      element.removeAttribute('data-processed');
      element.innerHTML = element.dataset.src;
    });

    try {
      window.mermaid.initialize(Object.assign({
        startOnLoad: false,
        securityLevel: 'strict'
      }, mermaidThemeVars()));
      Promise.resolve(window.mermaid.run({ nodes: blocks })).then(function () {
        mermaidReady = true;
      }).catch(function () {
        mermaidFallback(blocks);
      });
    } catch (error) {
      mermaidFallback(blocks);
    }
  }

  /* -----------------------------------------------------------------
     Tema claro/oscuro con memoria
     ----------------------------------------------------------------- */
  function setTheme(theme) {
    var normalized = theme === 'claro' ? 'claro' : 'oscuro';
    root.dataset.tema = normalized;
    guardAccentContrast();
    try { localStorage.setItem('ana-tema-v11', normalized); } catch (error) {}

    if (themeButton) {
      var dark = normalized === 'oscuro';
      themeButton.textContent = dark ? '☀' : '☾';
      themeButton.setAttribute('aria-label', dark ? 'Activar tema claro' : 'Activar tema oscuro');
    }

    if (mermaidReady && activeView) renderMermaid(activeView);
  }

  var savedTheme;
  try {
    savedTheme = localStorage.getItem('ana-tema-v11') || localStorage.getItem('ana-tema-v9') || localStorage.getItem('ana-tema-v8');
  } catch (error) {}
  setTheme(savedTheme || (root.dataset.temaBase === 'claro' ? 'claro' : 'oscuro'));
  if (themeButton) {
    themeButton.addEventListener('click', function () {
      setTheme(root.dataset.tema === 'oscuro' ? 'claro' : 'oscuro');
    });
  }

  /* -----------------------------------------------------------------
     Pantalla completa
     ----------------------------------------------------------------- */
  function toggleFullscreen() {
    try {
      var action;
      if (!document.fullscreenElement) {
        action = (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
      } else {
        action = (document.exitFullscreen || function () {}).call(document);
      }
      if (action && typeof action.catch === 'function') action.catch(function () {});
    } catch (error) {}
  }

  if (fullscreenButton) fullscreenButton.addEventListener('click', toggleFullscreen);

  /* -----------------------------------------------------------------
     Copiar código: no modifica ni reinterpreta el contenido.
     ----------------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'), function (button) {
    button.setAttribute('aria-live', 'polite');
    button.addEventListener('click', function () {
      var block = button.closest('.code-block');
      var codeElement = block ? block.querySelector('code') : null;
      var code = codeElement ? codeElement.innerText : '';
      if (!code) return;
      var original = button.textContent;
      var done = function () {
        button.textContent = 'Copiado ✓';
        window.setTimeout(function () { button.textContent = original; }, 1500);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code).then(done).catch(function () {
          button.textContent = 'No se pudo copiar';
        });
      } else {
        var textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); done(); } catch (error) {
          button.textContent = 'No se pudo copiar';
        }
        textarea.remove();
      }
    });
  });

  /* -----------------------------------------------------------------
     Construcción activa: revelar soluciones sin romper el ritmo.
     - <details class="code-reveal"> mantiene el archivo completo disponible,
       pero fuera del camino visual principal hasta que el estudiante lo necesita.
     - Al abrir una solución se vuelve a aplicar Prism solo dentro de ese bloque.
     - Las microactividades usan <details> nativo: funcionan sin JavaScript.
     ----------------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('details.code-reveal'), function (details) {
    var summary = details.querySelector(':scope > summary');
    if (summary) summary.setAttribute('aria-label', summary.getAttribute('aria-label') || 'Mostrar u ocultar archivo completo');

    details.addEventListener('toggle', function () {
      if (!details.open) return;
      if (typeof window.Prism !== 'undefined' && window.Prism.highlightAllUnder) {
        window.requestAnimationFrame(function () { window.Prism.highlightAllUnder(details); });
      }
    });
  });

  /* -----------------------------------------------------------------
     Gráficos: se animan al abrir su escena.
     ----------------------------------------------------------------- */
  function animateChart(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('.bar-fill[data-target]'), function (element) {
      element.style.width = Math.min(100, Math.max(0, parseFloat(element.dataset.target) || 0)) + '%';
    });
    Array.prototype.forEach.call(scope.querySelectorAll('.col-bar[data-target]'), function (element) {
      element.style.height = Math.min(100, Math.max(0, parseFloat(element.dataset.target) || 0)) + '%';
    });
    Array.prototype.forEach.call(scope.querySelectorAll('.donut circle[data-dash]'), function (element) {
      var dash = Math.min(100, Math.max(0, parseFloat(element.dataset.dash) || 0));
      element.style.strokeDasharray = dash + ' ' + (100 - dash);
    });
  }

  function animateChartsIn(view) {
    var scopes = view.querySelectorAll('.databox, .donut-panel, .visual-panel, .chart-panel, .columns');
    Array.prototype.forEach.call(scopes, function (scope) {
      if (reduceMotion) animateChart(scope);
      else window.requestAnimationFrame(function () { animateChart(scope); });
    });
  }

  /* -----------------------------------------------------------------
     SPA de escenas: portada + una sola sección visible.
     Compatible con guías v8 que todavía no marcan la portada como vista.
     ----------------------------------------------------------------- */
  var shell = document.getElementById('shell');
  var main = document.querySelector('.main');
  var content = document.querySelector('.content');
  var nav = document.getElementById('nav') || document.querySelector('.sb-nav');
  var collapseButton = document.getElementById('collapseBtn');
  var progressFill = document.getElementById('progFill');
  var progressPercent = document.getElementById('progPct');
  var topLine = document.getElementById('topline');
  var hero = document.querySelector('.hero');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.section[id]'));

  if (hero) {
    if (!hero.id) hero.id = 'portada';
    hero.classList.add('view');
  }
  sections.forEach(function (section) { section.classList.add('view'); });

  var views = hero ? [hero].concat(sections) : sections.slice();

  function ensureCoverLink() {
    if (!hero || !nav || nav.querySelector('[href="#' + hero.id + '"]')) return;
    var link = document.createElement('a');
    link.className = 'nav-item nav-item--cover';
    link.href = '#' + hero.id;
    link.dataset.icon = '✦';
    link.innerHTML = '<span class="nav-index">00</span><span class="nav-label">Portada</span>';
    nav.insertBefore(link, nav.firstChild);
  }
  ensureCoverLink();

  var navItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item[href^="#"]'));

  if (shell && collapseButton) {
    collapseButton.addEventListener('click', function () {
      var collapsed = shell.dataset.collapsed === 'true';
      shell.dataset.collapsed = collapsed ? 'false' : 'true';
      collapseButton.textContent = collapsed ? '‹' : '›';
      collapseButton.setAttribute('aria-label', collapsed ? 'Colapsar menú' : 'Expandir menú');
      try { localStorage.setItem('ana-sidebar-v11', shell.dataset.collapsed); } catch (error) {}
    });

    var savedSidebar;
    try {
      savedSidebar = localStorage.getItem('ana-sidebar-v11') || localStorage.getItem('ana-sidebar-v9') || localStorage.getItem('ana-sidebar-v8');
    } catch (error) {}
    if (savedSidebar === 'true') {
      shell.dataset.collapsed = 'true';
      collapseButton.textContent = '›';
    }
  }

  function ensureViewControls() {
    var controls = document.getElementById('viewControls');
    if (controls || !main || views.length < 2) return controls;
    controls = document.createElement('nav');
    controls.className = 'view-controls';
    controls.id = 'viewControls';
    controls.setAttribute('aria-label', 'Navegación entre secciones');
    controls.innerHTML = '<button class="view-btn" id="prevView" type="button" aria-label="Sección anterior">←</button>' +
      '<span class="view-position" id="viewPosition" aria-live="polite"></span>' +
      '<button class="view-btn" id="nextView" type="button" aria-label="Sección siguiente">→</button>';
    main.appendChild(controls);
    return controls;
  }

  ensureViewControls();
  var previousButton = document.getElementById('prevView');
  var nextButton = document.getElementById('nextView');
  var viewPosition = document.getElementById('viewPosition');

  function viewById(id) {
    return views.filter(function (view) { return view.id === id; })[0] || null;
  }

  function progressFor(index) {
    if (views.length < 2) return 100;
    return Math.round((index / (views.length - 1)) * 100);
  }

  function updateRouteUi(view, index) {
    navItems.forEach(function (item) {
      var current = item.getAttribute('href') === '#' + view.id;
      item.classList.toggle('active', current);
      if (current) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    var accent = view.dataset.accent || String(index === 0 ? 1 : ((index - 1) % 4) + 1);
    root.dataset.activeAccent = accent;

    var percent = progressFor(index);
    if (topLine) topLine.style.width = percent + '%';
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressPercent) progressPercent.textContent = percent + '%';
    if (viewPosition) viewPosition.textContent = index === 0 ? 'Portada' : index + ' de ' + (views.length - 1);
    if (previousButton) previousButton.disabled = index === 0;
    if (nextButton) nextButton.disabled = index === views.length - 1;
  }

  function setActiveView(id, options) {
    if (!views.length) return;
    options = options || {};
    var view = viewById(id) || views[0];
    var index = views.indexOf(view);

    views.forEach(function (candidate) {
      var current = candidate === view;
      candidate.hidden = !current;
      candidate.classList.toggle('is-active', current);
      candidate.setAttribute('aria-hidden', current ? 'false' : 'true');
    });

    activeView = view;
    if (content) content.hidden = view === hero;
    updateRouteUi(view, index);
    root.classList.add('spa-ready');

    if (main) main.scrollTop = 0;
    window.scrollTo(0, 0);

    if (options.focus) {
      var heading = view.querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }

    window.requestAnimationFrame(function () {
      animateChartsIn(view);
      if (typeof window.Prism !== 'undefined' && window.Prism.highlightAllUnder) {
        window.Prism.highlightAllUnder(view);
      }
      renderMermaid(view);
    });
  }

  function goToIndex(index, focus) {
    if (index < 0 || index >= views.length) return;
    var id = views[index].id;
    if (window.location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    setActiveView(id, { focus: focus });
  }

  navItems.forEach(function (item) {
    item.addEventListener('click', function (event) {
      var id = decodeURIComponent(item.getAttribute('href').slice(1));
      if (!viewById(id)) return;
      event.preventDefault();
      if (window.location.hash !== '#' + id) history.pushState(null, '', '#' + id);
      setActiveView(id, { focus: true });
    });
  });

  if (previousButton) {
    previousButton.addEventListener('click', function () {
      goToIndex(Math.max(0, views.indexOf(activeView) - 1), true);
    });
  }
  if (nextButton) {
    nextButton.addEventListener('click', function () {
      goToIndex(Math.min(views.length - 1, views.indexOf(activeView) + 1), true);
    });
  }

  window.addEventListener('popstate', function () {
    setActiveView(decodeURIComponent(window.location.hash.slice(1)), { focus: true });
  });
  window.addEventListener('hashchange', function () {
    setActiveView(decodeURIComponent(window.location.hash.slice(1)), { focus: true });
  });

  document.addEventListener('keydown', function (event) {
    if (event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.key === 'f' || event.key === 'F') {
      toggleFullscreen();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToIndex(Math.max(0, views.indexOf(activeView) - 1), true);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToIndex(Math.min(views.length - 1, views.indexOf(activeView) + 1), true);
    }
  });

  var initialId = decodeURIComponent(window.location.hash.slice(1));
  if (!viewById(initialId) && views.length) {
    initialId = views[0].id;
    history.replaceState(null, '', '#' + initialId);
  }
  setActiveView(initialId, { focus: false });

  if (document.querySelector('.mermaid') && typeof window.mermaid === 'undefined') {
    window.addEventListener('load', function () {
      window.setTimeout(function () { renderMermaid(activeView); }, 300);
    });
  }

  var accent = getComputedStyle(root).getPropertyValue('--scene-accent').trim() || '#2fd4cb';
  try {
    console.log('%c© 2026 Ana Alvarado', 'color:' + accent + ';font-weight:800;font-size:16px');
    console.log('Ana Learning Experience System v11.0 "Construcción Activa" · Material de autoría exclusiva.');
  } catch (error) {}
})();
