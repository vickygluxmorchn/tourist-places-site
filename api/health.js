"use strict";

// GET /api/health
module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      status: "ok",
      service: "tourist-places-api",
      time: new Date().toISOString(),
    })
  );
};
