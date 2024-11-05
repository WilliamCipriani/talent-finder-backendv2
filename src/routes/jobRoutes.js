const express = require('express');
const multer = require('multer'); // Importar multer
const jwt = require('jsonwebtoken');
const { deleteJob, getAllJobs, getJobById, createJob, addResponsibility, addQualification, addBenefit, getApplications,updateJob  } = require('../models/jobModel');
const authenticate = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Crear una convocatoria de empleo
router.post('/create-job', authenticate, upload.single('company_image'), async (req, res) => {
  try {
    console.log(req.body);
    const {
      company,
      type,
      title,
      location,
      salaryRange,
      description,
      daysPosted,
      responsibilities,
      qualifications,
      benefits
    } = req.body;
    
    const role = req.user.role_id;

    if (role !== 2) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const company_image = req.file ? req.file.buffer : null; // Obtener el buffer de la imagen cargada

    // Parsear responsibilities, qualifications y benefits como arrays
    const responsibilitiesArray = JSON.parse(responsibilities);
    const qualificationsArray = JSON.parse(qualifications);
    const benefitsArray = JSON.parse(benefits);

    const jobData = {
      company,
      type,
      title,
      location,
      salaryRange,
      description,
      daysPosted: parseInt(daysPosted, 10), // Asegura que daysPosted sea un entero
      company_image,
      responsibilitiesArray,
      qualificationsArray,
      benefitsArray
    };


    const jobId = await createJob(jobData);

    // Agregar responsabilidades, calificaciones y beneficios
    for (const responsibility of responsibilitiesArray) {
      await addResponsibility(jobId, responsibility);
    }

    for (const qualification of qualificationsArray) {
      await addQualification(jobId, qualification);
    }

    for (const benefit of benefitsArray) {
      await addBenefit(jobId, benefit);
    }

    res.status(201).json({ message: 'Trabajo creado exitosamente' });
  } catch (error) {
    console.error('Error creating job:', error.stack);
    res.status(500).json({ error: 'Error creating job' });
  }
});

router.delete('/delete-job/:id', authenticate, async (req, res) => {
  try {
    const jobId = req.params.id;
    const role = req.user.role_id;

    // Verificar si el usuario tiene permisos para eliminar el trabajo
    if (role !== 2) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Llamar a la función deleteJob en el modelo
    const result = await deleteJob(jobId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Error deleting job' });
  }
});

router.put('/update-job/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const jobData = req.body;
    const result = await updateJob(jobId, jobData);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Error updating job' });
  }
});

// Postular a un trabajo
router.post('/apply-job', authenticate, async (req, res) => {
  try {
    const { job_id, cv_id } = req.body;
    const user_id = req.user.id;

    const pool = await poolPromise;
    await pool.request()
      .input('user_id', user_id)
      .input('job_id', job_id)
      .input('cv_id', cv_id)
      .query('INSERT INTO Applications (user_id, job_id, cv_id) VALUES (@user_id, @job_id, @cv_id)');

    res.status(201).json({ message: 'Postulación enviada exitosamente' });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: 'Error applying for job' });
  }
});

// Endpoint para obtener todos los trabajos
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await getAllJobs();
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).send({ error: 'Error fetching jobs' });
  }
});

// Endpoint para obtener los detalles de un trabajo específico
router.get('/jobs/:id', async (req, res) => {
  const jobId = req.params.id;
  try {
    const job = await getJobById(jobId);
    if (job) {
      res.json(job);
    } else {
      res.status(404).send({ error: 'Job not found' });
    }
  } catch (err) {
    console.error('Error fetching job details:', err);
    res.status(500).send({ error: 'Error fetching job details' });
  }
});

// Ruta para obtener las postulaciones
router.get('/applications',  async (req, res) => {
  try {
    const applications = await getApplications();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Error fetching applications' });
  }
});


module.exports = router;
