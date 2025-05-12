const sql = require('mssql');
const config = require('../config/db');

// Connect to database
const connectToDatabase = async () => {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
};

// Save identity data
const saveIdentityData = async (data) => {
  try {
    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('userId', sql.NVarChar, data.userId)
      .input('firstName', sql.NVarChar, data.firstName)
      .input('lastName', sql.NVarChar, data.lastName)
      .input('email', sql.NVarChar, data.email)
      .input('phoneNumber', sql.NVarChar, data.phoneNumber)
      .input('dateOfBirth', sql.NVarChar, data.dateOfBirth)
      .input('nationality', sql.NVarChar, data.nationality)
      .query(`
        IF EXISTS (SELECT 1 FROM IdentityData WHERE userId = @userId)
        BEGIN
          UPDATE IdentityData 
          SET 
            firstName = @firstName,
            lastName = @lastName,
            email = @email,
            phoneNumber = @phoneNumber,
            dateOfBirth = @dateOfBirth,
            nationality = @nationality,
            updatedAt = GETDATE()
          WHERE userId = @userId
        END
        ELSE
        BEGIN
          INSERT INTO IdentityData 
            (userId, firstName, lastName, email, phoneNumber, dateOfBirth, nationality, createdAt, updatedAt)
          VALUES
            (@userId, @firstName, @lastName, @email, @phoneNumber, @dateOfBirth, @nationality, GETDATE(), GETDATE())
        END
      `);
      
    return { success: true, message: 'Identity data saved successfully' };
  } catch (err) {
    console.error('Error saving identity data:', err);
    throw err;
  }
};

// Save employment data
const saveEmploymentData = async (data) => {
  try {
    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('userId', sql.NVarChar, data.userId)
      .input('employmentStatus', sql.NVarChar, data.employmentStatus)
      .input('companyDetails', sql.NVarChar, data.companyDetails)
      .input('lengthOfEmployment', sql.NVarChar, data.lengthOfEmployment)
      .input('jobPosition', sql.NVarChar, data.jobPosition)
      .input('referenceFullName', sql.NVarChar, data.referenceFullName)
      .input('referenceEmail', sql.NVarChar, data.referenceEmail)
      .input('referencePhone', sql.NVarChar, data.referencePhone)
      .input('proofType', sql.NVarChar, data.proofType)
      .query(`
        IF EXISTS (SELECT 1 FROM EmploymentData WHERE userId = @userId)
        BEGIN
          UPDATE EmploymentData 
          SET 
            employmentStatus = @employmentStatus,
            companyDetails = @companyDetails,
            lengthOfEmployment = @lengthOfEmployment,
            jobPosition = @jobPosition,
            referenceFullName = @referenceFullName,
            referenceEmail = @referenceEmail,
            referencePhone = @referencePhone,
            proofType = @proofType,
            updatedAt = GETDATE()
          WHERE userId = @userId
        END
        ELSE
        BEGIN
          INSERT INTO EmploymentData 
            (userId, employmentStatus, companyDetails, lengthOfEmployment, jobPosition, 
             referenceFullName, referenceEmail, referencePhone, proofType, createdAt, updatedAt)
          VALUES
            (@userId, @employmentStatus, @companyDetails, @lengthOfEmployment, @jobPosition,
             @referenceFullName, @referenceEmail, @referencePhone, @proofType, GETDATE(), GETDATE())
        END
      `);
      
    return { success: true, message: 'Employment data saved successfully' };
  } catch (err) {
    console.error('Error saving employment data:', err);
    throw err;
  }
};

// Save residential data
const saveResidentialData = async (data) => {
  try {
    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('userId', sql.NVarChar, data.userId)
      .input('currentAddress', sql.NVarChar, data.currentAddress)
      .input('durationAtCurrentAddress', sql.NVarChar, data.durationAtCurrentAddress)
      .input('previousAddress', sql.NVarChar, data.previousAddress)
      .input('durationAtPreviousAddress', sql.NVarChar, data.durationAtPreviousAddress)
      .input('reasonForLeaving', sql.NVarChar, data.reasonForLeaving)
      .input('proofType', sql.NVarChar, data.proofType)
      .query(`
        IF EXISTS (SELECT 1 FROM ResidentialData WHERE userId = @userId)
        BEGIN
          UPDATE ResidentialData 
          SET 
            currentAddress = @currentAddress,
            durationAtCurrentAddress = @durationAtCurrentAddress,
            previousAddress = @previousAddress,
            durationAtPreviousAddress = @durationAtPreviousAddress,
            reasonForLeaving = @reasonForLeaving,
            proofType = @proofType,
            updatedAt = GETDATE()
          WHERE userId = @userId
        END
        ELSE
        BEGIN
          INSERT INTO ResidentialData 
            (userId, currentAddress, durationAtCurrentAddress, previousAddress, 
             durationAtPreviousAddress, reasonForLeaving, proofType, createdAt, updatedAt)
          VALUES
            (@userId, @currentAddress, @durationAtCurrentAddress, @previousAddress,
             @durationAtPreviousAddress, @reasonForLeaving, @proofType, GETDATE(), GETDATE())
        END
      `);
      
    return { success: true, message: 'Residential data saved successfully' };
  } catch (err) {
    console.error('Error saving residential data:', err);
    throw err;
  }
};

// Save financial data
const saveFinancialData = async (data) => {
  try {
    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('userId', sql.NVarChar, data.userId)
      .input('monthlyIncome', sql.NVarChar, data.monthlyIncome)
      .input('proofOfIncomeType', sql.NVarChar, data.proofOfIncomeType)
      .input('useOpenBanking', sql.Bit, data.useOpenBanking)
      .input('isConnectedToOpenBanking', sql.Bit, data.isConnectedToOpenBanking)
      .query(`
        IF EXISTS (SELECT 1 FROM FinancialData WHERE userId = @userId)
        BEGIN
          UPDATE FinancialData 
          SET 
            monthlyIncome = @monthlyIncome,
            proofOfIncomeType = @proofOfIncomeType,
            useOpenBanking = @useOpenBanking,
            isConnectedToOpenBanking = @isConnectedToOpenBanking,
            updatedAt = GETDATE()
          WHERE userId = @userId
        END
        ELSE
        BEGIN
          INSERT INTO FinancialData 
            (userId, monthlyIncome, proofOfIncomeType, useOpenBanking, isConnectedToOpenBanking, createdAt, updatedAt)
          VALUES
            (@userId, @monthlyIncome, @proofOfIncomeType, @useOpenBanking, @isConnectedToOpenBanking, GETDATE(), GETDATE())
        END
      `);
      
    return { success: true, message: 'Financial data saved successfully' };
  } catch (err) {
    console.error('Error saving financial data:', err);
    throw err;
  }
};

// Save guarantor data
const saveGuarantorData = async (data) => {
  try {
    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('userId', sql.NVarChar, data.userId)
      .input('firstName', sql.NVarChar, data.firstName)
      .input('lastName', sql.NVarChar, data.lastName)
      .input('email', sql.NVarChar, data.email)
      .input('phoneNumber', sql.NVarChar, data.phoneNumber)
      .input('address', sql.NVarChar, data.address)
      .query(`
        IF EXISTS (SELECT 1 FROM GuarantorData WHERE userId = @userId)
        BEGIN
          UPDATE GuarantorData 
          SET 
            firstName = @firstName,
            lastName = @lastName,
            email = @email,
            phoneNumber = @phoneNumber,
            address = @address,
            updatedAt = GETDATE()
          WHERE userId = @userId
        END
        ELSE
        BEGIN
          INSERT INTO GuarantorData 
            (userId, firstName, lastName, email, phoneNumber, address, createdAt, updatedAt)
          VALUES
            (@userId, @firstName, @lastName, @email, @phoneNumber, @address, GETDATE(), GETDATE())
        END
      `);
      
    return { success: true, message: 'Guarantor data saved successfully' };
  } catch (err) {
    console.error('Error saving guarantor data:', err);
    throw err;
  }
};

// Save agent details data
const saveAgentDetailsData = async (data) => {
  try {
    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('userId', sql.NVarChar, data.userId)
      .input('firstName', sql.NVarChar, data.firstName)
      .input('lastName', sql.NVarChar, data.lastName)
      .input('email', sql.NVarChar, data.email)
      .input('phoneNumber', sql.NVarChar, data.phoneNumber)
      .input('hasAgreedToCheck', sql.Bit, data.hasAgreedToCheck)
      .query(`
        IF EXISTS (SELECT 1 FROM AgentDetailsData WHERE userId = @userId)
        BEGIN
          UPDATE AgentDetailsData 
          SET 
            firstName = @firstName,
            lastName = @lastName,
            email = @email,
            phoneNumber = @phoneNumber,
            hasAgreedToCheck = @hasAgreedToCheck,
            updatedAt = GETDATE()
          WHERE userId = @userId
        END
        ELSE
        BEGIN
          INSERT INTO AgentDetailsData 
            (userId, firstName, lastName, email, phoneNumber, hasAgreedToCheck, createdAt, updatedAt)
          VALUES
            (@userId, @firstName, @lastName, @email, @phoneNumber, @hasAgreedToCheck, GETDATE(), GETDATE())
        END
      `);
      
    return { success: true, message: 'Agent details data saved successfully' };
  } catch (err) {
    console.error('Error saving agent details data:', err);
    throw err;
  }
};

// Get all form data for a user
const getFormData = async (userId) => {
  try {
    const pool = await connectToDatabase();
    
    // Get identity data
    const identityResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM IdentityData WHERE userId = @userId');
      
    // Get employment data
    const employmentResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM EmploymentData WHERE userId = @userId');
      
    // Get residential data
    const residentialResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM ResidentialData WHERE userId = @userId');
      
    // Get financial data
    const financialResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM FinancialData WHERE userId = @userId');
      
    // Get guarantor data
    const guarantorResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM GuarantorData WHERE userId = @userId');
      
    // Get agent details data
    const agentDetailsResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM AgentDetailsData WHERE userId = @userId');
      
    return {
      identity: identityResult.recordset[0] || {},
      employment: employmentResult.recordset[0] || {},
      residential: residentialResult.recordset[0] || {},
      financial: financialResult.recordset[0] || {},
      guarantor: guarantorResult.recordset[0] || {},
      agentDetails: agentDetailsResult.recordset[0] || {}
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
    await saveIdentityData({userId, ...formData.identity});
    await saveEmploymentData({userId, ...formData.employment});
    await saveResidentialData({userId, ...formData.residential});
    await saveFinancialData({userId, ...formData.financial});
    await saveGuarantorData({userId, ...formData.guarantor});
    await saveAgentDetailsData({userId, ...formData.agentDetails});
    
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

module.exports = {
  saveIdentityData,
  saveEmploymentData,
  saveResidentialData,
  saveFinancialData,
  saveGuarantorData,
  saveAgentDetailsData,
  getFormData,
  submitApplication
};