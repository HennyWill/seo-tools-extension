export function buildRichResultsUrl(currentUrl) {
  try {
    return 'https://search.google.com/test/rich-results?url=' + encodeURIComponent(currentUrl);
  } catch (e) {
    return 'https://search.google.com/test/rich-results?url=' + currentUrl;
  }
}

export function buildSearchConsoleUrl(currentUrl, configuredResource = '') {
  const page = new URL(currentUrl);
  const resource = configuredResource.trim() || 'sc-domain:' + page.hostname.replace(/^www\./i, '');
  if (resource.startsWith('sc-domain:')) {
    if (!/^sc-domain:[a-z0-9.-]+$/i.test(resource)) throw new Error('Invalid domain property');
  } else {
    const property = new URL(resource);
    if (!['http:', 'https:'].includes(property.protocol)) throw new Error('Invalid URL-prefix property');
  }
  return `https://search.google.com/search-console/performance/search-analytics?resource_id=${encodeURIComponent(resource)}&breakdown=page&page=!${encodeURIComponent(currentUrl)}`;
}


export function getSearchConsoleResources(currentUrl, savedResource = '') {
  const page = new URL(currentUrl);
  const domain = page.hostname.replace(/^www\./i, '');
  const choices = [
    { value: 'sc-domain:' + domain, label: 'Domain · ' + domain },
    { value: page.origin + '/', label: 'Website address · ' + page.origin + '/' }
  ];
  if (savedResource && !choices.some(choice => choice.value === savedResource)) {
    try {
      buildSearchConsoleUrl(currentUrl, savedResource);
      choices.push({ value: savedResource, label: 'Saved resource · ' + savedResource.replace(/^sc-domain:/, '') });
    } catch { /* Ignore invalid legacy settings. */ }
  }
  return choices;
}
