(function () {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  return Array.from(headings).map(h => h.textContent.trim());
})(); 