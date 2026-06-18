/**
 * Validates required secrets at startup. Fails fast in production.
 */
function requireSecret(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`${name} is required in production`);
    }
    return null;
  }
  return value;
}

function getJwtSecret() {
  const secret = requireSecret('JWT_SECRET');
  if (!secret && process.env.NODE_ENV !== 'production') {
    return 'dev-only-jwt-secret-change-me';
  }
  return secret;
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || getJwtSecret();
}

module.exports = { requireSecret, getJwtSecret, getSessionSecret };
