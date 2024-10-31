const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const authenticate = require('../middleware/auth');

// Ruta para crear una nueva postulación
router.post('/apply', authenticate, async (req, res) => {
    const { job_id, cv_id } = req.body;
    const user_id = req.user.id;

    // Verificar que todos los campos requeridos estén presentes
    if (!job_id || !cv_id) {
        return res.status(400).json({ error: 'Por favor, proporciona todos los campos requeridos.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .input('job_id', sql.Int, job_id)
            .input('cv_id', sql.Int, cv_id)
            .query('INSERT INTO Applications (user_id, job_id, applied_at, cv_id) VALUES (@user_id, @job_id, GETDATE(), @cv_id)');

        res.status(201).json({ message: 'Postulación creada exitosamente' });
    } catch (error) {
        console.error('Error al crear la postulación:', error); // Registro de depuración
        res.status(500).json({ error: error.message });
    }
});

router.get('/has-applied/:jobId', authenticate, async (req, res) => {
  const jobId = req.params.jobId;
  const userId = req.user.id;

  try {
      const pool = await poolPromise;
      const result = await pool.request()
          .input('user_id', sql.Int, userId)
          .input('job_id', sql.Int, jobId)
          .query('SELECT COUNT(*) as count FROM Applications WHERE user_id = @user_id AND job_id = @job_id');

      const hasApplied = result.recordset[0].count > 0;
      res.status(200).json({ hasApplied });
  } catch (error) {
      console.error('Error al verificar la postulación:', error);
      res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener todas las postulaciones de un usuario
router.get('/user/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .query('SELECT * FROM Applications WHERE user_id = @user_id');

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al obtener las postulaciones:', error); // Registro de depuración
        res.status(500).json({ error: error.message });
    }
});

// Obtener las postulaciones del usuario con su estado
router.get('/applications/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const pool = await poolPromise;
    const applicationsResult = await pool.request()
      .input('userId', sql.Int, userId) // Asegúrate de que userId es un entero
      .query(`
        SELECT A.id, A.user_id, A.job_id, A.applied_at, A.cv_id, J.title, J.company
        FROM Applications A
        INNER JOIN Jobs J ON A.job_id = J.id
        WHERE A.user_id = @userId
      `);

    const applications = applicationsResult.recordset;

    const applicationsWithStatus = await Promise.all(applications.map(async (application) => {
      console.log(`Processing application: ${application.id}, cvId: ${application.cv_id}`); // Registro de depuración

      const cvResult = await pool.request()
        .input('cvId', sql.Int, application.cv_id)
        .query('SELECT * FROM CVs WHERE id = @cvId');

      const cv = cvResult.recordset[0];
      console.log(`Fetched CV: ${cv}`);

      const approvedResult = await pool.request()
        .input('userId', sql.Int, userId)
        .input('jobId', sql.Int, application.job_id) // jobId es un entero
        .query('SELECT * FROM ApprovedApplicants WHERE user_id = @userId AND job_id = @jobId');

      const isApproved = approvedResult.recordset.length > 0;

      let status = 'subió su CV'; // Estado por defecto
      if (application) {
        status = 'postuló';
      }
      if (isApproved) {
        status = 'pasó';
      }

      return {
        ...application,
        status
      };
    }));

    res.json(applicationsWithStatus);
  } catch (error) {
    console.error('Error fetching applications:', error); // Registro de depuración
    res.status(500).send(error.message);
  }
});

router.get('/rejected/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM [dbo].[RejectedApplicants] WHERE user_id = @userId');
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching rejected applicants:', error);
    res.status(500).json({ error: 'Error fetching rejected applicants' });
  }
});


module.exports = router;
