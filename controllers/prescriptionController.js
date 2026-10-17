const Tesseract = require("tesseract.js");

const RESTRICTED_MEDICINES = [
  "alprazolam",
  "diazepam",
  "clonazepam",
];

function extractPrescriptionDate(text) {
  const patterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{2}[/-]\d{2}[/-]\d{4})\b/,
    /\b(\d{2}[/-]\d{2}[/-]\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) continue;

    const value = match[1];
    let year;
    let month;
    let day;

    if (/^\d{4}-/.test(value)) {
      [year, month, day] = value.split("-").map(Number);
    } else {
      const parts = value.split(/[/-]/).map(Number);
      [day, month, year] = parts;

      if (year < 100) {
        year += year >= 50 ? 1900 : 2000;
      }
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    // Reject impossible dates instead of silently normalizing them.
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      continue;
    }

    return date;
  }

  return null;
}

function hasRegistrationNumber(text) {
  // Heuristic only; this does not prove that a doctor is registered.
  const patterns = [
    /\b(?:registration|reg\.?)\s*(?:no\.?|number|#)\s*[:\-]?\s*[A-Z0-9/-]{4,}\b/i,
    /\b(?:medical council)\s*(?:registration)?\s*(?:no\.?|number|#)?\s*[:\-]?\s*[A-Z0-9/-]{4,}\b/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

function getRestrictedMedicines(text) {
  const normalizedText = text.toLowerCase();

  return RESTRICTED_MEDICINES.filter((medicine) =>
    normalizedText.includes(medicine)
  );
}

function checkPrescription(text) {
  const reasons = [];
  const prescriptionDate = extractPrescriptionDate(text);

  if (!prescriptionDate) {
    reasons.push("Prescription date could not be reliably identified.");
  } else {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 6);

    if (prescriptionDate < cutoff) {
      reasons.push("Prescription date is older than six months.");
    }

    if (prescriptionDate > now) {
      reasons.push("Prescription date is in the future.");
    }
  }

  if (!hasRegistrationNumber(text)) {
    reasons.push("Doctor registration number could not be verified.");
  }

  const restrictedMedicines = getRestrictedMedicines(text);

  if (restrictedMedicines.length > 0) {
    reasons.push(
      "Restricted medicine detected; pharmacist and applicable legal checks are required."
    );
  }

  return {
    prescriptionDate: prescriptionDate
      ? prescriptionDate.toISOString().slice(0, 10)
      : null,
    doctorRegistrationFormatFound: hasRegistrationNumber(text),
    restrictedMedicines,
    reasons,
  };
}

exports.verifyPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "BLOCKED_SUSPICIOUS",
        reason: "Prescription image is required.",
        checkoutAllowed: false,
      });
    }

    // OCR runs on the uploaded image buffer; image is not saved to disk.
    const result = await Tesseract.recognize(req.file.buffer, "eng");
    const extractedText = (result.data.text || "").trim();

    if (!extractedText || extractedText.length < 10) {
      return res.status(200).json({
        status: "BLOCKED_SUSPICIOUS",
        reason: "Prescription text could not be read reliably. Manual review is required.",
        checkoutAllowed: false,
        extractedText: "",
      });
    }

    const validation = checkPrescription(extractedText);

    if (validation.reasons.length > 0) {
      return res.status(200).json({
        status: "BLOCKED_SUSPICIOUS",
        reason: validation.reasons.join(" "),
        reasons: validation.reasons,
        prescriptionDate: validation.prescriptionDate,
        doctorRegistrationFormatFound:
          validation.doctorRegistrationFormatFound,
        restrictedMedicines: validation.restrictedMedicines,
        checkoutAllowed: false,
      });
    }

    // Passing OCR checks does NOT authenticate the prescription or doctor.
    // Pharmacist review is required before dispensing/checkout.
    return res.status(200).json({
      status: "REVIEW_REQUIRED",
      reason: "Automated checks passed. Pharmacist verification is required.",
      prescriptionDate: validation.prescriptionDate,
      doctorRegistrationFormatFound:
        validation.doctorRegistrationFormatFound,
      restrictedMedicines: validation.restrictedMedicines,
      extractedText,
      checkoutAllowed: false,
    });
  } catch (error) {
    console.error("Prescription OCR failed:", error.message);

    return res.status(500).json({
      status: "BLOCKED_SUSPICIOUS",
      reason: "Prescription verification failed. Retry or request manual review.",
      checkoutAllowed: false,
    });
  }
};
