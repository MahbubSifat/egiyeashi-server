const { EVENT_TYPES } = require("../constants");
const { todayInDhaka } = require("./date");

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validateEventInput(body = {}, options = {}) {
  const errors = {};

  const data = {
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? "").trim(),
    eventType: String(body.eventType ?? "").trim(),
    thumbnail: String(body.thumbnail ?? "").trim(),
    location: String(body.location ?? "").trim(),
    eventDate: String(body.eventDate ?? "").trim(),
  };

  if (data.title.length < 5 || data.title.length > 100) {
    errors.title = "Title must be between 5 and 100 characters";
  }
  if (data.description.length < 20 || data.description.length > 1000) {
    errors.description = "Description must be between 20 and 1000 characters";
  }
  if (!EVENT_TYPES.includes(data.eventType)) {
    errors.eventType = "Please choose a valid event type";
  }
  if (!isValidUrl(data.thumbnail)) {
    errors.thumbnail = "Thumbnail must be a valid image URL";
  }
  if (data.location.length < 3 || data.location.length > 150) {
    errors.location = "Location must be between 3 and 150 characters";
  }
  if (!isRealDate(data.eventDate)) {
    errors.eventDate = "Please provide a valid date";
    } else if (
    data.eventDate <= todayInDhaka() &&
    data.eventDate !== options.keepDate
  ) {
    errors.eventDate = "Event date must be in the future";
  }

  return { isValid: Object.keys(errors).length === 0, errors, data };
}

module.exports = { validateEventInput };