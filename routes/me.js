const express = require("express");
const { getDb } = require("../db");
const verifyJwt = require("../middleware/verifyJwt");

const router = express.Router();

// GET /my-events  → events created by the logged-in user
router.get("/my-events", verifyJwt, async (req, res) => {
  try {
    const db = await getDb();
    const events = await db
      .collection("events")
      .find({ creatorEmail: req.user.email })
      .sort({ eventDate: 1, createdAt: 1 })
      .toArray();

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to load your events" });
  }
});

// GET /joined-events  → events joined by the logged-in user, sorted by date
router.get("/joined-events", verifyJwt, async (req, res) => {
  try {
    const db = await getDb();
    const events = await db
      .collection("joinedEvents")
      .aggregate([
        { $match: { userEmail: req.user.email } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        { $addFields: { "event.joinedAt": "$joinedAt" } },
        { $replaceRoot: { newRoot: "$event" } },
        { $sort: { eventDate: 1 } },
      ])
      .toArray();

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to load joined events" });
  }
});

module.exports = router;