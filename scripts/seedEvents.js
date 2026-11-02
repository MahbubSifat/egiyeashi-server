require("dotenv").config();
const { getDb } = require("../db");

const SEED_EMAIL = "seed@egiyeashi.dev";

function dateFromToday(days) {
  const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return target.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function thumbnail(text, color) {
  return `https://placehold.co/800x500/${color}/ffffff?text=${text.replace(/ /g, "+")}`;
}

const sampleEvents = [
  {
    title: "Winter Clothes Distribution",
    description:
      "We will hand out warm clothes and sweaters to families who need them before the cold wave arrives.",
    eventType: "Donation",
    location: "Mirpur 10, Dhaka",
    thumbnail: thumbnail("Winter Clothes", "0f766e"),
    inDays: 3,
  },
  {
    title: "Blanket Distribution for the Needy",
    description:
      "Volunteers will distribute blankets to people sleeping outdoors during the cold nights.",
    eventType: "Donation",
    location: "Mohammadpur, Dhaka",
    thumbnail: thumbnail("Blanket Distribution", "b45309"),
    inDays: 5,
  },
  {
    title: "Dhanmondi Lake Cleanup",
    description:
      "Join us to collect plastic and waste around the lake side and keep the area clean for everyone.",
    eventType: "Cleanup",
    location: "Dhanmondi Lake, Dhaka",
    thumbnail: thumbnail("Lake Cleanup", "0369a1"),
    inDays: 8,
  },
  {
    title: "Tree Plantation Drive",
    description:
      "We will plant saplings together and share simple tips on how to take care of them.",
    eventType: "Plantation",
    location: "Savar, Dhaka",
    thumbnail: thumbnail("Tree Plantation", "15803d"),
    inDays: 12,
  },
  {
    title: "Free Health Checkup Camp",
    description:
      "Volunteer doctors will offer basic health checkups and advice for low-income families.",
    eventType: "Health Camp",
    location: "Mirpur 1, Dhaka",
    thumbnail: thumbnail("Health Camp", "be123c"),
    inDays: 15,
  },
  {
    title: "Street Children Reading Corner",
    description:
      "We will set up a small reading corner with books and stationery for street children.",
    eventType: "Education",
    location: "Farmgate, Dhaka",
    thumbnail: thumbnail("Reading Corner", "7e22ce"),
    inDays: 20,
  },
];

async function main() {
  const db = await getDb();
  const events = db.collection("events");

  await events.deleteMany({ creatorEmail: SEED_EMAIL });

  if (process.argv[2] === "clear") {
    console.log("Seed events removed");
    return;
  }

  const now = new Date();
  const docs = sampleEvents.map(({ inDays, ...event }) => ({
    ...event,
    eventDate: dateFromToday(inDays),
    creatorEmail: SEED_EMAIL,
    creatorName: "EgiyeAshi Team",
    createdAt: now,
  }));

  await events.insertMany(docs);
  console.log(`${docs.length} sample events added`);
}

main()
  .catch((error) => console.error(error))
  .finally(() => process.exit(0));