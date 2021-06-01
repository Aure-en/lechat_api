const multer = require('multer');
const path = require('path');

// Set up destination
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../temp'));
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `item-${Date.now()}.${ext}`);
  },
});

// Check if the file is actually an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image.'), false);
  }
};

// Upload avatar (only 1 file, must be an image)
exports.image = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 10 ** 7 },
}).single('image');

// Upload emote icon (only 1 file, small image)
exports.icon = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 1000 },
}).single('image');

// Upload any file (max 5)
exports.files = multer({
  storage: multerStorage,
  limits: { fileSize: 50 ** 7 },
}).array('files', 5);
