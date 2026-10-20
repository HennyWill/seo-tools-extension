(function () {
  const id = 'seo-tools-link-highlights';
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  else {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = 'a[href] { outline: 2px solid #b7791f !important; outline-offset: 1px !important; }';
    document.documentElement.appendChild(style);
  }
  return { highlighted: document.querySelectorAll('a[href]').length, active: !existing };
})();
