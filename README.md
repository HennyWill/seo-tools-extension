# SEO Tools

Version 1.4.1 · Chrome extension · Manifest V3

A compact toolkit for inspecting the current page and opening common SEO services.

## Install or reload

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select this folder.
3. After updating files, click **Reload** on the extension card.

## Tools

- **Page overview:** title, DOM meta robots, canonical and hreflang. This does not confirm Google indexing.
- **Check Indexability:** robots.txt rules for Googlebot, meta robots, X-Robots-Tag from a new HEAD request, and canonical. Warnings mean that a check is inconclusive or needs review. These browser requests may differ from Google's responses.
- **Meta Tags Overview:** title, description, Open Graph, Twitter and other meta tags.
- **View JSON-LD:** inspects JSON-LD in the current DOM, lists literal @type values from nested objects and @graph, and reports JSON syntax errors. This is not full Schema.org or rich-result eligibility validation. Includes source preview, copy and an external Rich Results Test button. Blocks over 250,000 characters are skipped with an explicit truncated preview.
- **Analyze Links:** table of HTTP(S) link occurrences, anchor text (with labeled image-alt/aria-label/title fallbacks), internal/external scope and rel tokens. Search, scope/attribute filters, 50-row pages and filtered TSV copy. TSV cells neutralize spreadsheet formula prefixes. Internal means the same hostname with a www alias; other subdomains are external. Page-level nofollow directives are not incorporated.
- **Google Rich Results:** opens the current URL directly in Google Rich Results Test without running the local inspector.
- **Link check:** same-origin HTTP/HTTPS links, five concurrent workers, ten-second timeout per request. HEAD 405/501 falls back to GET. HTTP 404/410 are broken; external URLs, other HTTP errors, timeouts and network errors are unverified. External status checks require additional host access and are not implemented.
- **Extract:** copy headings or unique internal/external links, including relative links.
- **Highlight:** toggle an injected stylesheet without replacing original inline link styles.
- **Services:** Google Search, Search Console, Ahrefs, and Wayback Machine.

## Search Console

By default, the button opens a Domain property: `sc-domain:example.com` (the initial `www.` is removed).

Use **Open Search Console for** to choose **Domain** or **Website address**. Domain is the default. Your selection is saved per hostname. Existing custom resource overrides are preserved as a saved choice. The full page URL stays in the performance report filter. The extension does not access your Google account or automatically discover its resources.


## Appearance and shortcuts

Light and dark themes use system fonts; no remote fonts are loaded. The theme button saves the preference locally.

Shortcuts apply while the popup is focused; browser-reserved combinations may take precedence:

- Ctrl/Cmd + Shift + H: copy headings
- Ctrl/Cmd + Shift + L: highlight links
- Ctrl/Cmd + Shift + I: check indexability
- Ctrl/Cmd + Shift + T: switch theme

## Permissions and privacy

Only `activeTab` and `scripting` are requested. Analysis runs on demand. The extension stores the theme and Search Console overrides locally, makes audit requests to the current site, and passes the current URL to third-party services when their buttons are used. No analytics or developer-operated collection. See PRIVACY.md.

## Development

No build step or dependencies. Run regression checks with Node.js 22 or newer:

```sh
node --test tests/regression.cjs
```

Source: `popup.html`, `popup.css`, `popup.js`, shared utilities in `popup/utils/`, and injected scripts in `scripts/`.

## Version 1.3.0

- Compact grouped interface, neutral palette, accessible focus styles and reduced-motion support.
- Configurable Search Console resources, including parent domains and URL-prefix properties.
- Explicit DOM meta status instead of an unsupported indexing claim.
- Robots.txt group selection, merged groups, end anchors and non-standard ports fixed.
- Canonical and hreflang resolve against the page base; trailing slashes remain significant.
- Page values render as text; link highlighting preserves existing inline styles.
- Link checker reports unverified URLs honestly and bounds concurrency and request duration.

Copyright © 2026 HennyWill. All rights reserved.


## Version 1.4.0

- Added local JSON-LD inspection and link analysis with filters and TSV copy.
- Kept the Google Rich Results Test as an explicit external action inside the structured data report.
- No additional permissions or external dependencies.


## Version 1.4.1

- Stronger light-theme contrast, distinct button surfaces and a dark green header.
- Replaced raw Search Console resource ID input with a remembered resource selector; Domain remains the default.
- Restored a direct Google Rich Results button alongside local JSON-LD inspection.
