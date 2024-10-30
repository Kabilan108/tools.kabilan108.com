import { format } from 'date-fns';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  info: '\x1b[36m', // Cyan
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow
  debug: '\x1b[35m', // Magenta
};

const log = (level, message, ...args) => {
  const timestamp = format(new Date(), 'yy.MM.dd - HH:mm:ss');
  const coloredLevel = `${colors[level]}${level.toUpperCase().padEnd(5)}${colors.reset}`;
  const coloredTimestamp = `${colors.dim}${timestamp}${colors.reset}`;
  console.log(`${coloredTimestamp} | ${coloredLevel} | ${message}`, ...args);
};

const logger = {
  info: (message, ...args) => log('info', message, ...args),
  error: (message, ...args) => log('error', message, ...args),
  warn: (message, ...args) => log('warn', message, ...args),
  debug: (message, ...args) => log('debug', message, ...args),
};

export default logger;
