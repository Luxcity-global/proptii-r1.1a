// In-memory storage for development
const storage = {
  identityData: new Map(),
  employmentData: new Map(),
  residentialData: new Map(),
  financialData: new Map(),
  guarantorData: new Map(),
  agentData: new Map()
};

// Save identity data
const saveIdentityData = async (userId, data) => {
  try {
    storage.identityData.set(userId, { ...data, updatedAt: new Date() });
    return { success: true, message: 'Identity data saved successfully' };
  } catch (err) {
    console.error('Error saving identity data:', err);
    throw err;
  }
};

// Save employment data
const saveEmploymentData = async (userId, data) => {
  try {
    storage.employmentData.set(userId, { ...data, updatedAt: new Date() });
    return { success: true, message: 'Employment data saved successfully' };
  } catch (err) {
    console.error('Error saving employment data:', err);
    throw err;
  }
};

// Save residential data
const saveResidentialData = async (userId, data) => {
  try {
    storage.residentialData.set(userId, { ...data, updatedAt: new Date() });
    return { success: true, message: 'Residential data saved successfully' };
  } catch (err) {
    console.error('Error saving residential data:', err);
    throw err;
  }
};

// Save financial data
const saveFinancialData = async (userId, data) => {
  try {
    storage.financialData.set(userId, { ...data, updatedAt: new Date() });
    return { success: true, message: 'Financial data saved successfully' };
  } catch (err) {
    console.error('Error saving financial data:', err);
    throw err;
  }
};

// Save guarantor data
const saveGuarantorData = async (userId, data) => {
  try {
    storage.guarantorData.set(userId, { ...data, updatedAt: new Date() });
    return { success: true, message: 'Guarantor data saved successfully' };
  } catch (err) {
    console.error('Error saving guarantor data:', err);
    throw err;
  }
};

// Save agent details data
const saveAgentDetailsData = async (userId, data) => {
  try {
    storage.agentData.set(userId, { ...data, updatedAt: new Date() });
    return { success: true, message: 'Agent details saved successfully' };
  } catch (err) {
    console.error('Error saving agent details:', err);
    throw err;
  }
};

// Get form data
const getFormData = async (userId) => {
  try {
    return {
      identity: storage.identityData.get(userId) || {},
      employment: storage.employmentData.get(userId) || {},
      residential: storage.residentialData.get(userId) || {},
      financial: storage.financialData.get(userId) || {},
      guarantor: storage.guarantorData.get(userId) || {},
      agent: storage.agentData.get(userId) || {}
    };
  } catch (err) {
    console.error('Error getting form data:', err);
    throw err;
  }
};

// Submit complete application
const submitApplication = async (userId, formData) => {
  try {
    // First save all data
    await saveIdentityData(userId, formData.identity);
    await saveEmploymentData(userId, formData.employment);
    await saveResidentialData(userId, formData.residential);
    await saveFinancialData(userId, formData.financial);
    await saveGuarantorData(userId, formData.guarantor);
    await saveAgentDetailsData(userId, formData.agent);
    
    // Then mark the application as submitted
    const pool = await connectToDatabase();
    
    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query(`
        IF EXISTS (SELECT 1 FROM ApplicationStatus WHERE userId = @userId)
        BEGIN
          UPDATE ApplicationStatus 
          SET 
            status = 'Submitted',
            updatedAt = GETDATE()
          WHERE userId = @userId
        END
        ELSE
        BEGIN
          INSERT INTO ApplicationStatus 
            (userId, status, submittedAt, updatedAt)
          VALUES
            (@userId, 'Submitted', GETDATE(), GETDATE())
        END
      `);
    
    return { success: true, message: 'Application submitted successfully' };
  } catch (err) {
    console.error('Error submitting application:', err);
    throw err;
  }
};

export const referencingService = {
  saveIdentityData,
  saveEmploymentData,
  saveResidentialData,
  saveFinancialData,
  saveGuarantorData,
  saveAgentDetailsData,
  getFormData,
  submitApplication
};