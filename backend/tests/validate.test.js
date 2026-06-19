const {
  validateSignup,
  validateLogin,
  validateActivity,
  validatePostContent,
  sanitizeProfileUpdates,
  EMAIL_RE,
  MAX_POST_LENGTH,
} = require('../src/utils/validate');

describe('validateSignup', () => {
  it('handles missing body safely', () => {
    const result = validateSignup(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects short passwords', () => {
    const result = validateSignup({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
      district: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('rejects invalid email and short name', () => {
    const result = validateSignup({
      name: 'A',
      email: 'not-an-email',
      password: 'password123',
      district: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Name must be at least 2 characters',
        'Valid email is required',
      ])
    );
  });

  it('requires district, state, and country', () => {
    const result = validateSignup({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('District, state, and country are required');
  });

  it('accepts valid signup payload', () => {
    const result = validateSignup({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      district: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateLogin', () => {
  it('handles missing body safely', () => {
    const result = validateLogin(undefined);
    expect(result.valid).toBe(false);
  });

  it('requires email and password', () => {
    expect(validateLogin({}).valid).toBe(false);
    expect(validateLogin({ email: 'a@b.com', password: 'x' }).valid).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = validateLogin({ email: 'bad-email', password: 'secret123' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Valid email is required');
  });
});

describe('validateActivity', () => {
  it('handles missing body safely', () => {
    const result = validateActivity(null);
    expect(result.valid).toBe(false);
  });

  it('requires activityType and category', () => {
    const result = validateActivity({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('activityType and category are required');
  });

  it('rejects out-of-range quantity', () => {
    const result = validateActivity({
      activityType: 'walk',
      category: 'transport',
      quantity: 99999,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('quantity must be between 0 and 10000');
  });

  it('rejects invalid duration values', () => {
    const result = validateActivity({
      activityType: 'tv',
      category: 'home',
      duration: 2000,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('duration must be between 0 and 1440');
  });

  it('accepts valid activity payload', () => {
    const result = validateActivity({
      activityType: 'walk',
      category: 'transport',
      duration: 30,
      quantity: 2,
    });
    expect(result.valid).toBe(true);
  });
});

describe('validatePostContent', () => {
  it('requires content and scope', () => {
    const result = validatePostContent({});
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining(['Content is required', 'Scope is required'])
    );
  });

  it('rejects invalid scope values', () => {
    const result = validatePostContent({ content: 'Hello', scope: 'District' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid scope value');
  });

  it('rejects posts that exceed the max length', () => {
    const result = validatePostContent({
      content: 'x'.repeat(MAX_POST_LENGTH + 1),
      scope: 'State',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/2000 characters or fewer/);
  });

  it('handles null content safely', () => {
    const result = validatePostContent({ content: null, scope: 'State' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Content is required');
  });

  it('handles a null request body safely', () => {
    const result = validatePostContent(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Content is required');
  });

  it('accepts numeric content values', () => {
    const result = validatePostContent({ content: 12345, scope: 'State' });
    expect(result.valid).toBe(true);
    expect(result.content).toBe('12345');
  });

  it('accepts valid post payloads and trims content', () => {
    const result = validatePostContent({ content: '  Green tip  ', scope: 'Country' });
    expect(result.valid).toBe(true);
    expect(result.content).toBe('Green tip');
  });
});

describe('sanitizeProfileUpdates', () => {
  it('keeps allowed fields and trims values', () => {
    const updates = sanitizeProfileUpdates({
      name: '  Faizaan  ',
      avatar: '__svg__c1',
      bio: '  Eco warrior  ',
      district: ' Mumbai ',
      state: ' Maharashtra ',
      country: ' India ',
      email: 'should-not-appear@example.com',
    });

    expect(updates).toEqual({
      name: 'Faizaan',
      avatar: '__svg__c1',
      bio: 'Eco warrior',
      district: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    });
  });

  it('clears invalid avatar values that are not svg or http(s)', () => {
    const updates = sanitizeProfileUpdates({
      avatar: 'javascript:alert(1)',
    });
    expect(updates.avatar).toBe('');
  });

  it('truncates long bio text', () => {
    const updates = sanitizeProfileUpdates({
      bio: 'x'.repeat(600),
    });
    expect(updates.bio).toHaveLength(500);
  });
});

describe('EMAIL_RE', () => {
  it('matches common email formats', () => {
    expect(EMAIL_RE.test('user@example.com')).toBe(true);
    expect(EMAIL_RE.test('invalid')).toBe(false);
  });
});
