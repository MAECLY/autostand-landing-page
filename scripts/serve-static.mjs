/**
 * Serve the exported build (out/) over HTTP.
 *
 * `output: "export"` in next.config.ts turns `next start` into an error — there
 * is no server build for it to run — but `pnpm start` and the Playwright suite
 * still need the production artifact on a port. This is the smallest thing that
 * behaves like the static host the site actually ships to: it serves files, it
 * answers an unknown path with 404 rather than the index document, and it has
 * no dependencies, so CI needs nothing installed to run it.
 *
 * It is a local harness, not a web server: it binds loopback by default and
 * knows nothing about caching, compression or TLS. GitHub Pages does all of
 * that in production.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const ROOT = resolve(process.cwd(), "out");
const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);

const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".map", "application/json; charset=utf-8"],
]);

/** The file a path resolves to, or null when nothing under out/ matches it. */
async function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = resolve(ROOT, `.${decoded}`);

  // A request may not climb out of out/ with ../ segments. Compared with the
  // separator appended so /out-of-band cannot pass as a child of /out.
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;

  const candidates = decoded.endsWith("/")
    ? [join(target, "index.html")]
    : // Next writes /foo as foo.html; the directory form is what a trailing-slash
      // host would look for. Try both so either spelling of a link resolves.
      [target, `${target}.html`, join(target, "index.html")];

  for (const candidate of candidates) {
    const stats = await stat(candidate).catch(() => null);
    if (stats?.isFile()) return candidate;
  }
  return null;
}

function send(response, status, file) {
  response.writeHead(status, {
    "content-type": CONTENT_TYPES.get(extname(file)) ?? "application/octet-stream",
    // Never let a stale asset survive a rebuild during a test run.
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(response);
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${HOST}:${PORT}`).pathname;

  void resolveFile(pathname).then(async (file) => {
    if (file) {
      send(response, 200, file);
      return;
    }

    // The export's own 404 page, served with the status it describes. A static
    // host that answered 200 here would hide every broken link in the suite.
    const notFound = join(ROOT, "404.html");
    const stats = await stat(notFound).catch(() => null);
    if (stats?.isFile()) {
      send(response, 404, notFound);
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("404\n");
  });
});

const rootExists = await stat(ROOT).catch(() => null);
if (!rootExists?.isDirectory()) {
  console.error(`${ROOT} does not exist. Run \`pnpm build\` first.`);
  process.exit(1);
}

server.listen(PORT, HOST, () => {
  console.log(`serving ${ROOT} on http://${HOST}:${PORT}`);
});
