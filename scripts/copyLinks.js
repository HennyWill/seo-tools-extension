(function () {
  const links = document.querySelectorAll('a[href^="http"], a[href^="https"], a[href^="//"]');
  const uniqueLinks = [...new Set(Array.from(links).map(link => link.href))];
  return uniqueLinks.join('\n');
})(); 