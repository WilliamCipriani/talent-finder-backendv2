const { poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');

const createUser = async (email, password, full_name, role_id = 1) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;

    const result = await pool.request()
      .input('email', email)
      .input('username', email)
      .input('password', hashedPassword)
      .input('full_name', full_name)
      .input('role_id', role_id)
      .query('INSERT INTO Users (email, username, password, full_name, role_id) VALUES (@email, @username, @password, @full_name, @role_id)');

    return result;
  } catch (error) {
    console.error('Error creating user:', error); // Loguea el error con más detalle
    throw new Error('Error creating user');
  }
};

const getUserByEmail = async (email) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE email = @email');
    return result.recordset[0];
  } catch (error) {
    console.error('Error fetching user:', error); // Loguea el error con más detalle
    throw new Error('Error fetching user');
  }
};

const getUserByResetToken = async (resetTokenHash) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('resetToken', resetTokenHash)
      .query('SELECT * FROM Users WHERE reset_token = @resetToken');
    return result.recordset[0];
  } catch (error) {
    console.error('Error al buscar usuario por token de restablecimiento:', error);
    throw new Error('Error al buscar usuario por token de restablecimiento');
  }
};

// Función para actualizar el token de restablecimiento de contraseña
const updateUserResetToken = async (userId, resetTokenHash, resetTokenExpiry) => {
  try {
    const pool = await poolPromise;
    const expiryDate = new Date(resetTokenExpiry);
    await pool.request()
      .input('userId', userId)
      .input('resetToken', resetTokenHash)
      .input('resetTokenExpiry', expiryDate)
      .query('UPDATE Users SET reset_token = @resetToken, reset_token_expiry = @resetTokenExpiry WHERE id = @userId');
  } catch (error) {
    console.error('Error al actualizar el token de restablecimiento:', error);
    throw new Error('Error al actualizar el token de restablecimiento');
  }
};

// Función para actualizar la contraseña del usuario
const updateUserPassword = async (userId, hashedPassword) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', userId)
      .input('password', hashedPassword)
      .query('UPDATE Users SET password = @password, reset_token = NULL, reset_token_expiry = NULL WHERE id = @userId');
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
    throw new Error('Error al actualizar la contraseña');
  }
};

const updateUserProfileImage = async (userId, imageBuffer) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', userId)
      .input('profileImage', imageBuffer)
      .query('UPDATE Users SET profile_image = @profileImage WHERE id = @userId');
  } catch (error) {
    console.error('Error al actualizar la imagen de perfil:', error);
    throw new Error('Error al actualizar la imagen de perfil');
  }
};

const getUserById = async (userId) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', userId)
      .query('SELECT * FROM Users WHERE id = @userId');
    return result.recordset[0]; // Retorna el primer resultado, si existe
  } catch (error) {
    console.error('Error al obtener el usuario por ID:', error);
    throw new Error('Error al obtener el usuario por ID');
  }
};


module.exports = {
  createUser,
  getUserByEmail,
  getUserByResetToken,
  updateUserResetToken,
  updateUserPassword,
  updateUserProfileImage,
  getUserById
};
