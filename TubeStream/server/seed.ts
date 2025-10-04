import { db } from "./db";
import { channels, videos, users } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create default user
  const [defaultUser] = await db.insert(users).values({
    username: "viewer1",
    email: "viewer@cineweave.com",
    personalMode: false,
    blockedChannels: [],
  }).returning();

  console.log("Created default user:", defaultUser.id);

  // Create sample channels
  const sampleChannels = [
    {
      name: "A Gamingcraft",
      username: "@agamingcraft",
      avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 1200000,
      description: "Gaming content creator",
    },
    {
      name: "A Filmcraft",
      username: "@afilmcraft",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 1200000,
      description: "Film and documentary content",
    },
    {
      name: "Tech Vision",
      username: "@techvision",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
      verified: true,
      subscribers: 2100000,
      description: "Technology and architecture",
    },
  ];

  const createdChannels = await db.insert(channels).values(sampleChannels).returning();
  console.log(`Created ${createdChannels.length} channels`);

  // Create sample videos
  const sampleVideos = [
    {
      title: "Uncharted Ruins of Eldoris",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=480&h=270&fit=crop",
      duration: "12:48",
      views: 1200000,
      channelId: createdChannels[0].id,
      isLive: false,
      description: "Epic fantasy adventure gameplay",
      category: "Gaming",
    },
    {
      title: "Exploration X: The Hidden Valleys",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=270&fit=crop",
      duration: "22:48",
      views: 1200000,
      channelId: createdChannels[1].id,
      isLive: false,
      description: "Documentary about hidden valleys",
      category: "Movies",
    },
    {
      title: "Pro Tournament Live: Finals Day",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=480&h=270&fit=crop",
      duration: "",
      views: 45000,
      channelId: createdChannels[0].id,
      isLive: true,
      description: "Live gaming tournament",
      category: "Gaming",
    },
  ];

  const createdVideos = await db.insert(videos).values(sampleVideos).returning();
  console.log(`Created ${createdVideos.length} videos`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
