// Dev only — sert le front statique sur :8080 et proxy /rdv/api/* + /rdv/media/* vers l'API locale (:9092).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8080;
const API_HOST = '127.0.0.1';
const API_PORT = 9092;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
};

function safeJoin(root, urlPath){
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const joined = path.normalize(path.join(root, decoded));
  if (!joined.startsWith(root)) return null;
  return joined;
}

function proxy(req, res, targetPath){
  const opts = {
    host: API_HOST, port: API_PORT, method: req.method, path: targetPath,
    headers: { ...req.headers, host: `${API_HOST}:${API_PORT}` },
  };
  const upstream = http.request(opts, (up) => {
    res.writeHead(up.statusCode || 502, up.headers);
    up.pipe(res);
  });
  upstream.on('error', (e) => {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'api_down', detail: e.message }));
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url.startsWith('/rdv/api/'))   return proxy(req, res, url.replace(/^\/rdv/, ''));
  if (url.startsWith('/rdv/media/')) return proxy(req, res, url.replace(/^\/rdv/, ''));

  let rel = url.split('?')[0];
  if (rel === '/' || rel === '/rdv' || rel === '/rdv/') rel = '/index.html';
  if (rel.startsWith('/rdv/')) rel = rel.slice(4);

  const full = safeJoin(ROOT, rel);
  if (!full){ res.writeHead(403); return res.end('forbidden'); }
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()){
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not found');
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(full).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`dev-serve: http://127.0.0.1:${PORT}/  →  proxies /rdv/api/* to ${API_HOST}:${API_PORT}`);
});
