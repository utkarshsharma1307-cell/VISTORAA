const fs = require('fs');

// Mock window for data.js
global.window = {};

eval(fs.readFileSync('js/data.js', 'utf8'));

const articles = global.window.VISTORA_ARTICLES || VISTORA_ARTICLES;
const baseUrl = 'https://vistora.blog';

// Generate robots.txt
const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`;
fs.writeFileSync('robots.txt', robotsTxt);

// Generate sitemap.xml
const staticPages = ['index.html', 'blog.html', 'about.html', 'saved.html', 'history.html', 'admin.html'];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

for (const page of staticPages) {
    let loc = page === 'index.html' ? baseUrl + '/' : baseUrl + '/' + page;
    sitemap += `\n  <url>\n    <loc>${loc}</loc>\n  </url>`;
}

for (const article of articles) {
    sitemap += `\n  <url>\n    <loc>${baseUrl}/post.html?slug=${article.slug}</loc>\n  </url>`;
}

sitemap += `\n</urlset>`;
fs.writeFileSync('sitemap.xml', sitemap);

// Generate rss.xml
let rss = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>VISTORA — Thoughtful Stories for Modern Minds</title>\n  <link>${baseUrl}</link>\n  <description>Thoughtful stories on technology, lifestyle, travel, business, and creative living for modern minds.</description>\n  <language>en-us</language>\n  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />`;

for (const article of articles) {
    rss += `\n  <item>\n    <title><![CDATA[${article.title}]]></title>\n    <link>${baseUrl}/post.html?slug=${article.slug}</link>\n    <description><![CDATA[${article.excerpt}]]></description>\n    <pubDate>${new Date(article.date).toUTCString()}</pubDate>\n    <category><![CDATA[${article.category}]]></category>\n  </item>`;
}

rss += `\n</channel>\n</rss>`;
fs.writeFileSync('rss.xml', rss);
