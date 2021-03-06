const express = require('express');
const fileController = require('../controllers/fileController');

const router = express.Router();

router.get('/:fileId/', fileController.file_data);
router.get('/:fileId/download', fileController.file_download);
router.get('/:fileId/preview', fileController.file_preview);

module.exports = router;
