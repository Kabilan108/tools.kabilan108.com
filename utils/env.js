const parseVar = ({ env, parse, value }) => {
  return env ? parse() : value;
};

const COOKIE_AGE = parseVar({
  env: process.env.COOKIE_AGE,
  parse: (value) => Number.parseInt(value, 10),
  value: 24 * 60 * 60 * 1000,
});

const CLEANUP_INTERVAL = parseVar({
  env: process.env.CLEANUP_INTERVAL,
  parse: (value) => Number.parseInt(value, 10),
  value: 5 * 60 * 1000,
});

const DB_PATH = parseVar({
  env: process.env.DB_PATH,
  parse: (value) => value,
  value: '.users.db',
});

const NODE_ENV = parseVar({
  env: process.env.NODE_ENV,
  parse: (value) => value,
  value: 'development',
});

const PORT = parseVar({
  env: process.env.PORT,
  parse: (value) => Number.parseInt(value, 10),
  value: 3000,
});

const SESSION_LIFESPAN = parseVar({
  env: process.env.SESSION_LIFESPAN,
  parse: (value) => Number.parseInt(value, 10),
  value: 24 * 60 * 60 * 1000,
});

const SESSION_SECRET = parseVar({
  env: process.env.SESSION_SECRET,
  parse: (value) => value,
  value: 'defaultSecretKey',
});

export default {
  COOKIE_AGE,
  CLEANUP_INTERVAL,
  DB_PATH,
  NODE_ENV,
  PORT,
  SESSION_SECRET,
  SESSION_LIFESPAN,
};
