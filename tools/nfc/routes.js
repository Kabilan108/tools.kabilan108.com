const express = require('express');
const router = express.Router();
const path = require('node:path');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = router;
