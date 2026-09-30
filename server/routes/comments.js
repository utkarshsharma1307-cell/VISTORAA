const express = require('express');
const db = require('../utils/db');
const { auth, optionalAuth } = require('../middleware/auth');
const { asString, sanitizePlain } = require('../utils/validate');

const router = express.Router();
const REACTIONS = ['insightful', 'beautiful', 'thoughtful', 'fire', 'clap'];

router.get('/:slug', optionalAuth, (req, res) => {
  const slug = asString(req.params.slug, 120);
  const comments = db.read('comments')
    .filter((comment) => comment.slug === slug)
    .map((comment) => ({
      id: comment.id,
      slug: comment.slug,
      parentId: comment.parentId || null,
      name: comment.name,
      body: comment.body,
      createdAt: comment.createdAt
    }));
  const reactions = db.read('reactions').filter((item) => item.slug === slug);
  const counts = {};
  REACTIONS.forEach((kind) => { counts[kind] = 0; });
  reactions.forEach((item) => {
    if (counts[item.kind] !== undefined) counts[item.kind] += 1;
  });
  const mine = req.user
    ? reactions.filter((item) => item.userId === req.user.id).map((item) => item.kind)
    : [];
  res.json({ comments, counts, mine });
});

router.post('/:slug', auth, (req, res) => {
  const slug = asString(req.params.slug, 120);
  const body = sanitizePlain(req.body && req.body.body, 1200);
  const parentId = req.body && req.body.parentId ? Number(req.body.parentId) : null;
  if (body.length < 2) return res.status(400).json({ error: 'Comment is too short.' });

  const articles = db.read('articles');
  if (!articles.some((article) => article.slug === slug && article.status !== 'draft')) {
    return res.status(404).json({ error: 'Article not found.' });
  }

  if (parentId) {
    const parent = db.read('comments').find((comment) => comment.id === parentId && comment.slug === slug);
    if (!parent) return res.status(400).json({ error: 'Reply target was not found.' });
    if (parent.parentId) return res.status(400).json({ error: 'Replies can only be one level deep.' });
  }

  const comments = db.read('comments');
  const comment = {
    id: db.nextId('comments'),
    slug,
    parentId: parentId || null,
    userId: req.user.id,
    name: req.user.name,
    body,
    createdAt: new Date().toISOString()
  };
  comments.push(comment);
  db.write('comments', comments);
  res.status(201).json({
    comment: {
      id: comment.id,
      slug: comment.slug,
      parentId: comment.parentId,
      name: comment.name,
      body: comment.body,
      createdAt: comment.createdAt
    }
  });
});

router.post('/:slug/reactions', auth, (req, res) => {
  const slug = asString(req.params.slug, 120);
  const kind = asString(req.body && req.body.kind, 20);
  if (!REACTIONS.includes(kind)) return res.status(400).json({ error: 'Unknown reaction.' });

  const reactions = db.read('reactions');
  const index = reactions.findIndex((item) => item.slug === slug && item.userId === req.user.id && item.kind === kind);
  if (index > -1) {
    reactions.splice(index, 1);
  } else {
    reactions.push({
      id: db.nextId('reactions'),
      slug,
      userId: req.user.id,
      kind,
      createdAt: new Date().toISOString()
    });
  }
  db.write('reactions', reactions);

  const counts = {};
  REACTIONS.forEach((name) => { counts[name] = 0; });
  reactions.filter((item) => item.slug === slug).forEach((item) => { counts[item.kind] += 1; });
  const mine = reactions.filter((item) => item.slug === slug && item.userId === req.user.id).map((item) => item.kind);
  res.json({ counts, mine });
});

router.delete('/item/:id', auth, (req, res) => {
  const comments = db.read('comments');
  const target = comments.find((comment) => String(comment.id) === String(req.params.id));
  if (!target) return res.status(404).json({ error: 'Comment not found.' });
  if (target.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only delete your own comments.' });
  }
  const next = comments.filter((comment) => comment.id !== target.id && comment.parentId !== target.id);
  db.write('comments', next);
  res.json({ ok: true });
});

module.exports = router;
