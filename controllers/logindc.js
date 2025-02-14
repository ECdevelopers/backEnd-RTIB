


async function getAccessToken(code) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return response.json();
}

async function getDiscordUser(accessToken) {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.json();
}


async function getGuildMember(userId, accessToken) {
  try {
    const response = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bot ${accessToken}`, // Gunakan bot token, bukan user token!
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Gagal mengambil member: ${response.status} - ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error saat mengambil data member:", error);
    return null;
  }
}
module.exports = {getAccessToken, getDiscordUser, getGuildMember}