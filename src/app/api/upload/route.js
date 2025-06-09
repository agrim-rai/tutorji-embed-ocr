import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable, { IncomingForm } from "formidable";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

// 1) Configure S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const BUCKET = process.env.S3_BUCKET_NAME;

export const config = { api: { bodyParser: false } };

// Turn Next Request into a Node IncomingMessage for formidable
async function streamToIncomingMessage(request) {
  const { headers } = request;
  const arrayBuffer = await request.arrayBuffer();
  const readable = Readable.from(Buffer.from(arrayBuffer));
  readable.headers = Object.fromEntries(request.headers.entries());
  readable.method = request.method;
  return readable;
}

export async function POST(request) {
  // Validate environment variables
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
    console.error('Missing AWS environment variables:', {
      AWS_REGION: !!process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      S3_BUCKET_NAME: !!process.env.S3_BUCKET_NAME
    });
    return new Response(JSON.stringify({ 
      error: "AWS configuration incomplete. Please check environment variables." 
    }), { status: 500 });
  }

  console.log('Upload API: Using bucket:', BUCKET, 'in region:', process.env.AWS_REGION);

  const req = await streamToIncomingMessage(request);
  const form = new IncomingForm();

  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return resolve(new Response(JSON.stringify({ error: "Form parse error: " + err.message }), { status: 500 }));
      }

      // Grab the temp file path from formidable
      const filePath = files.image?.[0]?.filepath || files.image?.filepath;
      const originalFilename = files.image?.[0]?.originalFilename || files.image?.originalFilename;
      
      if (!filePath) {
        console.error('No file provided in upload request');
        return resolve(new Response(JSON.stringify({ error: "No file provided" }), { status: 400 }));
      }

      console.log('Upload API: Processing file:', originalFilename, 'from temp path:', filePath);

      // Read the file into a Buffer (or createReadStream)
      const fileStream = fs.createReadStream(filePath);

      // Get the extension from the original filename, not the temp file path
      const ext = originalFilename ? path.extname(originalFilename).toLowerCase() : '';

      const key = `uploads/${nanoid()}${ext}`;    // generate a unique key
      console.log('Upload API: Generated S3 key:', key);

      try {
        // Upload to S3
        console.log('Upload API: Attempting to upload to S3...');
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: fileStream,
          ContentType: files.image?.[0]?.mimetype || "application/octet-stream"
        }));

        console.log('Upload API: Successfully uploaded to S3');

        // Construct the URL
        // If you have a CloudFront distro, swap this URL out for your CF domain.
        const imageUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log('Upload API: Generated image URL:', imageUrl);

        return resolve(new Response(JSON.stringify({
          imageId: key,
          imageUrl
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      } catch (uploadErr) {
        console.error('S3 Upload Error:', uploadErr);
        
        // Provide more specific error messages
        let errorMessage = "Upload failed";
        if (uploadErr.code === 'ENOTFOUND') {
          errorMessage = `S3 bucket '${BUCKET}' not found or region '${process.env.AWS_REGION}' is incorrect`;
        } else if (uploadErr.code === 'NoSuchBucket') {
          errorMessage = `S3 bucket '${BUCKET}' does not exist`;
        } else if (uploadErr.code === 'AccessDenied') {
          errorMessage = "Access denied. Check your AWS credentials and bucket permissions";
        } else if (uploadErr.code === 'InvalidAccessKeyId') {
          errorMessage = "Invalid AWS Access Key ID";
        } else if (uploadErr.code === 'SignatureDoesNotMatch') {
          errorMessage = "Invalid AWS Secret Access Key";
        }

        return resolve(new Response(JSON.stringify({ 
          error: errorMessage,
          details: uploadErr.message 
        }), { status: 500 }));
      }
    });
  });
}