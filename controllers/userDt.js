const {pool} = require('../db')

const getUserData= async(req,res)=>{
    try {
      const client = await pool.connect();
      const userData = await client.query("SELECT username, avatar, discord_id FROM users WHERE id = $1", [req.user.userId]);
      client.release();

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(userData.rows[0]));
    } catch (error) {
      console.error("Token verification error:", error);
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid token" }));
    }
}

module.exports={getUserData}