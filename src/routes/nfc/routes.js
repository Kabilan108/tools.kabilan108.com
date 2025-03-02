import express from 'express';
import path from "node:path";
import logger from "../../utils/logger";
import { requireApiKey, requireAuth } from "../../middleware/auth"

const router = express.Router();
const connections = new Map(); // store SSE connections by userId

router.get('/', requireAuth(true), (req, res) => {
  logger.debug(`"${req.session.username}" hit /nfc`)
  res.sendFile(path.join(__dirname, 'index.html'));
});

// sse endpoint for real-time updates
router.get('/updates', requireAuth(true), (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).send('Unauthorized')
  }

  // sse headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  // store connection
  if (connections.has(userId)) {
    logger.warn(`Closing existing SSE connection for user "${req.session.username}"`)
    const existing = connections.get(userId);
    existing.end();
  }

  logger.debug(`Opening SSE connection for user "${req.session.username}" (${userId})`)
  connections.set(userId, res);
  res.write(`data: ${JSON.stringify({data: null, format: null})}\n\n`)

  // remove connection on disconnect
  req.on('close', () => {
    logger.debug(`user "${req.session.username}" (${userId}) closed SSE connection`)
    connections.delete(userId);
  })
})

// endpoint to check connections
router.get("/connections", requireApiKey, (req, res) => {
  const apiKey = req.headers['x-api-key']
  const search = req.query.search || '';
  logger.debug(`API key "${apiKey}" checking connections (count: ${connections.size}) with search: ${search}`)

  // Convert Map to array of connected user IDs
  const connectedUsers = Array.from(connections.keys());
  logger.info(`Connected users: ${JSON.stringify(connectedUsers)}`)

  // XSS vulnerability: directly inserting user input into HTML response
  return res.status(200).send(`
    <h1>Connection Search Results for: ${search}</h1>
    <p>Total connections: ${connections.size}</p>
    <pre>${JSON.stringify(connectedUsers, null, 2)}</pre>
    <a href="/nfc">Back to NFC Tool</a>
  `);
})

// endpoint to send NFC data
router.post('/write-data', requireApiKey, (req, res) => {
  const apiKey = req.headers['x-api-key']
  const {userId, data, format, key} = req.body;

  if (!userId || !data) {
    return res.status(400).json({ error: 'missing userId or data' })
  }

  // validate format
  if (format && !['json', 'text'].includes(format)) {
    return res.status(400).json({error: 'format must be either "json" or "text"'})
  }

  // validate JSON data
  if (format === 'json' || (!format && data.trim().startsWith('{'))) {
    try {
      JSON.parse(data);
    } catch (err) {
      return res.status(400).json({error: 'invalid JSON data'})
    }
  }

  const connection = connections.get(parseInt(userId))
  if (!connection) {
    return res.status(404).json({error: 'user not connected'})
  }

  // send data to connected client
  logger.debug(`API key "${apiKey}" writing data to user ${userId}'s session`)
  connection.write(`data: ${JSON.stringify({data, format, key})}\n\n`)

  res.json({message: 'data sent successfully'})
})

export default router;
