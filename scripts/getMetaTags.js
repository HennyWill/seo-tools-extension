(function () {
  // Title
  const titleText = document.title || '';
  const title = { text: titleText, length: titleText.length };

  // Description
  const descMeta = document.querySelector('meta[name="description"]');
  const descText = descMeta ? descMeta.getAttribute('content') || '' : '';
  const description = { text: descText, length: descText.length };

  // Open Graph
  const ogTags = [];
  document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
    const prop = meta.getAttribute('property');
    const content = meta.getAttribute('content') || '';
    if (prop) ogTags.push({ key: prop, value: content });
  });

  // Twitter Card
  const twitterTags = [];
  document.querySelectorAll('meta[name^="twitter:"], meta[property^="twitter:"]').forEach(meta => {
    const key = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content') || '';
    if (key) twitterTags.push({ key, value: content });
  });

  // Other meta tags
  const skipNames = new Set(['description', 'viewport']);
  const skipPrefixes = ['og:', 'twitter:'];
  const otherTags = [];
  document.querySelectorAll('meta[name], meta[http-equiv]').forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('http-equiv');
    if (!name) return;
    const lower = name.toLowerCase();
    if (skipNames.has(lower)) return;
    if (skipPrefixes.some(p => lower.startsWith(p))) return;
    const content = meta.getAttribute('content') || '';
    otherTags.push({ key: name, value: content });
  });

  return { title, description, ogTags, twitterTags, otherTags };
})();
