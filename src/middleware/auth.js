const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db');

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Autenticación requerida. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', decoded.id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    const user = result.recordset[0];
    
    if (!user) {
      throw new Error();
    }

    req.user = { ...user, role_id: decoded.role_id };

    next();
  } catch (error) {
    // Diferenciar entre un token expirado o un token inválido
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'El token ha expirado. Inicia sesión nuevamente.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido. Autenticación fallida.' });
    } else {
      // Otros errores
      return res.status(500).json({ error: 'Error en la autenticación. Inténtalo de nuevo más tarde.' });
    }
  }
};

module.exports = authenticate;
