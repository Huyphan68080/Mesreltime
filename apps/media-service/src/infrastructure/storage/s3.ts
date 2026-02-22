import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";

const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials:
    env.S3_ACCESS_KEY && env.S3_SECRET_KEY
      ? {
          accessKeyId: env.S3_ACCESS_KEY,
          secretAccessKey: env.S3_SECRET_KEY
        }
      : undefined
});

export interface PresignedUploadResult {
  key: string;
  uploadUrl: string;
  publicUrl: string;
}

export const createPresignedUpload = async (input: {
  userId: string;
  fileName: string;
  contentType: string;
}): Promise<PresignedUploadResult> => {
  const extension = input.fileName.includes(".") ? input.fileName.slice(input.fileName.lastIndexOf(".")) : "";
  const key = `${input.userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: input.contentType,
    ServerSideEncryption: "AES256"
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: env.UPLOAD_URL_TTL_SECONDS
  });

  return {
    key,
    uploadUrl,
    publicUrl: `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`
  };
};
