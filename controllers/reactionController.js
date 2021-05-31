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
    next();
  },

  (req, res, next) => {
    // Check if the reaction name is already taken
    Reaction.findOne({ name: `:${req.body.name}:` }).exec((err, reaction) => {
      if (err) return next(err);
      if (reaction) {
        fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
          if (err) throw err;
        });

        return res.json({
          errors: [
            {
              value: '',
              msg: 'Reaction name is already taken.',
              param: 'name',
              location: 'body',
            },
          ],
        });
      }
      next();
    });
  },

  (req, res, next) => {
    // Everything is fine. Save the reaction.
    const reaction = new Reaction({
      name: `:${req.body.name}:`,
      category: req.body.category,
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
      return res.redirect(303, reaction.url);
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
    next();
  },

  (req, res, next) => {
    // Check if the reaction name is already taken
    Reaction.findOne({ name: `:${req.body.name}:` }).exec((err, reaction) => {
      if (err) return next(err);
      if (reaction) {
        if (req.file) {
          fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
            if (err) throw err;
          });
        }

        return res.json({
          errors: [
            {
              value: '',
              msg: 'Reaction name is already taken.',
              param: 'name',
              location: 'body',
            },
          ],
        });
      }
      next();
    });
  },

  (req, res, next) => {
  // Everything is fine. Save the reaction.
    const data = {
      name: `:${req.body.name}:`,
      category: req.body.category,
    };

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

    Reaction.findByIdAndUpdate(req.params.reactionId, data, {}, (err, reaction) => {
      if (err) return next(err);
      res.redirect(303, reaction.url);
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
