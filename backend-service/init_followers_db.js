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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS travel_followers (
        follower_id VARCHAR(255) NOT NULL,
        following_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id)
      );
    `);
    console.log("travel_followers table created or already exists.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

init();
