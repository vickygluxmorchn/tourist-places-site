"use strict";

const { places, CATEGORIES, filterPlaces, getPlaceById } = require("../lib/places");

// GET /api/places?q=beach&category=Nature&sort=name
// GET /api/places?id=taj-mahal
module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed. Use GET." }));
    return;
  }

  const { id, q, category, sort } = req.query || {};

  if (id) {
    const place = getPlaceById(places, String(id));
    if (!place) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `Place '${id}' not found.` }));
      return;
    }
    res.statusCode = 200;
    res.end(JSON.stringify({ place }));
    return;
  }

  const result = filterPlaces(places, { q, category, sort });

  res.statusCode = 200;
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.end(
    JSON.stringify({
      count: result.length,
      categories: CATEGORIES,
      places: result,
    })
  );
};
