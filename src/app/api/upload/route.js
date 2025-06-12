import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function streamToIncomingMessage(request) {
  const chunks = [];
  const reader = request.body.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request) {
  try {
    console.log('Upload API: Starting file upload');
    
    // Get session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get form data from request
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    console.log('Upload API: Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Get file extension from the original filename or mime type
    let fileExtension = '';
    if (file.name && file.name.includes('.')) {
      fileExtension = file.name.split('.').pop().toLowerCase();
    } else {
      // Fallback to mime type
      const mimeTypeMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/tiff': 'tiff'
      };
      fileExtension = mimeTypeMap[file.type] || 'jpg';
    }

    console.log('Upload API: Determined file extension:', fileExtension);

    // Optimize image using Sharp if it's too large
    try {
      const metadata = await sharp(buffer).metadata();
      console.log('Upload API: Original image metadata:', metadata);

      // Resize if image is too large (max 2048px on longest side)
      if (metadata.width > 2048 || metadata.height > 2048) {
        console.log('Upload API: Resizing large image');
        buffer = await sharp(buffer)
          .resize(2048, 2048, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        fileExtension = 'jpg'; // Convert to JPG after processing
      } else if (buffer.length > 5 * 1024 * 1024) { // If larger than 5MB
        console.log('Upload API: Compressing large file');
        buffer = await sharp(buffer)
          .jpeg({ quality: 80 })
          .toBuffer();
        fileExtension = 'jpg'; // Convert to JPG after processing
      }
    } catch (sharpError) {
      console.warn('Upload API: Sharp processing failed, using original:', sharpError.message);
      // Continue with original buffer if Sharp fails
    }

    // Generate unique filename with proper extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    console.log('Upload API: Generated filename:', fileName);

    // Determine content type
    const getContentType = (ext) => {
      const contentTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff'
      };
      return contentTypes[ext.toLowerCase()] || 'image/jpeg';
    };

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: getContentType(fileExtension),
      CacheControl: 'max-age=31536000', // Cache for 1 year
      Metadata: {
        'uploaded-by': session.user.email,
        'upload-timestamp': timestamp.toString(),
        'original-filename': file.name || 'unknown'
      }
    };

    console.log('Upload API: Uploading to S3 with params:', {
      Bucket: uploadParams.Bucket,
      Key: uploadParams.Key,
      ContentType: uploadParams.ContentType,
      Size: buffer.length
    });

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct the public S3 URL with proper extension
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    
    console.log('Upload API: Upload successful, URL:', imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      imageId: fileName, // Return the filename as imageId for backward compatibility
      fileName: fileName,
      fileSize: buffer.length,
      contentType: getContentType(fileExtension)
    });

  } catch (error) {
    console.error('Upload API: Error during upload:', error);
    
    // More specific error messages
    if (error.name === 'CredentialsError') {
      return NextResponse.json(
        { error: 'AWS credentials not configured properly' },
        { status: 500 }
      );
    } else if (error.name === 'NoSuchBucket') {
      return NextResponse.json(
        { error: 'S3 bucket not found' },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Upload failed: ' + error.message },
        { status: 500 }
      );
    }
  }
}