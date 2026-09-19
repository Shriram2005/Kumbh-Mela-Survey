import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let clientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!clientInstance) {
    const region = import.meta.env["VITE_AWS_REGION"] || "ap-south-1";
    const accessKeyId = import.meta.env["VITE_AWS_ACCESS_KEY_ID"];
    const secretAccessKey = import.meta.env["VITE_AWS_SECRET_ACCESS_KEY"];

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS credentials are missing. Please check VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY in .env."
      );
    }

    clientInstance = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return clientInstance;
}

/**
 * Uploads an audio Blob to S3 and returns the public URL.
 * The S3 bucket must have CORS configured for browser uploads.
 */
export async function uploadAudioToS3(blob: Blob, responseId: string, questionId: string): Promise<string> {
  const bucket =
    import.meta.env["VITE_AWS_S3_BUCKET"] ||
    import.meta.env["VITE_AWS_S3_BUCKET_NAME"];
  const region = import.meta.env["VITE_AWS_REGION"] || "ap-south-1";

  if (!bucket || bucket === "YOUR_S3_BUCKET_NAME" || bucket === "YOUR_BUCKET_NAME") {
    throw new Error(
      "AWS S3 bucket name is not configured properly in .env (currently set to '" +
        bucket +
        "'). Please set VITE_AWS_S3_BUCKET in your .env file."
    );
  }

  const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
  const key = `survey-audio/${responseId}/${questionId}.${ext}`;

  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: uint8Array,
      ContentType: blob.type || "audio/webm",
    }),
  );

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Uploads an arbitrary file (image, video, document, etc.) to S3 and returns the public URL.
 */
export async function uploadFileToS3(
  file: File | Blob,
  responseId: string,
  questionId: string,
  fileName?: string,
): Promise<string> {
  const bucket =
    import.meta.env["VITE_AWS_S3_BUCKET"] ||
    import.meta.env["VITE_AWS_S3_BUCKET_NAME"];
  const region = import.meta.env["VITE_AWS_REGION"] || "ap-south-1";

  if (!bucket || bucket === "YOUR_S3_BUCKET_NAME" || bucket === "YOUR_BUCKET_NAME") {
    throw new Error(
      "AWS S3 bucket name is not configured properly in .env. Please set VITE_AWS_S3_BUCKET in your .env file."
    );
  }

  const originalName = fileName || (file instanceof File ? file.name : `file_${Date.now()}`);
  const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `survey-files/${responseId}/${questionId}_${Date.now()}_${cleanName}`;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: uint8Array,
      ContentType: file.type || "application/octet-stream",
    }),
  );

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

