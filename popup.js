import { buildRichResultsUrl } from './popup/utils/url.js';
import { showToast, showLoading, hideLoading } from './popup/utils/ui.js';

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

  if (searchButton) {
    searchButton.addEventListener("click", async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = `https://www.google.com/search?q=site:${encodeURIComponent(tabs[0].url)}`;
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url);
        const domain = encodeURIComponent(url.protocol + '//' + url.hostname + '/');
        const pageUrl = encodeURIComponent(tabs[0].url);
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url);
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = encodeURIComponent(tabs[0].url);
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = `https://web.archive.org/web/*/${tabs[0].url}`;
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['scripts/copyHeadings.js']
        });

        const headingTexts = result[0].result;
        await copyToClipboard(headingTexts.join("\n"));
        showToast('Headings copied to clipboard!', 'success');
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['scripts/highlightLinks.js']
        });
        showToast('Links highlighted on page', 'success');
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['scripts/copyLinks.js']
        });

        const links = result[0].result;
        hideLoading(copyLinksButton);

        if (links) {
          await copyToClipboard(links);
          showToast('Links copied to clipboard!', 'success');
        } else {
          showToast('No external links found on this page', 'warning');
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['scripts/getLinkUrls.js']
        });

        const linkUrls = result[0].result;
        const brokenLinks = [];

        await Promise.all(
          linkUrls.map(url =>
            fetch(url)
              .then(response => {
                if (!response.ok) {
                  brokenLinks.push({ url, status: response.status });
                }
              })
              .catch(() => {
                brokenLinks.push({ url, status: "Error" });
              })
          )
        );

        hideLoading(brokenLinkCheckerButton);
        displayBrokenLinksReport(brokenLinks);
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['scripts/checkIndexability.js']
        });
      } catch (error) {
        showToast('Error checking indexability', 'error');
        console.error('Check indexability error:', error);
      }
    });
  }

  if (checkSchemaButton) {
    checkSchemaButton.addEventListener("click", async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tabs[0].url;
        const testUrl = buildRichResultsUrl(currentUrl);
        await chrome.tabs.create({ url: testUrl });
      } catch (error) {
        showToast('Error opening Schema tester', 'error');
        console.error('Check schema error:', error);
      }
    });
  }

  // Initialize keyboard shortcuts
  initKeyboardShortcuts();
});

// Helper functions
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
