const AWS = require('aws-sdk');

const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const BUCKET = process.env.AWS_S3_BUCKET;

async function uploadBuffer(buffer, key, contentType) {
  const result = await s3.upload({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }).promise();
  return result.Location;
}

module.exports = { uploadBuffer, s3, BUCKET };