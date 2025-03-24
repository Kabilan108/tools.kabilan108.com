import bcrypt from 'bcryptjs';
import express from 'express';
import { db } from '../db/setup';
import logger from '../utils/logger';

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login</title>
      <!-- Tailwind CSS CDN -->
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100">
      <div class="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-6 text-center">Login</h1>
        ${req.query.error ? `<p class="mb-4 text-red-600 text-center">${req.query.error}</p>` : ''}
        <form method="POST" action="/auth/login">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2" for="username">Username</label>
            <input
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              name="username"
              id="username"
              required
            >
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-medium mb-2" for="password">Password</label>
            <input
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              name="password"
              id="password"
              required
            >
          </div>
          <button
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </form>
      </div>
    </body>
    </html>
  `);
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = db.query('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.redirect('/auth/login?error=Invalid+credentials');
  }

  logger.debug(`"${username} just logged in"`);
  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  const username = req.session.username;
  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error for "${usename}":', err);
    }
    res.redirect('/auth/login');
  });
  logger.debug(`"${username}" just logged out`);
});

export default router;
