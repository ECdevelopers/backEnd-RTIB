const { query } = require("./db");

(async () => {
  try {
    const res = await query("SELECT NOW()");
    console.log("Database connected! Current time:", res.rows[0]);
  } catch (err) {
    console.error("Database connection failed:", err);
  }
})();
