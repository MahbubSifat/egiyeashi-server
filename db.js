const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = null;

async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME || "egiyeashi");
  }
  return db;
}

module.exports = { getDb };