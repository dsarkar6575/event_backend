  const multer = require('multer');

  // Store file in memory (or temp directory)
  const storage = multer.memoryStorage(); // or diskStorage if needed

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // limit file size to 5MB
  });

  module.exports = upload;