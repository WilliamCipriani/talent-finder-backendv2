const { poolPromise } = require('../config/db');
const sql = require('mssql');

const createJob = async (jobData) => {
  console.log("Received jobData:", jobData); // Verifica que todos los datos estén presentes
  const { company, type, title, location, salaryRange, description, daysPosted, company_image, responsibilitiesArray, qualificationsArray, benefitsArray } = jobData;

  if (!company || !type || !title || !location || !salaryRange) {
    throw new Error("Campos obligatorios no pueden estar vacíos");
  }

  console.log('Inserting job with data:', {
    company, type, title, location, salaryRange, description, daysPosted, company_image
  });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('company', sql.VarChar, company)
      .input('type', sql.VarChar, type)
      .input('title', sql.VarChar, title)
      .input('location', sql.VarChar, location)
      .input('salaryRange', sql.VarChar, salaryRange)
      .input('description', sql.VarChar, description)
      .input('daysPosted', sql.Int, parseInt(daysPosted, 10)) // Asegura que daysPosted es entero
      .input('company_image', sql.VarBinary, company_image || null) // Maneja company_image como Buffer o null
      .query(`
        INSERT INTO Jobs (company, type, title, location, salaryRange, description, daysPosted, company_image, created_at)
        OUTPUT INSERTED.id
        VALUES (@company, @type, @title, @location, @salaryRange, @description, @daysPosted, @company_image, GETDATE())
      `);

    const jobId = result.recordset[0].id;

    for (const responsibility of responsibilitiesArray) {
      await addResponsibility(jobId, responsibility);
    }
    for (const qualification of qualificationsArray) {
      await addQualification(jobId, qualification);
    }
    for (const benefit of benefitsArray) {
      await addBenefit(jobId, benefit);
    }

    return jobId;
  } catch (error) {
    console.error('Error creating job:', error);
    throw new Error('Error creating job');
  }
};

// Función para obtener todos los trabajos
const getAllJobs = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        j.id,
        j.title,
        j.company,
        j.type,
        j.location,
        j.salaryRange,
        j.description,
        j.company_image,
        q.qualification,
        b.benefit,
        r.responsibility
      FROM Jobs j
      LEFT JOIN Qualifications q ON j.id = q.job_id
      LEFT JOIN Benefits b ON j.id = b.job_id
      LEFT JOIN Responsibilities r ON j.id = r.job_id
      ORDER BY j.created_at DESC;
    `);

    // Utilizar un mapa para agrupar los datos de cada trabajo
    const jobsMap = new Map();

    result.recordset.forEach(row => {
      const jobId = row.id;

      // Si el trabajo no existe en el mapa, inicializarlo
      if (!jobsMap.has(jobId)) {
        jobsMap.set(jobId, {
          id: row.id,
          title: row.title,
          company: row.company,
          type: row.type,
          location: row.location,
          salaryRange: row.salaryRange,
          description: row.description,
          companyImage: row.company_image ? Buffer.from(row.company_image).toString('base64') : null,
          qualifications: new Set(),
          benefits: new Set(),
          responsibilities: new Set(),
        });
      }

      // Obtener el trabajo del mapa
      const job = jobsMap.get(jobId);

      // Agregar elementos únicos a cada propiedad de set
      if (row.qualification) job.qualifications.add(row.qualification);
      if (row.benefit) job.benefits.add(row.benefit);
      if (row.responsibility) job.responsibilities.add(row.responsibility);
    });

    // Convertir sets a arrays y construir el array de trabajos
    const jobsWithDetails = Array.from(jobsMap.values()).map(job => ({
      ...job,
      qualifications: Array.from(job.qualifications),
      benefits: Array.from(job.benefits),
      responsibilities: Array.from(job.responsibilities),
    }));

    return jobsWithDetails;
  } catch (err) {
    console.error('Error fetching jobs:', err);
    throw new Error('Error fetching jobs');
  }
};

// Función para obtener los detalles de un trabajo específico
const getJobById = async (jobId) => {
  try {
    const pool = await poolPromise;
    const jobResult = await pool.request()
      .input('id', sql.Int, jobId)
      .query('SELECT * FROM Jobs WHERE id = @id');
    const job = jobResult.recordset[0];

    if (job) {
      const responsibilitiesResult = await pool.request()
        .input('job_id', sql.Int, jobId)
        .query('SELECT responsibility FROM Responsibilities WHERE job_id = @job_id');
      job.responsibilities = responsibilitiesResult.recordset.map(r => r.responsibility).join('\n');

      const qualificationsResult = await pool.request()
        .input('job_id', sql.Int, jobId)
        .query('SELECT qualification FROM Qualifications WHERE job_id = @job_id');
      job.qualifications = qualificationsResult.recordset.map(q => q.qualification).join('\n');

      const benefitsResult = await pool.request()
        .input('job_id', sql.Int, jobId)
        .query('SELECT benefit FROM Benefits WHERE job_id = @job_id');
      job.benefits = benefitsResult.recordset.map(b => b.benefit).join('\n');
    }

    return job;
  } catch (err) {
    throw new Error('Error fetching job details');
  }
};

const addResponsibility = async (job_id, responsibility) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('job_id', sql.Int, job_id)
      .input('responsibility', sql.VarChar, responsibility)
      .query('INSERT INTO Responsibilities (job_id, responsibility) VALUES (@job_id, @responsibility)');
  } catch (error) {
    throw new Error('Error adding responsibility');
  }
};

const addQualification = async (job_id, qualification) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('job_id', sql.Int, job_id)
      .input('qualification', sql.VarChar, qualification)
      .query('INSERT INTO Qualifications (job_id, qualification) VALUES (@job_id, @qualification)');
  } catch (error) {
    throw new Error('Error adding qualification');
  }
};

const addBenefit = async (job_id, benefit) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('job_id', sql.Int, job_id)
      .input('benefit', sql.VarChar, benefit)
      .query('INSERT INTO Benefits (job_id, benefit) VALUES (@job_id, @benefit)');
  } catch (error) {
    throw new Error('Error adding benefit');
  }
};

const getApplications = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT A.[id]
            ,A.[user_id]
            ,A.[job_id]
            ,A.[applied_at]
            ,A.[cv_id]
            ,U.full_name
            ,U.profile_image
            ,J.title
            ,J.salaryRange
            ,J.company
            ,C.cv_data
      FROM [talenFinderdb].[dbo].[Applications] A
      INNER JOIN Users U ON A.user_id = U.id
      INNER JOIN Jobs J ON A.job_id = J.id
      INNER JOIN CVs C ON A.cv_id = C.id
    `);

    // Convertir la imagen binaria a base64
    result.recordset.forEach(application => {
      if (application.profile_image) {
        application.profile_image = Buffer.from(application.profile_image).toString('base64');
      }
    });

    return result.recordset;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw new Error('Error fetching applications');
  }
};

const deleteJob = async (jobId) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('job_id', sql.Int, jobId)
      .query(`
        DELETE FROM Responsibilities WHERE job_id = @job_id;
        DELETE FROM Qualifications WHERE job_id = @job_id;
        DELETE FROM Benefits WHERE job_id = @job_id;
        DELETE FROM Jobs WHERE id = @job_id;
      `);

    return { message: 'Trabajo eliminado exitosamente' };
  } catch (error) {
    console.error('Error deleting job:', error);
    throw new Error('Error deleting job');
  }
};

const updateJob = async (jobId, jobData) => {
  const { company, type, title, location, salaryRange, description, daysPosted, responsibilitiesArray, qualificationsArray, benefitsArray, company_image } = jobData; 
  console.log("Datos recibidos para actualizar el trabajo (Backend):", jobData);

  

  try {

    if (!company || !type || !title || !location || !salaryRange || !description) {
      throw new Error("Campos obligatorios no pueden estar vacíos"); // Genera un error si algún campo es nulo o vacío
    }

    const pool = await poolPromise;
    // Actualizar el trabajo principal en la tabla `Jobs`
    const result = await pool.request()
      .input('job_id', sql.Int, jobId)
      .input('company', sql.VarChar, company)
      .input('type', sql.VarChar, type)
      .input('title', sql.VarChar, title)
      .input('location', sql.VarChar, location)
      .input('salaryRange', sql.VarChar, salaryRange)
      .input('description', sql.VarChar, description)
      .input('daysPosted', sql.Int, parseInt(daysPosted, 10) || 0)
      .input('company_image', sql.VarBinary, company_image ? Buffer.from(company_image) : sql.VarBinary(null))
      .query(`
        UPDATE Jobs
        SET company = @company,
            type = @type,
            title = @title,
            location = @location,
            salaryRange = @salaryRange,
            description = @description,
            daysPosted = @daysPosted,
            company_image = @company_image
        WHERE id = @job_id
      `);

      console.log("Resultado de la actualización de la tabla principal:", result);

    // Elimina las entradas antiguas de qualifications, responsibilities y benefits
    await pool.request().input('job_id', sql.Int, jobId).query(`
      DELETE FROM Responsibilities WHERE job_id = @job_id;
      DELETE FROM Qualifications WHERE job_id = @job_id;
      DELETE FROM Benefits WHERE job_id = @job_id;
    `);

    console.log("Registros antiguos eliminados de las tablas relacionadas");

    // Re-inserta los nuevos valores
   // Re-inserta los nuevos valores
   for (const responsibility of responsibilitiesArray) {
    await addResponsibility(jobId, responsibility);
  }
  for (const qualification of qualificationsArray) {
    await addQualification(jobId, qualification);
  }
  for (const benefit of benefitsArray) {
    await addBenefit(jobId, benefit);
  }
    
  console.log("Datos relacionados actualizados correctamente");
    return { message: 'Trabajo actualizado exitosamente' };
  } catch (error) {
    console.error('Error updating job:', error);
    throw new Error('Error updating job');
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  addResponsibility,
  addQualification,
  addBenefit,
  getApplications,
  deleteJob,
  updateJob 
};
