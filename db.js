const mysql = require('mysql2');

const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'latihan_express',
}).promise();

(async () => {
  try {
    const conn = await dbPool.getConnection();
    console.log('✅ Database connected successfully!');
    conn.release();
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
  }
})();

module.exports = dbPool;
