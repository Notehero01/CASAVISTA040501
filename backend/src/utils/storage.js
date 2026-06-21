const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { generateId } = require('./crypto');

const requiredR2Env = [
  'R2_ENDPOINT',
  'R2_BUCKET',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_PUBLIC_URL'
];

function isObjectStorageConfigured() {
  return requiredR2Env.every(key => Boolean(process.env[key]));
}

function getClient() {
  return new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
  });
}

function buildFilename(originalName = '') {
  const ext = originalName.startsWith('.')
    ? originalName
    : path.extname(originalName).toLowerCase() || '.jpg';
  return `casavista-${Date.now()}-${generateId()}${ext}`;
}

function publicUrlFor(filename) {
  return `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${filename}`;
}

async function uploadImageBuffer(file) {
  const filename = buildFilename(file.safeExtension || file.originalname);
  const client = getClient();

  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: filename,
    Body: file.buffer,
    ContentType: file.detectedMime || file.mimetype,
    CacheControl: 'public, max-age=31536000, immutable'
  }));

  return {
    filename,
    url: publicUrlFor(filename)
  };
}

async function deleteImage(filename) {
  const client = getClient();
  await client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: filename
  }));
}

module.exports = {
  isObjectStorageConfigured,
  uploadImageBuffer,
  deleteImage
};
