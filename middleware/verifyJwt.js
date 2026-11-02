let joseModule = null;
let jwks = null;

// jose is loaded lazily so this works in a CommonJS server
async function getJose() {
  if (!joseModule) {
    joseModule = await import("jose");
  }
  return joseModule;
}

async function verifyJwt(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const authUrl = process.env.AUTH_URL;
  if (!authUrl) {
    return res.status(500).json({ message: "Server auth is not configured" });
  }

  try {
    const { createRemoteJWKSet, jwtVerify } = await getJose();

    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(`${authUrl}/api/auth/jwks`));
    }

    // The keys come from our own BetterAuth app, so a valid signature
    // proves the token was issued by it.
    const { payload } = await jwtVerify(token, jwks);

    if (!payload.email) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: payload.sub || payload.id,
      email: payload.email,
      name: payload.name || "EgiyeAshi User",
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = verifyJwt;