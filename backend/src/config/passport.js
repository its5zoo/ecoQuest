const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// ─── Helper: check if a value is a real key (not placeholder / empty) ─────────
const isReal = (v) =>
  typeof v === 'string' &&
  v.length > 0 &&
  !v.startsWith('YOUR_') &&
  v !== 'undefined';

// Track which providers are configured
const configured = { google: false };

// ─── Serialize / Deserialize ──────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ─── Helper: find or create OAuth user ───────────────────────────────────────
async function findOrCreateOAuthUser({ provider, providerId, email, name, avatar }) {
  let user = await User.findOne({ [`${provider}Id`]: providerId });
  if (user) return user;

  if (email) {
    user = await User.findOne({ email });
    if (user) {
      user[`${provider}Id`] = providerId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
      return user;
    }
  }

  user = await User.create({
    name:              name || 'EcoWarrior',
    email:             email || `${provider}_${providerId}@noemail.eco`,
    password:          require('crypto').randomBytes(32).toString('hex'),
    district:          'Unknown',
    state:             'Unknown',
    country:           'India',
    avatar:            avatar || '',
    registeredFrom:    provider,
    [`${provider}Id`]: providerId,
  });

  return user;
}

// ─── Google Strategy ──────────────────────────────────────────────────────────
if (isReal(process.env.GOOGLE_CLIENT_ID) && isReal(process.env.GOOGLE_CLIENT_SECRET)) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider:   'google',
            providerId: profile.id,
            email:      profile.emails?.[0]?.value,
            name:       profile.displayName,
            avatar:     profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
  configured.google = true;
  console.log('✅ Google OAuth strategy registered');
} else {
  console.warn('⚠️  Google OAuth disabled — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
}

module.exports = passport;
module.exports.configured = configured;
