import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertUserSchema, insertChannelSchema, insertVideoSchema, insertSpaceSchema, insertSubscriptionSchema, insertCommentSchema, insertLikeSchema, insertWatchHistorySchema, insertPlaylistSchema, insertPlaylistVideoSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { uploadVideoToStorage, uploadThumbnailToStorage, isStorageConfigured, getVideoFromStorage, getThumbnailFromStorage } from "./videoStorage";
import "./types";

// Configure multer for memory storage
// Note: With Render free tier (512MB RAM), files larger than 200-300MB may cause memory issues
// For production with more RAM, increase this limit accordingly
const parseUploadSize = (): number => {
  if (process.env.MAX_UPLOAD_SIZE) {
    const parsed = parseInt(process.env.MAX_UPLOAD_SIZE, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed * 1024 * 1024; // Convert MB to bytes
    }
  }
  return 500 * 1024 * 1024; // Default 500MB
};

const MAX_UPLOAD_SIZE = parseUploadSize();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (file.fieldname === 'video' && allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if ((file.fieldname === 'thumbnail' || file.fieldname === 'avatar') && allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}`));
    }
  },
});

// Helper function to get user ID from request (works with all auth methods)
function getUserIdFromRequest(req: any): string | null {
  // Check if authenticated via Replit Auth
  if (req.isAuthenticated() && req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  
  // Check if authenticated via Google OAuth
  if (req.isAuthenticated() && req.user?.id) {
    return req.user.id;
  }
  
  // Check if authenticated via email (session-based)
  if (req.session && req.session.userId) {
    return req.session.userId;
  }
  
  return null;
}

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
      // Get user ID from session, Replit Auth, or Google OAuth
      let userId = null;
      if (req.isAuthenticated()) {
        // For Replit Auth users
        if (req.user?.claims?.sub) {
          userId = req.user.claims.sub;
        }
        // For Google OAuth users (deserialized from database)
        else if (req.user?.id) {
          userId = req.user.id;
        }
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
      // Get user ID from session, Replit Auth, or Google OAuth
      let userId = null;
      if (req.isAuthenticated()) {
        // For Replit Auth users
        if (req.user?.claims?.sub) {
          userId = req.user.claims.sub;
        }
        // For Google OAuth users (deserialized from database)
        else if (req.user?.id) {
          userId = req.user.id;
        }
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
      const userId = getUserIdFromRequest(req);
      
      const allVideos = await storage.getVideos(
        limit ? parseInt(limit as string) : undefined,
        category as string
      );
      
      // Filter based on visibility:
      // - Public videos: visible to everyone
      // - Unlisted videos: visible to everyone (but not in search/recommendations)
      // - Private videos: only visible to the owner
      const filteredVideos = allVideos.filter((video: any) => {
        const visibility = video.visibility || 'public';
        if (visibility === 'public' || visibility === 'unlisted') {
          return true;
        }
        if (visibility === 'private') {
          return userId && video.channel?.userId === userId;
        }
        return false;
      });
      
      res.json(filteredVideos);
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
      const userId = getUserIdFromRequest(req);
      const allVideos = await storage.searchVideos(q as string);
      
      // Filter search results:
      // - Public videos: visible to everyone
      // - Private videos: only visible to owner
      // - Unlisted videos: NOT shown in search (even to owner)
      const filteredVideos = allVideos.filter((video: any) => {
        const visibility = video.visibility || 'public';
        if (visibility === 'public') {
          return true;
        }
        if (visibility === 'private') {
          // Show private videos to the owner
          return userId && video.channel?.userId === userId;
        }
        // Unlisted videos are never shown in search
        return false;
      });
      
      res.json(filteredVideos);
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
      const userId = getUserIdFromRequest(req);
      const ids = (channelIds as string).split(',');
      const allVideos = await storage.getVideosByChannels(ids);
      
      // Filter based on visibility
      const filteredVideos = allVideos.filter((video: any) => {
        const visibility = video.visibility || 'public';
        if (visibility === 'public' || visibility === 'unlisted') {
          return true;
        }
        if (visibility === 'private') {
          return userId && video.channel?.userId === userId;
        }
        return false;
      });
      
      res.json(filteredVideos);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const video = await storage.getVideo(req.params.id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const channel = await storage.getChannel(video.channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      // Check if user has permission to view this video
      const visibility = video.visibility || 'public';
      if (visibility === 'private') {
        // Only the owner can view private videos
        if (!userId || channel.userId !== userId) {
          return res.status(403).json({ message: "This video is private" });
        }
      }
      // Public and unlisted videos are accessible to everyone
      
      res.json({ ...video, channel });
    } catch (error) {
      console.error("Error in GET /api/videos/:id:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stream video from iDrive E2 (proxy endpoint to hide iDrive URLs)
  app.get("/api/videos/stream/:key", async (req, res) => {
    try {
      // Check storage configuration
      if (!isStorageConfigured()) {
        return res.status(503).json({ message: "Video storage not configured" });
      }

      const storageKey = decodeURIComponent(req.params.key);
      const range = req.headers.range;

      // Fetch video from iDrive E2
      const videoData = await getVideoFromStorage(storageKey, range);

      // Set response headers for video streaming
      res.setHeader("Content-Type", videoData.contentType);
      res.setHeader("Accept-Ranges", "bytes");

      if (range && videoData.contentRange) {
        // Partial content (for seeking)
        res.status(206);
        res.setHeader("Content-Range", videoData.contentRange);
        res.setHeader("Content-Length", videoData.contentLength.toString());
      } else {
        // Full content
        res.setHeader("Content-Length", videoData.contentLength.toString());
      }

      // Stream video to client
      videoData.stream.pipe(res);
    } catch (error: any) {
      console.error("Error streaming video:", error);
      res.status(500).json({ message: "Failed to stream video: " + error.message });
    }
  });

  // Serve thumbnail from iDrive E2 (proxy endpoint to avoid CORS issues)
  app.get("/api/thumbnails/:key", async (req, res) => {
    try {
      // Check storage configuration
      if (!isStorageConfigured()) {
        return res.status(503).json({ message: "Thumbnail storage not configured" });
      }

      const storageKey = decodeURIComponent(req.params.key);

      // Fetch thumbnail from iDrive E2
      const { stream, contentLength, contentType } = await getThumbnailFromStorage(storageKey);

      // Set response headers
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", contentLength.toString());
      res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache

      // Stream thumbnail to client
      stream.pipe(res);
    } catch (error: any) {
      console.error("Error serving thumbnail:", error);
      res.status(500).json({ message: "Failed to serve thumbnail: " + error.message });
    }
  });

  // Upload video file to iDrive E2 storage
  app.post("/api/upload/video", (req, res, next) => {
    // Set longer timeout for video uploads (5 minutes)
    req.setTimeout(300000);
    res.setTimeout(300000);
    
    upload.single('video')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxSizeMB = Math.floor(MAX_UPLOAD_SIZE / (1024 * 1024));
          return res.status(413).json({ 
            message: `File too large. Maximum upload size is ${maxSizeMB}MB. For larger files, please upgrade your hosting plan or compress your video.`
          });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      // Check storage configuration
      if (!isStorageConfigured()) {
        return res.status(503).json({ 
          message: "Video storage not configured. Please set up iDrive E2 credentials.",
          configured: false
        });
      }

      // Check authentication
      let userId = null;
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (req.isAuthenticated() && req.user?.id) {
        userId = req.user.id;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId;
      }

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      console.log(`Uploading video: ${req.file.originalname} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)`);

      // Upload to iDrive E2
      const result = await uploadVideoToStorage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      console.log(`Video uploaded successfully: ${result.key}`);

      res.json({
        message: "Video uploaded successfully",
        videoUrl: result.videoUrl,
        key: result.key,
        storageKey: result.storageKey
      });
    } catch (error: any) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video: " + error.message });
    }
  });

  // Upload thumbnail to iDrive E2 storage
  app.post("/api/upload/thumbnail", (req, res, next) => {
    upload.single('thumbnail')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxSizeMB = Math.floor(MAX_UPLOAD_SIZE / (1024 * 1024));
          return res.status(413).json({ 
            message: `Thumbnail too large. Maximum upload size is ${maxSizeMB}MB.`
          });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      // Check storage configuration
      if (!isStorageConfigured()) {
        return res.status(503).json({ 
          message: "Storage not configured",
          configured: false
        });
      }

      // Check authentication
      let userId = null;
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (req.isAuthenticated() && req.user?.id) {
        userId = req.user.id;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId;
      }

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No thumbnail file provided" });
      }

      console.log(`Uploading thumbnail: ${req.file.originalname}`);

      // Upload to iDrive E2
      const thumbnailUrl = await uploadThumbnailToStorage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        message: "Thumbnail uploaded successfully",
        thumbnailUrl
      });
    } catch (error: any) {
      console.error("Error uploading thumbnail:", error);
      res.status(500).json({ message: "Failed to upload thumbnail: " + error.message });
    }
  });

  // Channel avatar/logo upload
  app.post("/api/upload/avatar", (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            message: `Avatar too large. Maximum upload size is 10MB.`
          });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      // Check storage configuration
      if (!isStorageConfigured()) {
        return res.status(503).json({ 
          message: "Storage not configured",
          configured: false
        });
      }

      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No avatar file provided" });
      }

      console.log(`Uploading avatar: ${req.file.originalname}`);

      // Upload to iDrive E2 (reuse thumbnail storage for avatars)
      const avatarUrl = await uploadThumbnailToStorage(
        req.file.buffer,
        `avatar-${req.file.originalname}`,
        req.file.mimetype
      );

      res.json({
        message: "Avatar uploaded successfully",
        avatarUrl
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar: " + error.message });
    }
  });

  // Check storage configuration status
  app.get("/api/storage/status", async (req, res) => {
    res.json({
      configured: isStorageConfigured(),
      provider: "iDrive E2",
      cdnEnabled: !!process.env.CLOUDFLARE_CDN_URL,
      maxUploadSize: MAX_UPLOAD_SIZE,
      maxUploadSizeMB: Math.floor(MAX_UPLOAD_SIZE / (1024 * 1024))
    });
  });

  // Create video (upload)
  app.post("/api/videos", async (req: any, res) => {
    try {
      // Get user ID from session or Replit Auth
      let userId = null;
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (req.isAuthenticated() && req.user?.id) {
        userId = req.user.id;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId;
      }

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - Please login to upload videos" });
      }

      // Get user's channel
      const channel = await storage.getChannelByUserId(userId);
      if (!channel) {
        return res.status(400).json({ message: "You need to create a channel before uploading videos" });
      }

      // Validate required fields
      const { title, thumbnail, videoUrl, duration, description, category, visibility, storageKey } = req.body;
      
      if (!title || !thumbnail || !videoUrl || !duration) {
        return res.status(400).json({ message: "Missing required fields: title, thumbnail, videoUrl, duration" });
      }

      // Create video data
      const videoData = insertVideoSchema.parse({
        title,
        thumbnail,
        videoUrl,
        duration,
        channelId: channel.id,
        description: description || null,
        category: category || null,
        storageKey: storageKey || null,
        isShorts: duration && duration.includes(':') && parseInt(duration.split(':')[0]) === 0 && parseInt(duration.split(':')[1]) < 60,
      });

      const video = await storage.createVideo(videoData);
      
      // Create notifications for all subscribers of this channel
      const channelSubscribers = await storage.getChannelSubscribers(channel.id);
      const notificationPromises = channelSubscribers.map(async (subscriber) => {
        await storage.createNotification({
          userId: subscriber.userId,
          type: 'video_upload',
          title: `New video from ${channel.name}`,
          content: video.title,
          videoId: video.id,
          channelId: channel.id,
          thumbnail: video.thumbnail,
        });
      });
      
      await Promise.all(notificationPromises);
      
      res.status(201).json({
        message: "Video uploaded successfully",
        video: { ...video, channel }
      });
    } catch (error: any) {
      console.error("Error creating video:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid video data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Update video (edit details)
  app.patch("/api/videos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get video and verify ownership
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const channel = await storage.getChannel(video.channelId);
      if (!channel || channel.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own videos" });
      }

      // Update video
      const { title, description, category, thumbnail, visibility } = req.body;
      const updates: Partial<typeof video> = {};
      
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (thumbnail !== undefined) updates.thumbnail = thumbnail;
      if (visibility !== undefined) updates.visibility = visibility;

      const updatedVideo = await storage.updateVideo(req.params.id, updates);
      res.json({ message: "Video updated successfully", video: updatedVideo });
    } catch (error: any) {
      console.error("Error updating video:", error);
      res.status(500).json({ message: "Failed to update video" });
    }
  });

  // Delete video
  app.delete("/api/videos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get video and verify ownership
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const channel = await storage.getChannel(video.channelId);
      if (!channel || channel.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own videos" });
      }

      // Delete video
      const deleted = await storage.deleteVideo(req.params.id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete video" });
      }

      res.json({ message: "Video deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Failed to delete video" });
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
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const subData = insertSubscriptionSchema.parse({ ...req.body, userId });
      const subscription = await storage.subscribe(subData);
      
      // Notify channel owner about new subscriber
      const channel = await storage.getChannel(subscription.channelId);
      if (channel) {
        const subscriber = await storage.getUser(userId);
        if (subscriber) {
          await storage.createNotification({
            userId: channel.userId,
            type: 'new_subscriber',
            title: 'New subscriber',
            content: `${subscriber.username || subscriber.firstName || 'Someone'} subscribed to your channel`,
            channelId: channel.id,
            thumbnail: subscriber.profileImageUrl || null,
          });
        }
      }
      
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data" });
    }
  });

  app.delete("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
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
  app.post("/api/users/:userId/block", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Users can only block channels for themselves
      if (userId !== req.params.userId) {
        return res.status(403).json({ message: "Forbidden: Can only block channels for your own account" });
      }
      
      const { channelId } = req.body;
      if (!channelId) {
        return res.status(400).json({ message: "Channel ID required" });
      }
      const blocked = await storage.blockChannel(userId, channelId);
      res.json({ blocked });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:userId/block/:channelId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Users can only unblock channels for themselves
      if (userId !== req.params.userId) {
        return res.status(403).json({ message: "Forbidden: Can only unblock channels for your own account" });
      }
      
      const unblocked = await storage.unblockChannel(userId, req.params.channelId);
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
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId,
        videoId: req.params.videoId
      });
      const comment = await storage.createComment(commentData);
      
      // Notify video owner about new comment
      const video = await storage.getVideo(req.params.videoId);
      if (video) {
        const channel = await storage.getChannel(video.channelId);
        if (channel && channel.userId !== userId) {
          const commenter = await storage.getUser(userId);
          await storage.createNotification({
            userId: channel.userId,
            type: 'comment',
            title: 'New comment on your video',
            content: `${commenter?.username || commenter?.firstName || 'Someone'} commented: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
            videoId: video.id,
            channelId: channel.id,
            thumbnail: video.thumbnail,
          });
        }
      }
      
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
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const comment = await storage.getComment(req.params.id);
      if (!comment || comment.userId !== userId) {
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

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getNotifications(req.params.userId, limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/notifications/:userId/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadCount(req.params.userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const marked = await storage.markNotificationAsRead(req.params.id);
      if (!marked) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:userId/mark-all-read", async (req, res) => {
    try {
      const marked = await storage.markAllNotificationsAsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
