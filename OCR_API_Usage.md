# OCR API Usage Guide

## Overview
The OCR API (`/api/getQuestionContent`) supports three input methods:
1. **File Upload** (multipart/form-data)
2. **Base64 Image** (JSON)
3. **Image URL** (JSON)

All requests save the OCR results to MongoDB with the following schema:
- `userId` (ObjectId)
- `userEmail` (String)
- `imageUrl` (String, optional)
- `imageText` (String)
- `pageName` (String)
- `inputType` (enum: 'base64', 'file', 'url')
- `metadata` (Object with mimeType, fileSize, originalFileName)
- `createdAt` (Date)
- `updatedAt` (Date)

## API Endpoints

### POST /api/getQuestionContent
Extract text from images and save to database.

### GET /api/getQuestionContent
Retrieve OCR records for a user with pagination.

## Usage Examples

### 1. File Upload (multipart/form-data)

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('userId', '64a7b8c9d1e2f3a4b5c6d7e8');
formData.append('userEmail', 'user@example.com');
formData.append('pageName', 'Math Problem Set 1');

const response = await fetch('/api/getQuestionContent', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

### 2. Base64 Image (JSON)

```javascript
const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/...';

const response = await fetch('/api/getQuestionContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    base64Image: base64Data,
    userId: '64a7b8c9d1e2f3a4b5c6d7e8',
    userEmail: 'user@example.com',
    pageName: 'Science Notes'
  })
});

const result = await response.json();
console.log(result);
```

### 3. Image URL (JSON)

```javascript
const response = await fetch('/api/getQuestionContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/image.jpg',
    userId: '64a7b8c9d1e2f3a4b5c6d7e8',
    userEmail: 'user@example.com',
    pageName: 'History Assignment'
  })
});

const result = await response.json();
console.log(result);
```

### 4. Retrieve OCR Records (GET)

```javascript
const userId = '64a7b8c9d1e2f3a4b5c6d7e8';
const page = 1;
const limit = 10;

const response = await fetch(`/api/getQuestionContent?userId=${userId}&page=${page}&limit=${limit}`);
const result = await response.json();
console.log(result);
```

## Response Format

### Success Response (POST)
```json
{
  "success": true,
  "data": {
    "id": "64a7b8c9d1e2f3a4b5c6d7e9",
    "text": "Extracted text from the image...",
    "inputType": "file",
    "metadata": {
      "mimeType": "image/jpeg",
      "fileSize": 245760,
      "originalFileName": "math_problem.jpg"
    },
    "createdAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### Success Response (GET)
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "_id": "64a7b8c9d1e2f3a4b5c6d7e9",
        "userId": "64a7b8c9d1e2f3a4b5c6d7e8",
        "userEmail": "user@example.com",
        "imageText": "Extracted text...",
        "pageName": "Math Problem Set 1",
        "inputType": "file",
        "metadata": {
          "mimeType": "image/jpeg",
          "fileSize": 245760,
          "originalFileName": "math_problem.jpg"
        },
        "createdAt": "2023-12-07T10:30:00.000Z",
        "updatedAt": "2023-12-07T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

## Frontend Integration Examples

### React Component with File Upload
```jsx
import React, { useState } from 'react';

function OCRUpload({ userId, userEmail }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId);
    formData.append('userEmail', userEmail);
    formData.append('pageName', 'Upload');

    try {
      const response = await fetch('/api/getQuestionContent', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit" disabled={!file || loading}>
        {loading ? 'Processing...' : 'Extract Text'}
      </button>
      
      {result && (
        <div>
          <h3>Extracted Text:</h3>
          <p>{result.data.text}</p>
        </div>
      )}
    </form>
  );
}
```

### React Component with Base64 Upload
```jsx
import React, { useState } from 'react';

function Base64OCR({ userId, userEmail }) {
  const [base64, setBase64] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setBase64(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!base64) return;

    setLoading(true);
    try {
      const response = await fetch('/api/getQuestionContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image: base64,
          userId,
          userEmail,
          pageName: 'Base64 Upload'
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleSubmit} disabled={!base64 || loading}>
        {loading ? 'Processing...' : 'Extract Text'}
      </button>
      
      {result && (
        <div>
          <h3>Extracted Text:</h3>
          <p>{result.data.text}</p>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

Common error scenarios:
- Invalid or missing userId/userEmail
- User not found in database
- Invalid image format
- OpenAI API errors
- Network timeouts for URL-based images
- Invalid base64 data

Always check the response status and handle errors appropriately in your frontend code.

## Database Queries

You can query OCR records directly using the OCRRecord model:

```javascript
import OCRRecord from '@/models/OCRRecord';

// Find all records for a user
const userRecords = await OCRRecord.find({ userId }).sort({ createdAt: -1 });

// Find records by page name
const pageRecords = await OCRRecord.find({ userId, pageName: 'Math Problems' });

// Find records by input type
const fileUploads = await OCRRecord.find({ userId, inputType: 'file' });

// Text search in extracted content
const searchResults = await OCRRecord.find({
  userId,
  imageText: { $regex: 'keyword', $options: 'i' }
});
``` 