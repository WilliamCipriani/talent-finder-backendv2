const express = require('express');
const router = express.Router();
const { getApplicationsWithPublicId, getApprovedApplicants, getRejectedApplicants  } = require('../models/ApprovedApplicant');

router.get('/approvedApplicants', async (req, res) => {
  try {
    const applications = await getApplicationsWithPublicId();
    const approvedApplicants = await getApprovedApplicants();
    const rejectedApplicants = await getRejectedApplicants(); // Obtener los postulantes rechazados

    console.log('Applications:', applications); // Verifica los datos de applications
    console.log('Approved Applicants:', approvedApplicants); // Verifica los datos de approvedApplicants
    console.log('Rejected Applicants:', rejectedApplicants); // Verifica los datos de rejectedApplicants

    // Crear un conjunto de IDs de usuarios aprobados
    const approvedUserIds = new Set(approvedApplicants.map(applicant => applicant.user_id));

    // Clasificar las aplicaciones
    const passed = applications.filter(application => approvedUserIds.has(application.user_id));
    const notPassed = applications.length - passed.length;

    // Contar los aprobados por convocatoria (job_id) y por empresa (company)
    const byJob = {};
    const byCompany = {};
    approvedApplicants.forEach(applicant => {
      byJob[applicant.title] = (byJob[applicant.title] || 0) + 1;
      byCompany[applicant.company] = (byCompany[applicant.company] || 0) + 1;
    });

    // Contar los rechazados por convocatoria (job_id) y por empresa (company)
    const rejectedByJob = {};
    const rejectedByCompany = {};
    rejectedApplicants.forEach(applicant => {
      rejectedByJob[applicant.title] = (rejectedByJob[applicant.title] || 0) + 1;
      rejectedByCompany[applicant.company] = (rejectedByCompany[applicant.company] || 0) + 1;
    });

    res.status(200).json({
      passed: passed.length,
      notPassed,
      byJob,
      byCompany,
      approvedApplicants, 
      rejectedApplicants, 
      rejectedByJob,
      rejectedByCompany
    });
  } catch (error) {
    console.error('Error comparing data:', error);
    res.status(500).json({ error: 'Error comparing data' });
  }
});


module.exports = router;
