import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable Next.js default body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to convert Web Request to Node stream
const streamToIncomingMessage = async (request) => {
  const { headers } = request;
  const body = await request.arrayBuffer();
  const readable = Readable.from(Buffer.from(body));
  readable.headers = Object.fromEntries(headers.entries());
  readable.method = request.method;
  return readable;
};

// Handle POST
export async function POST(request) {
  const req = await streamToIncomingMessage(request);

  const form = new IncomingForm();

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return resolve(new Response(JSON.stringify({ error: 'Form parsing error' }), { status: 500 }));
      }

      const file = files.image?.[0]?.filepath || files.image?.filepath;

      try {
        const result = await cloudinary.uploader.upload(file, {
          folder: 'uploads',
        });

        return resolve(new Response(JSON.stringify({ 
          imageId: result.public_id,
          imageUrl: result.secure_url 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      } catch (e) {
        return resolve(new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 }));
      }
    });
  });
}
