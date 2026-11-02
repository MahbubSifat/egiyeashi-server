const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");
const { todayInDhaka } = require("../utils/date");
const { validateEventInput } = require("../utils/validateEvent");
const verifyJwt = require("../middleware/verifyJwt");
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

       const joinedCount = await db
      .collection("joinedEvents")
      .countDocuments({ eventId: event._id });

    res.json({ ...event, joinedCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to load event" });
  }
});

// POST /events  → create an event (login required)
router.post("/", verifyJwt, async (req, res) => {
  try {
    const { isValid, errors, data } = validateEventInput(req.body);

    if (!isValid) {
      return res
        .status(400)
        .json({ message: "Please fix the highlighted fields", errors });
    }

    const db = await getDb();
    const event = {
      ...data,
      creatorEmail: req.user.email,
      creatorName: req.user.name,
      createdAt: new Date(),
    };

    const result = await db.collection("events").insertOne(event);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: "Failed to create event" });
  }
});

// PUT /events/:id  → update an event (only the creator)
router.put("/:id", verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const db = await getDb();
    const events = db.collection("events");
    const existing = await events.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (existing.creatorEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You can only update your own events" });
    }

    const { isValid, errors, data } = validateEventInput(req.body, {
      keepDate: existing.eventDate,
    });

    if (!isValid) {
      return res
        .status(400)
        .json({ message: "Please fix the highlighted fields", errors });
    }

    await events.updateOne(
      { _id: existing._id },
      { $set: { ...data, updatedAt: new Date() } }
    );

    res.json({ message: "Event updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update event" });
  }
});

// DELETE /events/:id  → delete an event (only the creator)
router.delete("/:id", verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const db = await getDb();
    const events = db.collection("events");
    const existing = await events.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (existing.creatorEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You can only delete your own events" });
    }

    await events.deleteOne({ _id: existing._id });
    await db.collection("joinedEvents").deleteMany({ eventId: existing._id });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete event" });
  }
});

// POST /events/:id/join  → join an event (login required)
router.post("/:id/join", verifyJwt, async (req, res) => {
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

    if (event.eventDate < todayInDhaka()) {
      return res
        .status(400)
        .json({ message: "This event has already taken place" });
    }

    try {
      await db.collection("joinedEvents").insertOne({
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        userEmail: req.user.email,
        userName: req.user.name,
        joinedAt: new Date(),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ message: "You have already joined this event" });
      }
      throw error;
    }

    res.status(201).json({ message: "You have joined this event" });
  } catch (error) {
    res.status(500).json({ message: "Failed to join event" });
  }
});

// GET /events/:id/joined  → has the logged-in user joined this event?
router.get("/:id/joined", verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const db = await getDb();
    const record = await db.collection("joinedEvents").findOne({
      eventId: new ObjectId(id),
      userEmail: req.user.email,
    });

    res.json({ joined: Boolean(record) });
  } catch (error) {
    res.status(500).json({ message: "Failed to check join status" });
  }
});

module.exports = router;