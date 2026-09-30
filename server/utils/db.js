/**
 * VISTORA — split JSON collections with atomic writes.
 * Articles are seeded from js/data.js on first boot (vm, not eval).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_JS = path.join(__dirname, '..', '..', 'js', 'data.js');

const COLLECTIONS = [
  'users',
  'articles',
  'comments',
  'reactions',
  'newsletter',
  'contacts',
  'meta'
];

function fileFor(name) {
  if (!COLLECTIONS.includes(name)) {
    throw new Error('Unknown collection: ' + name);
  }
  return path.join(DATA_DIR, name + '.json');
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function loadSeedArticles() {
  const code = fs.readFileSync(DATA_JS, 'utf8');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'js/data.js', timeout: 2000 });
  const articles = (sandbox.window.VISTORA_ARTICLES || []).map((article) => ({
    ...article,
    status: 'published',
    views: 0,
    markdown: null
  }));
  const categories = sandbox.window.VISTORA_CATEGORIES || [];
  return { articles, categories };
}

function ensureSeed() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const empty = {
    comments: [],
    reactions: [],
    newsletter: [],
    contacts: []
  };

  Object.keys(empty).forEach((name) => {
    const file = fileFor(name);
    if (!fs.existsSync(file)) writeJson(file, empty[name]);
  });

  const usersFile = fileFor('users');
  if (!fs.existsSync(usersFile)) {
    const now = new Date().toISOString();
    writeJson(usersFile, [
      {
        id: 1,
        name: 'VISTORA Admin',
        email: process.env.ADMIN_EMAIL || 'admin@vistora.blog',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        bio: 'Editorial administrator. Demo account — change this password.',
        createdAt: now
      },
      {
        id: 2,
        name: 'Maya Patel',
        email: 'maya@vistora.blog',
        passwordHash: bcrypt.hashSync('maya123', 10),
        role: 'author',
        bio: 'Senior Technology Editor.',
        createdAt: now
      }
    ]);
    console.log('Seeded demo users (admin@vistora.blog / admin123).');
  }

  const articlesFile = fileFor('articles');
  const metaFile = fileFor('meta');
  if (!fs.existsSync(articlesFile) || !fs.existsSync(metaFile)) {
    const seed = loadSeedArticles();
    if (!fs.existsSync(articlesFile)) writeJson(articlesFile, seed.articles);
    if (!fs.existsSync(metaFile)) {
      writeJson(metaFile, { categories: seed.categories, nextIds: { users: 3, articles: 100, comments: 1, reactions: 1, newsletter: 1, contacts: 1 } });
    }
    console.log('Seeded articles from js/data.js.');
  }
}

function read(name) {
  return readJson(fileFor(name), name === 'meta' ? { categories: [], nextIds: {} } : []);
}

function write(name, data) {
  writeJson(fileFor(name), data);
}

function nextId(entity) {
  const meta = read('meta');
  meta.nextIds = meta.nextIds || {};
  const current = Number(meta.nextIds[entity] || 1);
  meta.nextIds[entity] = current + 1;
  write('meta', meta);
  return current;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || '',
    createdAt: user.createdAt
  };
}

ensureSeed();

module.exports = {
  read,
  write,
  nextId,
  publicUser,
  DATA_DIR
};
