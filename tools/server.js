/* Server statis kecil untuk pratinjau lokal.
 * Hanya alat bantu pengembangan — tidak ikut saat aplikasi di-deploy.
 * Jalankan: node tools/server.js  →  http://localhost:5173
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const AKAR = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 5173;

const TIPE = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

http.createServer((req, res) => {
  const bersih = decodeURIComponent(req.url.split('?')[0]);
  let berkas = path.join(AKAR, bersih === '/' ? 'index.html' : bersih);

  // Jangan sampai keluar dari folder proyek.
  if (!berkas.startsWith(AKAR)) {
    res.writeHead(403).end('Terlarang');
    return;
  }

  fs.stat(berkas, (err, stat) => {
    if (err || stat.isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Tidak ditemukan: ' + bersih);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TIPE[path.extname(berkas).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(berkas).pipe(res);
  });
}).listen(PORT, () => {
  console.log('Pratinjau berjalan di http://localhost:' + PORT);
});
