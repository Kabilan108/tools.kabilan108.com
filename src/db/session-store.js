import { Store } from 'express-session';

export default class SQLiteStore extends Store {
  constructor(db, opts) {
    super(opts);
    this.db = db;
    this.cleanupInterval = opts.cleanupInterval;
    this.sessionLifespan = opts.sessionLifespan;
    this.cleanup();
  }

  /**
   * Get session data by ID
   */
  get(sid, callback) {
    try {
      const now = new Date();
      const row = this.db
        .query('SELECT data, expires FROM sessions WHERE sid = ? and expires > ?')
        .get(sid, now.toISOString());

      if (!row) {
        return callback(null, null);
      }

      let sessionData;
      try {
        sessionData = JSON.parse(row.data);
      } catch (err) {
        return callback(err);
      }

      callback(null, sessionData);
    } catch (err) {
      callback(err);
    }
  }

  /*
   * Set session data
   */
  set(sid, session, callback) {
    try {
      const expires = new Date(
        session.cookie.expires || Date.now() + this.sessionLifespan,
      );
      const data = JSON.stringify(session);

      // use replace to handle both insert and update
      this.db
        .query(`
        REPLACE INTO sessions (sid, expires, data)
        VALUES (?, ?, ?)
      `)
        .run(sid, expires.toISOString(), data);

      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  /*
   * Destroy session by ID
   */
  destroy(sid, callback = () => {}) {
    // Add default empty callback
    try {
      this.db.query('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  /*
   * Update session expiry
   */
  touch(sid, session, callback) {
    try {
      const expires = new Date(
        session.cookie.expires || Date.now() + this.sessionLifespan,
      );
      this.db
        .query(`
        UPDATE sessions
        SET expires = ?
        WHERE sid = ?
      `)
        .run(expires.toISOString(), sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * Clear all sessions
   */
  clear(callback) {
    try {
      this.db.query('DELETE FROM sessions').run();
      callback(null);
    } catch {
      callback(err);
    }
  }

  /**
   * Get session count
   */
  length(callback) {
    try {
      const count = this.db.query('SELECT COUNT(*) as count FROM sessions').get();
      callback(null, count.count);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * Get all sessions
   */
  all(callback) {
    try {
      const rows = this.db.query('SELECT * FROM sessions').all();
      const sessions = {};

      for (const row of rows) {
        try {
          sessions[row.sid] = JSON.parse(row.data);
        } catch (err) {
          console.error(`Error parsing session data for ${row.sid}:`, err);
        }
      }

      callback(null, sessions);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanup() {
    try {
      const now = new Date();
      this.db.query('DELETE FROM sessions WHERE expires <= ?').run(now.toISOString());
    } catch (err) {
      console.error('Session cleanup error:', err);
    }

    // Schedule next cleanup
    setTimeout(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Stop the cleanup interval
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
