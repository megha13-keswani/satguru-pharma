const express = require('express');
const { execSync } = require('child_process');
const router = express.Router();

// Temporary route to trigger seeding on Render (protected by a secret key)
router.get('/run', (req, res) => {
  if (req.query.key !== process.env.SEED_SECRET) {
    return res.status(403).json({ error: 'Invalid key' });
  }
  try {
    const output = execSync('node prisma/seed.js', { encoding: 'utf-8' });
    res.json({ success: true, output });
  } catch (err) {
    res.status(500).json({ error: err.message, output: err.stdout?.toString() });
  }
});

module.exports = router;