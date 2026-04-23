import { v2 as cloudinary } from "cloudinary";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const VIDEO_FOLDER = "cineweave/videos";
const THUMBNAIL_FOLDER = "cineweave/thumbnails";
const AVATAR_FOLDER = "cineweave/avatars";

export interface VideoUploadResult {
  videoUrl: string;
  thumbnailUrl?: string;
  key: string;
  storageKey: string;
}

function folderForType(fileType: "video" | "thumbnail" | "avatar"): string {
  if (fileType === "video") return VIDEO_FOLDER;
  if (fileType === "avatar") return AVATAR_FOLDER;
  return THUMBNAIL_FOLDER;
}

function resourceTypeForFile(fileType: "video" | "thumbnail" | "avatar"): "video" | "image" {
  return fileType === "video" ? "video" : "image";
}

/**
 * Upload a buffer to Cloudinary and return the secure CDN URL + public_id.
 */
async function uploadBufferToCloudinary(
  buffer: Buffer,
  fileName: string,
  fileType: "video" | "thumbnail" | "avatar",
  contentType: string,
): Promise<{ secureUrl: string; publicId: string }> {
  const folder = folderForType(fileType);
  const resourceType = resourceTypeForFile(fileType);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          console.error(`Cloudinary upload failed for ${fileName}:`, error);
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
        console.log(
          `Cloudinary upload completed: ${result.public_id} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        );
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      },
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload video to Cloudinary storage (server-side, for fallback / smaller files).
 */
export async function uploadVideoToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string = "video/mp4",
): Promise<VideoUploadResult> {
  const { secureUrl, publicId } = await uploadBufferToCloudinary(
    buffer,
    fileName,
    "video",
    contentType,
  );

  return {
    videoUrl: secureUrl,
    key: publicId,
    storageKey: publicId,
  };
}

/**
 * Upload thumbnail to Cloudinary storage.
 */
export async function uploadThumbnailToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string = "image/jpeg",
): Promise<string> {
  const isAvatar = fileName.startsWith("avatar-");
  const { secureUrl } = await uploadBufferToCloudinary(
    buffer,
    fileName,
    isAvatar ? "avatar" : "thumbnail",
    contentType,
  );
  return secureUrl;
}

/**
 * Delete an asset from Cloudinary by its public_id.
 */
export async function deleteVideoFromStorage(
  publicId: string,
  resourceType: "video" | "image" = "video",
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Check if Cloudinary storage is configured.
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Generate a Cloudinary signed-upload payload that the browser uses to upload
 * directly to Cloudinary, bypassing this server.
 *
 * The client should POST a multipart/form-data request to:
 *   https://api.cloudinary.com/v1_1/<cloud_name>/<resource_type>/upload
 * with fields: file, api_key, timestamp, signature, folder, (and any other signed params).
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string = "video/mp4",
  fileType: "video" | "thumbnail" | "avatar" = "video",
): Promise<{
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: "video" | "image";
  // Kept for backward compatibility with previous iDrive flow:
  key: string;
  expiresIn: number;
}> {
  if (!isStorageConfigured()) {
    throw new Error("Cloudinary storage is not configured");
  }

  const folder = folderForType(fileType);
  const resourceType = resourceTypeForFile(fileType);
  const timestamp = Math.floor(Date.now() / 1000);

  // Only the params included in the signature must be sent by the client.
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string,
  );

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME as string;
  const apiKey = process.env.CLOUDINARY_API_KEY as string;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  console.log(
    `Generated Cloudinary signed upload payload for ${fileName} -> ${folder} (${resourceType})`,
  );

  return {
    uploadUrl,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    resourceType,
    key: `${folder}/${fileName}`,
    expiresIn: 3600,
  };
}
