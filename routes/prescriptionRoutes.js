const express = require("express");
const router = express.Router();

const uploadPrescription = require("../middleware/uploadPrescription");
const {
  verifyPrescription,
} = require("../controllers/prescriptionController");

router.post(
  "/verify-rx",
  uploadPrescription.single("prescription"),
  verifyPrescription
);

module.exports = router;
