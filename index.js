const app = require('./src/app');
const { poolPromise } = require('./src/config/db');
const port = process.env.PORT || 3000;

// Verificar la conexión a la base de datos
poolPromise.then(pool => {
  console.log('Conexión a la base de datos SQL Server establecida correctamente');
  app.listen(port, () => {
    console.log(`Servidor ejecutándose en el puerto ${port}`);
    console.log('Backend corriendo correctamente');
  });
}).catch(err => {
  console.error('Error al conectar con la base de datos:', err);
});
