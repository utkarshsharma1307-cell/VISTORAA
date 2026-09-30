require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const newsletterRoutes = require('./routes/newsletter');
const contactRoutes = require('./routes/contact');

const app = express();
const root = path.join(__dirname, '..');
const port = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'vistora' });
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);

app.use(express.static(root, { extensions: ['html'] }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found.' });
  }
  return res.redirect('/');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(port, () => {
  console.log('VISTORA listening on http://localhost:' + port);
});