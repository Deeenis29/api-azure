const sql = require('mssql');

const dbConfig = {
  user: 'senatino',
  password: 'contraseña_123',
  server: 'senati2025.database.windows.net',
  database: 'senati-db-2025',
  options: {
    encrypt: true, // Para conexiones a Azure
    trustServerCertificate: false
  }
};

async function getConnection() {
  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error('Error de conexión a SQL Server:', error);
    throw error;
  }
}

module.exports = {
  getConnection,
  sql
};