const sql = require('mssql');
require('dotenv').config();

const sqlConfig = {
  user: process.env.SQL_SERVER_USER,
  password: process.env.SQL_SERVER_PASSWORD,
  database: process.env.SQL_SERVER_DATABASE,
  server: process.env.SQL_SERVER_SERVER,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
};

const poolPromise = new sql.ConnectionPool(sqlConfig)
  .connect()
  .then(pool => {
    console.log('Conectado a SQL Server');
    return pool;
  })
  .catch(err => console.log('Error al conectar con la base de datos:', err));

module.exports = {
  sql, poolPromise
};
