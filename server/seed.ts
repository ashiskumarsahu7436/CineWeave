import { db } from "./db";
import { channels, videos, users, comments, likes, subscriptions } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  const existingChannels = await db.select().from(channels).limit(1);
  if (existingChannels.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  const sampleUsers = [
    {
      username: "viewer1",
      email: "viewer1@cineweave.com",
      firstName: "Alex",
      lastName: "Johnson",
      profileImageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop",
      personalMode: false,
      blockedChannels: [],
    },
    {
      username: "techfan",
      email: "techfan@cineweave.com",
      firstName: "Sarah",
      lastName: "Chen",
      profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
      personalMode: false,
      blockedChannels: [],
    },
    {
      username: "gamerlord",
      email: "gamer@cineweave.com",
      firstName: "Mike",
      lastName: "Thompson",
      profileImageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop",
      personalMode: true,
      blockedChannels: [],
    },
  ];

  const createdUsers = await db.insert(users).values(sampleUsers).returning();
  console.log(`Created ${createdUsers.length} users`);

  const sampleChannels = [
    {
      userId: createdUsers[0].id,
      name: "A Gamingcraft",
      username: "@agamingcraft",
      avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 1200000,
      description: "Epic gaming adventures and walkthroughs",
    },
    {
      userId: createdUsers[1].id,
      name: "A Filmcraft",
      username: "@afilmcraft",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 1200000,
      description: "Film analysis and cinematic storytelling",
    },
    {
      userId: createdUsers[2].id,
      name: "Tech Vision",
      username: "@techvision",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 2100000,
      description: "Technology reviews and tutorials",
    },
    {
      userId: createdUsers[0].id,
      name: "Cooking Masters",
      username: "@cookingmasters",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 850000,
      description: "Professional cooking tutorials and recipes",
    },
    {
      userId: createdUsers[1].id,
      name: "Nature Explorer",
      username: "@natureexplorer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 3500000,
      description: "Wildlife documentaries and nature exploration",
    },
    {
      userId: createdUsers[2].id,
      name: "Fitness Pro",
      username: "@fitnesspro",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
      verified: false,
      subscribers: 450000,
      description: "Workout routines and fitness tips",
    },
    {
      userId: createdUsers[0].id,
      name: "Music Vibes",
      username: "@musicvibes",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 5200000,
      description: "Latest music videos and live performances",
    },
    {
      userId: createdUsers[1].id,
      name: "Science Daily",
      username: "@sciencedaily",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 1800000,
      description: "Science experiments and educational content",
    },
    {
      userId: createdUsers[2].id,
      name: "Travel World",
      username: "@travelworld",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 2900000,
      description: "Travel vlogs from around the world",
    },
    {
      userId: createdUsers[0].id,
      name: "Comedy Central",
      username: "@comedycentral",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
      verified: false,
      subscribers: 670000,
      description: "Stand-up comedy and funny sketches",
    },
  ];

  const createdChannels = await db.insert(channels).values(sampleChannels).returning();
  console.log(`Created ${createdChannels.length} channels`);

  const sampleVideos = [
    {
      title: "Uncharted Ruins of Eldoris",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: "12:48",
      views: 1200000,
      channelId: createdChannels[0].id,
      isLive: false,
      description: "Exploring the mysterious ruins in this epic fantasy adventure",
      category: "Gaming",
    },
    {
      title: "Exploration X: The Hidden Valleys",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      duration: "22:48",
      views: 1200000,
      channelId: createdChannels[1].id,
      isLive: false,
      description: "A cinematic journey through hidden valleys and ancient landscapes",
      category: "Movies",
    },
    {
      title: "Pro Tournament Live: Finals Day",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      duration: "",
      views: 45000,
      channelId: createdChannels[0].id,
      isLive: true,
      description: "Live coverage of the championship finals",
      category: "Gaming",
    },
    {
      title: "iPhone 16 Pro Review - Best Phone of 2025?",
      thumbnail: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      duration: "15:32",
      views: 890000,
      channelId: createdChannels[2].id,
      isLive: false,
      description: "Comprehensive review of the latest iPhone flagship",
      category: "Technology",
    },
    {
      title: "Perfect Italian Pasta - 3 Simple Recipes",
      thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      duration: "18:24",
      views: 520000,
      channelId: createdChannels[3].id,
      isLive: false,
      description: "Master these classic Italian pasta dishes",
      category: "Food",
    },
    {
      title: "Amazon Rainforest Wildlife Documentary",
      thumbnail: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      duration: "45:12",
      views: 2100000,
      channelId: createdChannels[4].id,
      isLive: false,
      description: "Stunning 4K footage of Amazon rainforest wildlife",
      category: "Documentary",
    },
    {
      title: "Full Body Workout - 30 Minutes No Equipment",
      thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      duration: "30:15",
      views: 340000,
      channelId: createdChannels[5].id,
      isLive: false,
      description: "Complete at-home workout routine",
      category: "Fitness",
    },
    {
      title: "Summer Hits 2025 - Best Music Mix",
      thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      duration: "52:18",
      views: 4500000,
      channelId: createdChannels[6].id,
      isLive: false,
      description: "Top hits compilation for summer 2025",
      category: "Music",
    },
    {
      title: "How Quantum Computers Work",
      thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      duration: "24:56",
      views: 780000,
      channelId: createdChannels[7].id,
      isLive: false,
      description: "Understanding quantum computing for beginners",
      category: "Science",
    },
    {
      title: "Tokyo Japan Travel Guide 2025",
      thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      duration: "35:42",
      views: 1600000,
      channelId: createdChannels[8].id,
      isLive: false,
      description: "Complete travel guide to Tokyo with hidden gems",
      category: "Travel",
    },
    {
      title: "Stand-Up Comedy Special - Best Moments",
      thumbnail: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
      duration: "42:30",
      views: 920000,
      channelId: createdChannels[9].id,
      isLive: false,
      description: "Hilarious moments from recent comedy shows",
      category: "Comedy",
    },
    {
      title: "Dark Souls Boss Battle Compilation",
      thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      duration: "28:15",
      views: 650000,
      channelId: createdChannels[0].id,
      isLive: false,
      description: "Epic boss battles from Dark Souls series",
      category: "Gaming",
    },
    {
      title: "The Art of Cinematography",
      thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
      duration: "38:20",
      views: 440000,
      channelId: createdChannels[1].id,
      isLive: false,
      description: "Masterclass on cinematic techniques",
      category: "Education",
    },
    {
      title: "AI Revolution: What's Next in 2025",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: "19:45",
      views: 1100000,
      channelId: createdChannels[2].id,
      isLive: false,
      description: "Latest AI developments and future predictions",
      category: "Technology",
    },
    {
      title: "Baking Perfect Sourdough Bread",
      thumbnail: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      duration: "16:30",
      views: 380000,
      channelId: createdChannels[3].id,
      isLive: false,
      description: "Step-by-step sourdough bread tutorial",
      category: "Food",
    },
    {
      title: "African Safari - Lions and Elephants",
      thumbnail: "https://images.unsplash.com/photo-1549366021-9f761d450615?w=480&h=270&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      duration: "40:08",
      views: 1900000,
      channelId: createdChannels[4].id,
      isLive: false,
      description: "Incredible wildlife encounters in Africa",
      category: "Documentary",
    },
  ];

  const createdVideos = await db.insert(videos).values(sampleVideos).returning();
  console.log(`Created ${createdVideos.length} videos`);

  const sampleComments = [
    {
      videoId: createdVideos[0].id,
      userId: createdUsers[0].id,
      content: "This is amazing! The graphics are incredible!",
      likes: 245,
    },
    {
      videoId: createdVideos[0].id,
      userId: createdUsers[1].id,
      content: "Been waiting for this walkthrough, thank you!",
      likes: 89,
    },
    {
      videoId: createdVideos[1].id,
      userId: createdUsers[2].id,
      content: "Absolutely stunning cinematography. This deserves an award!",
      likes: 512,
    },
    {
      videoId: createdVideos[3].id,
      userId: createdUsers[0].id,
      content: "Great review! Very detailed and helpful.",
      likes: 156,
    },
    {
      videoId: createdVideos[4].id,
      userId: createdUsers[1].id,
      content: "Tried this recipe and it turned out perfect! Thanks!",
      likes: 78,
    },
    {
      videoId: createdVideos[5].id,
      userId: createdUsers[2].id,
      content: "The quality of this documentary is outstanding. 4K looks beautiful!",
      likes: 892,
    },
    {
      videoId: createdVideos[6].id,
      userId: createdUsers[0].id,
      content: "This workout kicked my butt! Definitely doing this again tomorrow.",
      likes: 234,
    },
    {
      videoId: createdVideos[7].id,
      userId: createdUsers[1].id,
      content: "Best summer playlist! Playing this on repeat 🔥",
      likes: 1543,
    },
  ];

  const createdComments = await db.insert(comments).values(sampleComments).returning();
  console.log(`Created ${createdComments.length} comments`);

  const replyComments = [
    {
      videoId: createdVideos[0].id,
      userId: createdUsers[2].id,
      parentId: createdComments[0].id,
      content: "I totally agree! The level design is next level.",
      likes: 45,
    },
    {
      videoId: createdVideos[1].id,
      userId: createdUsers[0].id,
      parentId: createdComments[2].id,
      content: "The director really outdid themselves with this one!",
      likes: 67,
    },
  ];

  const createdReplies = await db.insert(comments).values(replyComments).returning();
  console.log(`Created ${createdReplies.length} reply comments`);

  const sampleLikes = [
    { userId: createdUsers[0].id, videoId: createdVideos[0].id, type: "like" },
    { userId: createdUsers[1].id, videoId: createdVideos[0].id, type: "like" },
    { userId: createdUsers[2].id, videoId: createdVideos[0].id, type: "like" },
    { userId: createdUsers[0].id, videoId: createdVideos[1].id, type: "like" },
    { userId: createdUsers[1].id, videoId: createdVideos[2].id, type: "dislike" },
    { userId: createdUsers[2].id, videoId: createdVideos[3].id, type: "like" },
    { userId: createdUsers[0].id, videoId: createdVideos[4].id, type: "like" },
    { userId: createdUsers[1].id, videoId: createdVideos[5].id, type: "like" },
    { userId: createdUsers[2].id, videoId: createdVideos[6].id, type: "like" },
    { userId: createdUsers[0].id, videoId: createdVideos[7].id, type: "like" },
  ];

  const createdLikes = await db.insert(likes).values(sampleLikes).returning();
  console.log(`Created ${createdLikes.length} likes`);

  const sampleSubscriptions = [
    { userId: createdUsers[0].id, channelId: createdChannels[0].id },
    { userId: createdUsers[0].id, channelId: createdChannels[2].id },
    { userId: createdUsers[0].id, channelId: createdChannels[4].id },
    { userId: createdUsers[1].id, channelId: createdChannels[1].id },
    { userId: createdUsers[1].id, channelId: createdChannels[3].id },
    { userId: createdUsers[1].id, channelId: createdChannels[6].id },
    { userId: createdUsers[2].id, channelId: createdChannels[0].id },
    { userId: createdUsers[2].id, channelId: createdChannels[2].id },
    { userId: createdUsers[2].id, channelId: createdChannels[7].id },
  ];

  const createdSubscriptions = await db.insert(subscriptions).values(sampleSubscriptions).returning();
  console.log(`Created ${createdSubscriptions.length} subscriptions`);

  console.log("Seeding complete!");
  console.log(`Summary:`);
  console.log(`- ${createdUsers.length} users`);
  console.log(`- ${createdChannels.length} channels`);
  console.log(`- ${createdVideos.length} videos`);
  console.log(`- ${createdComments.length + createdReplies.length} comments`);
  console.log(`- ${createdLikes.length} likes`);
  console.log(`- ${createdSubscriptions.length} subscriptions`);
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
