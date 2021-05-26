const passport = require('passport');
const Server = require('../models/server');
const Category = require('../models/category');
const Channel = require('../models/channel');

// Check that the user is logged in
exports.check_user = function (req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Only registered users may perform this action.' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Check that the user is the administrator (only them can delete the server).
exports.check_admin = function (req, res, next) {
  switch (req.baseUrl) {
    case '/servers':
      Server.findById(req.params.serverId).exec((err, server) => {
        if (err) return next(err);
        if (!server) return res.json({ error: 'Server not found.' });
        if (req.user._id !== server.admin.toString()) {
          return res
            .status(403)
            .json({ error: 'Only the administrator can perform this action.' });
        }
        next();
      });
      break;

    case '/categories':
      Category.findById(req.params.categoryId).populate('server').exec((err, category) => {
        if (err) return next(err);
        if (!category) return res.json({ error: 'Category not found.' });
        if (req.user._id !== category.server.admin.toString()) {
          return res
            .status(403)
            .json({ error: 'Only the administrator can perform this action.' });
        }
        next();
      });
      break;

    case '/channels':
      Channel.findById(req.params.channelId).populate('server').exec((err, category) => {
        if (err) return next(err);
        if (!category) return res.json({ error: 'Category not found.' });
        if (req.user._id !== category.server.admin.toString()) {
          return res
            .status(403)
            .json({ error: 'Only the administrator can perform this action.' });
        }
        next();
      });
      break;

    default:
      next();
  }
};
