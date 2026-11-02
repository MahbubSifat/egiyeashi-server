require("dotenv").config();
const eventsRouter = require("./routes/events");
const express = require("express");
const cors = require("cors");
const { getDb } = require("./db");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(",")
      : "*",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EgiyeAshi server is running");
});

app.get("/health", async (req, res) => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

app.use("/events", eventsRouter);
if (require.main === module) {
  app.listen(port, () => {
    console.log(`EgiyeAshi server listening on port ${port}`);
  });
}

module.exports = app;