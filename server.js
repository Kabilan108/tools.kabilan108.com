import express from 'express';
import session from 'express-session';

import SQLiteStore from './db/session-store';
import { db } from './db/setup';
import { requireApiKey, requireAuth } from './middleware/auth';
import env from './utils/env';
import logger from './utils/logger';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import nfcRoutes from './tools/nfc/routes';

const app = express();

// middleware
// TODO: add csrf middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// configure session
app.use(
  session({
    store: new SQLiteStore(db, {
      cleanupInterval: env.CLEANUP_INTERVAL,
      sessionLifespan: env.SESSION_LIFESPAN,
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: env.COOKIE_AGE,
    },
  }),
);

// define routes
app.use('/nfc', requireAuth(true), nfcRoutes);
app.use('/auth', authRoutes);
app.use('/api/users', requireApiKey, userRoutes);

// root
app.get('/', requireAuth(false), (req, res) => {
  res.send(`
    <h1>Tools Collection</h1>
    ${
      req.session.userId
        ? `
      <p>Welcome ${req.session.username}! <a href="/auth/logout">Logout</a></p>
    `
        : `
      <p><a href="/auth/login">Login</a></p>
    `
    }
    <ul>
      <li><a href="/nfc">NFC Tool</a></li>
      <li>...</li>
    </ul>
  `);
});

app.listen(env.PORT, () => {
  logger.info(`server running at http://localhost:${env.PORT}`);
});
