import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChannelSchema, insertVideoSchema, insertSpaceSchema, insertSubscriptionSchema, insertCommentSchema, insertLikeSchema, insertWatchHistorySchema, insertPlaylistSchema, insertPlaylistVideoSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import "./types";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if authenticated via Replit Auth
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        return res.json(user);
      }
      
      // Check if authenticated via Google OAuth
      if (req.isAuthenticated() && req.user?.id) {
        // User is already the full user object from deserializeUser
        return res.json(req.user);
      }
      
      // Check if authenticated via email (session-based)
      if (req.session && req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        return res.json(user);
      }
      
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email Authentication Routes
  // Send OTP (for now, accepts any email and returns success)
  app.post('/api/auth/email/send-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email required" });
      }
      
      // In production, send actual OTP via email service
      // For now, just return success
      console.log(`OTP would be sent to: ${email}`);
      res.json({ message: "OTP sent successfully", email });
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and create/login user
  app.post('/api/auth/email/verify-otp', async (req, res) => {
    try {
      const { email, otp, firstName, lastName } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP required" });
      }
      
      // For now, accept any OTP (will integrate external service later)
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      
      let user;
      if (existingUser) {
        user = existingUser;
      } else {
        // Create new user
        user = await storage.createUser({
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          authProvider: "email",
          isVerified: true,
        });
      }
      
      // Set session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      res.json({ message: "Login successful", user });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Email Logout
  app.post('/api/auth/email/logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Already logged out" });
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

  // Get user's channel
  app.get("/api/users/:userId/channel", async (req, res) => {
    try {
      const channel = await storage.getChannelByUserId(req.params.userId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create channel for authenticated user
  app.post("/api/channels", async (req: any, res) => {
    try {
      // Get user ID from session or Replit Auth
      let userId = null;
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId;
      }

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user already has a channel
      const existingChannel = await storage.getChannelByUserId(userId);
      if (existingChannel) {
        return res.status(400).json({ message: "User already has a channel" });
      }

      const channelData = insertChannelSchema.parse({ ...req.body, userId });
      const channel = await storage.createChannel(channelData);
      res.status(201).json(channel);
    } catch (error) {
      console.error("Error creating channel:", error);
      res.status(400).json({ message: "Invalid channel data" });
    }
  });

  // Update user's channel
  app.patch("/api/channels/:id", async (req: any, res) => {
    try {
      // Get user ID from session or Replit Auth
      let userId = null;
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId;
      }

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify the channel belongs to the user
      const channel = await storage.getChannel(req.params.id);
      if (!channel || channel.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedChannel = await storage.updateChannel(req.params.id, req.body);
      if (!updatedChannel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(updatedChannel);
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

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      const channel = await storage.getChannel(video.channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json({ ...video, channel });
    } catch (error) {
      console.error("Error in GET /api/videos/:id:", error);
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

  app.post("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subData = insertSubscriptionSchema.parse({ ...req.body, userId });
      const subscription = await storage.subscribe(subData);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data" });
    }
  });

  app.delete("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { channelId } = req.body;
      if (!channelId) {
        return res.status(400).json({ message: "ChannelId required" });
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

  // Comment routes
  app.post("/api/videos/:videoId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId,
        videoId: req.params.videoId
      });
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.get("/api/videos/:videoId/comments", async (req, res) => {
    try {
      const { limit, offset, sortBy } = req.query;
      const comments = await storage.getCommentsByVideo(
        req.params.videoId,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined,
        sortBy as string
      );
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const comment = await storage.getComment(req.params.id);
      if (!comment || comment.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updatedComment = await storage.updateComment(req.params.id, req.body);
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(updatedComment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const comment = await storage.getComment(req.params.id);
      if (!comment || comment.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const deleted = await storage.deleteComment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/comments/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const liked = await storage.likeComment(req.params.id);
      if (!liked) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Like routes
  app.post("/api/videos/:videoId/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const likeData = insertLikeSchema.parse({
        ...req.body,
        userId,
        videoId: req.params.videoId
      });
      const result = await storage.toggleLike(likeData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid like data" });
    }
  });

  app.get("/api/videos/:videoId/likes", async (req, res) => {
    try {
      const counts = await storage.getLikeCounts(req.params.videoId);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/videos/:videoId/user-like/:userId", async (req, res) => {
    try {
      const userLike = await storage.getUserLike(req.params.userId, req.params.videoId);
      res.json(userLike || null);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Watch history routes
  app.post("/api/watch-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const historyData = insertWatchHistorySchema.parse({ ...req.body, userId });
      const history = await storage.addToWatchHistory(historyData);
      res.status(201).json(history);
    } catch (error) {
      res.status(400).json({ message: "Invalid watch history data" });
    }
  });

  app.get("/api/watch-history/:userId", async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const history = await storage.getWatchHistory(
        req.params.userId,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/watch-history/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cleared = await storage.clearWatchHistory(userId);
      if (!cleared) {
        return res.status(404).json({ message: "No watch history found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Playlist routes
  app.post("/api/playlists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playlistData = insertPlaylistSchema.parse({ ...req.body, userId });
      const playlist = await storage.createPlaylist(playlistData);
      res.status(201).json(playlist);
    } catch (error) {
      res.status(400).json({ message: "Invalid playlist data" });
    }
  });

  app.get("/api/playlists/:userId", async (req, res) => {
    try {
      const playlists = await storage.getPlaylistsByUser(req.params.userId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/playlists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist || playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updatedPlaylist = await storage.updatePlaylist(req.params.id, req.body);
      if (!updatedPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.json(updatedPlaylist);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/playlists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist || playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const deleted = await storage.deletePlaylist(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/playlists/:id/videos", isAuthenticated, async (req: any, res) => {
    try {
      const playlistVideoData = insertPlaylistVideoSchema.parse({
        ...req.body,
        playlistId: req.params.id
      });
      const playlistVideo = await storage.addVideoToPlaylist(playlistVideoData);
      res.status(201).json(playlistVideo);
    } catch (error) {
      res.status(400).json({ message: "Invalid playlist video data" });
    }
  });

  app.delete("/api/playlists/:playlistId/videos/:videoId", isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.playlistId);
      if (!playlist || playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const removed = await storage.removeVideoFromPlaylist(req.params.playlistId, req.params.videoId);
      if (!removed) {
        return res.status(404).json({ message: "Video not found in playlist" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Video view count route
  app.post("/api/videos/:videoId/view", async (req, res) => {
    try {
      const incremented = await storage.incrementViewCount(req.params.videoId);
      if (!incremented) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
