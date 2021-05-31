const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const Reaction = require('../models/reaction');

// List all reactions
exports.reaction_list = function (req, res, next) {
  Reaction.find().exec((err, reactions) => {
    if (err) return next(err);
    return res.json(reactions);
  });
};

// Detail of a specific reaction
exports.reaction_detail = function (req, res, next) {
  Reaction.findById(req.params.reactionId).exec((err, reaction) => {
    if (err) return next(err);
    if (!reaction) return res.json({ error: 'Reaction not found.' });
    return res.json(reaction);
  });
};

// Create a reaction
exports.reaction_create = [
  // Validation
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name must be specified.')
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!req.file) {
      errors.errors.push({
        value: '',
        param: 'image',
        location: 'body',
        msg: 'Image must be specified.',
      });
    }
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    // Everything is fine. Save the reaction.
    const reaction = new Reaction({
      name: req.body.name,
      type: req.body.type,
      image: {
        name: req.file.filename,
        data: fs.readFileSync(
          path.join(__dirname, `../temp/${req.file.filename}`),
        ),
        contentType: req.file.mimetype,
      },
    });

    // Delete the image from the disk after using it
    fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
      if (err) throw err;
    });

    reaction.save((err) => {
      if (err) return next(err);
      res.redirect(303, '/reactions');
    });
  },
];

// Update a reaction
exports.reaction_update = [
  // Validation
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name must be specified.')
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    // Everything is fine. Save the reaction.
    const data = new Reaction({
      name: req.body.name,
      type: req.body.type,
      _id: req.params.reactionId,
    });

    if (req.file) {
      data.image = {
        name: req.file.filename,
        data: fs.readFileSync(
          path.join(__dirname, `../temp/${req.file.filename}`),
        ),
        contentType: req.file.mimetype,
      };

      // Delete the image from the disk after using it
      fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
        if (err) throw err;
      });
    }

    const reaction = new Reaction(data);

    reaction.save((err) => {
      if (err) return next(err);
      res.redirect(303, '/reactions');
    });
  },
];

// Delete a reaction
exports.reaction_delete = function (req, res, next) {
  Reaction.findByIdAndRemove(req.params.reactionId, (err) => {
    if (err) return next(err);
    res.redirect(303, '/reactions');
  });
};
