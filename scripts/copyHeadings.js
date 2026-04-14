(function () {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const results = Array.from(headings).map(h => {
    const level = parseInt(h.tagName.charAt(1));
    const indent = '  '.repeat(level - 1);
    return `${indent}${h.tagName}: ${h.textContent.trim()}`;
  });
  return results;
})();
