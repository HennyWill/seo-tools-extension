(function () {
  // 1. Title
  const titleText = document.title || '';
  const title = { text: titleText, length: titleText.length };

  function pageUrl(value) {
    if (!value || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      url.hash = '';
      return url.href;
    } catch { return null; }
  }

  // Resolve page links against the document base, preserving trailing slashes.
  const canonicalLink = document.querySelector('link[rel~="canonical"]');
  const href = canonicalLink ? pageUrl(canonicalLink.getAttribute('href')) : null;
  const canonical = { exists: !!canonicalLink, href, isSelf: !!href && href === pageUrl(location.href) };

  // 3. Robots Meta
  const metas = Array.from(document.querySelectorAll('meta[name]')).filter(m => ['robots', 'googlebot'].includes(m.getAttribute('name').toLowerCase()));
  let robotsMeta = { blocked: false, content: null };
  for (const meta of metas) {
    const content = (meta.getAttribute('content') || '').toLowerCase();
    if (content.split(/[\s,]+/).some(token => ['noindex', 'none'].includes(token))) {
      robotsMeta = { blocked: true, content: meta.getAttribute('content') };
      break;
    }
  }

  // 4. Hreflang
  const hreflangLinks = document.querySelectorAll('link[rel~="alternate"][hreflang]');
  const hreflangItems = Array.from(hreflangLinks).map(l => ({
    lang: l.getAttribute('hreflang') || '',
    href: pageUrl(l.getAttribute('href'))
  })).filter(item => item.lang && item.href);
  const hreflang = { count: hreflangItems.length, items: hreflangItems };

  return { title, canonical, robotsMeta, hreflang };
})();
