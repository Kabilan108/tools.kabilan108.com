import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import { db } from '../db/setup';
import logger from '../utils/logger';

const router = express.Router();

// create a user
router.post('/', async (req, res) => {
  const { username, password, is_admin } = req.body;

  if (!username || !password || password.length < 8) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userIsAdmin = is_admin === 1 ? 1 : 0;
    let apiKey = null;

    if (userIsAdmin) {
      apiKey = crypto.randomBytes(32).toString('hex');
      logger.debug(`api key issued for new user "${username}"`);
    }

    db.query(
      'INSERT INTO users (username, password, is_admin, api_key) VALUES (?, ?, ?, ?)',
    ).run(username, hashedPassword, userIsAdmin, apiKey);

    const response = {
      message: 'User created successfully',
    };

    if (userIsAdmin) {
      response.apiKey = apiKey;
    }

    logger.debug(`new user "${username}" created`);
    res.status(201).json(response);
  } catch (error) {
    logger.error(`failed to create user: ${error}`);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Get users
router.get('/', (req, res) => {
  logger.debug('fetching users');
  const users = db.query('SELECT id, username, is_admin, created_at FROM users').all();
  res.json(users);
});

// Delete user
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const user = db.query('SELECT * FROM users WHERE id = ?').get(id);
  if (user) {
    logger.debug(`deleting user ${id} aka "${user.username}"`);
    db.query('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: 'User deleted successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

export default router;
