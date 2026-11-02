const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");
const { todayInDhaka } = require("../utils/date");
const router = express.Router();

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /events  → upcoming events only (public)
// optional: ?limit=6  ?type=Donation  ?search=mirpur
router.get("/", async (req, res) => {
  try {
    const db = await getDb();

    const limit = Math.min(parseInt(req.query.limit, 10) || 0, 50);
    const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter = { eventDate: { $gte: todayInDhaka() } };

    if (type) {
      filter.eventType = type;
    }
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ title: pattern }, { location: pattern }];
    }

    let cursor = db
      .collection("events")
      .find(filter)
      .sort({ eventDate: 1, createdAt: 1 });

    if (limit > 0) {
      cursor = cursor.limit(limit);
    }

    const events = await cursor.toArray();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to load events" });
  }
});


// GET /events/:id  → single event details (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const db = await getDb();
    const event = await db
      .collection("events")
      .findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Failed to load event" });
  }
});

module.exports = router;