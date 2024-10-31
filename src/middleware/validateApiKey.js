const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['api_key']; // La API key debería enviarse en los headers
  
    if (apiKey === process.env.API_KEY) {
      next(); // La API key es válida, continuar con la solicitud
    } else {
      res.status(401).json({ error: 'API key inválida' }); // API key inválida, bloquear la solicitud
    }
  };
  
  module.exports = validateApiKey;

  