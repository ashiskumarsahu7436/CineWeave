import { db } from './server/db.js';
import { channels, videos } from './shared/schema.js';

async function test() {
  try {
    console.log("Testing database connection...");
    const channelResults = await db.select().from(channels).limit(5);
    console.log("Channels count:", channelResults.length);
    console.log("Channels:", JSON.stringify(channelResults, null, 2));

    const videoResults = await db.select().from(videos).limit(5);
    console.log("Videos count:", videoResults.length);
    console.log("Videos:", JSON.stringify(videoResults, null, 2));
  } catch (error) {
    console.error("Database test failed:", error);
    process.exit(1);
  }
  process.exit(0);
}

test();
