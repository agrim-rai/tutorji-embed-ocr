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
  const req = await streamToIncomingMessage(request);
  const form = new IncomingForm();

  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return resolve(new Response(JSON.stringify({ error: "Form parse error" }), { status: 500 }));
      }

      // Grab the temp file path from formidable
      const filePath = files.image?.[0]?.filepath || files.image?.filepath;
      const originalFilename = files.image?.[0]?.originalFilename || files.image?.originalFilename;
      
      if (!filePath) {
        return resolve(new Response(JSON.stringify({ error: "No file" }), { status: 400 }));
      }

      // Read the file into a Buffer (or createReadStream)
      const fileStream = fs.createReadStream(filePath);

      // Get the extension from the original filename, not the temp file path
      const ext = originalFilename ? path.extname(originalFilename).toLowerCase() : '';



      const key = `uploads/${nanoid()}${ext}`;    // generate a unique key

      try {
        // Upload to S3
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: fileStream,
          ContentType: files.image?.[0]?.mimetype || "application/octet-stream"
        }));

        // Construct the URL
        // If you have a CloudFront distro, swap this URL out for your CF domain.
        const imageUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        return resolve(new Response(JSON.stringify({
          imageId: key,
          imageUrl
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      } catch (uploadErr) {
        console.error(uploadErr);
        return resolve(new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 }));
      }
    });
  });
}