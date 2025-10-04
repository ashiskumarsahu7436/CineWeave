import { type User, type InsertUser, type UpsertUser, type Channel, type InsertChannel, type Video, type InsertVideo, type Space, type InsertSpace, type Subscription, type InsertSubscription, type VideoWithChannel, type SpaceWithChannels } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Channel methods
  getChannel(id: string): Promise<Channel | undefined>;
  getChannelByUsername(username: string): Promise<Channel | undefined>;
  getAllChannels(): Promise<Channel[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;

  // Video methods
  getVideo(id: string): Promise<Video | undefined>;
  getVideos(limit?: number, category?: string): Promise<VideoWithChannel[]>;
  getVideosByChannel(channelId: string): Promise<VideoWithChannel[]>;
  getVideosByChannels(channelIds: string[]): Promise<VideoWithChannel[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  searchVideos(query: string): Promise<VideoWithChannel[]>;

  // Space methods
  getSpace(id: string): Promise<Space | undefined>;
  getSpacesByUser(userId: string): Promise<SpaceWithChannels[]>;
  createSpace(space: InsertSpace): Promise<Space>;
  updateSpace(id: string, updates: Partial<Space>): Promise<Space | undefined>;
  deleteSpace(id: string): Promise<boolean>;

  // Subscription methods
  getSubscriptions(userId: string): Promise<Subscription[]>;
  isSubscribed(userId: string, channelId: string): Promise<boolean>;
  subscribe(subscription: InsertSubscription): Promise<Subscription>;
  unsubscribe(userId: string, channelId: string): Promise<boolean>;

  // Blocking methods
  blockChannel(userId: string, channelId: string): Promise<boolean>;
  unblockChannel(userId: string, channelId: string): Promise<boolean>;
  getBlockedChannels(userId: string): Promise<Channel[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private channels: Map<string, Channel> = new Map();
  private videos: Map<string, Video> = new Map();
  private spaces: Map<string, Space> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed some initial data for demonstration
    const sampleChannels: Channel[] = [
      {
        id: "ch1",
        name: "A Gamingcraft",
        username: "@agamingcraft",
        avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop",
        verified: true,
        subscribers: 1200000,
        description: "Gaming content creator"
      },
      {
        id: "ch2",
        name: "A Filmcraft",
        username: "@afilmcraft",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
        verified: true,
        subscribers: 1200000,
        description: "Film and documentary content"
      },
      {
        id: "ch3",
        name: "Tech Vision",
        username: "@techvision",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
        verified: true,
        subscribers: 2100000,
        description: "Technology and architecture"
      }
    ];

    const sampleVideos: Video[] = [
      {
        id: "v1",
        title: "Uncharted Ruins of Eldoris",
        thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=480&h=270&fit=crop",
        duration: "12:48",
        views: 1200000,
        channelId: "ch1",
        uploadedAt: new Date("2024-09-15"),
        isLive: false,
        description: "Epic fantasy adventure gameplay",
        category: "Gaming"
      },
      {
        id: "v2",
        title: "Exploration X: The Hidden Valleys",
        thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=270&fit=crop",
        duration: "22:48",
        views: 1200000,
        channelId: "ch2",
        uploadedAt: new Date("2024-09-15"),
        isLive: false,
        description: "Documentary about hidden valleys",
        category: "Movies"
      },
      {
        id: "v3",
        title: "Pro Tournament Live: Finals Day",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=480&h=270&fit=crop",
        duration: "",
        views: 45000,
        channelId: "ch1",
        uploadedAt: new Date(),
        isLive: true,
        description: "Live gaming tournament",
        category: "Gaming"
      }
    ];

    // Seed data
    sampleChannels.forEach(channel => this.channels.set(channel.id, channel));
    sampleVideos.forEach(video => this.videos.set(video.id, video));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, personalMode: false, blockedChannels: [] };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Channel methods
  async getChannel(id: string): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async getChannelByUsername(username: string): Promise<Channel | undefined> {
    return Array.from(this.channels.values()).find(channel => channel.username === username);
  }

  async getAllChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = randomUUID();
    const channel: Channel = { 
      ...insertChannel, 
      id, 
      subscribers: 0, 
      verified: false,
      description: insertChannel.description ?? null,
      avatar: insertChannel.avatar ?? null
    };
    this.channels.set(id, channel);
    return channel;
  }

  // Video methods
  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getVideos(limit?: number, category?: string): Promise<VideoWithChannel[]> {
    let videos = Array.from(this.videos.values());
    
    if (category) {
      videos = videos.filter(video => video.category === category);
    }
    
    if (limit) {
      videos = videos.slice(0, limit);
    }

    return videos.map(video => ({
      ...video,
      channel: this.channels.get(video.channelId)!
    }));
  }

  async getVideosByChannel(channelId: string): Promise<VideoWithChannel[]> {
    const videos = Array.from(this.videos.values()).filter(video => video.channelId === channelId);
    return videos.map(video => ({
      ...video,
      channel: this.channels.get(video.channelId)!
    }));
  }

  async getVideosByChannels(channelIds: string[]): Promise<VideoWithChannel[]> {
    const videos = Array.from(this.videos.values()).filter(video => channelIds.includes(video.channelId));
    return videos.map(video => ({
      ...video,
      channel: this.channels.get(video.channelId)!
    }));
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = { 
      ...insertVideo, 
      id, 
      views: 0, 
      uploadedAt: new Date(), 
      isLive: false,
      description: insertVideo.description ?? null,
      category: insertVideo.category ?? null
    };
    this.videos.set(id, video);
    return video;
  }

  async searchVideos(query: string): Promise<VideoWithChannel[]> {
    const videos = Array.from(this.videos.values()).filter(video => 
      video.title.toLowerCase().includes(query.toLowerCase()) ||
      video.description?.toLowerCase().includes(query.toLowerCase())
    );
    
    return videos.map(video => ({
      ...video,
      channel: this.channels.get(video.channelId)!
    }));
  }

  // Space methods
  async getSpace(id: string): Promise<Space | undefined> {
    return this.spaces.get(id);
  }

  async getSpacesByUser(userId: string): Promise<SpaceWithChannels[]> {
    const userSpaces = Array.from(this.spaces.values()).filter(space => space.userId === userId);
    
    return userSpaces.map(space => ({
      ...space,
      channels: (space.channelIds || []).map(id => this.channels.get(id)!).filter(Boolean),
      videoCount: Array.from(this.videos.values()).filter(video => (space.channelIds || []).includes(video.channelId)).length
    }));
  }

  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    const id = randomUUID();
    const space: Space = { 
      ...insertSpace, 
      id, 
      channelIds: [],
      description: insertSpace.description ?? null,
      icon: insertSpace.icon ?? null,
      color: insertSpace.color ?? null
    };
    this.spaces.set(id, space);
    return space;
  }

  async updateSpace(id: string, updates: Partial<Space>): Promise<Space | undefined> {
    const space = this.spaces.get(id);
    if (!space) return undefined;
    
    const updatedSpace = { ...space, ...updates };
    this.spaces.set(id, updatedSpace);
    return updatedSpace;
  }

  async deleteSpace(id: string): Promise<boolean> {
    return this.spaces.delete(id);
  }

  // Subscription methods
  async getSubscriptions(userId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => sub.userId === userId);
  }

  async isSubscribed(userId: string, channelId: string): Promise<boolean> {
    return Array.from(this.subscriptions.values()).some(sub => 
      sub.userId === userId && sub.channelId === channelId
    );
  }

  async subscribe(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = { ...insertSubscription, id };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async unsubscribe(userId: string, channelId: string): Promise<boolean> {
    const subscription = Array.from(this.subscriptions.values()).find(sub => 
      sub.userId === userId && sub.channelId === channelId
    );
    
    if (subscription) {
      return this.subscriptions.delete(subscription.id);
    }
    return false;
  }

  // Blocking methods
  async blockChannel(userId: string, channelId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const blockedChannels = user.blockedChannels || [];
    if (!blockedChannels.includes(channelId)) {
      blockedChannels.push(channelId);
      user.blockedChannels = blockedChannels;
      this.users.set(userId, user);
    }
    return true;
  }

  async unblockChannel(userId: string, channelId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    user.blockedChannels = (user.blockedChannels || []).filter(id => id !== channelId);
    this.users.set(userId, user);
    return true;
  }

  async getBlockedChannels(userId: string): Promise<Channel[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    return (user.blockedChannels || []).map(id => this.channels.get(id)!).filter(Boolean);
  }
}

import { db } from "./db";
import { users, channels, videos, spaces, subscriptions } from "@shared/schema";
import { eq, and, or, ilike, inArray, sql } from "drizzle-orm";

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // Channel methods
  async getChannel(id: string): Promise<Channel | undefined> {
    const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
    return result[0];
  }

  async getChannelByUsername(username: string): Promise<Channel | undefined> {
    const result = await db.select().from(channels).where(eq(channels.username, username)).limit(1);
    return result[0];
  }

  async getAllChannels(): Promise<Channel[]> {
    return await db.select().from(channels);
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const result = await db.insert(channels).values(insertChannel).returning();
    return result[0];
  }

  // Video methods
  async getVideo(id: string): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
    return result[0];
  }

  async getVideos(limit?: number, category?: string): Promise<VideoWithChannel[]> {
    let query = db
      .select({
        video: videos,
        channel: channels,
      })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .orderBy(sql`${videos.uploadedAt} DESC`);

    if (category) {
      query = query.where(eq(videos.category, category)) as any;
    }

    if (limit) {
      query = query.limit(limit) as any;
    }

    const results = await query;
    return results.map(r => ({ ...r.video, channel: r.channel }));
  }

  async getVideosByChannel(channelId: string): Promise<VideoWithChannel[]> {
    const results = await db
      .select({
        video: videos,
        channel: channels,
      })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(eq(videos.channelId, channelId))
      .orderBy(sql`${videos.uploadedAt} DESC`);

    return results.map(r => ({ ...r.video, channel: r.channel }));
  }

  async getVideosByChannels(channelIds: string[]): Promise<VideoWithChannel[]> {
    if (channelIds.length === 0) return [];

    const results = await db
      .select({
        video: videos,
        channel: channels,
      })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(inArray(videos.channelId, channelIds))
      .orderBy(sql`${videos.uploadedAt} DESC`);

    return results.map(r => ({ ...r.video, channel: r.channel }));
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const result = await db.insert(videos).values(insertVideo).returning();
    return result[0];
  }

  async searchVideos(query: string): Promise<VideoWithChannel[]> {
    const results = await db
      .select({
        video: videos,
        channel: channels,
      })
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(
        or(
          ilike(videos.title, `%${query}%`),
          ilike(videos.description, `%${query}%`)
        )
      )
      .orderBy(sql`${videos.uploadedAt} DESC`);

    return results.map(r => ({ ...r.video, channel: r.channel }));
  }

  // Space methods
  async getSpace(id: string): Promise<Space | undefined> {
    const result = await db.select().from(spaces).where(eq(spaces.id, id)).limit(1);
    return result[0];
  }

  async getSpacesByUser(userId: string): Promise<SpaceWithChannels[]> {
    const userSpaces = await db.select().from(spaces).where(eq(spaces.userId, userId));

    const spacesWithChannels = await Promise.all(
      userSpaces.map(async (space) => {
        const channelIds = space.channelIds || [];
        const spaceChannels = channelIds.length > 0
          ? await db.select().from(channels).where(inArray(channels.id, channelIds))
          : [];

        const videoCount = channelIds.length > 0
          ? await db.select({ count: sql<number>`count(*)` })
              .from(videos)
              .where(inArray(videos.channelId, channelIds))
              .then(result => Number(result[0]?.count || 0))
          : 0;

        return {
          ...space,
          channels: spaceChannels,
          videoCount,
        };
      })
    );

    return spacesWithChannels;
  }

  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    const result = await db.insert(spaces).values(insertSpace).returning();
    return result[0];
  }

  async updateSpace(id: string, updates: Partial<Space>): Promise<Space | undefined> {
    const result = await db.update(spaces).set(updates).where(eq(spaces.id, id)).returning();
    return result[0];
  }

  async deleteSpace(id: string): Promise<boolean> {
    const result = await db.delete(spaces).where(eq(spaces.id, id)).returning();
    return result.length > 0;
  }

  // Subscription methods
  async getSubscriptions(userId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }

  async isSubscribed(userId: string, channelId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId)))
      .limit(1);
    return result.length > 0;
  }

  async subscribe(insertSubscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(insertSubscription).returning();
    return result[0];
  }

  async unsubscribe(userId: string, channelId: string): Promise<boolean> {
    const result = await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId)))
      .returning();
    return result.length > 0;
  }

  // Blocking methods
  async blockChannel(userId: string, channelId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const blockedChannels = user.blockedChannels || [];
    if (!blockedChannels.includes(channelId)) {
      blockedChannels.push(channelId);
      await this.updateUser(userId, { blockedChannels });
    }
    return true;
  }

  async unblockChannel(userId: string, channelId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const blockedChannels = (user.blockedChannels || []).filter(id => id !== channelId);
    await this.updateUser(userId, { blockedChannels });
    return true;
  }

  async getBlockedChannels(userId: string): Promise<Channel[]> {
    const user = await this.getUser(userId);
    if (!user || !user.blockedChannels || user.blockedChannels.length === 0) return [];

    return await db.select().from(channels).where(inArray(channels.id, user.blockedChannels));
  }
}

export const storage = new DbStorage();
