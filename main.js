import express from 'express';
import session from 'express-session';

import SQLiteStore from './src/db/session-store';
import { db } from './src/db/setup';
import { requireApiKey, requireAuth } from './src/middleware/auth';
import env from './src/utils/env';
import logger from './src/utils/logger';

import authRoutes from './src/routes/auth';
import userRoutes from './src/routes/api/users';
import nfcRoutes from './src/routes/nfc/routes';

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
//app.use('/nfc', requireAuth(true), nfcRoutes);
app.use('/nfc', nfcRoutes);
app.use('/auth', authRoutes);
app.use('/api/users', requireApiKey, userRoutes);

// root
app.get('/', requireAuth(false), (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tools Collection</title>
      <!-- Tailwind CSS CDN -->
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
      <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-md p-8 my-8">
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Tools Collection</h1>

          ${req.session.userId
      ? `
            <div class="mb-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
              <p class="text-blue-800">Welcome, <span class="font-medium">${req.session.username}</span>!</p>
              <a href="/auth/logout" class="text-blue-600 hover:text-blue-800 underline">Logout</a>
            </div>
          `
      : `
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
              <p>Please <a href="/auth/login" class="text-blue-600 hover:text-blue-800 underline">Login</a> to access all tools</p>
            </div>
          `
    }

          <h2 class="text-xl font-semibold mb-4 text-gray-700">Available Tools</h2>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
              <a href="/nfc" class="block p-4 hover:bg-gray-50">
                <h3 class="text-lg font-medium text-gray-800 mb-2">NFC Tool</h3>
                <p class="text-gray-600">Read and write data to NFC tags with optional encryption</p>
              </a>
            </li>
            <li class="border border-gray-200 rounded-lg overflow-hidden text-gray-400">
              <div class="p-4">
                <h3 class="text-lg font-medium mb-2">Coming Soon...</h3>
                <p>More tools will be added in the future</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

// 404 handler - must be last route
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Page Not Found</title>
      <!-- Tailwind CSS CDN -->
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
      <div class="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
        <h1 class="text-3xl font-bold text-red-600 mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Page Not Found</h2>
        <p class="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200">
          Return to Home
        </a>
      </div>
    </body>
    </html>
  `);
});

app.listen(env.PORT, () => {
  logger.info(`server running at http://localhost:${env.PORT}`);
});
