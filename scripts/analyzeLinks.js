(function () {
  const links = [];
  let skipped = 0;
  const pageHost = location.hostname.toLowerCase().replace(/^www\./, '');
  for (const element of document.querySelectorAll('a[href]')) {
    let url;
    try { url = new URL(element.href, document.baseURI); } catch { skipped++; continue; }
    if (!['http:', 'https:'].includes(url.protocol)) { skipped++; continue; }
    const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
    const imageAlt = Array.from(element.querySelectorAll('img[alt]'), image => image.getAttribute('alt') || '').join(' ').replace(/\s+/g, ' ').trim();
    const aria = (element.getAttribute('aria-label') || '').trim();
    const title = (element.getAttribute('title') || '').trim();
    const rel = [...new Set((element.getAttribute('rel') || '').toLowerCase().split(/\s+/).filter(Boolean))];
    links.push({
      url: url.href,
      anchor: text || imageAlt || aria || title,
      anchorSource: text ? 'text' : imageAlt ? 'image alt' : aria ? 'aria-label' : title ? 'title' : 'empty',
      scope: url.hostname.toLowerCase().replace(/^www\./, '') === pageHost ? 'internal' : 'external',
      rel,
      nofollow: rel.includes('nofollow'),
      sponsored: rel.includes('sponsored'),
      ugc: rel.includes('ugc')
    });
  }
  return { pageUrl: location.href, links, skipped };
})();
