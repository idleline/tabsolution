(function (root) {
  function validateRule(rule) {
    if (!rule.name?.trim()) throw new Error('Enter a tab name.');
    if (!rule.value?.trim()) throw new Error('Enter a URL or pattern.');
    if (rule.type === 'exact') {
      const url = new URL(rule.value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use an HTTP or HTTPS URL.');
    } else if (rule.type === 'regex') {
      try { new RegExp(rule.value); } catch (error) { throw new Error(`Invalid regex: ${error.message}`); }
    } else throw new Error('Choose a rule type.');
    return rule;
  }
  function findRule(rules, url) {
    return rules.find(rule => rule.type === 'exact' && rule.value === url) ||
      rules.find(rule => {
        if (rule.type !== 'regex') return false;
        try { return new RegExp(rule.value).test(url); } catch { return false; }
      });
  }
  const api = {validateRule, findRule};
  root.TabRules = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
