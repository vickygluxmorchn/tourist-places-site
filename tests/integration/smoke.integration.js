"use strict";

// Integration / smoke tests: start the real server and call it over HTTP.

const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { createServer } = require("../../scripts/dev-server");

let server;
let base;
let port;

test.before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
  base = `http://127.0.0.1:${port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

test("home page is served", async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  assert.match(await res.text(), /Wanderly/);
});

test("CSS and JS assets are served with the right content types", async () => {
  const css = await fetch(`${base}/style.css`);
  assert.strictEqual(css.status, 200);
  assert.match(css.headers.get("content-type"), /text\/css/);

  const js = await fetch(`${base}/app.js`);
  assert.strictEqual(js.status, 200);
  assert.match(js.headers.get("content-type"), /javascript/);
});

test("GET /api/health returns ok", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).status, "ok");
});

test("GET /api/places returns all places and categories", async () => {
  const res = await fetch(`${base}/api/places`);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.count >= 10);
  assert.strictEqual(body.count, body.places.length);
  assert.ok(body.categories.includes("Beach"));
});

test("GET /api/places filters by category and search term", async () => {
  const byCategory = await (await fetch(`${base}/api/places?category=Mountain`)).json();
  assert.ok(byCategory.places.length > 0);
  assert.ok(byCategory.places.every((p) => p.category === "Mountain"));

  const bySearch = await (await fetch(`${base}/api/places?q=japan`)).json();
  assert.ok(bySearch.places.some((p) => p.id === "fushimi-inari"));
});

test("GET /api/places?id= returns one place or 404", async () => {
  const ok = await fetch(`${base}/api/places?id=petra`);
  assert.strictEqual(ok.status, 200);
  assert.strictEqual((await ok.json()).place.name, "Petra");

  const missing = await fetch(`${base}/api/places?id=atlantis`);
  assert.strictEqual(missing.status, 404);
});

test("unknown API route returns 404 JSON", async () => {
  const res = await fetch(`${base}/api/does-not-exist`);
  assert.strictEqual(res.status, 404);
  assert.ok((await res.json()).error);
});

test("path traversal outside public/ is blocked", async () => {
  const status = await new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port, path: "/..%2fpackage.json" }, (res) => {
        res.resume();
        resolve(res.statusCode);
      })
      .on("error", reject);
  });
  assert.ok(status === 403 || status === 404, `expected 403/404 but got ${status}`);
});
