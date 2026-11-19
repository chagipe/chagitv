const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const play = require('./dist/api/play');
const files = new Map([
  ['/', 'index.html'], ['/index.html', 'index.html'], ['/app.js', 'app.js'],
  ['/catalog.js', 'catalog.js'], ['/artwork.js', 'artwork.js'], ['/cinema.css', 'cinema.css']
]);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/play') {
    req.query = Object.fromEntries(url.searchParams);
    res.status = code => { res.statusCode = code; return res; };
    res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    try { play(req, res); } catch { res.status(503).end(); }
    return;
  }
  const file = files.get(url.pathname);
  if (!file) { res.writeHead(404).end(); return; }
  fs.readFile(path.join(__dirname, 'dist', file), (error, data) => {
    if (error) { res.writeHead(500).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] + '; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(4178, '127.0.0.1', () => console.log('ChagiTV: http://127.0.0.1:4178'));
