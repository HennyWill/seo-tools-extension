const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
const node = attributes => ({ getAttribute: key => attributes[key] ?? null });
function pageContext(url = 'https://example.com/public') {
  return { URL, AbortSignal, console, location: new URL(url), document: { baseURI: url, getElementsByTagName: () => [], querySelector: () => null, querySelectorAll: () => [] } };
}
async function audit(robots, url, extra = {}) {
  const context = pageContext(url);
  context.fetch = async request => request.endsWith('/robots.txt')
    ? { ok: true, text: async () => robots }
    : { ok: true, headers: { get: () => null } };
  Object.assign(context, extra);
  return vm.runInNewContext(source('scripts/checkIndexability.js'), context);
}
test('specific Googlebot group does not inherit wildcard restrictions', async () => {
  const result = await audit('User-agent: *\nDisallow: /\nUser-agent: Googlebot\nDisallow: /private');
  assert.equal(result[0].type, 'pass');
});
test('multiple user agents share rules and repeated Googlebot groups merge', async () => {
  for (const robots of ['User-agent: Googlebot\nUser-agent: bingbot\nDisallow: /public', 'User-agent: Googlebot\nDisallow: /private\nUser-agent: Googlebot\nDisallow: /public']) {
    assert.equal((await audit(robots))[0].type, 'fail');
  }
});
test('allow wins equal specificity; wildcard and end anchor work', async () => {
  assert.equal((await audit('User-agent: *\nDisallow: /public\nAllow: /public'))[0].type, 'pass');
  assert.equal((await audit('User-agent: *\nDisallow: /*.pdf$', 'https://example.com/a.pdf'))[0].type, 'fail');
  assert.equal((await audit('User-agent: *\nDisallow: /*.pdf$', 'https://example.com/a.pdf?download=1'))[0].type, 'pass');
});
test('robots request preserves port', async () => {
  const requests = [];
  await audit('', 'https://example.com:8443/public', { fetch: async url => { requests.push(url); return {ok: true, text: async () => '', headers: {get: () => null}}; } });
  assert.equal(requests[0], 'https://example.com:8443/robots.txt');
});
test('canonical difference is a warning and trailing slash stays significant', async () => {
  const document = {baseURI: 'https://example.com/public', getElementsByTagName: tag => tag === 'link' ? [node({rel: 'canonical', href: '/public/'})] : []};
  const result = await audit('', undefined, {document});
  assert.equal(result.find(c => c.label === 'Canonical').type, 'warning');
});
test('X-Robots-Tag respects bot scope and unavailable HEAD is inconclusive', async () => {
  for (const [header, expected] of [['bingbot: noindex', 'pass'], ['googlebot: noindex', 'fail']]) {
    const result = await audit('', undefined, {fetch: async url => ({ok: true, text: async () => '', headers: { get: () => header }})});
    assert.equal(result.find(c => c.label === 'X-Robots-Tag').type, expected);
  }
  const result = await audit('', undefined, {fetch: async () => ({ok: false, status: 405})});
  assert.equal(result.find(c => c.label === 'X-Robots-Tag').type, 'warning');
});
test('summary resolves relative URLs using baseURI and rejects unsafe schemes', () => {
  const context = pageContext();
  context.document.baseURI = 'https://example.com/base/';
  context.document.querySelector = () => node({href: '../public'});
  context.document.querySelectorAll = selector => selector.startsWith('link') ? [node({hreflang:'en', href:'en/'}),node({hreflang:'fr',href:'javascript:alert(1)'})] : [];
  const summary = vm.runInNewContext(source('scripts/pageSummary.js'), context);
  assert.equal(summary.canonical.href, 'https://example.com/public');
  assert.equal(summary.canonical.isSelf, true);
  assert.equal(summary.hreflang.count, 1);
  assert.equal(summary.hreflang.items[0].href, 'https://example.com/base/en/');
});
test('meta directives are tokenized rather than substring matched', () => {
  const context = pageContext();
  context.document.querySelectorAll = selector => selector === 'meta[name]' ? [node({name:'ROBOTS',content:'nonetheless'})] : [];
  assert.equal(vm.runInNewContext(source('scripts/pageSummary.js'), context).robotsMeta.blocked, false);
  context.document.querySelectorAll = selector => selector === 'meta[name]' ? [node({name:'ROBOTS',content:'NOINDEX, follow'})] : [];
  assert.equal(vm.runInNewContext(source('scripts/pageSummary.js'), context).robotsMeta.blocked, true);
});
test('link extraction includes resolved relative links and excludes mailto', () => {
  const context = pageContext();
  context.document.querySelectorAll = () => [{href:'https://example.com/relative'},{href:'https://external.com/a'},{href:'mailto:a@example.com'}];
  const result = vm.runInNewContext(source('scripts/copyLinks.js'), context);
  assert.match(result, /\/relative/); assert.match(result, /https:\/\/external.com\/a/); assert.doesNotMatch(result,/mailto/);
});
test('external URLs remain unknown, HEAD 405 falls back, 404 is broken', async () => {
  const context = pageContext();
  context.document.querySelectorAll = () => ['https://example.com/ok','https://example.com/missing','https://example.com/fallback','https://other.com/missing'].map(href=>({href}));
  const requests = [];
  context.fetch = async (url, options) => {
    requests.push([url, options.method]);
    const status = url.endsWith('missing') ? 404 : url.endsWith('fallback') && options.method === 'HEAD' ? 405 : 200;
    return {status, ok:status === 200};
  };
  const result = await vm.runInNewContext(source('scripts/checkBrokenLinks.js'), context);
  assert.equal(result.find(r=>r.url.includes('other.com')).state, 'unknown');
  assert.equal(result.find(r=>r.url.endsWith('/missing') && r.url.includes('example.com')).state, 'broken');
  assert.equal(result.find(r=>r.url.endsWith('/fallback')).state, 'ok');
  assert.equal(requests.some(([url])=>url.includes('other.com')),false);
  assert.equal(requests.length,4);
});
test('link checker bounds concurrency and treats network errors as unknown', async () => {
  const context = pageContext(); let active=0, peak=0;
  context.document.querySelectorAll = () => Array.from({length:15},(_,i)=>({href:`https://example.com/${i}`}));
  context.fetch = async () => {active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,2));active--;throw new Error('Network');};
  const result = await vm.runInNewContext(source('scripts/checkBrokenLinks.js'), context);
  assert.equal(peak,5);assert.equal(result.length,15);assert.ok(result.every(r=>r.state==='unknown'));
});
test('popup renders untrusted page data as text', () => {
  class Element {
    constructor() {this.children=[];this.listeners={};this.textContent='';}
    appendChild(child) {this.children.push(child);return child;}
    addEventListener(type, fn) {this.listeners[type]=fn;}
  }
  const document = { addEventListener() {}, createElement: () => new Element() };
  const context = { document, console };
  const popup = source('popup.js').replace(/^import .*;\r?\n/gm,'');
  vm.runInNewContext(popup, context);
  const parent = new Element();
  context.addSummaryRow(parent, {status:'success',label:'Title',value:'<img src=x onerror=alert(1)>'});
  assert.equal(parent.children[0].children[2].textContent,'<img src=x onerror=alert(1)>');
  assert.equal(parent.children[0].innerHTML,undefined);
});

test('Search Console preserves exact page filter and supports parent and URL-prefix resources', async () => {
  const module = await import('data:text/javascript;base64,' + Buffer.from(source('popup/utils/url.js')).toString('base64'));
  const page = 'https://www.example.co.uk/a?q=one&lang=uk';
  const defaults = new URL(module.buildSearchConsoleUrl(page));
  assert.equal(defaults.searchParams.get('resource_id'), 'sc-domain:example.co.uk');
  assert.equal(defaults.searchParams.get('page'), '!' + page);
  assert.equal(new URL(module.buildSearchConsoleUrl('https://blog.example.com/post', 'sc-domain:example.com')).searchParams.get('resource_id'), 'sc-domain:example.com');
  assert.equal(new URL(module.buildSearchConsoleUrl(page, 'https://www.example.co.uk/')).searchParams.get('resource_id'), 'https://www.example.co.uk/');
  assert.throws(() => module.buildSearchConsoleUrl(page, 'javascript:alert(1)'));
});

test('link analysis retains duplicate occurrences, rel tokens and labeled anchor fallbacks', () => {
  const context = pageContext();
  const anchor = (href, text, attributes = {}, images = []) => ({
    ...node(attributes), href, textContent: text,
    querySelectorAll: () => images.map(alt => node({alt}))
  });
  context.document.querySelectorAll = () => [
    anchor('https://www.example.com/page', '  Learn\n more ', {rel:'UGC NOFOLLOW nofollow'}),
    anchor('https://other.com/ad', '', {rel:'sponsored', 'aria-label':'Advertisement'}),
    anchor('https://example.com/image', '', {}, ['Image description']),
    anchor('https://example.com/page', ''),
    anchor('https://blog.example.com/', 'Blog'),
    anchor('mailto:hi@example.com', 'Email')
  ];
  const data = vm.runInNewContext(source('scripts/analyzeLinks.js'), context);
  assert.equal(data.links.length, 5);
  assert.equal(data.skipped, 1);
  assert.equal(data.links[0].anchor, 'Learn more');
  assert.equal(data.links[0].scope, 'internal');
  assert.equal(data.links[0].rel.length, 2);
  assert.equal(data.links[0].nofollow, true);
  assert.equal(data.links[0].ugc, true);
  assert.equal(data.links[1].sponsored, true);
  assert.equal(data.links[1].anchorSource, 'aria-label');
  assert.equal(data.links[2].anchorSource, 'image alt');
  assert.equal(data.links[3].anchorSource, 'empty');
  assert.equal(data.links[4].scope, 'external');
});
function jsonLd(blocks) {
  const context = pageContext();
  context.document.querySelectorAll = () => blocks.map(([textContent, type = 'application/ld+json']) => ({ ...node({type}), textContent }));
  return vm.runInNewContext(source('scripts/getStructuredData.js'), context);
}
test('JSON-LD extracts nested, array and @graph types without executing content', () => {
  const data = jsonLd([[JSON.stringify({'@graph': [{'@type':['Article','NewsArticle'],author:{'@type':'Person'}},{'@type':'Article'}]})],['[{"@type":"Product"}]'],['{"@type":"Ignored"}','application/json']]);
  assert.equal(data.blocks.length, 2);
  assert.equal(JSON.stringify(data.blocks[0].types), JSON.stringify(['Article','NewsArticle','Person']));
  assert.equal(data.blocks[1].types[0], 'Product');
  assert.equal(data.blocks[0].error, null);
});
test('JSON-LD reports invalid and empty JSON independently from valid blocks', () => {
  const data = jsonLd([['{"@type":"Product",}'],[''],['{"@type":"WebSite"}']]);
  assert.ok(data.blocks[0].error);
  assert.ok(data.blocks[1].error);
  assert.equal(data.blocks[2].types[0], 'WebSite');
});
test('JSON-LD distinguishes syntax from semantic review and handles deep graphs iteratively', () => {
  const data = jsonLd([['null'],['{"name":"Example"}'],['{"@type":"Thing"}', 'Application/LD+JSON; charset=utf-8']]);
  assert.equal(data.blocks[0].error, null);
  assert.ok(data.blocks[0].warning);
  assert.ok(data.blocks[1].warning);
  assert.equal(data.blocks[2].types[0], 'Thing');
  const deep = '{"child":'.repeat(2000) + '{"@type":"Thing"}' + '}'.repeat(2000);
  assert.equal(jsonLd([[deep]]).blocks[0].types[0], 'Thing');
});
test('oversized JSON-LD is explicitly skipped instead of silently truncating syntax', () => {
  const block = jsonLd([[' '.repeat(1) + '{"value":"' + 'x'.repeat(250001) + '"}']]).blocks[0];
  assert.match(block.error, /exceeds/);
  assert.equal(block.raw.length, 2000);
});
test('link filters combine search, scope and rel; TSV preserves rows and neutralizes formulas', async () => {
  const report = await import('data:text/javascript;base64,' + Buffer.from(source('popup/reports.js')).toString('base64'));
  const links = [
    {url:'https://example.com/a',anchor:'=HYPERLINK("bad")',anchorSource:'text',scope:'internal',rel:['nofollow'],nofollow:true},
    {url:'https://outside.com/a',anchor:'Other',anchorSource:'text',scope:'external',rel:['ugc'],ugc:true},
    {url:'https://example.com/empty',anchor:'',anchorSource:'empty',scope:'internal',rel:[]}
  ];
  assert.equal(report.filterLinks(links,{scope:'internal',rel:'nofollow',query:'EXAMPLE'}).length,1);
  assert.equal(report.filterLinks(links,{rel:'empty'})[0],links[2]);
  assert.equal(report.filterLinks(links,{scope:'external',rel:'nofollow'}).length,0);
  const tsv = report.linksToTsv(links);
  assert.match(tsv,/\t'=HYPERLINK/);
  assert.equal(tsv.split('\n').length,4);
});

test('report buttons execute the right content script and restore loading state on success and failure', async () => {
  let handler, rendered, restored = 0;
  const container = {scrollIntoView() {}};
  const context = {
    document:{addEventListener(){},getElementById:()=>container},
    chrome:{tabs:{query:async()=>[{id:42,url:'https://example.com/'}]},scripting:{executeScript:async request=>{assert.equal(request.target.tabId,42);assert.equal(request.files[0],'scripts/analyzeLinks.js');return [{result:{links:[]}}];}}},
    showLoading(){}, hideLoading(){restored++;}, showToast(){}, console:{error(){}}
  };
  vm.runInNewContext(source('popup.js').replace(/^import .*;\r?\n/gm,''),context);
  context.bindReportTool({addEventListener(event,callback){handler=callback;}},'scripts/analyzeLinks.js',(data,target)=>{rendered=data;assert.equal(target,container);});
  await handler();
  assert.ok(rendered.links);
  assert.equal(restored,1);
  context.chrome.scripting.executeScript=async()=>{throw new Error('Restricted page');};
  await handler();
  assert.equal(restored,2);
});

test('GSC selector defaults to domain, offers exact URL-prefix and preserves valid saved resources', async () => {
  const utils = await import('data:text/javascript;base64,' + Buffer.from(source('popup/utils/url.js')).toString('base64'));
  const choices = utils.getSearchConsoleResources('https://photo-site.example/ru/');
  assert.equal(choices[0].value,'sc-domain:photo-site.example');
  assert.equal(choices[1].value,'https://photo-site.example/');
  assert.equal(new URL(utils.buildSearchConsoleUrl('https://photo-site.example/ru/',choices[1].value)).searchParams.get('resource_id'),'https://photo-site.example/');
  assert.equal(utils.getSearchConsoleResources('https://blog.example.com/','sc-domain:example.com')[2].value,'sc-domain:example.com');
  assert.equal(utils.getSearchConsoleResources('https://example.com/','javascript:alert(1)').length,2);
});
