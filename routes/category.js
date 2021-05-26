const express = require('express');
const checkAuth = require('../auth/checkAuth');

const router = express.Router({ mergeParams: true }); // mergeParams is necessary to get serverId.
const categoryController = require('../controllers/categoryController');

// PUT to update a category
router.put(
  '/:categoryId',
  checkAuth.check_user,
  checkAuth.check_admin,
  categoryController.category_update,
);

// DELETE a category
router.delete(
  '/:categoryId',
  checkAuth.check_user,
  checkAuth.check_admin,
  categoryController.category_delete,
);

// GET a specific category
router.get(
  '/:categoryId', categoryController.category_detail,
);

module.exports = router;
