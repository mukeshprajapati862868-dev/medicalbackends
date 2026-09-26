const { validateMedicineReference } = require('../utils/objectIdValidation');

describe('medicine object id validation', () => {
  it('rejects non-Mongo medicine ids such as 12', () => {
    const result = validateMedicineReference('12');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/valid MongoDB ObjectId/i);
  });

  it('accepts a valid Mongo ObjectId string', () => {
    const validId = '507f1f77bcf86cd799439011';
    const result = validateMedicineReference(validId);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });
});
