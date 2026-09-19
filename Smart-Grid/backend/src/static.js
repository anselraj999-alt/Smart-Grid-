import fs from "node:fs";
import path from "node:path";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

/**
 * Serves the plain HTML/CSS/JS version of the app straight from the project folders:
 *   /            -> html/index.html
 *   /css/*       -> css/*
 *   /javascript/ -> javascript/*
 * (html/index.html links to "../css/..." and "../javascript/...", which resolve to
 * exactly these URLs, and also work when you open the file directly from disk.)
 * Returns true if it handled the request.
 */
export function createStaticServer(projectRoot) {
  const mounts = [
    { prefix: "/css/", dir: path.join(projectRoot, "css") },
    { prefix: "/javascript/", dir: path.join(projectRoot, "javascript") },
    { prefix: "/", dir: path.join(projectRoot, "html") }, // must stay last
  ];

  return async function serveStatic(req, res, pathname) {
    const requested = pathname === "/" ? "/index.html" : pathname;
    const mount = mounts.find((m) => requested.startsWith(m.prefix));

    let relative;
    try {
      relative = decodeURIComponent(requested.slice(mount.prefix.length));
    } catch {
      return false;
    }

    // Stop "../" tricks from escaping the folder.
    const filePath = path.resolve(mount.dir, relative);
    if (!filePath.startsWith(mount.dir + path.sep)) return false;

    let stats;
    try {
      stats = await fs.promises.stat(filePath);
    } catch {
      return false;
    }
    if (!stats.isFile()) return false;

    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": stats.size,
      "Cache-Control": "no-cache",
    });

    if (req.method === "HEAD") {
      res.end();
    } else {
      fs.createReadStream(filePath).pipe(res);
    }
    return true;
  };
}
