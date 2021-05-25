const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.json({ name: 'frodo' });
});

module.exports = router;
