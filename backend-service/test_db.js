require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function init() {
  try {
    const res = await pool.query(`SELECT * FROM travel_followers LIMIT 1;`);
    console.log("Query success. Columns:", res.fields.map(f => f.name));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

init();
