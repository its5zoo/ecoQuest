const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup(body) {
  const errors = [];
  const { name, email, password, district, state, country } = body || {};

  if (!name || String(name).trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !EMAIL_RE.test(String(email).trim())) errors.push('Valid email is required');
  if (!password || String(password).length < 8) errors.push('Password must be at least 8 characters');
  if (!district || !state || !country) errors.push('District, state, and country are required');

  return { valid: errors.length === 0, errors };
}

function validateLogin(body) {
  const errors = [];
  const { email, password } = body || {};
  if (!email || !EMAIL_RE.test(String(email).trim())) errors.push('Valid email is required');
  if (!password) errors.push('Password is required');
  return { valid: errors.length === 0, errors };
}

function validateActivity(body) {
  const errors = [];
  const { activityType, category, duration, quantity } = body || {};
  if (!activityType || !category) errors.push('activityType and category are required');
  const d = Number(duration);
  const q = Number(quantity);
  if (duration !== undefined && (Number.isNaN(d) || d < 0 || d > 1440)) {
    errors.push('duration must be between 0 and 1440');
  }
  if (quantity !== undefined && (Number.isNaN(q) || q < 0 || q > 10000)) {
    errors.push('quantity must be between 0 and 10000');
  }
  return { valid: errors.length === 0, errors };
}

const MAX_POST_LENGTH = 2000;

function validatePostContent(body) {
  const errors = [];
  const { content, scope } = body || {};
  const trimmed = content != null ? String(content).trim() : '';

  if (!trimmed) errors.push('Content is required');
  if (trimmed.length > MAX_POST_LENGTH) {
    errors.push(`Content must be ${MAX_POST_LENGTH} characters or fewer`);
  }
  if (!scope) errors.push('Scope is required');
  if (scope && !['State', 'Country'].includes(scope)) {
    errors.push('Invalid scope value');
  }

  return { valid: errors.length === 0, errors, content: trimmed };
}

function sanitizeProfileUpdates(body) {
  const allowed = ['name', 'avatar', 'bio', 'district', 'state', 'country'];
  const updates = {};
  allowed.forEach((field) => {
    if (body[field] !== undefined) {
      updates[field] = String(body[field]).trim().slice(0, field === 'bio' ? 500 : 200);
    }
  });
  if (updates.avatar && !updates.avatar.startsWith('__svg__') && !/^https?:\/\//i.test(updates.avatar)) {
    updates.avatar = '';
  }
  return updates;
}

module.exports = {
  validateSignup,
  validateLogin,
  validateActivity,
  validatePostContent,
  sanitizeProfileUpdates,
  EMAIL_RE,
  MAX_POST_LENGTH,
};
