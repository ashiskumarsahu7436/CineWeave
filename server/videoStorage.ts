import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

// iDrive E2 S3-compatible client configuration
export const s3Client = new S3Client({
  endpoint: process.env.IDRIVE_ENDPOINT || "",
  region: process.env.IDRIVE_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.IDRIVE_ACCESS_KEY || "",
    secretAccessKey: process.env.IDRIVE_SECRET_KEY || "",
  },
  forcePathStyle: true, // Required for S3-compatible services
  requestHandler: {
    // Increase connection timeout to 5 minutes for large uploads
    connectionTimeout: 300000,
    requestTimeout: 300000,
  },
});

const BUCKET_NAME = process.env.IDRIVE_BUCKET || "";
const CDN_URL = process.env.CLOUDFLARE_CDN_URL || process.env.IDRIVE_PUBLIC_URL || "";

export interface VideoUploadResult {
  videoUrl: string;
  thumbnailUrl?: string;
  key: string;
  storageKey: string;
}

/**
 * Upload video to iDrive E2 storage
 */
export async function uploadVideoToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string = "video/mp4"
): Promise<VideoUploadResult> {
  const key = `videos/${Date.now()}-${fileName}`;
  
  console.log(`Starting upload to iDrive: ${key} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
  
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // 1 year cache for videos
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 5, // 5MB parts for better reliability
    leavePartsOnError: false,
  });

  // Track upload progress
  upload.on("httpUploadProgress", (progress) => {
    if (progress.loaded && progress.total) {
      const percentage = Math.round((progress.loaded / progress.total) * 100);
      console.log(`Upload progress: ${percentage}% (${(progress.loaded / (1024 * 1024)).toFixed(2)} MB / ${(progress.total / (1024 * 1024)).toFixed(2)} MB)`);
    }
  });

  try {
    await upload.done();
    console.log(`Upload completed successfully: ${key}`);
  } catch (error) {
    console.error(`Upload failed for ${key}:`, error);
    throw error;
  }
  
  // Return clean API URL instead of iDrive URL
  const videoUrl = `/api/videos/stream/${encodeURIComponent(key)}`;

  return {
    videoUrl,
    key,
    storageKey: key,
  };
}

/**
 * Upload thumbnail to iDrive E2 storage
 */
export async function uploadThumbnailToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  const key = `thumbnails/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000", // 1 year cache
  });

  await s3Client.send(command);
  
  // Construct CDN URL
  const thumbnailUrl = CDN_URL 
    ? `${CDN_URL}/${key}`
    : `https://${BUCKET_NAME}.${process.env.IDRIVE_ENDPOINT?.replace('https://', '')}/${key}`;

  return thumbnailUrl;
}

/**
 * Delete video from iDrive E2 storage
 */
export async function deleteVideoFromStorage(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Upload video from stream (useful for large files)
 */
export async function uploadVideoStream(
  stream: Readable,
  fileName: string,
  contentType: string = "video/mp4"
): Promise<VideoUploadResult> {
  const key = `videos/${Date.now()}-${fileName}`;
  
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: stream,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000",
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 10,
  });

  await upload.done();
  
  // Return clean API URL instead of iDrive URL
  const videoUrl = `/api/videos/stream/${encodeURIComponent(key)}`;

  return {
    videoUrl,
    key,
    storageKey: key,
  };
}

/**
 * Get video from iDrive E2 storage
 */
export async function getVideoFromStorage(
  key: string,
  range?: string
): Promise<{ stream: Readable; contentLength: number; contentType: string; contentRange?: string }> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Range: range,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error("No video data returned from storage");
  }

  return {
    stream: response.Body as Readable,
    contentLength: response.ContentLength || 0,
    contentType: response.ContentType || "video/mp4",
    contentRange: response.ContentRange,
  };
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.IDRIVE_ENDPOINT &&
    process.env.IDRIVE_ACCESS_KEY &&
    process.env.IDRIVE_SECRET_KEY &&
    process.env.IDRIVE_BUCKET
  );
}
