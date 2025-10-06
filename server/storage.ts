import { type User, type InsertUser, type UpsertUser, type Channel, type InsertChannel, type Video, type InsertVideo, type Space, type InsertSpace, type Subscription, type InsertSubscription, type Comment, type InsertComment, type Like, type InsertLike, type WatchHistory, type InsertWatchHistory, type Playlist, type InsertPlaylist, type PlaylistVideo, type InsertPlaylistVideo, type VideoWithChannel, type SpaceWithChannels } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  incrementViewCount(videoId: string): Promise<boolean>;

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

  // Comment methods
  getComment(id: string): Promise<Comment | undefined>;
  getCommentsByVideo(videoId: string, limit?: number, offset?: number, sortBy?: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, updates: Partial<Comment>): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<boolean>;
  likeComment(commentId: string): Promise<boolean>;

  // Like methods
  toggleLike(like: InsertLike): Promise<Like | null>;
  getLikeCounts(videoId: string): Promise<{ likes: number; dislikes: number }>;
  getUserLike(userId: string, videoId: string): Promise<Like | undefined>;

  // Watch History methods
  addToWatchHistory(history: InsertWatchHistory): Promise<WatchHistory>;
  getWatchHistory(userId: string, limit?: number, offset?: number): Promise<WatchHistory[]>;
  clearWatchHistory(userId: string): Promise<boolean>;

  // Playlist methods
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<boolean>;
  addVideoToPlaylist(playlistVideo: InsertPlaylistVideo): Promise<PlaylistVideo>;
  removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<boolean>;
  getPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private channels: Map<string, Channel> = new Map();
  private videos: Map<string, Video> = new Map();
  private spaces: Map<string, Space> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private comments: Map<string, Comment> = new Map();
  private likes: Map<string, Like> = new Map();
  private watchHistory: Map<string, WatchHistory> = new Map();
  private playlists: Map<string, Playlist> = new Map();
  private playlistVideos: Map<string, PlaylistVideo> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // No initial seed data - clean start
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      personalMode: false, 
      blockedChannels: [],
      username: insertUser.username ?? null,
      email: insertUser.email ?? null,
      password: insertUser.password ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      authProvider: insertUser.authProvider ?? "email",
      oauthId: insertUser.oauthId ?? null,
      isVerified: insertUser.isVerified ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
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
      avatar: insertChannel.avatar ?? null,
      createdAt: new Date()
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
      isShorts: insertVideo.isShorts ?? false,
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id ?? '');
    if (existingUser && userData.id) {
      const updatedUser = { ...existingUser, ...userData, id: userData.id, updatedAt: new Date() };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    }
    const id = userData.id ?? randomUUID();
    const newUser: User = { 
      id,
      username: userData.username ?? null,
      email: userData.email ?? null,
      password: userData.password ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      personalMode: userData.personalMode ?? false, 
      blockedChannels: userData.blockedChannels ?? [],
      authProvider: userData.authProvider ?? "email",
      oauthId: userData.oauthId ?? null,
      isVerified: userData.isVerified ?? false,
      createdAt: userData.createdAt ?? new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async incrementViewCount(videoId: string): Promise<boolean> {
    const video = this.videos.get(videoId);
    if (!video) return false;
    
    video.views = (video.views || 0) + 1;
    this.videos.set(videoId, video);
    return true;
  }

  async getComment(id: string): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByVideo(videoId: string, limit: number = 50, offset: number = 0, sortBy: string = 'createdAt'): Promise<Comment[]> {
    let comments = Array.from(this.comments.values()).filter(comment => comment.videoId === videoId);
    
    if (sortBy === 'likes') {
      comments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      comments.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
    }
    
    return comments.slice(offset, offset + limit);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = { 
      ...insertComment,
      id,
      parentId: insertComment.parentId ?? null,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updatedComment = { ...comment, ...updates, updatedAt: new Date() };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async likeComment(commentId: string): Promise<boolean> {
    const comment = this.comments.get(commentId);
    if (!comment) return false;
    
    comment.likes = (comment.likes || 0) + 1;
    this.comments.set(commentId, comment);
    return true;
  }

  async toggleLike(insertLike: InsertLike): Promise<Like | null> {
    const existingLike = Array.from(this.likes.values()).find(
      like => like.userId === insertLike.userId && like.videoId === insertLike.videoId
    );

    if (existingLike) {
      if (existingLike.type === insertLike.type) {
        this.likes.delete(existingLike.id);
        return null;
      } else {
        existingLike.type = insertLike.type;
        this.likes.set(existingLike.id, existingLike);
        return existingLike;
      }
    }

    const id = randomUUID();
    const like: Like = { ...insertLike, id, createdAt: new Date() };
    this.likes.set(id, like);
    return like;
  }

  async getLikeCounts(videoId: string): Promise<{ likes: number; dislikes: number }> {
    const videoLikes = Array.from(this.likes.values()).filter(like => like.videoId === videoId);
    const likes = videoLikes.filter(like => like.type === 'like').length;
    const dislikes = videoLikes.filter(like => like.type === 'dislike').length;
    return { likes, dislikes };
  }

  async getUserLike(userId: string, videoId: string): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.videoId === videoId
    );
  }

  async addToWatchHistory(insertHistory: InsertWatchHistory): Promise<WatchHistory> {
    const id = randomUUID();
    const history: WatchHistory = { 
      ...insertHistory, 
      id, 
      watchedAt: new Date()
    };
    this.watchHistory.set(id, history);
    return history;
  }

  async getWatchHistory(userId: string, limit: number = 50, offset: number = 0): Promise<WatchHistory[]> {
    const history = Array.from(this.watchHistory.values())
      .filter(h => h.userId === userId)
      .sort((a, b) => b.watchedAt!.getTime() - a.watchedAt!.getTime());
    
    return history.slice(offset, offset + limit);
  }

  async clearWatchHistory(userId: string): Promise<boolean> {
    const userHistory = Array.from(this.watchHistory.entries())
      .filter(([_, h]) => h.userId === userId);
    
    userHistory.forEach(([id, _]) => this.watchHistory.delete(id));
    return true;
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(playlist => playlist.userId === userId);
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = randomUUID();
    const playlist: Playlist = { 
      ...insertPlaylist,
      id,
      description: insertPlaylist.description ?? null,
      isPublic: insertPlaylist.isPublic ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.playlists.set(id, playlist);
    return playlist;
  }

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined> {
    const playlist = this.playlists.get(id);
    if (!playlist) return undefined;
    
    const updatedPlaylist = { ...playlist, ...updates, updatedAt: new Date() };
    this.playlists.set(id, updatedPlaylist);
    return updatedPlaylist;
  }

  async deletePlaylist(id: string): Promise<boolean> {
    const deleted = this.playlists.delete(id);
    if (deleted) {
      const playlistVideosToDelete = Array.from(this.playlistVideos.entries())
        .filter(([_, pv]) => pv.playlistId === id);
      playlistVideosToDelete.forEach(([id, _]) => this.playlistVideos.delete(id));
    }
    return deleted;
  }

  async addVideoToPlaylist(insertPlaylistVideo: InsertPlaylistVideo): Promise<PlaylistVideo> {
    const id = randomUUID();
    const playlistVideo: PlaylistVideo = { 
      ...insertPlaylistVideo, 
      id, 
      addedAt: new Date()
    };
    this.playlistVideos.set(id, playlistVideo);
    return playlistVideo;
  }

  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    const playlistVideo = Array.from(this.playlistVideos.entries()).find(
      ([_, pv]) => pv.playlistId === playlistId && pv.videoId === videoId
    );
    
    if (playlistVideo) {
      return this.playlistVideos.delete(playlistVideo[0]);
    }
    return false;
  }

  async getPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
    return Array.from(this.playlistVideos.values())
      .filter(pv => pv.playlistId === playlistId)
      .sort((a, b) => a.position - b.position);
  }
}

import { db } from "./db";
import { users, channels, videos, spaces, subscriptions, comments, likes, watchHistory, playlists, playlistVideos } from "@shared/schema";
import { eq, and, or, ilike, inArray, sql, desc } from "drizzle-orm";

export class DbStorage implements IStorage {
  private normalizeArray<T>(result: T[] | null): T[] {
    return result || [];
  }

  private isNeonNullError(error: unknown): boolean {
    return error instanceof TypeError && 
           (error.message.includes("Cannot read properties of null") ||
            error.message.includes("Cannot read property 'map' of null"));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
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
    try {
      const result = await db.select().from(channels);
      return this.normalizeArray(result);
    } catch (error) {
      if (this.isNeonNullError(error)) {
        console.log("Neon null result detected in getAllChannels, returning empty array");
        return [];
      }
      throw error;
    }
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
    let userSpaces: Space[];
    try {
      userSpaces = await db.select().from(spaces).where(eq(spaces.userId, userId));
      userSpaces = this.normalizeArray(userSpaces);
    } catch (error) {
      if (this.isNeonNullError(error)) {
        console.log("Neon null result detected in getSpacesByUser, returning empty array");
        userSpaces = [];
      } else {
        throw error;
      }
    }

    const spacesWithChannels = await Promise.all(
      userSpaces.map(async (space) => {
        const channelIds = space.channelIds || [];
        let spaceChannels: Channel[];
        try {
          spaceChannels = channelIds.length > 0
            ? await db.select().from(channels).where(inArray(channels.id, channelIds))
            : [];
          spaceChannels = this.normalizeArray(spaceChannels);
        } catch (error) {
          if (this.isNeonNullError(error)) {
            console.log("Neon null result detected in getSpacesByUser channels, returning empty array");
            spaceChannels = [];
          } else {
            throw error;
          }
        }

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
    try {
      const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
      return this.normalizeArray(result);
    } catch (error) {
      if (this.isNeonNullError(error)) {
        console.log("Neon null result detected in getSubscriptions, returning empty array");
        return [];
      }
      throw error;
    }
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

    try {
      const result = await db.select().from(channels).where(inArray(channels.id, user.blockedChannels));
      return this.normalizeArray(result);
    } catch (error) {
      if (this.isNeonNullError(error)) {
        console.log("Neon null result detected in getBlockedChannels, returning empty array");
        return [];
      }
      throw error;
    }
  }

  async incrementViewCount(videoId: string): Promise<boolean> {
    const result = await db
      .update(videos)
      .set({ views: sql`${videos.views} + 1` })
      .where(eq(videos.id, videoId))
      .returning();
    return result.length > 0;
  }

  async getComment(id: string): Promise<Comment | undefined> {
    const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return result[0];
  }

  async getCommentsByVideo(videoId: string, limit: number = 50, offset: number = 0, sortBy: string = 'createdAt'): Promise<Comment[]> {
    try {
      let query = db
        .select()
        .from(comments)
        .where(eq(comments.videoId, videoId))
        .limit(limit)
        .offset(offset);

      if (sortBy === 'likes') {
        query = query.orderBy(desc(comments.likes)) as any;
      } else {
        query = query.orderBy(desc(comments.createdAt)) as any;
      }

      const result = await query;
      return this.normalizeArray(result);
    } catch (error) {
      if (this.isNeonNullError(error)) {
        console.log("Neon null result detected in getCommentsByVideo, returning empty array");
        return [];
      }
      throw error;
    }
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(insertComment).returning();
    return result[0];
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment | undefined> {
    const result = await db
      .update(comments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id)).returning();
    return result.length > 0;
  }

  async likeComment(commentId: string): Promise<boolean> {
    const result = await db
      .update(comments)
      .set({ likes: sql`${comments.likes} + 1` })
      .where(eq(comments.id, commentId))
      .returning();
    return result.length > 0;
  }

  async toggleLike(insertLike: InsertLike): Promise<Like | null> {
    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, insertLike.userId), eq(likes.videoId, insertLike.videoId)))
      .limit(1);

    if (existingLike.length > 0) {
      const existing = existingLike[0];
      if (existing.type === insertLike.type) {
        await db
          .delete(likes)
          .where(and(eq(likes.userId, insertLike.userId), eq(likes.videoId, insertLike.videoId)));
        return null;
      } else {
        const updated = await db
          .update(likes)
          .set({ type: insertLike.type })
          .where(and(eq(likes.userId, insertLike.userId), eq(likes.videoId, insertLike.videoId)))
          .returning();
        return updated[0];
      }
    }

    const result = await db.insert(likes).values(insertLike).returning();
    return result[0];
  }

  async getLikeCounts(videoId: string): Promise<{ likes: number; dislikes: number }> {
    const result = await db
      .select({
        type: likes.type,
        count: sql<number>`count(*)`,
      })
      .from(likes)
      .where(eq(likes.videoId, videoId))
      .groupBy(likes.type);

    const likesCount = result.find(r => r.type === 'like')?.count || 0;
    const dislikesCount = result.find(r => r.type === 'dislike')?.count || 0;

    return {
      likes: Number(likesCount),
      dislikes: Number(dislikesCount),
    };
  }

  async getUserLike(userId: string, videoId: string): Promise<Like | undefined> {
    const result = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)))
      .limit(1);
    return result[0];
  }

  async addToWatchHistory(insertHistory: InsertWatchHistory): Promise<WatchHistory> {
    const result = await db.insert(watchHistory).values(insertHistory).returning();
    return result[0];
  }

  async getWatchHistory(userId: string, limit: number = 50, offset: number = 0): Promise<WatchHistory[]> {
    try {
      const result = await db
        .select()
        .from(watchHistory)
        .where(eq(watchHistory.userId, userId))
        .orderBy(desc(watchHistory.watchedAt))
        .limit(limit)
        .offset(offset);
      return this.normalizeArray(result);
    } catch (error) {
      if (this.isNeonNullError(error)) {
        console.log("Neon null result detected in getWatchHistory, returning empty array");
        return [];
      }
      throw error;
    }
  }

  async clearWatchHistory(userId: string): Promise<boolean> {
    const result = await db.delete(watchHistory).where(eq(watchHistory.userId, userId)).returning();
    return result.length > 0;
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const result = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
    return result[0];
  }

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    try {
      const result = await db.select().from(playlists).where(eq(playlists.userId, userId));
      return this.normalizeArray(result);
    } catch (error) {
      if (this.isNeonNullError(error)) {
        console.log("Neon null result detected in getPlaylistsByUser, returning empty array");
        return [];
      }
      throw error;
    }
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const result = await db.insert(playlists).values(insertPlaylist).returning();
    return result[0];
  }

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined> {
    const result = await db
      .update(playlists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playlists.id, id))
      .returning();
    return result[0];
  }

  async deletePlaylist(id: string): Promise<boolean> {
    await db.delete(playlistVideos).where(eq(playlistVideos.playlistId, id));
    const result = await db.delete(playlists).where(eq(playlists.id, id)).returning();
    return result.length > 0;
  }

  async addVideoToPlaylist(insertPlaylistVideo: InsertPlaylistVideo): Promise<PlaylistVideo> {
    const result = await db.insert(playlistVideos).values(insertPlaylistVideo).returning();
    return result[0];
  }

  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    const result = await db
      .delete(playlistVideos)
      .where(and(eq(playlistVideos.playlistId, playlistId), eq(playlistVideos.videoId, videoId)))
      .returning();
    return result.length > 0;
  }

  async getPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
    try {
      const result = await db
        .select()
        .from(playlistVideos)
        .where(eq(playlistVideos.playlistId, playlistId))
        .orderBy(playlistVideos.position);
      return this.normalizeArray(result);
    } catch (error) {
      if (this.isNeonNullError(error)) {
        console.log("Neon null result detected in getPlaylistVideos, returning empty array");
        return [];
      }
      throw error;
    }
  }
}

export const storage = new DbStorage();
