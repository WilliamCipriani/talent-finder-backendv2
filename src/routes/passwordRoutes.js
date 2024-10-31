const express = require('express');
const crypto = require('crypto'); // Para generar el token aleatorio
const { getUserByEmail, updateUserResetToken, getUserByResetToken, updateUserPassword } = require('../models/userModel'); // Asegúrate de tener este método
const sendResetEmail = require('../email/sendEmail'); // Importar la función de envío de correo
const router = express.Router();
const bcrypt = require('bcryptjs');

// Ruta para solicitar el restablecimiento de contraseña
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar si el usuario existe
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar un token de restablecimiento único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Establecer una expiración para el token (1 hora)
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora en milisegundos
    const expiryDate = new Date(resetTokenExpiry); // Crear instancia de Date

    // Guardar el token hash y la expiración en la base de datos
    await updateUserResetToken(user.id, resetTokenHash, expiryDate);

    // Crear el enlace de restablecimiento
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Enviar el correo con el enlace
    await sendResetEmail(email, resetUrl);

    res.status(200).json({ message: 'Se ha enviado un enlace para restablecer la contraseña a tu correo electrónico.' });
  } catch (error) {
    console.error('Error al solicitar el restablecimiento de contraseña:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
  
      // Validar el token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await getUserByResetToken(hashedToken);
  
      if (!user) {
        return res.status(400).json({ message: 'Token inválido o expirado' });
      }
  
      // Validar si el token no ha expirado
      if (Date.now() > user.reset_token_expiry) {
        return res.status(400).json({ message: 'El token ha expirado' });
      }
  
      // Cifrar la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Actualizar la contraseña y eliminar el token
      await updateUserPassword(user.id, hashedPassword);
  
      res.status(200).json({ message: 'Contraseña restablecida correctamente' });
    } catch (error) {
      console.error('Error al restablecer la contraseña:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router;
