"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { places, CATEGORIES, filterPlaces, getPlaceById } = require("../lib/places");

test("data: every place has the required fields", () => {
  assert.ok(places.length > 0);
  for (const p of places) {
    assert.match(p.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad id: ${p.id}`);
    for (const field of ["name", "country", "bestTime", "description", "emoji"]) {
      assert.ok(typeof p[field] === "string" && p[field].length > 0, `${p.id} missing ${field}`);
    }
    assert.ok(CATEGORIES.includes(p.category), `${p.id} has unknown category ${p.category}`);
    assert.ok(typeof p.rating === "number" && p.rating >= 0 && p.rating <= 5, `${p.id} bad rating`);
    assert.ok(Number.isInteger(p.hue) && p.hue >= 0 && p.hue <= 360, `${p.id} bad hue`);
    assert.ok(Array.isArray(p.highlights) && p.highlights.length > 0, `${p.id} needs highlights`);
  }
});

test("data: ids are unique", () => {
  const ids = places.map((p) => p.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test("filter: by category", () => {
  const result = filterPlaces(places, { category: "Beach" });
  assert.ok(result.length > 0);
  assert.ok(result.every((p) => p.category === "Beach"));
});

test("filter: 'All' returns everything", () => {
  assert.strictEqual(filterPlaces(places, { category: "All" }).length, places.length);
});

test("filter: search is case-insensitive and matches country", () => {
  const result = filterPlaces(places, { q: "SWITZERLAND" });
  assert.ok(result.length >= 2);
  assert.ok(result.every((p) => p.country === "Switzerland"));
});

test("filter: no match returns empty list", () => {
  assert.deepStrictEqual(filterPlaces(places, { q: "zzzz-not-a-place" }), []);
});

test("sort: by rating (highest first) by default", () => {
  const result = filterPlaces(places, {});
  for (let i = 1; i < result.length; i++) {
    assert.ok(result[i - 1].rating >= result[i].rating);
  }
});

test("sort: by name", () => {
  const names = filterPlaces(places, { sort: "name" }).map((p) => p.name);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  assert.deepStrictEqual(names, sorted);
});

test("getPlaceById: found and not found", () => {
  assert.strictEqual(getPlaceById(places, "taj-mahal").name, "Taj Mahal");
  assert.strictEqual(getPlaceById(places, "nope"), null);
});
