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
      <style>
        body { font-family: Arial; max-width: 500px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        input { width: 100%; padding: 8px; margin-top: 5px; }
        button { padding: 10px 15px; background: #4CAF50; color: white; border: none; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>Login</h1>
      ${req.query.error ? `<p class="error">${req.query.error}</p>` : ''}
      <form method="POST" action="/auth/login">
        <div class="form-group">
          <label>Username</label>
          <input type="text" name="username" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" name="password" required>
        </div>
        <button type="submit">Login</button>
      </form>
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
