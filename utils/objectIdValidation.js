const mongoose = require('mongoose');

const isValidMongoObjectId = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(value);
};

const validateMedicineReference = (value) => {
  if (!isValidMongoObjectId(value)) {
    return {
      isValid: false,
      error: 'Invalid medicine id. Use the real MongoDB Medicine _id from the API response.'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

module.exports = {
  isValidMongoObjectId,
  validateMedicineReference
};
