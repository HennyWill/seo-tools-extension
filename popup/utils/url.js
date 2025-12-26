export function buildRichResultsUrl(currentUrl) {
  try {
    return 'https://search.google.com/test/rich-results?url=' + encodeURIComponent(currentUrl);
  } catch (e) {
    return 'https://search.google.com/test/rich-results?url=' + currentUrl;
  }
} 