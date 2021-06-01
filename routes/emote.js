const express = require('express');
const emoteController = require('../controllers/emoteController');
const upload = require('../middleware/upload');

const router = express.Router();

// GET to list all emotes
router.get('/', emoteController.emote_list);

// POST to create a emote
router.post('/', upload.icon, emoteController.emote_create);

// GET a specific emote
router.get('/:emoteId', emoteController.emote_detail);

// PUT to update a emote
router.put('/:emoteId', upload.icon, emoteController.emote_update);

// DELETE to delete a emote
router.delete('/:emoteId', emoteController.emote_delete);

module.exports = router;
