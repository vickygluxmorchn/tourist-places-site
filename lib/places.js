"use strict";

const places = require("../data/places.json");

const CATEGORIES = ["Heritage", "Landmark", "Beach", "Nature", "Mountain"];

function matchesQuery(place, q) {
  const haystack = [
    place.name,
    place.country,
    place.category,
    place.description,
    ...(place.highlights || []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Filter and sort a list of places.
 * options: { q, category, sort }  (sort: "rating" | "name")
 */
function filterPlaces(list, options = {}) {
  const q = String(options.q || "").trim().toLowerCase();
  const category = options.category;
  const sort = options.sort || "rating";

  let result = list.filter((place) => {
    if (category && category !== "All" && place.category !== category) {
      return false;
    }
    if (q && !matchesQuery(place, q)) return false;
    return true;
  });

  result = [...result];
  if (sort === "name") {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    result.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  }
  return result;
}

function getPlaceById(list, id) {
  return list.find((place) => place.id === id) || null;
}

module.exports = { places, CATEGORIES, filterPlaces, getPlaceById };
