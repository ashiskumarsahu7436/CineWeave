var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  channels: () => channels,
  insertChannelSchema: () => insertChannelSchema,
  insertSpaceSchema: () => insertSpaceSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertUserSchema: () => insertUserSchema,
  insertVideoSchema: () => insertVideoSchema,
  sessions: () => sessions,
  spaces: () => spaces,
  subscriptions: () => subscriptions,
  users: () => users,
  videos: () => videos
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  personalMode: boolean("personal_mode").default(false),
  blockedChannels: text("blocked_channels").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  avatar: text("avatar"),
  verified: boolean("verified").default(false),
  subscribers: integer("subscribers").default(0),
  description: text("description")
});
var videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  duration: text("duration").notNull(),
  views: integer("views").default(0),
  channelId: varchar("channel_id").notNull(),
  uploadedAt: timestamp("uploaded_at").default(sql`now()`),
  isLive: boolean("is_live").default(false),
  description: text("description"),
  category: text("category")
});
var spaces = pgTable("spaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").notNull(),
  channelIds: text("channel_ids").array().default([]),
  icon: text("icon"),
  color: text("color").default("blue")
});
var subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  channelId: varchar("channel_id").notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true
});
var insertChannelSchema = createInsertSchema(channels).omit({
  id: true
});
var insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  uploadedAt: true
});
var insertSpaceSchema = createInsertSchema(spaces).omit({
  id: true
});
var insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true
});

// server/db.ts
var sql2 = neon(process.env.DATABASE_URL);
var db = drizzle(sql2, { schema: schema_exports });

// server/storage.ts
import { eq, and, or, ilike, inArray, sql as sql3 } from "drizzle-orm";
var DbStorage = class {
  // User methods
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  async updateUser(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }
  async upsertUser(userData) {
    const result = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result[0];
  }
  // Channel methods
  async getChannel(id) {
    const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
    return result[0];
  }
  async getChannelByUsername(username) {
    const result = await db.select().from(channels).where(eq(channels.username, username)).limit(1);
    return result[0];
  }
  async getAllChannels() {
    return await db.select().from(channels);
  }
  async createChannel(insertChannel) {
    const result = await db.insert(channels).values(insertChannel).returning();
    return result[0];
  }
  // Video methods
  async getVideo(id) {
    const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
    return result[0];
  }
  async getVideos(limit, category) {
    let query = db.select({
      video: videos,
      channel: channels
    }).from(videos).innerJoin(channels, eq(videos.channelId, channels.id)).orderBy(sql3`${videos.uploadedAt} DESC`);
    if (category) {
      query = query.where(eq(videos.category, category));
    }
    if (limit) {
      query = query.limit(limit);
    }
    const results = await query;
    return results.map((r) => ({ ...r.video, channel: r.channel }));
  }
  async getVideosByChannel(channelId) {
    const results = await db.select({
      video: videos,
      channel: channels
    }).from(videos).innerJoin(channels, eq(videos.channelId, channels.id)).where(eq(videos.channelId, channelId)).orderBy(sql3`${videos.uploadedAt} DESC`);
    return results.map((r) => ({ ...r.video, channel: r.channel }));
  }
  async getVideosByChannels(channelIds) {
    if (channelIds.length === 0) return [];
    const results = await db.select({
      video: videos,
      channel: channels
    }).from(videos).innerJoin(channels, eq(videos.channelId, channels.id)).where(inArray(videos.channelId, channelIds)).orderBy(sql3`${videos.uploadedAt} DESC`);
    return results.map((r) => ({ ...r.video, channel: r.channel }));
  }
  async createVideo(insertVideo) {
    const result = await db.insert(videos).values(insertVideo).returning();
    return result[0];
  }
  async searchVideos(query) {
    const results = await db.select({
      video: videos,
      channel: channels
    }).from(videos).innerJoin(channels, eq(videos.channelId, channels.id)).where(
      or(
        ilike(videos.title, `%${query}%`),
        ilike(videos.description, `%${query}%`)
      )
    ).orderBy(sql3`${videos.uploadedAt} DESC`);
    return results.map((r) => ({ ...r.video, channel: r.channel }));
  }
  // Space methods
  async getSpace(id) {
    const result = await db.select().from(spaces).where(eq(spaces.id, id)).limit(1);
    return result[0];
  }
  async getSpacesByUser(userId) {
    const userSpaces = await db.select().from(spaces).where(eq(spaces.userId, userId));
    const spacesWithChannels = await Promise.all(
      userSpaces.map(async (space) => {
        const channelIds = space.channelIds || [];
        const spaceChannels = channelIds.length > 0 ? await db.select().from(channels).where(inArray(channels.id, channelIds)) : [];
        const videoCount = channelIds.length > 0 ? await db.select({ count: sql3`count(*)` }).from(videos).where(inArray(videos.channelId, channelIds)).then((result) => Number(result[0]?.count || 0)) : 0;
        return {
          ...space,
          channels: spaceChannels,
          videoCount
        };
      })
    );
    return spacesWithChannels;
  }
  async createSpace(insertSpace) {
    const result = await db.insert(spaces).values(insertSpace).returning();
    return result[0];
  }
  async updateSpace(id, updates) {
    const result = await db.update(spaces).set(updates).where(eq(spaces.id, id)).returning();
    return result[0];
  }
  async deleteSpace(id) {
    const result = await db.delete(spaces).where(eq(spaces.id, id)).returning();
    return result.length > 0;
  }
  // Subscription methods
  async getSubscriptions(userId) {
    return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }
  async isSubscribed(userId, channelId) {
    const result = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId))).limit(1);
    return result.length > 0;
  }
  async subscribe(insertSubscription) {
    const result = await db.insert(subscriptions).values(insertSubscription).returning();
    return result[0];
  }
  async unsubscribe(userId, channelId) {
    const result = await db.delete(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId))).returning();
    return result.length > 0;
  }
  // Blocking methods
  async blockChannel(userId, channelId) {
    const user = await this.getUser(userId);
    if (!user) return false;
    const blockedChannels = user.blockedChannels || [];
    if (!blockedChannels.includes(channelId)) {
      blockedChannels.push(channelId);
      await this.updateUser(userId, { blockedChannels });
    }
    return true;
  }
  async unblockChannel(userId, channelId) {
    const user = await this.getUser(userId);
    if (!user) return false;
    const blockedChannels = (user.blockedChannels || []).filter((id) => id !== channelId);
    await this.updateUser(userId, { blockedChannels });
    return true;
  }
  async getBlockedChannels(userId) {
    const user = await this.getUser(userId);
    if (!user || !user.blockedChannels || user.blockedChannels.length === 0) return [];
    return await db.select().from(channels).where(inArray(channels.id, user.blockedChannels));
  }
};
var storage = new DbStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  app2.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/channels", async (req, res) => {
    try {
      const channels2 = await storage.getAllChannels();
      res.json(channels2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/channels/:id", async (req, res) => {
    try {
      const channel = await storage.getChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/videos", async (req, res) => {
    try {
      const { limit, category } = req.query;
      const videos2 = await storage.getVideos(
        limit ? parseInt(limit) : void 0,
        category
      );
      res.json(videos2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/videos/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query required" });
      }
      const videos2 = await storage.searchVideos(q);
      res.json(videos2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/videos/by-channels", async (req, res) => {
    try {
      const { channelIds } = req.query;
      if (!channelIds) {
        return res.status(400).json({ message: "Channel IDs required" });
      }
      const ids = channelIds.split(",");
      const videos2 = await storage.getVideosByChannels(ids);
      res.json(videos2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/spaces/user/:userId", async (req, res) => {
    try {
      const spaces2 = await storage.getSpacesByUser(req.params.userId);
      res.json(spaces2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/spaces", async (req, res) => {
    try {
      const spaceData = insertSpaceSchema.parse(req.body);
      const space = await storage.createSpace(spaceData);
      res.status(201).json(space);
    } catch (error) {
      res.status(400).json({ message: "Invalid space data" });
    }
  });
  app2.patch("/api/spaces/:id", async (req, res) => {
    try {
      const space = await storage.updateSpace(req.params.id, req.body);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }
      res.json(space);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/spaces/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSpace(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Space not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/subscriptions/:userId", async (req, res) => {
    try {
      const subscriptions2 = await storage.getSubscriptions(req.params.userId);
      res.json(subscriptions2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/subscriptions", async (req, res) => {
    try {
      const subData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.subscribe(subData);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data" });
    }
  });
  app2.delete("/api/subscriptions", async (req, res) => {
    try {
      const { userId, channelId } = req.body;
      if (!userId || !channelId) {
        return res.status(400).json({ message: "UserId and channelId required" });
      }
      const unsubscribed = await storage.unsubscribe(userId, channelId);
      if (!unsubscribed) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/block", async (req, res) => {
    try {
      const { channelId } = req.body;
      if (!channelId) {
        return res.status(400).json({ message: "Channel ID required" });
      }
      const blocked = await storage.blockChannel(req.params.userId, channelId);
      res.json({ blocked });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/block/:channelId", async (req, res) => {
    try {
      const unblocked = await storage.unblockChannel(req.params.userId, req.params.channelId);
      res.json({ unblocked });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/blocked-channels", async (req, res) => {
    try {
      const blockedChannels = await storage.getBlockedChannels(req.params.userId);
      res.json(blockedChannels);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    strictPort: true,
    hmr: {
      clientPort: 443
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
