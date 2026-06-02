// Cloudflare R2 (S3-compatible) client + presigned URLs.
// Files go browser <-> R2 directly via these signed URLs, so 200-400 MB
// uploads/downloads never pass through a function.
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.R2_BUCKET;
const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Admin: get a URL to PUT a file straight to R2 from the browser.
export function presignUpload(key, contentType, expiresIn = 3600) {
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn });
}

// Client: short-lived URL to download a file, with a friendly filename.
export function presignDownload(key, downloadName, expiresIn = 900) {
  const cmd = new GetObjectCommand({
    Bucket: bucket, Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(downloadName || "file")}"`,
  });
  return getSignedUrl(client, cmd, { expiresIn });
}

export function deleteObject(key) {
  return client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
