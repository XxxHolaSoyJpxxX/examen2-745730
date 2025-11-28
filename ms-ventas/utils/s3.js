import { S3Client, PutObjectCommand, GetObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export const uploadFile = async (bucketName, key, body) => {
  await s3.send(new PutObjectCommand({
    Bucket: bucketName, Key: key, Body: body, ContentType: 'application/pdf',
    Metadata: { 'hora-envio': new Date().toISOString(), 'nota-descargada': 'false' }
  }));
};

export const getFile = async (bucketName, key) => {
  const response = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
  // Convertir stream a buffer para Lambda
  const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
  return { Body: await streamToBuffer(response.Body), Metadata: response.Metadata };
};

export const updateMetadata = async (bucketName, key, newMetadata) => {
  await s3.send(new CopyObjectCommand({
    Bucket: bucketName, CopySource: `${bucketName}/${key}`, Key: key,
    Metadata: newMetadata, MetadataDirective: "REPLACE",
  }));
};