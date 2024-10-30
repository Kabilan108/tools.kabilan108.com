import express from 'express';
import path from "node:path";

import logger from "../../utils/logger";

const router = express.Router();

router.get('/', (req, res) => {
  logger.debug(`"${req.session.username}" is using /nfc`)
  res.sendFile(path.join(__dirname, 'index.html'));
});

export default router;
