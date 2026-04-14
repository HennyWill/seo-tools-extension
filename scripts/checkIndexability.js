(async function () {
  function robotsMatchRule(url, rule) {
    if (!rule) return false;
    const endsWithDollar = rule.endsWith('$');
    const ruleBody = endsWithDollar ? rule.slice(0, -1) : rule;
    let pattern = ruleBody.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    pattern = pattern.replace(/\*/g, '.*');
    if (!endsWithDollar) {
      pattern += '.*';
    }
    try {
      return new RegExp('^' + pattern).test(url);
    } catch (e) {
      return false;
    }
  }

  function parseRobotsBlock(blockText, url) {
    const lines = blockText.split('\n');
    let matchedRule = null;
    let matchedType = null;
    let matchedLength = -1;

    lines.forEach(line => {
      const trimmed = line.trim();
      const lowerLine = trimmed.toLowerCase();
      if (lowerLine.startsWith('disallow:') || lowerLine.startsWith('allow:')) {
        const type = lowerLine.startsWith('allow:') ? 'allow' : 'disallow';
        const path = trimmed.substring(trimmed.indexOf(':') + 1).trim();
        if (path && robotsMatchRule(url, path)) {
          if (path.length > matchedLength || (path.length === matchedLength && type === 'allow')) {
            matchedRule = path;
            matchedType = type;
            matchedLength = path.length;
          }
        }
      }
    });

    return { rule: matchedRule, type: matchedType };
  }

  function normalizeUrl(href, baseUrl) {
    try {
      const url = new URL(href, baseUrl);
      let normalized = url.origin + url.pathname;
      if (normalized.endsWith('/') && url.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }
      if (url.search) normalized += url.search;
      return normalized;
    } catch {
      return href;
    }
  }

  try {
    const checks = [];
    const url = location.pathname + location.search;

    // 1. Fetch and parse robots.txt
    const robotsUrl = `${location.protocol}//${location.hostname}/robots.txt`;
    let robotsText = '';
    try {
      const response = await fetch(robotsUrl);
      if (!response.ok) {
        checks.push({ type: 'warning', label: 'robots.txt', message: `robots.txt returned status ${response.status}` });
      } else {
        robotsText = await response.text();
      }
    } catch (e) {
      checks.push({ type: 'warning', label: 'robots.txt', message: 'Could not fetch robots.txt' });
    }

    if (robotsText) {
      // Remove comments but preserve case of paths
      const cleanedText = robotsText.replace(/#.*/g, '').replace(/\r?\n/g, '\n').replace(/:\s+/g, ': ');

      const userAgentBlocks = cleanedText.split(/user-agent\s*:/i);

      // Parse wildcard (*) block
      const starBlock = userAgentBlocks.find(block => block.trim().toLowerCase().startsWith('*')) || '';
      const starResult = parseRobotsBlock(starBlock, url);

      // Parse googlebot-specific block
      const googlebotBlock = userAgentBlocks.find(block => block.trim().toLowerCase().startsWith('googlebot')) || '';
      const googlebotResult = parseRobotsBlock(googlebotBlock, url);

      // Googlebot-specific rules take precedence
      const effectiveResult = googlebotResult.rule !== null ? googlebotResult : starResult;

      if (effectiveResult.rule !== null) {
        const allowed = effectiveResult.type === 'allow';
        const ruleLabel = `${effectiveResult.type}: ${effectiveResult.rule}`;
        if (allowed) {
          checks.push({ type: 'pass', label: 'robots.txt', message: `Allowed for indexing (rule: ${ruleLabel})` });
        } else {
          checks.push({ type: 'fail', label: 'robots.txt', message: `Blocked by rule: ${ruleLabel}` });
        }
      } else {
        checks.push({ type: 'pass', label: 'robots.txt', message: 'Allowed for indexing (no matching rules)' });
      }

      // Warn if googlebot differs from wildcard
      if (googlebotResult.rule !== null && starResult.rule !== null && googlebotResult.type !== starResult.type) {
        checks.push({ type: 'warning', label: 'robots.txt', message: `Note: user-agent: * is ${starResult.type} but googlebot is ${googlebotResult.type}` });
      }
    }

    // 2. Check meta robots tags
    const metas = document.getElementsByTagName('meta');
    let metaTagBlocked = false;

    for (let meta of metas) {
      const name = meta.getAttribute('name');
      if (name && ['robots', 'googlebot'].includes(name.toLowerCase())) {
        const content = meta.getAttribute('content')?.toLowerCase();
        if (content?.includes('noindex') || content?.includes('none')) {
          checks.push({ type: 'fail', label: `meta ${name}`, message: `Blocked by <meta name="${name}" content="${meta.getAttribute('content')}">` });
          metaTagBlocked = true;
        }
      }
    }

    if (!metaTagBlocked) {
      checks.push({ type: 'pass', label: 'Meta tags', message: 'Not blocked by any meta robots tags' });
    }

    // 3. Check X-Robots-Tag HTTP header
    try {
      const headResponse = await fetch(location.href, { method: 'HEAD' });
      const xRobotsTag = headResponse.headers.get('x-robots-tag');
      if (xRobotsTag) {
        const lower = xRobotsTag.toLowerCase();
        if (lower.includes('noindex') || lower.includes('none')) {
          checks.push({ type: 'fail', label: 'X-Robots-Tag', message: `Blocked by HTTP header: X-Robots-Tag: ${xRobotsTag}` });
        } else {
          checks.push({ type: 'pass', label: 'X-Robots-Tag', message: `X-Robots-Tag: ${xRobotsTag} (not blocking)` });
        }
      } else {
        checks.push({ type: 'pass', label: 'X-Robots-Tag', message: 'No X-Robots-Tag header found' });
      }
    } catch (e) {
      checks.push({ type: 'warning', label: 'X-Robots-Tag', message: 'Could not check X-Robots-Tag header' });
    }

    // 4. Check canonical URL
    const links = document.getElementsByTagName('link');
    let canonicalFound = false;

    for (let link of links) {
      const rel = link.getAttribute('rel');
      if (rel && rel.toLowerCase() === 'canonical') {
        const href = link.getAttribute('href');
        if (href) {
          const normalizedCanonical = normalizeUrl(href, location.href);
          const normalizedCurrent = normalizeUrl(location.href);
          canonicalFound = true;

          if (normalizedCanonical === normalizedCurrent) {
            checks.push({ type: 'pass', label: 'Canonical', message: `Self-referencing canonical: ${decodeURI(href)}` });
          } else {
            checks.push({ type: 'fail', label: 'Canonical', message: `Canonical URL differs: ${decodeURI(href)}` });
          }
        }
      }
    }

    if (!canonicalFound) {
      checks.push({ type: 'warning', label: 'Canonical', message: 'No canonical tag found' });
    }

    return checks;
  } catch (error) {
    console.error('Indexability check error:', error);
    return [{ type: 'fail', label: 'Error', message: error.message }];
  }
})();
