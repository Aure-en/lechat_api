const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const Emote = require('../models/emote');

// List all emotes
exports.emote_list = function (req, res, next) {
  Emote.find().exec((err, emotes) => {
    if (err) return next(err);
    return res.json(emotes);
  });
};

// Detail of a specific emote
exports.emote_detail = function (req, res, next) {
  Emote.findById(req.params.emoteId).exec((err, emote) => {
    if (err) return next(err);
    if (!emote) return res.json({ error: 'Emote not found.' });
    return res.json(emote);
  });
};

// Create a emote
exports.emote_create = [
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
    // Check if the emote name is already taken
    Emote.findOne({ name: `:${req.body.name}:` }).exec((err, emote) => {
      if (err) return next(err);
      if (emote) {
        fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
          if (err) throw err;
        });

        return res.json({
          errors: [
            {
              value: '',
              msg: 'Emote name is already taken.',
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
    // Everything is fine. Save the emote.
    const emote = new Emote({
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

    emote.save((err) => {
      if (err) return next(err);
      return res.redirect(303, emote.url);
    });
  },
];

// Update a emote
exports.emote_update = [
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
    // Check if the emote name is already taken
    Emote.findOne({ name: `:${req.body.name}:` }).exec((err, emote) => {
      if (err) return next(err);
      if (emote) {
        if (req.file) {
          fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
            if (err) throw err;
          });
        }

        return res.json({
          errors: [
            {
              value: '',
              msg: 'Emote name is already taken.',
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
  // Everything is fine. Save the emote.
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

    Emote.findByIdAndUpdate(req.params.emoteId, data, {}, (err, emote) => {
      if (err) return next(err);
      res.redirect(303, emote.url);
    });
  },
];

// Delete a emote
exports.emote_delete = function (req, res, next) {
  Emote.findByIdAndRemove(req.params.emoteId, (err) => {
    if (err) return next(err);
    res.redirect(303, '/emotes');
  });
};
