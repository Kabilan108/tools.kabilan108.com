import bcrypt from 'bcryptjs';
import env from '../utils/env';
import { db } from '../db/setup'
import logger from '../utils/logger';

async function initializeDatabase() {
  // Check if the initial user already exists
  const existingUser = db.query('SELECT * FROM users WHERE username = ?')
    .get(env.SEED_USERNAME);

  if (!existingUser) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(env.SEED_PASSWORD, 10);

    // Insert the initial user
    db.query(`
      INSERT INTO users (username, password, is_admin, api_key)
      VALUES (?, ?, ?, ?)
    `).run(
      env.SEED_USERNAME,
      hashedPassword,
      1,
      env.SEED_API_KEY,
    );

    logger.info('Initial user created successfully.');
  } else {
    logger.info('Initial user already exists.');
  }
}

initializeDatabase().catch(logger.error);
