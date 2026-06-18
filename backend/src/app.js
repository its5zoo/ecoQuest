const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const session  = require('express-session');
const passport = require('./config/passport');
const { getSessionSecret } = require('./config/secrets');

// ─── Register all Mongoose models to prevent MissingSchemaError ──────────────
require('./models/User');
require('./models/OAuthCode');
require('./models/Badge');
require('./models/Quest');
require('./models/Activity');
require('./models/ScoreHistory');
require('./models/Post');
require('./models/EnvChat');

const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes        = require('./routes/authRoutes');
const trackerRoutes     = require('./routes/trackerRoutes');
const aiRoutes          = require('./routes/aiRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const communityRoutes   = require('./routes/communityRoutes');
const envChatRoutes     = require('./routes/envChatRoutes');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: false }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(session({
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 10 * 60 * 1000,
  },
}));

app.use(passport.initialize());

app.use('/api/auth',        authRoutes);
app.use('/api/tracker',     trackerRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/community',   communityRoutes);
app.use('/api/env-chat',    envChatRoutes);

app.get('/health', (req, res) => res.status(200).json({
  status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}));

app.use(errorHandler);

module.exports = app;
