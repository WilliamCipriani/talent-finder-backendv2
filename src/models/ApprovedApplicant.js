const { poolPromise } = require('../config/db');
const sql = require('mssql');

const getApplicationsWithPublicId = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT A.id, A.user_id, A.job_id, A.applied_at, A.cv_id
      FROM Applications A
      INNER JOIN CVs C ON A.cv_id = C.id
    `);
    return result.recordset || []; // Asegurarte de que siempre se devuelve un array
  } catch (error) {
    console.error('Error fetching applications:', error); // Agregar más detalles del error para el log
    throw new Error('Error fetching applications');
  }
};

const getApprovedApplicants = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT A.id, A.user_id, A.job_id, A.cv_id, A.approved_at, j.title, j.company
      FROM ApprovedApplicants A
      INNER JOIN Jobs j ON A.job_id = j.id 
    `);
    return result.recordset || []; 
  } catch (error) {
    console.error('Error fetching approved applicants:', error); // Más detalles de error para depurar
    throw new Error('Error fetching approved applicants');
  }
};

const getRejectedApplicants = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT R.id, R.user_id, R.job_id, R.cv_id, R.rejected_at, R.reason, 
            U.full_name, J.title, J.company
      FROM RejectedApplicants R
      INNER JOIN Users U ON R.user_id = U.id
      INNER JOIN Jobs J ON R.job_id = J.id;
    `);
    return result.recordset || [];
  } catch (error) {
    throw new Error('Error fetching rejected applicants');
  }
};

module.exports = {
  getApplicationsWithPublicId,
  getApprovedApplicants,
  getRejectedApplicants 
};
