const express = require('express');
const multer = require('multer');
const { createCV, getUserCV, deleteCV, downloadCV } = require('../models/cvModel'); // Asegúrate de importar getUserCV
const authenticate = require('../middleware/auth');
const validateApiKey = require('../middleware/validateApiKey');

const router = express.Router();

const storage = multer.memoryStorage(); // Usar almacenamiento en memoria
const upload = multer({ storage: storage });

router.post('/upload', validateApiKey, authenticate, upload.single('cv'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener los datos binarios del archivo (req.file.buffer contiene el archivo en binario)
    const cvData = req.file.buffer;

    // Guardar el archivo binario en la base de datos
    const cvId = await createCV(userId, cvData);

    res.status(201).json({ message: 'CV subido exitosamente', cvId });
  } catch (error) {
    console.error('Error al subir el CV:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/user-cv', validateApiKey, authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cv = await getUserCV(userId); // Llama a la función modificada getUserCV

    if (cv) {
      res.status(200).json(cv); // Devuelve el CV (solo id y uploaded_at)
    } else {
      res.status(404).json({ message: 'No CV found' });
    }
  } catch (error) {
    console.error('Error al obtener el CV:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/download-cv/:cvId', validateApiKey, authenticate, async (req, res) => {
  try {
    const cvId = req.params.cvId;

    // Obtener el CV en formato binario desde la base de datos
    const cvRecord = await downloadCV(cvId);

    if (!cvRecord) {
      return res.status(404).json({ message: 'No CV found' });
    }

    const { cv_data, full_name } = cvRecord;

    // Limpiar el nombre del usuario para usarlo como nombre de archivo
    const cleanedName = full_name.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

    // Configurar los encabezados para la descarga del archivo
    res.setHeader('Content-Disposition', `attachment; filename=${cleanedName}_CV.pd`);
    res.setHeader('Content-Type', 'application/pdf');

    // Enviar el archivo binario como respuesta
    res.send(cv_data);
  } catch (error) {
    console.error('Error al descargar el CV:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/delete', validateApiKey, authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cv = await getUserCV(userId);

    if (!cv) {
      return res.status(404).json({ message: 'No CV found' });
    }

    await deleteCV(userId); // Función para eliminar o marcar como inactivo

    res.status(200).json({ message: 'CV eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el CV:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
