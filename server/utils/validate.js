function asString(value, max) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (max && trimmed.length > max) return trimmed.slice(0, max);
  return trimmed;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugify(value) {
  return asString(value, 120)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function sanitizePlain(value, max) {
  return asString(value, max).replace(/[<>]/g, '');
}

module.exports = { asString, isEmail, slugify, sanitizePlain };
