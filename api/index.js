require("dotenv").config();
const jwt = require('jsonwebtoken');
const http = require("http");
const authController = require("./controllers/authController");
const userDt = require('./controllers/userDt.js')
const { authenticateJWT } = require("./middlewares/authenticateJWT");
const { getAccessToken, getDiscordUser, getGuildMember } = require("./controllers/logindc");
const {pool} = require( "./db.js");

const ROLE_ID = process.env.DISCORD_ROLE_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // Handling CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log("Requested Path:", url.pathname);

  // Routes
  if (req.method === "POST" && url.pathname === "/register") {
    return authController.registerUser(req, res);
  }
  if (req.method === "POST" && url.pathname === "/login") {
    return authController.loginUser(req, res);
  }
  if (req.method === "GET" && url.pathname === "/profile") {
    return authenticateJWT(req, res, () => authController.getProfile(req, res));
  }

  // Discord OAuth
  if (url.pathname === "/auth/discord") {
    return authController.loginWithDiscord(res);
  }

  if (url.pathname === "/auth/discord/callback") {
    const code = url.searchParams.get("code");

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Authorization code is missing.");
    }

    try {
      // Mendapatkan Access Token
      const tokenData = await getAccessToken(code);
      const access_token= tokenData.access_token;
      const userData = await getDiscordUser(access_token);

      if (!userData.id) {
        res.writeHead(401, { "Content-Type": "text/plain" });
        return res.end("Unauthorized: Invalid user data.");
      }

      const {id, username, avatar} = userData

      const client = await pool.connect();
      const existingUser = await client.query("SELECT * FROM users WHERE discord_id = $1", [id]);

      let user;
      if (existingUser.rowCount > 0) {
        user = existingUser.rows[0];
      } else {
        const newUser = await client.query(
          "INSERT INTO users (discord_id, username,  avatar) VALUES ($1, $2, $3) RETURNING *",
          [id, username, avatar]
        );
        user = newUser.rows[0];
      }
      client.release();

      const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" });

      // 5. Redirect ke frontend dengan token
      res.writeHead(302, { Location: `http://localhost:8080/?token=${token}` });
      return res.end();

    } catch (err) {
      console.error("Error in Discord OAuth:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ err: "Authentication failed" }));
    }
  }

  // Endpoint untuk fetch user data dengan token
  if (url.pathname === "/getuser") {
    return authenticateJWT(req,res,()=>{
      userDt.getUserData(req,res)
    })
  }

  

  // Jika route tidak ditemukan
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint tidak ditemukan" }));
});

server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
