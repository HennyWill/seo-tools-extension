(async function () {
  const urls = [...new Set(Array.from(document.querySelectorAll('a[href]'), a => a.href)
    .filter(href => /^https?:\/\//i.test(href)))];
  const results = [];
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      if (new URL(url).origin !== location.origin) {
        results.push({ url, state: 'unknown', status: 'External URL — not checked (requires host access)' });
        continue;
      }
      try {
        let response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
        if ([405, 501].includes(response.status)) {
          response = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (response.body) await response.body.cancel();
        }
        results.push({ url, state: response.ok ? 'ok' : ([404, 410].includes(response.status) ? 'broken' : 'unknown'), status: response.status });
      } catch {
        results.push({ url, state: 'unknown', status: 'Network error or timeout' });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, urls.length) }, worker));
  return results.sort((a, b) => a.url.localeCompare(b.url));
})();
