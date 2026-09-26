const { AuditLog } = require('../models');

const createAuditLog = async (data) => {
  try {
    const auditLog = await AuditLog.create(data);
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error - audit logs should not break the main flow
  }
};

module.exports = { createAuditLog };
