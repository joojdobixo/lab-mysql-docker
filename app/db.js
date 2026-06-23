const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'user123',
  database: process.env.DB_NAME || 'lab_db',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  charset: 'utf8mb4'
});

module.exports = pool;