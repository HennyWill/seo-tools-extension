(function () {
  // 1. Title
  const titleText = document.title || '';
  const title = { text: titleText, length: titleText.length };

  // 2. Canonical
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  let canonical = { exists: false, href: null, isSelf: false };
  if (canonicalLink) {
    const href = canonicalLink.getAttribute('href');
    if (href) {
      let normalizedCanonical, normalizedCurrent;
      try {
        const cUrl = new URL(href, location.href);
        const curUrl = new URL(location.href);
        normalizedCanonical = cUrl.origin + cUrl.pathname.replace(/\/$/, '') + cUrl.search;
        normalizedCurrent = curUrl.origin + curUrl.pathname.replace(/\/$/, '') + curUrl.search;
      } catch {
        normalizedCanonical = href;
        normalizedCurrent = location.href;
      }
      canonical = {
        exists: true,
        href: href,
        isSelf: normalizedCanonical === normalizedCurrent
      };
    }
  }

  // 3. Robots Meta
  const metas = document.querySelectorAll('meta[name="robots"], meta[name="googlebot"]');
  let robotsMeta = { blocked: false, content: null };
  for (const meta of metas) {
    const content = (meta.getAttribute('content') || '').toLowerCase();
    if (content.includes('noindex') || content.includes('none')) {
      robotsMeta = { blocked: true, content: meta.getAttribute('content') };
      break;
    }
  }

  // 4. Hreflang
  const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
  const hreflangItems = Array.from(hreflangLinks).map(l => ({
    lang: l.getAttribute('hreflang') || '',
    href: l.getAttribute('href') || ''
  })).filter(item => item.lang);
  const hreflang = { count: hreflangItems.length, items: hreflangItems };

  return { title, canonical, robotsMeta, hreflang };
})();
