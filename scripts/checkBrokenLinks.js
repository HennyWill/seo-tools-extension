(async function () {
  const links = document.getElementsByTagName("a");
  const urls = [...new Set(
    Array.from(links)
      .map(a => a.href)
      .filter(href => href && href.startsWith('http'))
  )];

  const brokenLinks = [];

  await Promise.all(
    urls.map(url =>
      fetch(url, { method: 'HEAD', mode: 'no-cors' })
        .then(response => {
          // In no-cors mode we get opaque responses (status 0) for cross-origin
          // Only flag actually failed responses with real status codes
          if (response.type !== 'opaque' && !response.ok) {
            brokenLinks.push({ url, status: response.status });
          }
        })
        .catch(() => {
          brokenLinks.push({ url, status: 'Error' });
        })
    )
  );

  return brokenLinks;
})();
