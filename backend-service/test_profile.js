require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testProfile() {
  try {
    const res = await pool.query(`SELECT COUNT(*) FROM travel_posts WHERE user_id = 'test'`);
    console.log("Posts count:", res.rows[0].count);

    const fRes = await pool.query(`SELECT COUNT(*) FROM travel_followers WHERE following_id = 'test'`);
    console.log("Followers count:", fRes.rows[0].count);
    
    const isRes = await pool.query(`SELECT 1 FROM travel_followers WHERE follower_id = 'test' AND following_id = 'test2'`);
    console.log("Is Following:", isRes.rows.length);
    
    console.log("ALL QUERIES OK");
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}
testProfile();
