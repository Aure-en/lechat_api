const express = require('express');
const authRouter = require('./auth');
const serverRouter = require('./server');
const categoryRouter = require('./category');
const channelRouter = require('./channel');
const messageRouter = require('./message');
const userRouter = require('./user');
const friendRouter = require('./friend');
const emoteRouter = require('./emote');
const conversationRouter = require('./conversation');
const activityRouter = require('./activity');
const fileRouter = require('./file');

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
router.use('/emotes', emoteRouter);
router.use('/conversations', conversationRouter);
router.use('/activity', activityRouter);
router.use('/files', fileRouter);

module.exports = router;
