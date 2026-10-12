(() => {
  if (globalThis.tabsolutionLoaded) return;
  globalThis.tabsolutionLoaded = true;
  let rules = [];
  let originalTitle = document.title;
  let appliedTitle = null;
  let lastURL = location.href;
  function apply() {
    if (lastURL !== location.href) {
      lastURL = location.href;
      // A site's next title update supplies the new page's natural title.
    }
    if (document.title !== appliedTitle) originalTitle = document.title;
    const rule = TabRules.findRule(rules, location.href);
    if (rule) {
      appliedTitle = rule.name;
      if (document.title !== appliedTitle) document.title = appliedTitle;
    } else if (appliedTitle !== null) {
      if (document.title === appliedTitle) document.title = originalTitle;
      appliedTitle = null;
    }
  }
  chrome.storage.local.get({rules: []}).then(data => { rules = data.rules; apply(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.rules) { rules = changes.rules.newValue || []; apply(); }
  });
  new MutationObserver(apply).observe(document.documentElement, {subtree: true, childList: true, characterData: true});
  window.addEventListener('popstate', apply);
  window.addEventListener('hashchange', apply);
  // History API navigation can change URLs without changing the DOM.
  setInterval(apply, 1000);
})();
