const express = require('express');
const reactionController = require('../controllers/reactionController');
const upload = require('../middleware/upload');

const router = express.Router();

// GET to list all reactions
router.get('/', reactionController.reaction_list);

// POST to create a reaction
router.post('/', upload.icon, reactionController.reaction_create);

// GET a specific reaction
router.get('/:reactionId', reactionController.reaction_detail);

// PUT to update a reaction
router.put('/:reactionId', upload.icon, reactionController.reaction_update);

// DELETE to delete a reaction
router.delete('/:reactionId', reactionController.reaction_delete);

module.exports = router;
