const express = require('express');
const authRouter = require('./auth');
const serverRouter = require('./server');
const categoryRouter = require('./category');
const channelRouter = require('./channel');
const messageRouter = require('./message');
const userRouter = require('./user');
const friendRouter = require('./friend');
const reactionRouter = require('./reaction');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.send('Welcome to Lechat API.');
});

router.use('/auth', authRouter);
router.use('/servers', serverRouter);
router.use('/categories', categoryRouter);
router.use('/channels', channelRouter);
router.use('/messages', messageRouter);
router.use('/users', userRouter);
router.use('/friends', friendRouter);
router.use('/reactions', reactionRouter);

module.exports = router;
