import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChannelSchema, insertVideoSchema, insertSpaceSchema, insertSubscriptionSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
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

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
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

  // Channel routes
  app.get("/api/channels", async (req, res) => {
    try {
      const channels = await storage.getAllChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/channels/:id", async (req, res) => {
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

  // Video routes
  app.get("/api/videos", async (req, res) => {
    try {
      const { limit, category } = req.query;
      const videos = await storage.getVideos(
        limit ? parseInt(limit as string) : undefined,
        category as string
      );
      res.json(videos);
    } catch (error) {
      console.error("Error in GET /api/videos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/videos/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query required" });
      }
      const videos = await storage.searchVideos(q as string);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/videos/by-channels", async (req, res) => {
    try {
      const { channelIds } = req.query;
      if (!channelIds) {
        return res.status(400).json({ message: "Channel IDs required" });
      }
      const ids = (channelIds as string).split(',');
      const videos = await storage.getVideosByChannels(ids);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Space routes
  app.get("/api/spaces/user/:userId", async (req, res) => {
    try {
      const spaces = await storage.getSpacesByUser(req.params.userId);
      res.json(spaces);
    } catch (error) {
      console.error("Error in GET /api/spaces/user/:userId:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/spaces", async (req, res) => {
    try {
      const spaceData = insertSpaceSchema.parse(req.body);
      const space = await storage.createSpace(spaceData);
      res.status(201).json(space);
    } catch (error) {
      res.status(400).json({ message: "Invalid space data" });
    }
  });

  app.patch("/api/spaces/:id", async (req, res) => {
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

  app.delete("/api/spaces/:id", async (req, res) => {
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

  // Subscription routes
  app.get("/api/subscriptions/:userId", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions(req.params.userId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const subData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.subscribe(subData);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data" });
    }
  });

  app.delete("/api/subscriptions", async (req, res) => {
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

  // Blocking routes
  app.post("/api/users/:userId/block", async (req, res) => {
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

  app.delete("/api/users/:userId/block/:channelId", async (req, res) => {
    try {
      const unblocked = await storage.unblockChannel(req.params.userId, req.params.channelId);
      res.json({ unblocked });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/blocked-channels", async (req, res) => {
    try {
      const blockedChannels = await storage.getBlockedChannels(req.params.userId);
      res.json(blockedChannels);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
