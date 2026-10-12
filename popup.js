const $ = id => document.getElementById(id);
let rules = [], currentTab, editingId = null;
const selectedType = () => document.querySelector('input[name="type"]:checked').value;
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
function updateType() {
  const regex = selectedType() === 'regex';
  $('exact-field').hidden = regex; $('regex-field').hidden = !regex;
  $('url').required = !regex; $('pattern').required = regex;
  $('url').disabled = regex; $('pattern').disabled = !regex;
  preview();
}
function preview() {
  try {
    $('match-preview').textContent = $('pattern').value ? (new RegExp($('pattern').value).test(currentTab?.url || '') ? 'Matches this tab’s URL.' : 'Does not match this tab’s URL.') : '';
  } catch { $('match-preview').textContent = 'Pattern is not a valid regular expression.'; }
}
function reset() {
  editingId = null; $('tab-name').value = ''; $('url').value = currentTab?.url || ''; $('pattern').value = '';
  document.querySelector('input[value="exact"]').checked = true; updateType(); status(''); $('tab-name').focus();
}
function render() {
  $('rules').replaceChildren();
  const currentOnly = $('rule-scope').value === 'current';
  const query = $('rule-search').value.trim().toLowerCase();
  const scoped = currentOnly ? rules.filter(rule => TabRules.findRule([rule], currentTab?.url || '')) : rules;
  const visible = scoped.filter(rule => `${rule.name} ${rule.value}`.toLowerCase().includes(query));
  const active = TabRules.findRule(rules, currentTab?.url || '');
  $('rule-count').textContent = `${visible.length} shown · ${scoped.length} ${currentOnly ? 'matching this tab' : 'total rules'}`;
  if (!visible.length) {
    const li = document.createElement('li');
    li.textContent = !rules.length ? 'No rules yet. Name your first tab above.' : query ? 'No rules match your search.' : 'No rules match this tab. Choose All rules to manage other pages.';
    $('rules').append(li);
  }
  for (const rule of visible) {
    const li = document.createElement('li'), name = document.createElement('strong'), value = document.createElement('div'), actions = document.createElement('div');
    name.textContent = rule.name; value.textContent = `${rule.type === 'exact' ? 'URL' : 'Regex'} · ${rule.value}`; value.className = 'rule-value'; actions.className = 'rule-actions';
    for (const [label, handler] of [['Edit', () => {
      editingId = rule.id; $('tab-name').value = rule.name;
      document.querySelector(`input[value="${rule.type}"]`).checked = true;
      $(rule.type === 'exact' ? 'url' : 'pattern').value = rule.value; updateType(); status('Editing saved rule.'); $('tab-name').focus();
    }], ['Delete', async () => {
      try { const next = rules.filter(item => item.id !== rule.id); await chrome.storage.local.set({rules: next}); rules = next; if (editingId === rule.id) reset(); render(); status('Rule deleted.'); }
      catch (error) { status(error.message, true); }
    }]]) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'text-button'; button.textContent = label; button.setAttribute('aria-label', `${label} ${rule.name}`); button.addEventListener('click', handler); actions.append(button);
    }
    if (rule.id === active?.id) { const badge = document.createElement('span'); badge.className = 'active-badge'; badge.textContent = 'Applies to this tab'; name.append(badge); }
    li.append(name, value, actions); $('rules').append(li);
  }
}
$('rule-form').addEventListener('submit', async event => {
  event.preventDefault(); $('save').disabled = true;
  try {
    const type = selectedType();
    const rule = TabRules.validateRule({id: editingId || crypto.randomUUID(), name: $('tab-name').value.trim(), type, value: $(type === 'exact' ? 'url' : 'pattern').value.trim()});
    const duplicate = rules.find(item => item.id !== editingId && item.type === type && item.value === rule.value);
    if (duplicate) rule.id = duplicate.id;
    const index = rules.findIndex(item => item.id === (editingId || rule.id));
    const next = rules.filter(item => item.id !== editingId && item.id !== rule.id);
    next.splice(index < 0 ? next.length : Math.min(index, next.length), 0, rule);
    await chrome.storage.local.set({rules: next}); rules = next; editingId = rule.id; render();
    try {
      await chrome.scripting.executeScript({target: {tabId: currentTab.id}, files: ['rules.js', 'content.js']});
      status(TabRules.findRule(rules, currentTab.url)?.id === rule.id ? 'Saved. Tab name applied.' : 'Saved. This rule will apply to matching pages.');
    } catch { status('Saved. Reload this page to apply, or visit a matching website.'); }
  } catch (error) { status(error.message, true); }
  finally { $('save').disabled = false; }
});
$('cancel').addEventListener('click', () => window.close());
$('new-rule').addEventListener('click', reset);
$('rule-scope').addEventListener('change', () => { $('rules').scrollTop = 0; render(); });
$('rule-search').addEventListener('input', () => { $('rules').scrollTop = 0; render(); });
document.querySelectorAll('input[name="type"]').forEach(input => input.addEventListener('change', updateType));
$('pattern').addEventListener('input', preview);
(async () => {
  try {
    [currentTab] = await chrome.tabs.query({active: true, currentWindow: true});
    rules = (await chrome.storage.local.get({rules: []})).rules;
    reset(); render();
    const exact = rules.find(rule => rule.type === 'exact' && rule.value === currentTab?.url);
    if (exact) { editingId = exact.id; $('tab-name').value = exact.name; }
    if (!/^https?:\/\//.test(currentTab?.url || '')) status('Chrome internal pages cannot be renamed. You can still create website rules.', true);
  } catch (error) { status(`Could not load rules: ${error.message}`, true); $('save').disabled = true; }
})();
