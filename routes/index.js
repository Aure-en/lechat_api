const express = require('express');
const authRouter = require('./auth');
const serverRouter = require('./server');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.send('Welcome to Lechat API.');
});

router.use('/auth', authRouter);
router.use('/servers', serverRouter);

module.exports = router;
