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

  // remove connection on disconnect
  req.on('close', () => {
    connections.delete(userId);
  })
})

// endpoint to check connections
router.get("/connections", requireApiKey, (req, res) => {
  const apiKey = req.headers['x-api-key']
  logger.debug(`API key "${apiKey}" checking connections (count: ${connections.size})`)
  logger.info(`connections: ${JSON.stringify(connections)}`)
  return res.status(200).json({ data: JSON.stringify(connections) });
})

// endpoint to send NFC data
router.post('/write-data', requireApiKey, (req, res) => {
  const {userId, data, format} = req.body;

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
  connection.write(`data: ${JSON.stringify({data, format})}\n\n`)

  res.json({message: 'data sent successfully'})
})

export default router;
