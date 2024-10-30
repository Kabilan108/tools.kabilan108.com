const express = require('express');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 3000;

// serve static files from the tools dir
app.use(express.static(path.join(__dirname, 'tools')));

// import routes
const nfcRoutes = require('./tools/nfc/routes');

// define routes
app.use('/nfc', nfcRoutes);

// root
app.get('/', (req, res) => {
  res.send(`
    <h1>Tools Collection</h1>
    <ul>
      <li><a href="/nfc">NFC Tool</a></li>
      <li>...</li>
    </ul>
  `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
