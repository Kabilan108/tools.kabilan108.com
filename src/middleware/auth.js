import { db } from '../db/setup';

export const requireAuth = (isProtected = true) => {
  return (req, res, next) => {
    // If route is not protected, allow access
    if (!isProtected) {
      return next();
    }

    // Check if user is authenticated
    if (req.session?.userId) {
      return next();
    }

    // Handle unauthorized access
    if (req.path.startsWith('/api/')) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      res.redirect('/auth/login');
    }
  };
};

export const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  const user = db
    .query('SELECT id FROM users WHERE api_key = ? AND is_admin = 1')
    .get(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};
