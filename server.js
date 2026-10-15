// Servidor local sin dependencias (requiere Node.js 18 o superior).
// Sirve los archivos del juego y reenvía las llamadas a la API,
// así el navegador no tiene problemas de CORS.
//
// Uso:  node server.js   y luego abre http://localhost:3000

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ALLOWED_HOSTS = ["quotes.jepcd.com", "thronesapi.com"];
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

http
  .createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

    // --- Proxy hacia la API ---
    if (reqUrl.pathname === "/proxy") {
      try {
        const target = new URL(reqUrl.searchParams.get("url"));
        if (!ALLOWED_HOSTS.includes(target.hostname)) {
          res.writeHead(403);
          return res.end("Host no permitido");
        }
        const apiRes = await fetch(target);
        const body = await apiRes.text();
        res.writeHead(apiRes.status, { "Content-Type": "application/json" });
        return res.end(body);
      } catch (err) {
        res.writeHead(502);
        return res.end("Error al contactar la API: " + err.message);
      }
    }

    // --- Archivos estáticos ---
    const file = reqUrl.pathname === "/" ? "/index.html" : reqUrl.pathname;
    const filePath = path.join(__dirname, path.normalize(file));
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("No encontrado");
      }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream",
      });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Juego listo en http://localhost:${PORT}`));
