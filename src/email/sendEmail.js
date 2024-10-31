const nodemailer = require('nodemailer');

// Función para enviar el correo de restablecimiento de contraseña
const sendResetEmail = async (email, resetUrl) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // true para SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Soporte" <${process.env.EMAIL_USER}>`, // Remitente
      to: email, // Destinatario
      subject: 'Restablecimiento de contraseña',
      text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetUrl}`,
      html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${resetUrl}">${resetUrl}</a>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado: %s', info.messageId);
  } catch (error) {
    console.error('Error enviando el correo:', error);
    throw new Error('No se pudo enviar el correo de restablecimiento');
  }
};

module.exports = sendResetEmail;
