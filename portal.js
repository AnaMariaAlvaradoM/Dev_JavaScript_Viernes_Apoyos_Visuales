/*
  PLANTILLA UNIVERSAL DE PORTALES · ANA ALVARADO
  Este único archivo controla el portal y también crea el botón de regreso
  cuando se carga dentro de una guía mediante data-home.
*/
(function () {
  'use strict';

  var loader = document.currentScript;
  var root = document.documentElement;
  var company = (loader && loader.dataset.empresa) || root.dataset.empresa || 'generation';
  var home = loader && loader.dataset.home;

  if (home) mountHomeButton(home, company);
  if (document.getElementById('lista-guias')) initPortal(company);

  function initPortal(activeCompany) {
    var themeButton = document.getElementById('temaBtn');
    var searchToggle = document.getElementById('mostrarBusqueda');
    var searchPanel = document.getElementById('panelBusqueda');
    var searchInput = document.getElementById('buscarGuia');
    var clearButton = document.getElementById('limpiarBusqueda');
    var expandButton = document.getElementById('expandirModulos');
    var emptyState = document.getElementById('sinResultados');
    var resultStatus = document.getElementById('estadoResultados');
    var modules = Array.prototype.slice.call(document.querySelectorAll('.modulo'));
    var moduleCount = document.querySelector('[data-module-count]');
    var resourceCount = document.querySelector('[data-resource-count]');
    var themeKey = 'ana-portal-tema-' + activeCompany;
    var allowMultipleModules = false;

    root.dataset.empresa = activeCompany;

    function normalize(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    }

    function setTheme(theme) {
      var dark = theme === 'oscuro';
      root.dataset.tema = dark ? 'oscuro' : 'claro';
      if (themeButton) {
        themeButton.textContent = dark ? '☀' : '☾';
        themeButton.setAttribute('aria-label', dark ? 'Activar tema claro' : 'Activar tema oscuro');
        themeButton.setAttribute('title', dark ? 'Activar tema claro' : 'Activar tema oscuro');
      }
      try { localStorage.setItem(themeKey, dark ? 'oscuro' : 'claro'); } catch (error) {}
    }

    var storedTheme;
    try { storedTheme = localStorage.getItem(themeKey); } catch (error) {}
    setTheme(storedTheme || 'oscuro');

    if (themeButton) {
      themeButton.addEventListener('click', function () {
        setTheme(root.dataset.tema === 'oscuro' ? 'claro' : 'oscuro');
      });
    }

    var availableResources = document.querySelectorAll('a.clase[href]').length;
    if (moduleCount) moduleCount.textContent = modules.length;
    if (resourceCount) resourceCount.textContent = availableResources;

    modules.forEach(function (module, index) {
      module.open = index === 0;
      module.addEventListener('toggle', function () {
        if (!module.open || allowMultipleModules || normalize(searchInput && searchInput.value)) return;
        modules.forEach(function (other) {
          if (other !== module) other.open = false;
        });
        updateExpandLabel();
      });
    });

    function visibleItems() {
      return Array.prototype.slice.call(document.querySelectorAll('.clase')).filter(function (item) {
        return !item.hidden && !item.closest('.modulo').hidden;
      }).length;
    }

    function updateStatus(query) {
      var count = visibleItems();
      if (emptyState) emptyState.hidden = count !== 0;
      if (resultStatus) {
        resultStatus.textContent = query
          ? count + (count === 1 ? ' resultado' : ' resultados')
          : availableResources + ' guías disponibles';
      }
    }

    function filterGuides() {
      var query = normalize(searchInput && searchInput.value);
      modules.forEach(function (module) {
        var items = Array.prototype.slice.call(module.querySelectorAll('.clase'));
        var visible = 0;
        items.forEach(function (item) {
          var matches = !query || normalize(item.textContent).indexOf(query) !== -1;
          item.hidden = !matches;
          if (matches) visible += 1;
        });
        module.hidden = visible === 0;
        if (query && visible) module.open = true;
      });
      if (clearButton) clearButton.hidden = !query;
      if (expandButton) expandButton.hidden = !!query;
      updateStatus(query);
      updateExpandLabel();
    }

    function showSearch(show) {
      if (!searchPanel || !searchToggle) return;
      searchPanel.hidden = !show;
      searchToggle.setAttribute('aria-expanded', show ? 'true' : 'false');
      searchToggle.setAttribute('aria-label', show ? 'Cerrar búsqueda' : 'Buscar una guía');
      var label = searchToggle.querySelector('[data-search-label]');
      if (label) label.textContent = show ? 'Cerrar' : 'Buscar';
      if (show && searchInput) searchInput.focus();
    }

    function updateExpandLabel() {
      if (!expandButton) return;
      var visibleModules = modules.filter(function (module) { return !module.hidden; });
      var shouldExpand = visibleModules.some(function (module) { return !module.open; });
      expandButton.dataset.action = shouldExpand ? 'expandir' : 'contraer';
      expandButton.textContent = shouldExpand ? 'Expandir' : 'Contraer';
      expandButton.setAttribute('aria-expanded', shouldExpand ? 'false' : 'true');
    }

    if (searchToggle) {
      searchToggle.addEventListener('click', function () { showSearch(searchPanel.hidden); });
    }
    if (searchInput) {
      searchInput.addEventListener('input', filterGuides);
      searchInput.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        searchInput.value = '';
        filterGuides();
        showSearch(false);
        searchToggle.focus();
      });
    }
    if (clearButton) {
      clearButton.addEventListener('click', function () {
        searchInput.value = '';
        filterGuides();
        searchInput.focus();
      });
    }
    if (expandButton) {
      expandButton.addEventListener('click', function () {
        var expand = expandButton.dataset.action === 'expandir';
        allowMultipleModules = expand;
        modules.forEach(function (module) {
          if (!module.hidden) module.open = expand;
        });
        allowMultipleModules = false;
        updateExpandLabel();
      });
    }

    updateStatus('');
    updateExpandLabel();
  }

  function mountHomeButton(homePath, activeCompany) {
    if (document.querySelector('.ana-portal-home')) return;

    var style = document.createElement('style');
    style.textContent = [
      '.ana-portal-home{--home-brand:#0879b8;position:fixed;top:16px;left:16px;z-index:10000;min-height:44px;display:inline-flex;align-items:center;gap:8px;padding:0 13px;border:1px solid #cfd3d0;border-radius:10px;background:#fff;color:#252a28;box-shadow:0 2px 8px rgba(18,24,21,.1);font:650 13px/1.1 system-ui,sans-serif;text-decoration:none;transition:border-color .18s ease,background .18s ease}',
      '.ana-portal-home:hover{border-color:var(--home-brand);background:#f7f8f7}',
      '.ana-portal-home:focus-visible{outline:3px solid color-mix(in srgb,var(--home-brand) 50%,white);outline-offset:3px}',
      '.ana-portal-home svg{width:18px;height:18px;flex:0 0 18px}',
      '.ana-portal-home[data-empresa="dev-senior"]{--home-brand:#6d3ff0}',
      ':root[data-tema="oscuro"] .ana-portal-home{background:#1d201f;color:#e7e9e7;border-color:#414643;box-shadow:0 2px 8px rgba(0,0,0,.24)}',
      '.controls .ana-portal-home{position:static;order:-1}',
      '@media(max-width:560px){.ana-portal-home{width:44px;padding:0;justify-content:center}.ana-portal-home span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}',
      '@media(prefers-reduced-motion:reduce){.ana-portal-home{transition:none}}'
    ].join('');
    document.head.appendChild(style);

    var link = document.createElement('a');
    link.className = 'ana-portal-home';
    link.href = homePath;
    link.dataset.empresa = activeCompany;
    link.setAttribute('aria-label', 'Volver a todas las guías');
    link.setAttribute('title', 'Todas las guías');
    link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg><span>Todas las guías</span>';

    var controls = document.querySelector('.controls');
    if (controls) controls.insertBefore(link, controls.firstChild);
    else document.body.insertBefore(link, document.body.firstChild);
  }
})();
