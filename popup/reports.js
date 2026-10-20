// All page-controlled content is rendered as text; URL clicks use validated HTTP(S) URLs.
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function button(text, action) {
  const element = el('button', 'copy-report-btn', text);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
}
function select(label, options) {
  const element = el('select');
  element.setAttribute('aria-label', label);
  for (const [value, text] of options) {
    const option = el('option', '', text);
    option.value = value;
    element.appendChild(option);
  }
  return element;
}
export function filterLinks(links, { scope = 'all', rel = 'all', query = '' } = {}) {
  const search = query.trim().toLowerCase();
  return links.filter(link =>
    (scope === 'all' || link.scope === scope) &&
    (rel === 'all' || (rel === 'empty' ? !link.anchor : link[rel] === true)) &&
    (!search || `${link.url} ${link.anchor} ${link.rel.join(' ')}`.toLowerCase().includes(search))
  );
}
export function linksToTsv(links) {
  const cell = value => {
    const text = String(value).replace(/[\t\r\n]+/g, ' ');
    return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
  };
  return ['URL\tAnchor\tAnchor source\tScope\tRel', ...links.map(link =>
    [link.url, link.anchor, link.anchorSource, link.scope, link.rel.join(' ')].map(cell).join('\t')
  )].join('\n');
}

export function renderLinkAnalysis(data, container, actions) {
  container.replaceChildren();
  const links = data.links;
  container.appendChild(el('h3', '', 'Link analysis'));
  container.appendChild(el('p', 'report-note', `${links.length} links · ${new Set(links.map(l => l.url)).size} unique URLs · ${links.filter(l => l.scope === 'internal').length} internal · ${links.filter(l => l.scope === 'external').length} external`));
  container.appendChild(el('p', 'report-note', `nofollow ${links.filter(l => l.nofollow).length} · sponsored ${links.filter(l => l.sponsored).length} · ugc ${links.filter(l => l.ugc).length}`));
  const toolbar = el('div', 'report-filters');
  const search = el('input');
  search.type = 'search';
  search.placeholder = 'Search URL or anchor';
  search.setAttribute('aria-label', 'Search links');
  const scope = select('Link scope', [['all', 'All links'], ['internal', 'Internal'], ['external', 'External']]);
  const rel = select('Link attribute', [['all', 'All attributes'], ['nofollow', 'nofollow'], ['sponsored', 'sponsored'], ['ugc', 'ugc'], ['empty', 'Empty anchor']]);
  toolbar.append(search, scope, rel);
  container.appendChild(toolbar);
  const count = el('p', 'report-note');
  count.setAttribute('aria-live', 'polite');
  const scroller = el('div', 'link-table-wrap');
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region');
  scroller.setAttribute('aria-label', 'Page links');
  const table = el('table', 'link-table');
  const thead = el('thead');
  const headings = el('tr');
  for (const title of ['Anchor / URL', 'Scope', 'Rel']) {
    const th = el('th', '', title); th.scope = 'col'; headings.appendChild(th);
  }
  thead.appendChild(headings);
  const tbody = el('tbody');
  table.append(thead, tbody); scroller.appendChild(table);
  const pagination = el('div', 'report-pagination');
  let page = 0, filtered = links;
  const pageSize = 50;
  const previous = button('Previous', () => { page--; draw(); });
  const next = button('Next', () => { page++; draw(); });
  const copy = button('Copy filtered TSV', async () => {
    try { await actions.copy(linksToTsv(filtered)); actions.notify(`${filtered.length} links copied`, 'success'); }
    catch { actions.notify('Could not copy links', 'error'); }
  });
  pagination.append(previous, next, copy);
  container.append(count, scroller, pagination);
  container.appendChild(el('p', 'report-note', `HTTP(S) links only; ${data.skipped} other links skipped. Internal includes the www alias; other subdomains are external. Rel attributes are read from each link, not meta robots.`));
  function draw() {
    const start = page * pageSize;
    const visible = filtered.slice(start, start + pageSize);
    count.textContent = filtered.length ? `${start + 1}–${start + visible.length} of ${filtered.length} matching links` : 'No matching links';
    tbody.replaceChildren();
    for (const link of visible) {
      const tr = el('tr');
      const main = el('td');
      main.appendChild(el('div', 'link-anchor', link.anchor || '(empty anchor)'));
      if (!['text', 'empty'].includes(link.anchorSource)) main.appendChild(el('span', 'anchor-source', link.anchorSource));
      const url = el('a', 'link-url', link.url);
      url.href = link.url;
      url.addEventListener('click', e => { e.preventDefault(); actions.open(link.url); });
      main.appendChild(url);
      tr.append(main, el('td', 'link-scope', link.scope === 'internal' ? 'Int.' : 'Ext.'), el('td', 'link-rel', link.rel.join(' ') || '—'));
      tbody.appendChild(tr);
    }
    previous.disabled = page === 0;
    next.disabled = start + pageSize >= filtered.length;
    copy.disabled = filtered.length === 0;
    scroller.scrollTop = 0;
  }
  function update() {
    page = 0;
    filtered = filterLinks(links, { scope: scope.value, rel: rel.value, query: search.value });
    draw();
  }
  search.addEventListener('input', update);
  scope.addEventListener('change', update);
  rel.addEventListener('change', update);
  draw();
}

export function renderStructuredData(data, container, actions) {
  container.replaceChildren();
  container.appendChild(el('h3', '', 'Structured data · JSON-LD'));
  const errors = data.blocks.filter(b => b.error).length;
  const warnings = data.blocks.filter(b => !b.error && b.warning).length;
  container.appendChild(el('p', 'report-note', data.blocks.length
    ? `${data.blocks.length} blocks · ${errors} errors · ${warnings} to review`
    : 'No JSON-LD blocks found in the current page DOM.'));
  container.appendChild(el('p', 'report-note', 'Checks JSON syntax and lists literal @type values, including nested objects and @graph. Schema requirements, custom contexts, Microdata and RDFa are not validated here.'));
  for (const block of data.blocks) {
    const details = el('details', `schema-block ${block.error ? 'schema-error' : block.warning ? 'schema-warning' : ''}`);
    details.open = !!block.error;
    const summary = el('summary', '', `Block ${block.number} · ${block.error ? 'Error' : block.warning ? 'Review' : 'JSON syntax OK'}`);
    details.appendChild(summary);
    if (block.types.length) details.appendChild(el('p', 'schema-types', block.types.join(' · ')));
    if (block.error || block.warning) details.appendChild(el('p', 'schema-message', block.error || block.warning));
    const pre = el('pre', 'schema-code', block.raw || '(empty block)');
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', `JSON-LD source for block ${block.number}`);
    details.appendChild(pre);
    if (!block.error?.includes('Preview is truncated')) {
      details.appendChild(button('Copy JSON-LD', async () => {
        try { await actions.copy(block.raw); actions.notify('JSON-LD copied', 'success'); }
        catch { actions.notify('Could not copy JSON-LD', 'error'); }
      }));
    }
    container.appendChild(details);
  }
  container.appendChild(button('Open Google Rich Results Test ↗', actions.validate));
}
