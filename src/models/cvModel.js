const { sql, poolPromise } = require('../config/db');

async function createCV(userId, cvData) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('cv_data', sql.VarBinary, cvData) // Nuevo campo para almacenar el archivo en binario
      .query('INSERT INTO CVs (user_id, cv_data) VALUES (@user_id, @cv_data)');
  } catch (error) {
    throw new Error('Error al crear el CV: ' + error.message);
  }
}

async function getUserCV(userId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT id, uploaded_at, active FROM CVs WHERE user_id = @user_id AND active = 1');
    
    if (result.recordset.length === 0) {
      return null; // No hay CV para este usuario
    }

    return result.recordset[0]; // Devuelve solo el id y la fecha de subida
  } catch (error) {
    throw new Error('Error al obtener el CV: ' + error.message);
  }
}


async function deleteCV(userId) {
  try {
    const pool = await poolPromise;
    // Marcar el CV como inactivo en lugar de eliminarlo
    await pool.request()
      .input('user_id', sql.Int, userId)
      .query('UPDATE CVs SET active = 0 WHERE user_id = @user_id');
  } catch (error) {
    throw new Error('Error al eliminar el CV: ' + error.message);
  }
}

async function downloadCV(cvId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('cv_id', sql.Int, cvId)
      .query(`
        SELECT cv_data, U.full_name
        FROM CVs C
        INNER JOIN Users U ON C.user_id = U.id
        WHERE C.id = @cv_id AND C.active = 1
      `); // Obtener el CV activo

    if (result.recordset.length === 0) {
      return null; // No se encontró el CV
    }

    return result.recordset[0]; // Devolver los datos binarios del CV
  } catch (error) {
    throw new Error('Error al descargar el CV: ' + error.message);
  }
}

module.exports = {
  createCV,
  getUserCV,
  deleteCV,
  downloadCV,
};
