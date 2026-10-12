"use strict";

const test = require("node:test");
const assert = require("node:assert");
const placesHandler = require("../api/places");
const healthHandler = require("../api/health");

function call(handler, method, query) {
  return new Promise((resolve) => {
    const res = {
      headers: {},
      statusCode: 200,
      setHeader(k, v) { this.headers[k] = v; },
      end(body) { resolve({ status: this.statusCode, body: JSON.parse(body) }); },
    };
    handler({ method, query }, res);
  });
}

test("GET /api/places returns the list and categories", async () => {
  const { status, body } = await call(placesHandler, "GET", {});
  assert.strictEqual(status, 200);
  assert.ok(body.count > 0);
  assert.strictEqual(body.count, body.places.length);
  assert.ok(Array.isArray(body.categories));
});

test("GET /api/places filters by category", async () => {
  const { body } = await call(placesHandler, "GET", { category: "Heritage" });
  assert.ok(body.places.every((p) => p.category === "Heritage"));
});

test("GET /api/places?id= returns one place", async () => {
  const { status, body } = await call(placesHandler, "GET", { id: "petra" });
  assert.strictEqual(status, 200);
  assert.strictEqual(body.place.name, "Petra");
});

test("GET /api/places?id= returns 404 for unknown id", async () => {
  const { status } = await call(placesHandler, "GET", { id: "atlantis" });
  assert.strictEqual(status, 404);
});

test("POST /api/places is rejected with 405", async () => {
  const { status } = await call(placesHandler, "POST", {});
  assert.strictEqual(status, 405);
});

test("GET /api/health returns ok", async () => {
  const { status, body } = await call(healthHandler, "GET", {});
  assert.strictEqual(status, 200);
  assert.strictEqual(body.status, "ok");
});
