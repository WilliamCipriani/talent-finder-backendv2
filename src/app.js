const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');
require('dotenv').config();

const app = express();

const allowedOrigins = ['https://www.trabajosaqui.net.pe', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'api_key'],
  }));

app.use(express.json());// Middleware para parsear JSON

// Importar rutas
const cvRoutes = require('./routes/cvRoutes');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes')
const applicationRoutes = require('./routes/applicationRoutes');
const approvedApplicantsRoutes = require('./routes/approvedApplicantsRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const userRoutes = require('./routes/userRoutes');

// Usar rutas
app.use('/cv', cvRoutes);
app.use('/auth', authRoutes);
app.use('/jobs', jobRoutes);
app.use('/applications', applicationRoutes);
app.use('/approved-applicants', approvedApplicantsRoutes);
app.use('/auth', passwordRoutes)
app.use('/users', userRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando correctamente');
});

app.get('/status', async (req, res) => {
    try {
      const pool = await poolPromise; // Espera la conexión al pool
      if (pool.connected) {
        res.send('Conexión a la base de datos establecida correctamente.');
      } else {
        res.status(500).send('No se pudo establecer la conexión a la base de datos.');
      }
    } catch (error) {
      res.status(500).send('Error al conectar con la base de datos: ' + error.message);
    }
  });

module.exports = app;
