import { buildRichResultsUrl } from './popup/utils/url.js';
import { showToast, showLoading, hideLoading } from './popup/utils/ui.js';

let lastSummaryData = null;

function isRestrictedUrl(url) {
  return !url || /^(chrome|chrome-extension|about|file|edge|brave|opera|vivaldi):/.test(url);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) {
    showToast('No active tab found', 'error');
    return null;
  }
  return tabs[0];
}

document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("searchButton");
  const consoleButton = document.getElementById("consoleButton");
  const ahrefsButton = document.getElementById("ahrefsButton");
  const ahrefsBacklinksButton = document.getElementById("ahrefsBacklinksButton");
  const archiveButton = document.getElementById("archiveButton");
  const copyHeadingsButton = document.getElementById("copyHeadingsButton");
  const highlightLinksButton = document.getElementById("highlightLinksButton");
  const copyLinksButton = document.getElementById("copyLinksButton");
  const brokenLinkCheckerButton = document.getElementById("brokenLinkCheckerButton");
  const checkIndexabilityButton = document.getElementById("checkIndexabilityButton");
  const checkSchemaButton = document.getElementById("checkSchemaButton");
  const metaTagsButton = document.getElementById("metaTagsButton");
  const themeToggle = document.getElementById("themeToggle");

  // Theme toggle
  if (themeToggle) {
    try {
      const savedTheme = localStorage.getItem('seoToolTheme') || 'light';
      applyTheme(savedTheme);

      themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        localStorage.setItem('seoToolTheme', newTheme);
        showToast(`Theme: ${newTheme} mode`);
      });
    } catch (error) {
      console.error('Theme toggle error:', error);
      applyTheme('light');
    }
  }

  // Auto-load summary
  loadSummary();

  const summaryRefresh = document.getElementById("summaryRefresh");
  if (summaryRefresh) {
    summaryRefresh.addEventListener("click", () => loadSummary());
  }

  const summaryCopy = document.getElementById("summaryCopy");
  if (summaryCopy) {
    summaryCopy.addEventListener("click", async () => {
      if (!lastSummaryData) { showToast('No summary data to copy', 'warning'); return; }
      const text = formatSummaryText(lastSummaryData);
      await copyToClipboard(text);
      showToast('Summary copied!', 'success');
    });
  }

  if (searchButton) {
    searchButton.addEventListener("click", async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) return;
        if (isRestrictedUrl(tab.url)) { showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const currentUrl = new URL(tab.url);
        const url = `https://www.google.com/search?q=site:${encodeURIComponent(currentUrl.hostname + currentUrl.pathname)}`;
        await chrome.tabs.create({ url });
      } catch (error) {
        showToast('Error opening Google Search', 'error');
        console.error('Search error:', error);
      }
    });
  }

  if (consoleButton) {
    consoleButton.addEventListener("click", async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) return;
        if (isRestrictedUrl(tab.url)) { showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const url = new URL(tab.url);
        const domain = encodeURIComponent(url.protocol + '//' + url.hostname + '/');
        const pageUrl = encodeURIComponent(tab.url);
        const searchConsoleUrl = `https://search.google.com/search-console/performance/search-analytics?resource_id=${domain}&breakdown=page&page=!${pageUrl}`;
        await chrome.tabs.create({ url: searchConsoleUrl });
      } catch (error) {
        showToast('Error opening Search Console', 'error');
        console.error('Console error:', error);
      }
    });
  }

  if (ahrefsButton) {
    ahrefsButton.addEventListener("click", async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) return;
        if (isRestrictedUrl(tab.url)) { showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const url = new URL(tab.url);
        let hostname = url.hostname;
        const protocol = url.protocol;

        if (hostname.startsWith("www.")) {
          hostname = hostname.substring(4);
        }

        const path = url.pathname + url.search + url.hash;
        const targetUrl = `${protocol}//${hostname}${path}`;
        const encodedUrl = encodeURIComponent(targetUrl);
        const ahrefsUrl = `https://app.ahrefs.com/site-explorer/overview/v2/subdomains/live?target=${encodedUrl}`;

        await chrome.tabs.create({ url: ahrefsUrl });
      } catch (error) {
        showToast('Error opening Ahrefs', 'error');
        console.error('Ahrefs error:', error);
      }
    });
  }

  if (ahrefsBacklinksButton) {
    ahrefsBacklinksButton.addEventListener("click", async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) return;
        if (isRestrictedUrl(tab.url)) { showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const currentUrl = encodeURIComponent(tab.url);
        const ahrefsUrl = `https://app.ahrefs.com/v2-site-explorer/backlinks?anchorRules=%5B%5B%22contains_not%22%2C%22any%22%5D%2C%22seo%22%2C%22all%22%5D%7C%7C%5B%5B%22contains_not%22%2C%22any%22%5D%2C%22tg%22%2C%22all%22%5D&bestFilter=all&domainNameRules=&filterLiveOnly=0&followType=all&grouping=one-per-domain&highlightChanges=none&history=all&ipRules=&limit=100&mode=exact&offset=0&refPageAuthorRules=&refPageTitleRules=%5B%5B%22contains_not%22%2C%22any%22%5D%2C%22seo%22%2C%22all%22%5D%7C%7C%5B%5B%22contains_not%22%2C%22any%22%5D%2C%22telegram%22%2C%22all%22%5D%7C%7C%5B%5B%22contains_not%22%2C%22any%22%5D%2C%22tg%22%2C%22all%22%5D&refPageUrlRules=&sort=Traffic&sortDirection=desc&surroundingRules=&target=${currentUrl}&targetUrlRules=`;
        await chrome.tabs.create({ url: ahrefsUrl });
      } catch (error) {
        showToast('Error opening Ahrefs Backlinks', 'error');
        console.error('Ahrefs Backlinks error:', error);
      }
    });
  }

  if (archiveButton) {
    archiveButton.addEventListener("click", async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) return;
        if (isRestrictedUrl(tab.url)) { showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const url = `https://web.archive.org/web/*/${tab.url}`;
        await chrome.tabs.create({ url });
      } catch (error) {
        showToast('Error opening Archive.org', 'error');
        console.error('Archive error:', error);
      }
    });
  }

  if (copyHeadingsButton) {
    copyHeadingsButton.addEventListener("click", async () => {
      try {
        showLoading(copyHeadingsButton);
        const tab = await getActiveTab();
        if (!tab) { hideLoading(copyHeadingsButton); return; }
        if (isRestrictedUrl(tab.url)) { hideLoading(copyHeadingsButton); showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/copyHeadings.js']
        });

        if (!result || !result[0]) { hideLoading(copyHeadingsButton); showToast('Cannot run on this page', 'error'); return; }
        const headingTexts = result[0].result;
        if (!headingTexts || headingTexts.length === 0) {
          hideLoading(copyHeadingsButton);
          showToast('No headings found on this page', 'warning');
          return;
        }
        await copyToClipboard(headingTexts.join("\n"));
        showToast(`${headingTexts.length} headings copied to clipboard!`, 'success');
        hideLoading(copyHeadingsButton);
      } catch (error) {
        hideLoading(copyHeadingsButton);
        showToast('Error copying headings', 'error');
        console.error('Copy headings error:', error);
      }
    });
  }

  if (highlightLinksButton) {
    highlightLinksButton.addEventListener("click", async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) return;
        if (isRestrictedUrl(tab.url)) { showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/highlightLinks.js']
        });
        if (!result || !result[0]) { showToast('Cannot run on this page', 'error'); return; }
        const count = result[0].result;
        showToast(`${count.highlighted} links ${count.active ? 'highlighted' : 'unhighlighted'} on page`, 'success');
      } catch (error) {
        showToast('Error highlighting links', 'error');
        console.error('Highlight links error:', error);
      }
    });
  }

  if (copyLinksButton) {
    copyLinksButton.addEventListener("click", async () => {
      try {
        showLoading(copyLinksButton);
        const tab = await getActiveTab();
        if (!tab) { hideLoading(copyLinksButton); return; }
        if (isRestrictedUrl(tab.url)) { hideLoading(copyLinksButton); showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/copyLinks.js']
        });

        if (!result || !result[0]) { hideLoading(copyLinksButton); showToast('Cannot run on this page', 'error'); return; }
        const links = result[0].result;
        hideLoading(copyLinksButton);

        if (links) {
          await copyToClipboard(links);
          const count = links.split('\n').filter(l => l).length;
          showToast(`${count} links copied to clipboard!`, 'success');
        } else {
          showToast('No links found on this page', 'warning');
        }
      } catch (error) {
        hideLoading(copyLinksButton);
        showToast('Error copying links', 'error');
        console.error('Copy links error:', error);
      }
    });
  }

  if (brokenLinkCheckerButton) {
    brokenLinkCheckerButton.addEventListener("click", async () => {
      try {
        showLoading(brokenLinkCheckerButton);
        const tab = await getActiveTab();
        if (!tab) { hideLoading(brokenLinkCheckerButton); return; }
        if (isRestrictedUrl(tab.url)) { hideLoading(brokenLinkCheckerButton); showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/checkBrokenLinks.js']
        });

        hideLoading(brokenLinkCheckerButton);
        if (!result || !result[0]) { showToast('Cannot run on this page', 'error'); return; }
        displayBrokenLinksReport(result[0].result);
      } catch (error) {
        hideLoading(brokenLinkCheckerButton);
        showToast('Error checking broken links', 'error');
        console.error('Broken link checker error:', error);
      }
    });
  }

  if (checkIndexabilityButton) {
    checkIndexabilityButton.addEventListener("click", async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) return;
        if (isRestrictedUrl(tab.url)) { showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/checkIndexability.js']
        });
        if (!result || !result[0]) { showToast('Cannot run on this page', 'error'); return; }
        displayIndexabilityReport(result[0].result);
      } catch (error) {
        showToast('Error checking indexability', 'error');
        console.error('Check indexability error:', error);
      }
    });
  }

  if (checkSchemaButton) {
    checkSchemaButton.addEventListener("click", async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) return;
        if (isRestrictedUrl(tab.url)) { showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const currentUrl = tab.url;
        const testUrl = buildRichResultsUrl(currentUrl);
        await chrome.tabs.create({ url: testUrl });
      } catch (error) {
        showToast('Error opening Schema tester', 'error');
        console.error('Check schema error:', error);
      }
    });
  }

  if (metaTagsButton) {
    metaTagsButton.addEventListener("click", async () => {
      try {
        showLoading(metaTagsButton);
        const tab = await getActiveTab();
        if (!tab) { hideLoading(metaTagsButton); return; }
        if (isRestrictedUrl(tab.url)) { hideLoading(metaTagsButton); showToast('This tool doesn\'t work on browser system pages', 'warning'); return; }
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/getMetaTags.js']
        });
        hideLoading(metaTagsButton);
        if (!result || !result[0]) { showToast('Cannot run on this page', 'error'); return; }
        displayMetaTagsReport(result[0].result);
      } catch (error) {
        hideLoading(metaTagsButton);
        showToast('Error loading meta tags', 'error');
        console.error('Meta tags error:', error);
      }
    });
  }

  // Donate link — open in new tab
  const donateLink = document.querySelector('.donate a');
  if (donateLink) {
    donateLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: donateLink.href });
    });
  }

  // Initialize keyboard shortcuts
  initKeyboardShortcuts();
});

// Helper functions
async function loadSummary() {
  const content = document.getElementById("summaryContent");
  if (!content) return;

  content.innerHTML = '<div class="summary-loading"><span class="spinner"></span><span>Analyzing page...</span></div>';

  try {
    const tab = await getActiveTab();
    if (!tab) {
      content.innerHTML = '<div class="summary-message">No active tab</div>';
      return;
    }
    if (isRestrictedUrl(tab.url)) {
      content.innerHTML = '<div class="summary-message">Not available on this page</div>';
      return;
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scripts/pageSummary.js']
    });

    if (!result || !result[0] || !result[0].result) {
      content.innerHTML = '<div class="summary-message">Could not analyze page</div>';
      return;
    }

    renderSummary(result[0].result, content);
  } catch (error) {
    console.error('Summary error:', error);
    content.innerHTML = '<div class="summary-message">Could not load summary</div>';
  }
}

function renderSummary(data, container) {
  lastSummaryData = data;
  const grid = document.createElement('div');
  grid.className = 'summary-grid';

  // Indexable
  addSummaryRow(grid, {
    status: data.robotsMeta.blocked ? 'error' : 'success',
    label: 'Indexable',
    value: data.robotsMeta.blocked ? 'Blocked (noindex)' : 'Allowed'
  });

  // Title — show text
  if (!data.title.text) {
    addSummaryRow(grid, { status: 'error', label: 'Title', value: 'Missing' });
  } else {
    addSummaryRow(grid, {
      status: (data.title.length >= 30 && data.title.length <= 60) ? 'success' : 'warning',
      label: 'Title',
      value: data.title.text
    });
  }

  // Canonical — with clickable URL
  if (data.canonical.exists) {
    const row = addSummaryRow(grid, {
      status: data.canonical.isSelf ? 'success' : 'warning',
      label: 'Canonical',
      value: data.canonical.isSelf ? 'Self-referencing' : 'Different URL'
    });
    const urlEl = document.createElement('a');
    urlEl.className = 'summary-url';
    urlEl.href = data.canonical.href;
    urlEl.textContent = data.canonical.href;
    urlEl.title = 'Click to open, right-click to copy';
    urlEl.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: data.canonical.href });
    });
    urlEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      copyToClipboard(data.canonical.href);
      showToast('Canonical URL copied!', 'success');
    });
    grid.appendChild(urlEl);
  } else {
    addSummaryRow(grid, { status: 'warning', label: 'Canonical', value: 'Missing' });
  }

  // Hreflang — always visible
  if (data.hreflang.count > 0) {
    addSummaryRow(grid, { status: 'success', label: 'Hreflang', value: `${data.hreflang.count} langs` });

    const detail = document.createElement('div');
    detail.className = 'summary-detail';

    data.hreflang.items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'summary-detail-row';
      itemEl.title = 'Click to open, right-click to copy';

      const langSpan = document.createElement('span');
      langSpan.className = 'summary-detail-lang';
      langSpan.textContent = item.lang;

      const urlLink = document.createElement('a');
      urlLink.className = 'summary-detail-url';
      urlLink.href = item.href;
      urlLink.textContent = item.href;
      urlLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: item.href });
      });

      itemEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        copyToClipboard(item.href);
        showToast('URL copied!', 'success');
      });

      itemEl.appendChild(langSpan);
      itemEl.appendChild(urlLink);
      detail.appendChild(itemEl);
    });

    grid.appendChild(detail);
  } else {
    addSummaryRow(grid, { status: 'neutral', label: 'Hreflang', value: 'None' });
  }

  container.innerHTML = '';
  container.appendChild(grid);
}

function addSummaryRow(parent, { status, label, value }) {
  const rowEl = document.createElement('div');
  rowEl.className = 'summary-row';
  rowEl.innerHTML = `<span class="summary-dot summary-dot-${status}"></span><span class="summary-label">${label}</span><span class="summary-value">${value}</span>`;
  parent.appendChild(rowEl);
  return rowEl;
}

function formatSummaryText(data) {
  const lines = [];
  lines.push(`Indexable: ${data.robotsMeta.blocked ? 'Blocked (noindex)' : 'Allowed'}`);
  lines.push(`Title: ${data.title.text || 'Missing'}`);
  if (data.canonical.exists) {
    lines.push(`Canonical: ${data.canonical.isSelf ? 'Self-referencing' : 'Different URL'} (${data.canonical.href})`);
  } else {
    lines.push('Canonical: Missing');
  }
  if (data.hreflang.count > 0) {
    lines.push(`Hreflang: ${data.hreflang.count} langs`);
    data.hreflang.items.forEach(item => {
      lines.push(`  ${item.lang}: ${item.href}`);
    });
  } else {
    lines.push('Hreflang: None');
  }
  return lines.join('\n');
}

function displayIndexabilityReport(checks) {
  const reportContainer = document.getElementById("reportContainer");
  if (!reportContainer) return;

  reportContainer.innerHTML = "";

  if (!checks || checks.length === 0) {
    showToast("No indexability data available", "warning");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "indexability-report";

  const header = document.createElement("h3");
  header.innerText = "Indexability Report";
  wrapper.appendChild(header);

  const list = document.createElement("ul");
  list.className = "indexability-list";

  checks.forEach(check => {
    const item = document.createElement("li");
    item.className = `indexability-item indexability-${check.type}`;
    const icon = check.type === 'pass' ? '\u2713' : check.type === 'fail' ? '\u2716' : '\u26A0';
    item.innerHTML = `<span class="indexability-icon">${icon}</span><span class="indexability-label">${check.label}</span><span class="indexability-msg">${check.message}</span>`;
    list.appendChild(item);
  });

  wrapper.appendChild(list);

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-report-btn";
  copyBtn.innerText = "Copy Report";
  copyBtn.addEventListener("click", async () => {
    const text = checks.map(c => {
      const icon = c.type === 'pass' ? '\u2713' : c.type === 'fail' ? '\u2716' : '\u26A0';
      return `${icon} [${c.label}] ${c.message}`;
    }).join('\n');
    await copyToClipboard(text);
    showToast('Report copied to clipboard!', 'success');
  });
  wrapper.appendChild(copyBtn);

  reportContainer.appendChild(wrapper);

  const hasFailures = checks.some(c => c.type === 'fail');
  if (hasFailures) {
    showToast('Indexability issues found', 'warning');
  } else {
    showToast('Page appears indexable', 'success');
  }
}

function displayMetaTagsReport(data) {
  const reportContainer = document.getElementById("reportContainer");
  if (!reportContainer) return;
  reportContainer.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "meta-report";

  const header = document.createElement("h3");
  header.innerText = "Meta Tags Overview";
  wrapper.appendChild(header);

  // Title
  addMetaGroup(wrapper, `Title (${data.title.length} chars)`, data.title.text || 'Missing');

  // Description
  addMetaGroup(wrapper, `Description (${data.description.length} chars)`, data.description.text || 'Missing');

  // Open Graph
  if (data.ogTags.length > 0) {
    addMetaGroupTable(wrapper, 'Open Graph', data.ogTags);
  }

  // Twitter Card
  if (data.twitterTags.length > 0) {
    addMetaGroupTable(wrapper, 'Twitter Card', data.twitterTags);
  }

  // Other
  if (data.otherTags.length > 0) {
    addMetaGroupTable(wrapper, 'Other', data.otherTags);
  }

  // Copy All button
  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-report-btn";
  copyBtn.innerText = "Copy All";
  copyBtn.addEventListener("click", async () => {
    const lines = [];
    lines.push(`Title (${data.title.length} chars)`);
    lines.push(`  ${data.title.text || 'Missing'}`);
    lines.push(`Description (${data.description.length} chars)`);
    lines.push(`  ${data.description.text || 'Missing'}`);
    if (data.ogTags.length) {
      lines.push('Open Graph');
      data.ogTags.forEach(t => lines.push(`  ${t.key}: ${t.value}`));
    }
    if (data.twitterTags.length) {
      lines.push('Twitter Card');
      data.twitterTags.forEach(t => lines.push(`  ${t.key}: ${t.value}`));
    }
    if (data.otherTags.length) {
      lines.push('Other');
      data.otherTags.forEach(t => lines.push(`  ${t.key}: ${t.value}`));
    }
    await copyToClipboard(lines.join('\n'));
    showToast('Meta tags copied!', 'success');
  });
  wrapper.appendChild(copyBtn);

  reportContainer.appendChild(wrapper);
}

function addMetaGroup(parent, title, text) {
  const group = document.createElement('div');
  group.className = 'meta-group';

  const titleEl = document.createElement('div');
  titleEl.className = 'meta-group-title';
  titleEl.textContent = title;
  group.appendChild(titleEl);

  const valueEl = document.createElement('div');
  valueEl.className = 'meta-group-text';
  valueEl.textContent = text;
  group.appendChild(valueEl);

  parent.appendChild(group);
}

function addMetaGroupTable(parent, title, tags) {
  const group = document.createElement('div');
  group.className = 'meta-group';

  const titleEl = document.createElement('div');
  titleEl.className = 'meta-group-title';
  titleEl.textContent = title;
  group.appendChild(titleEl);

  tags.forEach(tag => {
    const row = document.createElement('div');
    row.className = 'meta-row';
    row.innerHTML = `<span class="meta-key">${tag.key}</span><span class="meta-val">${tag.value}</span>`;
    group.appendChild(row);
  });

  parent.appendChild(group);
}

function displayBrokenLinksReport(brokenLinks) {
  const reportContainer = document.getElementById("reportContainer");
  if (!reportContainer) return;

  reportContainer.innerHTML = "";

  if (brokenLinks.length === 0) {
    showToast("No broken links found", "success");
    return;
  }

  const reportHeader = document.createElement("h3");
  reportHeader.innerText = "Broken Links Report";

  const reportList = document.createElement("ul");
  reportList.classList.add("broken-links-list");

  brokenLinks.forEach(link => {
    const listItem = document.createElement("li");
    listItem.innerText = `${link.url} [${link.status}]`;
    reportList.appendChild(listItem);
  });

  reportContainer.appendChild(reportHeader);
  reportContainer.appendChild(reportList);
  showToast(`Found ${brokenLinks.length} broken link(s)`, "warning");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

function applyTheme(theme) {
  try {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme || 'light');
    }
  } catch (error) {
    console.error('Apply theme error:', error);
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + [Key] shortcuts
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      switch(e.key.toLowerCase()) {
        case 'h':
          e.preventDefault();
          document.getElementById('copyHeadingsButton')?.click();
          break;
        case 'l':
          e.preventDefault();
          document.getElementById('highlightLinksButton')?.click();
          break;
        case 'i':
          e.preventDefault();
          document.getElementById('checkIndexabilityButton')?.click();
          break;
        case 't':
          e.preventDefault();
          document.getElementById('themeToggle')?.click();
          break;
      }
    }
  });
}
