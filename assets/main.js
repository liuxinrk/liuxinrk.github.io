(function () {
  function T(key, vars, fallback) {
    var i = window.XLi18n;
    if (i) return i.t(key, vars, fallback);
    return fallback.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }
  var renderers = [];
  window.addEventListener('xl:lang', function () { renderers.forEach(function (f) { f(); }); });

  // mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // "show N / show all" lists
  function limitList(list, n, button) {
    var items = Array.prototype.slice.call(list.children);
    var expanded = false;
    function render() {
      items.forEach(function (li, i) { li.hidden = !expanded && i >= n; });
      if (button) {
        button.hidden = items.length <= n;
        button.textContent = expanded ? T('ui.showFewer', null, 'Show fewer')
          : T(button.dataset.key || 'ui.showAll', { n: items.length }, button.dataset.label);
      }
    }
    if (button) button.addEventListener('click', function () { expanded = !expanded; render(); });
    renderers.push(render);
    render();
    return { reset: function () { expanded = false; render(); } };
  }

  // publications: search + year filter + show more
  var pubList = document.getElementById('pub-list');
  if (pubList) {
    var q = document.getElementById('pub-q');
    var yearSel = document.getElementById('pub-year');
    var moreBtn = document.getElementById('pub-more');
    var empty = document.getElementById('pub-empty');
    var rows = Array.prototype.slice.call(pubList.children);
    var LIMIT = 8;
    var expanded = false;
    function apply() {
      var term = (q.value || '').trim().toLowerCase();
      var yr = yearSel.value;
      var filtering = term || yr;
      var shown = 0;
      rows.forEach(function (li) {
        var ok = (!term || li.textContent.toLowerCase().indexOf(term) !== -1) && (!yr || li.dataset.year === yr);
        var visible = ok && (filtering || expanded || shown < LIMIT);
        li.hidden = !visible;
        if (ok) shown++;
      });
      moreBtn.hidden = !!filtering || rows.length <= LIMIT;
      moreBtn.textContent = expanded ? T('ui.showFewer', null, 'Show fewer')
        : T(moreBtn.dataset.key || 'ui.showAllPubs', { n: rows.length }, moreBtn.dataset.label);
      empty.hidden = shown !== 0;
    }
    q.addEventListener('input', apply);
    yearSel.addEventListener('change', apply);
    moreBtn.addEventListener('click', function () { expanded = !expanded; apply(); });
    renderers.push(apply);
    apply();
  }

  // presentations: tabs, each panel limited
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  tabs.forEach(function (tab) {
    var panel = document.getElementById(tab.getAttribute('aria-controls'));
    var list = panel.querySelector('.rows');
    var btn = panel.querySelector('.more .btn');
    var ctl = limitList(list, 8, btn);
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var sel = t === tab;
        t.setAttribute('aria-selected', sel ? 'true' : 'false');
        document.getElementById(t.getAttribute('aria-controls')).hidden = !sel;
      });
      ctl.reset();
    });
  });

  // news
  var news = document.getElementById('news-list');
  if (news) limitList(news, 8, document.getElementById('news-more'));

})();
