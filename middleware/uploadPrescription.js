const multer = require("multer");

const uploadPrescription = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPEG and PNG prescription images are supported.")
      );
    }

    callback(null, true);
  },
});

module.exports = uploadPrescription;
