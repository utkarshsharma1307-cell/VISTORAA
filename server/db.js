const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    console.log('Initializing seed database...');
    
    const window = {};
    const dataJsContent = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
    try {
      eval(dataJsContent);
    } catch (e) {
      console.error('Failed to parse js/data.js', e);
    }

    const VISTORA_ARTICLES = window.VISTORA_ARTICLES || [];
    const VISTORA_CATEGORIES = window.VISTORA_CATEGORIES || [];
    const getUniqueTags = window.VISTORA_DATA ? window.VISTORA_DATA.getUniqueTags : () => [];
    
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const authorPassword = bcrypt.hashSync('maya123', 10);

    const initialData = {
      users: [
        { id: 1, name: "VISTORA Admin", email: "admin@vistora.blog", passwordHash: adminPassword, role: "admin", createdAt: new Date().toISOString() },
        { id: 2, name: "Maya Patel", email: "maya@vistora.blog", passwordHash: authorPassword, role: "author", createdAt: new Date().toISOString() }
      ],
      articles: VISTORA_ARTICLES.map(a => ({ ...a, status: 'published', views: 0 })),
      categories: VISTORA_CATEGORIES,
      tags: getUniqueTags(),
      likes: [],
      bookmarks: [],
      subscribers: [
        { id: 1, email: "reader1@example.com", status: "active", subscribedAt: new Date().toISOString() }
      ]
    };
    
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log('Database seeded successfully.');
  }
}

function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading DB:', e);
    return { users: [], articles: [], categories: [], tags: [], likes: [], bookmarks: [], subscribers: [] };
  }
}

function writeDB(data) {
  const tempFile = DB_FILE + '.tmp';
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    console.error('Error writing DB:', e);
  }
}

initDB();

module.exports = { readDB, writeDB };
