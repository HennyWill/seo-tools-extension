(function () {
  const scripts = Array.from(document.querySelectorAll('script[type]'))
    .filter(script => (script.getAttribute('type') || '').split(';')[0].trim().toLowerCase() === 'application/ld+json');
  const maxLength = 250000;
  const blocks = scripts.map((script, index) => {
    const raw = (script.textContent || '').trim();
    const block = { number: index + 1, raw, types: [], error: null, warning: null };
    if (raw.length > maxLength) {
      block.raw = raw.slice(0, 2000);
      block.error = 'Block exceeds 250,000 characters; not parsed. Preview is truncated.';
      return block;
    }
    try {
      const data = JSON.parse(raw);
      if (data === null || typeof data !== 'object') {
        block.warning = 'JSON is valid, but the root must be an object or an array for JSON-LD.';
      }
      const types = new Set();
      const pending = [data];
      while (pending.length) {
        const value = pending.pop();
        if (!value || typeof value !== 'object') continue;
        if (!Array.isArray(value)) {
          const declared = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
          for (const type of declared) if (typeof type === 'string' && type.trim()) types.add(type);
        }
        for (const child of Object.values(value)) if (child && typeof child === 'object') pending.push(child);
      }
      block.types = [...types].sort();
      if (!block.types.length && !block.warning) block.warning = 'No literal @type found. This may use references or a custom context; review in a validator.';
    } catch (error) {
      block.error = error.message;
    }
    return block;
  });
  return { pageUrl: location.href, blocks };
})();
