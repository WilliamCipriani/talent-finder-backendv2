const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: 'https://www.trabajosaqui.net.pe', // Permitir solicitudes desde este origen
  //origin: 'http://localhost:3000',
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

module.exports = app;
