const fs = require('fs');
const files = ['index.html', 'blog.html', 'about.html', 'post.html', 'saved.html', 'history.html'];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('og:type')) {
        console.log(`Skipping ${file}, already has OG tags`);
        continue;
    }

    let canonicalPath = file === 'index.html' ? '' : file;
    let url = 'https://vistora.blog/' + canonicalPath;
    let title = file === 'index.html' ? "VISTORA — Thoughtful Stories for Modern Minds" : "VISTORA — " + file.replace('.html', '').toUpperCase();
    
    let injectedTags = `
  <!-- SEO & Open Graph Tags -->
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="Thoughtful stories on technology, lifestyle, travel, business, and creative living for modern minds.">
  <meta property="og:image" content="https://vistora.blog/images/og-image.jpg">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="VISTORA">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="Thoughtful stories on technology, lifestyle, travel, business, and creative living for modern minds.">
  <meta name="twitter:image" content="https://vistora.blog/images/og-image.jpg">
  <link rel="alternate" type="application/rss+xml" title="VISTORA RSS Feed" href="rss.xml">`;

    if (file === 'index.html') {
        injectedTags += `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "VISTORA",
    "url": "https://vistora.blog/",
    "publisher": {
      "@type": "Organization",
      "name": "VISTORA Editorial Team"
    }
  }
  </script>`;
    } else if (file === 'post.html') {
        injectedTags += `
  <script type="application/ld+json" id="structured-data">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "VISTORA Article",
    "url": "https://vistora.blog/post.html",
    "publisher": {
      "@type": "Organization",
      "name": "VISTORA Editorial Team"
    }
  }
  </script>`;
    }

    content = content.replace('</head>', injectedTags + '\n</head>');
    fs.writeFileSync(file, content);
}
