const { isValidObjectId } = require('mongoose');
const fs = require('fs');
const path = require('path');
const File = require('../models/file');

// Download a saved file.
exports.file_download = (req, res, next) => {
  if (!isValidObjectId(req.params.fileId)) return res.json({ error: 'File not found.' });
  File.findOne({ _id: req.params.fileId }).exec((err, file) => {
    if (err) return next(err);
    if (!file) return res.status(404).json({ error: 'File not found.' });

    const filePath = path.join(__dirname, `../temp/${file.name}`);

    // Create file from binary data received from MongoDB
    fs.writeFile(
      filePath,
      file.data,
      (error) => {
        if (error) next(error);

        // Send the file
        res.download(
          filePath,
          `${file.name}`,
          // Erase the file after sending it.
          () => fs.unlinkSync(filePath),
        );
      },
    );
  });
};

// Send a full-size image.
exports.file_data = (req, res, next) => {
  if (!isValidObjectId(req.params.fileId)) return res.json({ error: 'File not found.' });
  File.findOne({ _id: req.params.fileId }, 'name data contentType size').exec((err, file) => {
    if (err) return next(err);
    if (!file) return res.status(404).json({ error: 'File not found.' });
    return res.json(file);
  });
};

// Send a file preview
exports.file_preview = (req, res, next) => {
  if (!isValidObjectId(req.params.fileId)) return res.json({ error: 'File not found.' });
  File.findOne({ _id: req.params.fileId }, 'name thumbnail contentType size').exec((err, file) => {
    if (err) return next(err);
    if (!file) return res.status(404).json({ error: 'File not found.' });
    return res.json(file);
  });
};
