(function () {
  const isActive = document.body.hasAttribute('data-seo-links-highlighted');
  const links = document.getElementsByTagName("a");

  if (isActive) {
    for (let i = 0; i < links.length; i++) {
      links[i].style.removeProperty('outline');
      links[i].style.removeProperty('outline-offset');
    }
    document.body.removeAttribute('data-seo-links-highlighted');
  } else {
    for (let i = 0; i < links.length; i++) {
      links[i].style.outline = "2px solid #FBBF24";
      links[i].style.outlineOffset = "1px";
    }
    document.body.setAttribute('data-seo-links-highlighted', 'true');
  }

  return { highlighted: links.length, active: !isActive };
})();
