"use strict";

// Tiny local server: serves public/ and routes /api/* to the files in api/.
// Used for local development (npm start) and for the integration tests.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const apiDir = path.join(root, "api");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");

    // API routes: /api/<name> -> api/<name>.js
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice("/api/".length);
      const file = path.join(apiDir, `${name}.js`);
      if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(file)) {
        return sendJson(res, 404, { error: "Unknown API route." });
      }
      req.query = Object.fromEntries(url.searchParams);
      return require(file)(req, res);
    }

    // Static files
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.statusCode = 400;
      return res.end("Bad request");
    }
    if (pathname === "/") pathname = "/index.html";

    const filePath = path.normalize(path.join(publicDir, pathname));
    if (filePath !== publicDir && !filePath.startsWith(publicDir + path.sep)) {
      res.statusCode = 403;
      return res.end("Forbidden");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        return res.end("Not found");
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
      res.end(data);
    });
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    console.log(`Wanderly running at http://localhost:${port}`);
  });
}

module.exports = { createServer };
