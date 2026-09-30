const express = require('express');
const db = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');
const { asString, sanitizePlain, slugify } = require('../utils/validate');

const router = express.Router();
const editors = requireRole('admin', 'author');

function publicArticle(article) {
  if (!article) return null;
  const copy = Object.assign({}, article);
  delete copy.internalNotes;
  return copy;
}

function readingTimeFrom(content, markdown) {
  let words = 0;
  if (Array.isArray(content)) {
    content.forEach((block) => {
      if (block && typeof block.text === 'string') {
        words += block.text.trim().split(/\s+/).filter(Boolean).length;
      }
    });
  }
  if (typeof markdown === 'string' && markdown.trim()) {
    words += markdown.trim().split(/\s+/).filter(Boolean).length;
  }
  return Math.max(1, Math.ceil(words / 200) || 1);
}

function normalizeContent(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 80).map((block) => {
    const type = asString(block && block.type, 20);
    if (!['paragraph', 'heading', 'quote', 'callout', 'image'].includes(type)) return null;
    if (type === 'image') {
      const url = asString(block.url, 500);
      if (!/^https?:\/\//i.test(url)) return null;
      return { type, url, caption: sanitizePlain(block.caption, 240) };
    }
    const text = sanitizePlain(block.text, 4000);
    if (!text) return null;
    if (type === 'heading') {
      const level = Number(block.level) === 3 ? 3 : 2;
      return { type, level, text };
    }
    if (type === 'quote') return { type, text, cite: sanitizePlain(block.cite, 160) };
    return { type, text };
  }).filter(Boolean);
}

router.get('/', (req, res) => {
  const articles = db.read('articles');
  const includeDrafts = req.query.all === '1';
  const list = articles
    .filter((article) => includeDrafts || article.status !== 'draft')
    .map(publicArticle);
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ articles: list, categories: (db.read('meta').categories || []) });
});

router.get('/trending', (req, res) => {
  const articles = db.read('articles').filter((article) => article.status !== 'draft');
  const ranked = articles
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0) || new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map(publicArticle);
  res.json({ articles: ranked });
});

router.get('/:slug', (req, res) => {
  const key = String(req.params.slug || '');
  const articles = db.read('articles');
  const index = articles.findIndex((article) => article.slug === key || String(article.id) === key);
  if (index === -1 || (articles[index].status === 'draft' && req.query.preview !== '1')) {
    return res.status(404).json({ error: 'Article not found.' });
  }
  articles[index].views = (articles[index].views || 0) + 1;
  db.write('articles', articles);
  return res.json({ article: publicArticle(articles[index]) });
});

router.post('/', editors, (req, res) => {
  const body = req.body || {};
  const title = sanitizePlain(body.title, 180);
  if (title.length < 4) return res.status(400).json({ error: 'Title must be at least 4 characters.' });

  const articles = db.read('articles');
  let slug = slugify(body.slug || title);
  if (!slug) slug = 'story-' + Date.now();
  if (articles.some((article) => article.slug === slug)) slug = slug + '-' + Date.now().toString().slice(-4);

  const content = normalizeContent(body.content);
  const markdown = asString(body.markdown, 20000);
  const article = {
    id: db.nextId('articles'),
    slug,
    title,
    category: sanitizePlain(body.category, 40) || 'Personal',
    tags: Array.isArray(body.tags) ? body.tags.map((tag) => sanitizePlain(tag, 40)).filter(Boolean).slice(0, 8) : [],
    author: sanitizePlain(body.author, 80) || req.user.name,
    authorRole: sanitizePlain(body.authorRole, 80) || 'Contributor',
    authorInitials: sanitizePlain(body.authorInitials, 4) || 'VA',
    authorAvatarClass: sanitizePlain(body.authorAvatarClass, 40) || 'avatar-teal',
    date: asString(body.date, 20) || new Date().toISOString().slice(0, 10),
    formattedDate: sanitizePlain(body.formattedDate, 40) || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    image: asString(body.image, 500),
    imageAlt: sanitizePlain(body.imageAlt, 180),
    excerpt: sanitizePlain(body.excerpt, 400),
    readingTime: readingTimeFrom(content, markdown),
    featured: Boolean(body.featured),
    highlight: Boolean(body.highlight),
    status: body.status === 'draft' ? 'draft' : 'published',
    content,
    markdown: markdown || null,
    views: 0
  };

  if (!/^https?:\/\//i.test(article.image)) {
    article.image = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';
  }

  articles.push(article);
  db.write('articles', articles);
  return res.status(201).json({ article: publicArticle(article) });
});

router.put('/:id', editors, (req, res) => {
  const articles = db.read('articles');
  const index = articles.findIndex((article) => String(article.id) === String(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Article not found.' });
  if (req.user.role !== 'admin' && articles[index].author !== req.user.name) {
    return res.status(403).json({ error: 'You can only edit your own stories.' });
  }

  const body = req.body || {};
  const current = articles[index];
  if (body.title) current.title = sanitizePlain(body.title, 180);
  if (body.excerpt !== undefined) current.excerpt = sanitizePlain(body.excerpt, 400);
  if (body.category) current.category = sanitizePlain(body.category, 40);
  if (Array.isArray(body.tags)) current.tags = body.tags.map((tag) => sanitizePlain(tag, 40)).filter(Boolean).slice(0, 8);
  if (body.content) current.content = normalizeContent(body.content);
  if (body.markdown !== undefined) current.markdown = asString(body.markdown, 20000) || null;
  if (body.status === 'draft' || body.status === 'published') current.status = body.status;
  if (body.image && /^https?:\/\//i.test(body.image)) current.image = asString(body.image, 500);
  if (body.imageAlt !== undefined) current.imageAlt = sanitizePlain(body.imageAlt, 180);
  if (typeof body.featured === 'boolean') current.featured = body.featured;
  if (typeof body.highlight === 'boolean') current.highlight = body.highlight;
  current.readingTime = readingTimeFrom(current.content, current.markdown);

  articles[index] = current;
  db.write('articles', articles);
  return res.json({ article: publicArticle(current) });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const articles = db.read('articles');
  const next = articles.filter((article) => String(article.id) !== String(req.params.id));
  if (next.length === articles.length) return res.status(404).json({ error: 'Article not found.' });
  db.write('articles', next);
  return res.json({ ok: true });
});

module.exports = router;
