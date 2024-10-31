const express = require('express');
const multer = require('multer');
const userModel = require('../models/userModel');
const router = express.Router();

// Configuración de multer para manejar archivos de imagen
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos de imagen en formato PNG o JPG.'));
  }
});

// Ruta para subir la imagen de perfil del usuario
router.post('/upload-image/:id', (req, res, next) => {
  upload.single('profile_image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error al subir la imagen: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const userId = req.params.id;
  const profileImage = req.file;

  if (!profileImage) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen.' });
  }

  try {
    // Actualiza la imagen de perfil del usuario en formato binario
    await userModel.updateUserProfileImage(userId, profileImage.buffer);
    res.json({ message: 'Imagen de perfil actualizada exitosamente.' });
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    res.status(500).json({ message: 'Error al subir la imagen.' });
  }
});

// Ruta para obtener la imagen de perfil del usuario
router.get('/profile-image/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await userModel.getUserById(userId);
    if (user && user.profile_image) {
      res.setHeader('Content-Type', 'image/png'); // O 'image/jpeg' si es necesario
      res.send(user.profile_image);
    } else {
      res.status(404).send('Imagen no encontrada');
    }
  } catch (error) {
    console.error('Error al obtener la imagen de perfil:', error);
    res.status(500).json({ message: 'Error al obtener la imagen de perfil' });
  }
});

module.exports = router;
