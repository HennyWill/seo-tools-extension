(async function () {
  function robotsMatchRule(url, rule) {
    if (!rule) return false;
    let pattern = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    pattern = pattern.replace(/\*/g, '.*');
    if (pattern.endsWith('$')) {
      pattern = pattern.slice(0, -1) + '$';
    } else {
      pattern += '.*';
    }
    try {
      return new RegExp('^' + pattern).test(url);
    } catch (e) {
      return false;
    }
  }

  try {
    const robotsUrl = `${location.protocol}//${location.hostname}/robots.txt`;
    const response = await fetch(robotsUrl);

    if (!response.ok) {
      alert('\u26A0 The robots.txt file did not return status 200 OK');
      return;
    }

    let responseText = await response.text();

    responseText = responseText.replace(/\#.*/g, '')
                       .replace(/\r?\n/g, '\n')
                       .replace(/:\s+/g, ': ')
                       .toLowerCase();

    const userAgentBlocks = responseText.split('user-agent:');
    const starBlock = userAgentBlocks.find(block => block.trim().startsWith('*')) || '';
    const lines = starBlock.split('\n');
    const url = location.pathname + location.search;

    let matchedRule = null;
    let matchedType = null;
    let matchedLength = -1;

    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('disallow:') || line.startsWith('allow:')) {
        const type = line.startsWith('allow:') ? 'allow' : 'disallow';
        const path = line.replace(type + ':', '').trim();
        if (path && robotsMatchRule(url, path)) {
          if (path.length > matchedLength || (path.length === matchedLength && type === 'allow')) {
            matchedRule = path;
            matchedType = type;
            matchedLength = path.length;
          }
        }
      }
    });

    let robotsAllowed = true;
    let rule = '';
    if (matchedRule !== null) {
      robotsAllowed = matchedType === 'allow';
      rule = (matchedType.charAt(0).toUpperCase() + matchedType.slice(1)) + ': ' + matchedRule;
    }

    let output = '';
    if (robotsAllowed) {
      output = '\u2713 URL is allowed for indexing by robots.txt';
    } else {
      output = `\u2716 URL is disallowed for indexing by robots.txt with rule: ${rule}`;
    }

    const metas = document.getElementsByTagName('meta');
    let metaTagBlocked = false;

    for (let meta of metas) {
      const name = meta.getAttribute('name');
      if (name && ['robots', 'googlebot'].includes(name.toLowerCase())) {
        const content = meta.getAttribute('content')?.toLowerCase();
        if (content?.includes('noindex') || content?.includes('none')) {
          output += `\n\u2716 Blocked by meta tag: ${name}`;
          metaTagBlocked = true;
        }
      }
    }

    if (!metaTagBlocked) {
      output += '\n\u2713 Not blocked by any meta robots tags';
    }

    const links = document.getElementsByTagName('link');
    let canonicalFound = false;

    for (let link of links) {
      const rel = link.getAttribute('rel');
      if (rel && rel.toLowerCase() === 'canonical') {
        const href = link.getAttribute('href');
        if (href && href !== window.location.href) {
          output += `\n\u2716 Canonical URL is different: ${decodeURI(href)}`;
          canonicalFound = true;
        }
      }
    }

    if (!canonicalFound) {
      output += '\n\u2713 This page is canonical';
    }

    alert(output);
  } catch (error) {
    console.error('Indexability check error:', error);
    alert('\u26A0 Error checking indexability: ' + error.message);
  }
})(); 