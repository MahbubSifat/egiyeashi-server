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
    const database = client.db(process.env.DB_NAME || "egiyeashi");

    await Promise.all([
      database.collection("events").createIndex({ eventDate: 1 }),
      database.collection("events").createIndex({ creatorEmail: 1 }),
      database
        .collection("joinedEvents")
        .createIndex({ eventId: 1, userEmail: 1 }, { unique: true }),
      database.collection("joinedEvents").createIndex({ userEmail: 1 }),
    ]);

    db = database;
  }
  return db;
}

module.exports = { getDb };