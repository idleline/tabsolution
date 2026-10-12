# Tabsolution

A local Chrome extension for persistent tab names. No dependencies, build step, account, or server.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder (`/Users/lawheelock/git/tabsolution`).
4. Pin **Tabsolution — Saved Tab Names** from Chrome's Extensions menu.
5. Reload any website tabs already open when installing.

## Use

Click the extension on a website. Its exact URL is pre-filled: enter a **Tab name** and click **Save name**. **Cancel** closes without saving.

Choose **Regex pattern** to match multiple URLs instead. Only the selected matching field is used. Enter a JavaScript regular expression without surrounding `/` delimiters or flags. For example:

```text
^https://[^/]+\.mce\.salesforce\.[a-z]{2,3}(?:/|$)
```

This matches Salesforce subdomains such as `https://example.mce.salesforce.com/dashboard`. Patterns are case-sensitive and tested against the full URL; use `^` and `$` when you need boundaries. Invalid regex patterns cannot be saved. The popup shows whether a pattern matches the current tab.

Rules apply automatically after pages load and are reapplied when sites update their titles. URL changes within single-page apps are checked at least once per second. Exact URLs (including query strings and fragments) take priority; otherwise the first matching regex in the saved list wins. Saving an existing URL/pattern updates it. Use **Edit**, **Delete**, and **New rule** to manage rules. Deleting an active rule restores the latest site title observed or applies the next matching rule.

**Saved rules** defaults to **This tab**, showing all exact URL and regex rules matching the current URL. The winning rule is labeled **Applies to this tab**. Choose **All rules** to manage the full collection. Search filters by name, URL, or pattern within the selected view, preserving rule priority. The list scrolls independently and the popup height is capped. These filters only change the display; all saved rules continue to run.

Rules stay in `chrome.storage.local` in this Chrome profile, across browser restarts; they are not synced or sent anywhere. Uninstalling the extension removes its rules. The extension needs access to HTTP/HTTPS pages to apply saved names automatically, plus storage and scripting access to save rules and apply them to the current tab immediately. Chrome internal pages, the Chrome Web Store, PDFs in Chrome's viewer, and other protected pages cannot be renamed. File URLs are not supported.

After changing extension code, click **Reload** on its card at `chrome://extensions` and reload open website tabs.

## Verify

Run `node --test tests/*.test.cjs` for matching, validation, and content-script lifecycle checks. For a manual check, load the extension, name a website, reload it, and confirm the title persists. Test a regex against two matching URLs, delete the rule, and verify the site's title returns. Confirm invalid regex input shows an error and Cancel does not save.

Implementation follows Chrome's [Manifest V3 reference](https://developer.chrome.com/docs/extensions/reference/manifest) and [content script documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).
