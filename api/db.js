require("dotenv").config();
const { Pool } = require("pg");


if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing in .env file!");
  process.exit(1);
}

//  koneksi pool ke PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    console.error("Database query error:", err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query };
