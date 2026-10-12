const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {findRule, validateRule} = require('../rules.js');
test('exact URLs win over regex; full URLs include query and fragment', () => {
  const regex = {type: 'regex', value: 'example\\.com', name: 'Broad'};
  const exact = {type: 'exact', value: 'https://example.com/?x=1#top', name: 'Exact'};
  assert.equal(findRule([regex, exact], exact.value), exact);
  assert.equal(findRule([regex, exact], 'https://example.com/?x=2#top'), regex);
  assert.equal(findRule([exact], 'https://example.com/'), undefined);
});
test('first matching regex wins and corrupt patterns are ignored', () => {
  const first = {type: 'regex', value: '^https://[^/]+\\.mce\\.salesforce\\.[a-z]{2,3}(?:/|$)', name: 'Salesforce'};
  assert.equal(findRule([{type: 'regex', value: '['}, first, {...first, name: 'Second'}], 'https://demo.mce.salesforce.com/dashboard'), first);
  assert.equal(findRule([first], 'https://demo.mce.salesforce.com.evil.com/'), undefined);
});
test('validation rejects malformed patterns, empty names, and unsupported URLs', () => {
  assert.throws(() => validateRule({name: 'X', type: 'regex', value: '['}), /Invalid regex/);
  assert.throws(() => validateRule({name: ' ', type: 'regex', value: '.*'}), /tab name/);
  assert.throws(() => validateRule({name: 'X', type: 'exact', value: 'chrome://extensions'}), /HTTP/);
  assert.doesNotThrow(() => validateRule({name: 'X', type: 'exact', value: 'https://example.com/'}));
});
test('content script applies, preserves, changes, and restores titles without duplicate listeners', async () => {
  let observer, storageListener, timer, listenerCount = 0;
  const document = {title: 'Site title', documentElement: {}};
  const location = {href: 'https://example.com/'};
  const context = vm.createContext({document, location, TabRules: {findRule},
    chrome: {storage: {local: {get: async () => ({rules: [{type: 'exact', value: location.href, name: 'Custom'}]})},
      onChanged: {addListener: fn => {storageListener = fn; listenerCount++;}}}},
    MutationObserver: class {constructor(fn) {observer = fn;} observe() {}},
    window: {addEventListener() {}}, setInterval: fn => {timer = fn;}});
  const source = fs.readFileSync(require.resolve('../content.js'), 'utf8');
  vm.runInContext(source, context); await Promise.resolve();
  assert.equal(document.title, 'Custom');
  document.title = 'Site update'; observer(); assert.equal(document.title, 'Custom');
  storageListener({rules: {newValue: []}}, 'local'); assert.equal(document.title, 'Site update');
  storageListener({rules: {newValue: [{type: 'exact', value: location.href, name: 'Custom'}]}}, 'local');
  location.href = 'https://other.com/'; timer(); assert.equal(document.title, 'Site update');
  vm.runInContext(source, context); assert.equal(listenerCount, 1);
});
