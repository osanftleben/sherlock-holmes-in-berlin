// Kleiner Webserver ohne Abhängigkeiten: node server.js [port]
// Liefert die Spieldateien aus und zeigt die Adressen im Heimnetz an, um auf dem Smartphone zu spielen.
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = parseInt(process.argv[2] || process.env.PORT || '8080', 10);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};
const BLOCKED = /^\/(node_modules|tools|\.)|\/\./;

const server = http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (_) { res.writeHead(400).end(); return; }
  if (url.endsWith('/')) url += 'index.html';
  const file = path.normalize(path.join(root, url));
  if (!file.startsWith(root + path.sep) || BLOCKED.test(url) || url === '/server.js' || url === '/package.json') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
    return;
  }
  let st;
  try { st = statSync(file); } catch (_) { st = null; }
  if (!st || !st.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
    return;
  }
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': st.size,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(file).pipe(res);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`Port ${port} ist belegt. Anderen Port wählen: node server.js 8081`);
  else console.error(e);
  process.exit(1);
});

server.listen(port, () => {
  console.log('\n  Sherlock Holmes in Berlin – Fall 1');
  console.log(`  Auf diesem Rechner:  http://localhost:${port}/`);
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  Im Heimnetz (Handy): http://${a.address}:${port}/`);
    }
  }
  console.log('\n  Beenden mit Strg+C\n');
});
