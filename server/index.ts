import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import { createServer } from "http";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import gauranitaiRoutes from "./gauranitaiRoutes";
import { registerGauranitaiSocket } from "./gauranitaiSocket";
import { gauranitaiStore } from "./gauranitaiStore";
import { buildRobotsTxt, buildSitemapXml, publicBaseUrlFromRequest } from "./seoSitemap";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' ws: wss: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "gauranitai-local-session-secret",
  resave: false,
  saveUninitialized: false,
  name: "gauranitai.sid",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8,
  },
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(sessionMiddleware);
app.use("/assets", express.static(path.join(process.cwd(), "attached_assets"), {
  maxAge: isProduction ? "30d" : "1h",
  immutable: isProduction,
}));

app.get("/robots.txt", async (req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.type("text/plain").send(buildRobotsTxt(data, publicBaseUrlFromRequest(req)));
  } catch (error) {
    next(error);
  }
});

app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.type("application/xml").send(buildSitemapXml(data, publicBaseUrlFromRequest(req)));
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  let captured: unknown;

  res.json = function json(body: any) {
    captured = body;
    return originalJson.call(this, body);
  };

  res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;
    const duration = Date.now() - start;
    const suffix = captured ? ` :: ${JSON.stringify(captured).slice(0, 120)}` : "";
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms${suffix}`);
  });

  next();
});

app.use("/api", gauranitaiRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

(async () => {
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });
  io.engine.use(sessionMiddleware);
  registerGauranitaiSocket(io);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || 5000);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`Gauranitai full-stack app serving on port ${port}`);
  });
})();
