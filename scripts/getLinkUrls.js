(function () {
  const links = document.getElementsByTagName("a");
  return Array.from(links)
    .map(a => a.href)
    .filter(href => href && href.startsWith('http'));
})(); 