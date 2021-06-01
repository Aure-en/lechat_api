const { body, validationResult } = require('express-validator');
const async = require('async');
const Category = require('../models/category');
const Channel = require('../models/channel');

// List all categories of a server (GET)
exports.category_list = function (req, res, next) {
  Category.find({ server: req.params.serverId }).exec((err, categories) => {
    if (err) return next(err);
    return res.json(categories);
  });
};

// Detail of a specific category (GET)
exports.category_detail = function (req, res, next) {
  Category.findOne({ _id: req.params.categoryId }).exec((err, category) => {
    if (err) return next(err);
    if (!category) {
      return res.json({ error: 'Category not found.' });
    }
    return res.json(category);
  });
};

// Create a category (POST)
exports.category_create = [
  // Validation
  body('name', 'Name must be specified.').trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    // There are no errors. Save the category.
    const category = new Category({
      name: req.body.name,
      server: req.params.serverId,
      timestamp: Date.now(),
    });

    category.save((err) => {
      if (err) return next(err);
      return res.redirect(303, category.url);
    });
  },
];

// Update a category (PUT)
exports.category_update = [
  // Validation
  body('name', 'Name must be specified.').trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    // check for errors
    const errors = validationResult(req);
    // There are errors. Send them.
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    Category.findByIdAndUpdate(
      req.params.categoryId,
      { name: req.body.name },
      {},
      (err, category) => {
        if (err) return next(err);
        // Use 303 status to redirect to GET.
        // Otherwise, it infinitely makes PUT requests.
        res.redirect(303, category.url);
      },
    );
  },
];

// Delete a category (DELETE)
exports.category_delete = function (req, res, next) {
  async.parallel({
    category(callback) {
      Category.findById(req.params.categoryId).exec(callback);
    },

    channels(callback) {
      Channel.find({ category: req.params.categoryId }).exec(callback);
    },
  }, (err, results) => {
    if (err) return next(err);

    // If the category still has channels, it cannot be deleted
    if (results.channels.length > 0) {
      return res.json({ error: 'Categories containing channels cannot be deleted.' });
    }
    // If it has no channels, delete it.
    Category.findByIdAndRemove(req.params.categoryId, (err, category) => {
      if (err) return next(err);
      res.redirect(303, `/servers/${category._id}/categories`);
    });
  });
};
