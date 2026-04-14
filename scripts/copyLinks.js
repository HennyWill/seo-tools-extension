(function () {
  const links = document.querySelectorAll('a[href^="http"]');
  const hostname = location.hostname;
  const internal = new Set();
  const external = new Set();

  links.forEach(link => {
    try {
      const url = new URL(link.href);
      if (url.hostname === hostname || url.hostname === 'www.' + hostname || hostname === 'www.' + url.hostname) {
        internal.add(url.pathname + url.search);
      } else {
        external.add(link.href);
      }
    } catch (e) {}
  });

  const parts = [];
  if (internal.size > 0) {
    parts.push(`--- Internal Links (${internal.size}) ---`);
    parts.push(...Array.from(internal).sort());
  }
  if (external.size > 0) {
    parts.push(`--- External Links (${external.size}) ---`);
    parts.push(...Array.from(external).sort());
  }

  return parts.length > 0 ? parts.join('\n') : null;
})();
