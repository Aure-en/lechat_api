const express = require('express');
const reactionController = require('../controllers/reactionController');

const router = express.Router();

// GET to list all reactions
router.get('/', reactionController.reaction_list);

// POST to create a reaction
router.post('/', reactionController.reaction_create);

// PUT to update a reaction
router.put('/:reactionId', reactionController.reaction_update);

// DELETE to delete a reaction
router.delete('/:reactionId', reactionController.reaction_delete);

module.exports = router;
