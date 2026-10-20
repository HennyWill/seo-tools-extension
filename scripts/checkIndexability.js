(async function () {
  function robotsMatchRule(url, rule) {
    if (!rule) return false;
    const endsWithDollar = rule.endsWith('$');
    const ruleBody = endsWithDollar ? rule.slice(0, -1) : rule;
    let pattern = ruleBody.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    pattern = pattern.replace(/\*/g, '.*');
    pattern += endsWithDollar ? '$' : '.*';
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
    const robotsUrl = new URL('/robots.txt', location.href).href;
    let robotsText = '';
    try {
      const response = await fetch(robotsUrl, { signal: AbortSignal.timeout(10000) });
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
      const groups = [];
      let group = null;
      for (const raw of robotsText.split(/\r?\n/)) {
        const line = raw.replace(/#.*/, '').trim();
        const match = line.match(/^([\w-]+)\s*:\s*(.*)$/);
        if (!match) continue;
        const field = match[1].toLowerCase(), value = match[2].trim();
        if (field === 'user-agent') {
          if (!group || group.hasRules) {
            group = { agents: [], rules: [], hasRules: false };
            groups.push(group);
          }
          group.agents.push(value.toLowerCase());
        } else if (group && (field === 'allow' || field === 'disallow')) {
          group.hasRules = true;
          group.rules.push(`${field}: ${value}`);
        }
      }
      const specific = groups.filter(g => g.agents.includes('googlebot'));
      const selected = specific.length ? specific : groups.filter(g => g.agents.includes('*'));
      const effectiveResult = parseRobotsBlock(selected.flatMap(g => g.rules).join('\n'), url);

      if (effectiveResult.rule !== null) {
        const allowed = effectiveResult.type === 'allow';
        const ruleLabel = `${effectiveResult.type}: ${effectiveResult.rule}`;
        if (allowed) {
          checks.push({ type: 'pass', label: 'robots.txt', message: `Crawling allowed (rule: ${ruleLabel})` });
        } else {
          checks.push({ type: 'fail', label: 'robots.txt', message: `Blocked by rule: ${ruleLabel}` });
        }
      } else {
        checks.push({ type: 'pass', label: 'robots.txt', message: 'Crawling allowed (no matching rules)' });
      }


    }

    // 2. Check meta robots tags
    const metas = document.getElementsByTagName('meta');
    let metaTagBlocked = false;

    for (let meta of metas) {
      const name = meta.getAttribute('name');
      if (name && ['robots', 'googlebot'].includes(name.toLowerCase())) {
        const content = meta.getAttribute('content')?.toLowerCase();
        if (content?.split(/[\s,]+/).some(token => ['noindex', 'none'].includes(token))) {
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
      const headResponse = await fetch(location.href, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
      if (!headResponse.ok) throw new Error(`HTTP ${headResponse.status}`);
      const xRobotsTag = headResponse.headers.get('x-robots-tag');
      if (xRobotsTag) {
        let agent = null;
        const directives = [];
        for (let part of xRobotsTag.toLowerCase().split(',')) {
          part = part.trim();
          const scoped = part.match(/^([a-z][a-z0-9_-]*):\s*(.*)$/);
          if (scoped && !['unavailable_after', 'max-snippet', 'max-video-preview', 'max-image-preview'].includes(scoped[1])) {
            agent = scoped[1]; part = scoped[2];
          }
          if (!agent || agent === 'googlebot') directives.push(...part.split(/\s+/));
        }
        if (directives.some(token => ['noindex', 'none'].includes(token))) {
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
      if (rel && rel.toLowerCase().split(/\s+/).includes('canonical')) {
        const href = link.getAttribute('href');
        if (href) {
          const normalizedCanonical = normalizeUrl(href, document.baseURI);
          const normalizedCurrent = normalizeUrl(location.href);
          canonicalFound = true;

          if (normalizedCanonical === normalizedCurrent) {
            checks.push({ type: 'pass', label: 'Canonical', message: `Self-referencing canonical: ${href}` });
          } else {
            checks.push({ type: 'warning', label: 'Canonical', message: `Canonical URL differs: ${href}` });
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
