## API Documentation

This document provides an overview of the RESTful API endpoints, their functionalities, expected inputs, and typical outputs.

---

### 1. `/api/compare-images`

- **Description**: Compares two images using OpenAI's Vision API to determine if they are the same.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "topResultId": "string", // ID of the stored image (Ada ID)
    "userImageBase64": "string" // Base64 encoded string of the user's image
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "comparison": {
      "areSame": boolean, // true if images are determined to be the same
      "confidence": number, // Confidence score (0-1)
      "explanation": "string" // Detailed explanation of the comparison
    },
    "topResultId": "string",
    "rawResponse": "string" // Raw response from OpenAI
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string",
    "details": "string" (optional)
  }
  ```



  `/api/compare-texts`

- **Description**: Compares two text inputs to determine if they are the same, considering content, layout, and overall appearance, using OpenAI models.
- **Methods**: `POST`

#### `POST /api/compare-texts`
- **Description**: Takes two text fields and uses AI to compare them, returning a similarity assessment.
- **Input (JSON Body)**:
  ```json
  {
    "text1": "string",   // First text block to compare
    "text2": "string"    // Second text block to compare
  }

  

---

### 2. `/api/ada-store`

- **Description**: Stores or retrieves an Ada ID to image Base64 mapping in the database.
- **Methods**: `POST`, `GET`

#### `POST /api/ada-store`
- **Description**: Creates a new Ada-Image mapping or updates an existing one.
- **Input (JSON Body)**:
  ```json
  {
    "adaId": "string",       // Unique ID for the Ada (e.g., from vector store)
    "imageBase64": "string"  // Base64 encoded string of the image
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "message": "string", // "Updated existing Ada-Image mapping" or "Ada-Image mapping created successfully"
    "adaId": "string"
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

#### `GET /api/ada-store`
- **Description**: Retrieves the image Base64 string associated with a given Ada ID.
- **Input (Query Parameter)**:
  - `adaId`: `string` (Required) - The Ada ID to retrieve the image for.
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "data": {
      "adaId": "string",
      "imageBase64": "string",
      "createdAt": "string" // ISO date string
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 3. `/api/vectors`

- **Description**: Manages text embeddings for semantic search.
- **Methods**: `POST`, `GET`

#### `POST /api/vectors`
- **Description**: Stores a text document and its OpenAI embedding.
- **Input (JSON Body)**:
  ```json
  {
    "id": "string",   // Unique identifier for the text document
    "text": "string"  // The text content to be embedded and stored
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

#### `GET /api/vectors`
- **Description**: Performs a semantic search for text documents similar to a given query.
- **Input (Query Parameters)**:
  - `q`: `string` (Required) - The query string to find similar documents.
  - `k`: `number` (Optional, Default: 5) - The number of top similar results to return.
- **Output (JSON Response - Success)**:
  ```json
  {
    "results": [
      {
        "id": "string",    // ID of the matched document
        "text": "string",  // Text content of the matched document
        "score": number    // Cosine similarity score (higher is more similar)
      }
    ],
    "topResult": {
      "id": "string",
      "text": "string",
      "score": number
    } | null
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---



### 4. `/api/diagram-check`

- **Description**: Determines if an uploaded image contains a figure, drawing, diagram, or chart using OpenAI's vision model.
- **Method**: `POST`

#### `POST /api/diagram-check`
- **Description**: Analyzes an image file and replies with `"true"` if it contains a figure, drawing, diagram, or chart; otherwise replies with `"false"`.
- **Input (multipart/form-data)**:
  - `file`: *File* – The image file to analyze.

- **Output (JSON Response - Success)**:
  ```json
  {
    "response": "true" // or "false"
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 5. `/api/combiner`

- **Description**: A comprehensive workflow API that combines OCR, vector search, database retrieval, diagram detection, and image/text comparison to determine if a question is new or matches existing content.
- **Method**: `POST`

#### `POST /api/combiner`
- **Description**: Processes an uploaded image through a multi-step workflow to determine if it matches existing questions in the system.
- **Input (multipart/form-data)**:
  - `image`: *File* (Required) – The image file to process.
  - `userId`: *string* (Required) – User ID for authentication and tracking.
  - `userEmail`: *string* (Required) – User email for authentication and tracking.
  - `pageName`: *string* (Optional, Default: 'combiner') – Name of the page where the request originated.

- **Workflow Steps**:
  1. **OCR Processing**: Extracts text from the uploaded image
  2. **Vector Search**: Finds the most similar content (k=1) using semantic search
  3. **Database Retrieval**: Gets stored image associated with the top match
  4. **Diagram Detection**: Determines if the image contains diagrams/charts
  5. **Comparison Logic**:
     - If diagram: Direct image comparison
     - If not diagram: Text comparison followed by image comparison if texts match

- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "result": "string", // Either an Ada ID (if match found) or "NEW QUESTION"
    "reason": "string", // Explanation of the result
    "details": {
      "extractedText": "string",
      "topResult": {
        "id": "string",
        "text": "string", 
        "score": number
      },
      "isDiagram": boolean,
      "textComparison": { // Present if text comparison was performed
        "areSame": boolean,
        "confidence": number,
        "explanation": "string"
      },
      "imageComparison": { // Present if image comparison was performed
        "areSame": boolean,
        "confidence": number,
        "explanation": "string"
      }
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

**External APIs Used:**
- `/api/ocr` - For text extraction from images
- `/api/vectors` - For semantic similarity search
- `/api/diagram-check` - For diagram detection
- `/api/compare-images` - For image similarity comparison
- `/api/compare-texts` - For text similarity comparison
- Database: `adaAndImage` collection for Ada ID to image mapping

---


### 6. `/api/verify-payment`

- **Description**: Verifies a Razorpay payment and updates user credits.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "orderId": "string",           // Razorpay Order ID
    "razorpayPaymentId": "string", // Razorpay Payment ID
    "razorpaySignature": "string"  // Razorpay Signature for verification
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "message": "string", // "payment verified successfully" or "Payment already processed"
    "isOk": true,
    "credits": number,     // Credits added in this transaction
    "newBalance": number   // User's new total credit balance
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "message": "string",
    "isOk": false
  }
  ```
- **Authentication**: Required

---

### 7. `/api/payment/failed`

- **Description**: Records a failed payment attempt.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "orderId": "string", // The order ID associated with the failed payment
    "error": "string",   // General error message (optional)
    "reason": "string"   // Specific reason for failure (optional)
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "message": "Payment failure recorded",
    "orderId": "string"
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string",
    "details": "string" (optional)
  }
  ```
- **Authentication**: Required

---

### 8. `/api/user/payments`

- **Description**: Retrieves a user's payment and transaction history, including statistics.
- **Method**: `GET`
- **Input (Query Parameters)**:
  - `limit`: `number` (Optional, Default: 20) - Maximum number of records to return.
  - `skip`: `number` (Optional, Default: 0) - Number of records to skip for pagination.
  - `type`: `string` (Optional) - Filter by 'payments', 'transactions', or 'all'. If not provided, returns all.
- **Output (JSON Response - Success)**:
  ```json
  {
    "payments": [ // Array of payment objects if requested
      {
        "_id": "string",
        "userId": "string",
        "userEmail": "string",
        "userName": "string",
        "orderId": "string",
        "amount": number,
        "currency": "string",
        "credits": number,
        "planType": "string",
        "status": "string",
        "receipt": "string",
        "razorpayPaymentId": "string" (optional),
        "razorpaySignature": "string" (optional),
        "failureReason": "string" (optional),
        "failureDetails": "string" (optional),
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "transactions": [ // Array of transaction objects if requested
      {
        "_id": "string",
        "userId": "string",
        "userEmail": "string",
        "transactionId": "string",
        "type": "string", // e.g., "credit_purchase", "credit_usage", "bonus"
        "creditsBefore": number,
        "creditsAfter": number,
        "creditsChanged": number,
        "source": "string",
        "description": "string",
        "status": "string",
        "relatedPaymentId": "string" (optional),
        "relatedOrderId": "string" (optional),
        "planType": "string" (optional),
        "amount": number (optional),
        "createdAt": "string"
      }
    ],
    "statistics": { // Summary statistics if requested
      "payments": {
        "totalPayments": number,
        "successfulPayments": number,
        "failedPayments": number,
        "totalRevenue": number
      },
      "credits": {
        "totalCreditsPurchased": number,
        "totalCreditsUsed": number,
        "currentBalance": number
      }
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string",
    "details": "string" (optional)
  }
  ```
- **Authentication**: Required

---

### 9. `/api/user/credits`

- **Description**: Manages user credits (retrieve, add, deduct).
- **Methods**: `GET`, `POST`, `PATCH`

#### `GET /api/user/credits`
- **Description**: Retrieves the current credit balance and user details for the authenticated user.
- **Input**: None (uses session for user identification)
- **Output (JSON Response - Success)**:
  ```json
  {
    "credits": number,
    "name": "string",
    "email": "string",
    "updatedAt": "string" // ISO date string
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required

#### `POST /api/user/credits`
- **Description**: Adds a specified amount of credits to the authenticated user's account. (Likely for admin or bonus only).
- **Input (JSON Body)**:
  ```json
  {
    "amount": number,        // Positive number of credits to add
    "description": "string" // Optional description for the credit addition (default: "Manual credit addition")
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "credits": number,        // New total credit balance
    "message": "string"       // Confirmation message
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required

#### `PATCH /api/user/credits`
- **Description**: Deducts a specified amount of credits from the authenticated user's account. (Likely for internal usage tracking).
- **Input (JSON Body)**:
  ```json
  {
    "amount": number,        // Positive number of credits to deduct
    "description": "string" // Optional description for the credit usage (default: "Credit usage")
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "credits": number,        // New total credit balance
    "message": "string"       // Confirmation message
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required

---

### 10. `/api/create-order`

- **Description**: Creates a new Razorpay order for purchasing credits.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "amount": number,    // The amount in INR for the order
    "planType": "string" // The type of credit plan (e.g., "bronze", "silver", "gold")
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "id": "string",       // Razorpay Order ID
    "amount": number,     // Order amount in paise
    "currency": "string", // "INR"
    "receipt": "string",  // Unique receipt ID
    "status": "string",   // "created"
    "planType": "string",
    "credits": number     // Credits associated with the plan
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string",
    "details": "string" (optional)
  }
  ```
- **Authentication**: Required

---

### 11. `/api/query-ada`

- **Description**: Forwards a query to an external Ada service to retrieve relevant information.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    // Expects a JSON object that will be directly forwarded to the external /query endpoint.
    // The structure will depend on the external service's requirements.
    "query_text": "string",
    "top_k": number
  }
  ```
- **Output (JSON Response)**:
  ```json
  {
    // Returns the JSON response directly from the external /query endpoint.
    // The structure will depend on the external service's output.
    "results": [
        {"text": "...", "score": "...", "metadata": {}}
    ]
  }
  ```

---

### 13. `/api/link-ocr-ai`

- **Description**: Links an OCR record with an AI response record in the database.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "ocrRecordId": "string",    // ID of the OCR record to update
    "aiResponseId": "string"   // ID of the AI response to link
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "message": "OCR record linked with AI response successfully"
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required

---

### 14. `/api/ocr`

- **Description**: Extracts text from images using OpenAI Vision and stores OCR records. Also supports fetching past OCR records.
- **Methods**: `POST`, `GET`

#### `POST /api/ocr`
- **Description**: Performs OCR on an image (provided as base64 or URL) and saves the extracted text.
- **Input (Multipart Form Data)**: For file uploads
  - `image`: `File` (Required) - The image file to process.
  - `userId`: `string` (Required) - User ID.
  - `userEmail`: `string` (Required) - User email.
  - `pageName`: `string` (Optional, Default: 'Unknown') - Name of the page where the OCR request originated.
- **Input (JSON Body)**: For base64 or image URL
  ```json
  {
    "userId": "string",         // Required User ID
    "userEmail": "string",      // Required User email
    "pageName": "string",       // Optional, default: "Unknown"
    "base64Image": "string",    // Either this or imageUrl is required (Base64 encoded image with data URL prefix)
    "imageUrl": "string"        // Or this (Public URL of the image)
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "string",          // ID of the created OCR record
      "text": "string",        // Extracted text content
      "inputType": "string",   // "file", "base64", or "url"
      "metadata": {
        "mimeType": "string",
        "fileSize": number,
        "originalFileName": "string" (optional)
      },
      "createdAt": "string"    // ISO date string
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

#### `GET /api/ocr`
- **Description**: Retrieves a paginated list of OCR records for a specific user.
- **Input (Query Parameters)**:
  - `userId`: `string` (Required) - The ID of the user whose OCR records to fetch.
  - `page`: `number` (Optional, Default: 1) - The page number for pagination.
  - `limit`: `number` (Optional, Default: 10) - The number of records per page.
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "data": {
      "records": [
        {
          "_id": "string",
          "userId": "string",
          "userEmail": "string",
          "imageUrl": "string" (optional),
          "imageText": "string",
          "pageName": "string",
          "inputType": "string",
          "metadata": { /* ... */ },
          "createdAt": "string",
          "updatedAt": "string"
        }
      ],
      "pagination": {
        "page": number,
        "limit": number,
        "total": number,
        "pages": number
      }
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 15. `/api/ask`

- **Description**: Provides AI question-answering functionality. Processes academic questions (text or image-based) using OpenAI, deducts user credits, and stores the interaction history.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "question": "string",    // The academic question text (optional if imageId is provided, defaults to "Solve the problem shown in the image")
    "imageId": "string",     // Optional: ID of an image previously uploaded (e.g., S3 key or full URL)
    "language": "string"     // Optional: Preferred language for the response (e.g., "english", "hindi", "kannada")
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "finalAnswer": "string",    // The AI-generated detailed step-by-step solution
    "aiResponseId": "string",   // ID of the stored AI response record
    "creditsRemaining": number, // User's remaining credits
    "devFallback": boolean      // True if a mock response was used due to missing API key
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required (User must have credits)

---

### 16. `/api/get-response`

- **Description**: Fetches a stored AI response based on an image URL.
- **Method**: `GET`
- **Input (Query Parameter)**:
  - `imageUrl`: `string` (Required) - The URL of the image associated with the AI response.
  - `from`: `string` (Optional) - Can be set to 'shareask' to bypass authentication.
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "data": {
      "question": "string",    // The original question
      "answer": "string",      // The AI-generated answer
      "heading": "string",     // A short heading for the question
      "imageId": "string",     // Image ID (e.g., S3 key)
      "imageUrl": "string",    // Image URL
      "createdAt": "string"    // ISO date string
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required, unless `from=shareask` query parameter is present.

---

### 17. `/api/chat`

- **Description**: Provides streaming AI chat functionality for academic tutoring, maintaining conversation context.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "messages": [ // Array of message objects in the conversation history
      {
        "role": "user" | "assistant",
        "content": "string"
      }
    ],
    "chatId": "string" (optional), // Unique ID for the chat session (if continuing a conversation)
    "initialQuestion": "string" (optional), // Initial question if starting a new chat from a Q&A session
    "initialAnswer": "string" (optional)   // Initial answer if starting a new chat from a Q&A session
  }
  ```
- **Output (Streamed Text Response)**:
  - The AI's response is streamed as plain text. The response headers will include `X-Chat-ID` with the session's `chatId`.
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required

---

### 18. `/api/history`

- **Description**: Retrieves the authenticated user's academic question and AI answer history.
- **Method**: `GET`
- **Input**: None (uses session for user identification)
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "history": [
      {
        "_id": "string",
        "question": "string",
        "answer": "string",
        "heading": "string",
        "imageUrl": "string" (optional),
        "createdAt": "string" // ISO date string
      }
    ]
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required

---

### 19. `/api/admin/manage`

- **Description**: Manages admin users (get all, promote, revoke).
- **Methods**: `GET`, `POST`
- **Authorization**: Admin role required.

#### `GET /api/admin/manage`
- **Description**: Retrieves a list of all users with admin privileges.
- **Input**: None
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "admins": [ // Array of admin user objects
      {
        "_id": "string",
        "email": "string",
        "name": "string",
        "role": "admin"
      }
    ]
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

#### `POST /api/admin/manage`
- **Description**: Promotes user(s) to admin or revokes admin access.
- **Input (JSON Body)**:
  ```json
  {
    "action": "promote" | "revoke", // Action to perform
    "email": "string" (optional),   // Email of a single user for "promote" or "revoke"
    "emails": ["string"] (optional) // Array of emails for "promote" (bulk promotion)
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "message": "string",
    "data": any // User object or array of results for bulk operations
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 20. `/api/admin/ratings`

- **Description**: Retrieves and provides statistics on user ratings.
- **Method**: `GET`
- **Authorization**: Admin role required.
- **Input (Query Parameters)**:
  - `page`: `number` (Optional, Default: 1) - Page number for pagination.
  - `limit`: `number` (Optional, Default: 20) - Number of ratings per page.
  - `dateFrom`: `string` (Optional) - Filter ratings created on or after this date (ISO format).
  - `dateTo`: `string` (Optional) - Filter ratings created on or before this date (ISO format).
  - `ratingType`: `string` (Optional) - Filter by specific rating type (e.g., 'breakdown_experience').
  - `minRating`: `number` (Optional) - Filter ratings with a minimum score.
  - `maxRating`: `number` (Optional) - Filter ratings with a maximum score.
  - `imageUrl`: `string` (Optional) - Filter ratings by partial image URL (case-insensitive regex).
  - `userEmail`: `string` (Optional) - Filter ratings by partial user email (case-insensitive regex).
- **Output (JSON Response - Success)**:
  ```json
  {
    "ratings": [
      {
        "_id": "string",
        "userEmail": "string",
        "imageUrl": "string",
        "sessionId": "string",
        "rating": number, // 1-5
        "ratingType": "string",
        "userAgent": "string",
        "ipAddress": "string",
        "createdAt": "string",
        "updatedAt": "string",
        "id": "string",       // Same as _id
        "ratingLabel": "string" // e.g., "Excellent"
      }
    ],
    "stats": {
      "totalRatings": number,
      "averageRating": number,
      "ratingDistribution": [
        { "rating": number, "count": number, "percentage": number }
      ],
      "ratingsByType": [
        { "type": "string", "count": number, "averageRating": number }
      ],
      "dailyRatings": [
        { "date": "string", "count": number, "averageRating": number }
      ],
      "topRatedImages": [
        { "imageUrl": "string", "averageRating": number, "totalRatings": number }
      ]
    },
    "pagination": {
      "page": number,
      "limit": number,
      "total": number
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 21. `/api/admin/ratings/export`

- **Description**: Exports user ratings data to a CSV file based on provided filters.
- **Method**: `POST`
- **Authorization**: Admin role required.
- **Input (JSON Body)**:
  ```json
  {
    "dateFrom": "string" (optional), // Filter ratings created on or after this date (ISO format)
    "dateTo": "string" (optional),   // Filter ratings created on or before this date (ISO format)
    "ratingType": "string" (optional), // Filter by specific rating type
    "minRating": "string" (optional),  // Filter ratings with a minimum score
    "maxRating": "string" (optional),  // Filter ratings with a maximum score
    "imageUrl": "string" (optional),   // Filter ratings by partial image URL
    "userEmail": "string" (optional)   // Filter ratings by partial user email
  }
  ```
- **Output (CSV File Stream)**:
  - Returns a CSV file as a stream. Headers include `Content-Type: text/csv` and `Content-Disposition` for filename.
  - Example CSV content:
    ```csv
    ID,User Email,Image URL,Session ID,Rating,Rating Label,Rating Type,User Agent,IP Address,Created At,Updated At
    65e5e0a6d0c7f2a1b2c3d4e5,user@example.com,https://example.com/image.jpg,session123,5,Excellent,breakdown_experience,Mozilla/5.0,...,2023-01-01T10:00:00.000Z,2023-01-01T10:00:00.000Z
    ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 22. `/api/rating`

- **Description**: Allows users to submit or retrieve ratings for a specific image.
- **Methods**: `POST`, `GET`

#### `POST /api/rating`
- **Description**: Submits or updates a user rating for an image.
- **Input (JSON Body)**:
  ```json
  {
    "rating": number,          // Required: Integer rating between 1 and 5
    "imageUrl": "string",      // Required: URL of the image being rated
    "ratingType": "string"     // Optional, default: "breakdown_experience"
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "message": "string", // "Thank you for your rating!" or "Rating updated successfully"
    "data": {
      "ratingId": "string",
      "rating": number,
      "ratingLabel": "string",
      "updated": boolean (optional), // True if an existing rating was updated
      "imageStats": { // Only present for new ratings
        "averageRating": number,
        "totalRatings": number
      }
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```
- **Authentication**: Optional (user email will be recorded if session exists)

#### `GET /api/rating`
- **Description**: Retrieves rating statistics (average, total, distribution) for a given image URL.
- **Input (Query Parameter)**:
  - `imageUrl`: `string` (Required) - The URL of the image to get rating statistics for.
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "data": {
      "averageRating": number,
      "totalRatings": number,
      "distribution": {
        "1": number, // Count of 1-star ratings
        "2": number,
        "3": number,
        "4": number,
        "5": number
      }
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

---

### 23. `/api/share/create`

- **Description**: Creates a shareable link for summary and breakdown data of an image.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "imageUrl": "string",   // Required: URL of the image
    "userEmail": "string"  // Optional: User email to fetch specific summary/breakdown data
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "shareId": "string",   // Unique ID generated for the share link
    "shareUrl": "string"   // Full URL of the shareable link
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

---

### 24. `/api/share/[id]`

- **Description**: Retrieves shared summary and breakdown data using a share ID.
- **Method**: `GET`
- **Input (URL Parameter)**:
  - `id`: `string` (Required) - The unique share ID.
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "data": {
      "imageUrl": "string",
      "summaryData": object | null,   // Summary JSON data if available
      "breakdownData": object | null, // Breakdown JSON data if available
      "createdAt": "string"            // ISO date string
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

---

### 25. `/api/store-summary`

- **Description**: Stores a summary JSON output related to an image for a specific user.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "useremail": "string", // Email of the user
    "imageurl": "string",  // URL of the image
    "jsonoutput": object   // The JSON object representing the summary
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "message": "Summary stored successfully",
    "data": object // The created summary document
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 26. `/api/store-breakdown`

- **Description**: Stores a breakdown JSON output related to an image for a specific user.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "useremail": "string", // Email of the user
    "imageurl": "string",  // URL of the image
    "jsonoutput": object   // The JSON object representing the breakdown steps
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "message": "Breakdown stored successfully",
    "data": object // The created breakdown document
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 27. `/api/breakdown`

- **Description**: Generates a structured breakdown (summary, main steps, sub-steps, theory) of a problem from an image or text using OpenAI.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "problem": "string",     // The problem description (required for theory/sub, optional for summary/main if imageData provided)
    "type": "summary" | "main" | "sub" | "theory", // Type of breakdown requested
    "stepContext": "string" (optional), // Relevant step context for "sub" and "theory" types
    "imageData": "string" (optional)   // Base64 encoded image with data URL prefix for image analysis
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "content": "string" | null, // Raw string content for "theory" type, null for others
    "data": object | null,      // Structured JSON data for "summary", "main", "sub" types
    "type": "string",           // Type of breakdown requested
    "model": "string"           // OpenAI model used (e.g., "o4-mini", "gpt-4o-mini")
  }
  ```
  **Example `data` structure for `type: "summary"`:**
  ```json
  {
    "cruxOfProblem": "string",
    "formulaeUsed": "string",
    "termDefinitions": "string"
  }
  ```
  **Example `data` structure for `type: "main"`:**
  ```json
  {
    "steps": [
      { "id": number, "title": "string", "description": "string" }
    ]
  }
  ```
  **Example `data` structure for `type: "sub"`:**
  ```json
  {
    "subSteps": [
      { "id": number, "title": "string", "description": "string" }
    ]
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 26. `/api/suggestions`

- **Description**: Manages user suggestions for the platform.
- **Methods**: `POST`, `GET`

#### `POST /api/suggestions`
- **Description**: Submits a new suggestion from a user.
- **Input (JSON Body)**:
  ```json
  {
    "name": "string",    // User's name
    "email": "string",   // User's email
    "topic": "string",   // Topic of the suggestion
    "message": "string"  // Detailed suggestion message
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "message": "Suggestion submitted successfully",
    "id": "string"
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

#### `GET /api/suggestions`
- **Description**: Retrieves all submitted suggestions (for admin use).
- **Input**: None
- **Output (JSON Response - Success)**:
  ```json
  {
    "suggestions": [
      {
        "_id": "string",
        "name": "string",
        "email": "string",
        "topic": "string",
        "message": "string",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ]
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 27. `/api/contact`

- **Description**: Manages contact form submissions.
- **Methods**: `POST`, `GET`

#### `POST /api/contact`
- **Description**: Submits a new contact form entry.
- **Input (JSON Body)**:
  ```json
  {
    "name": "string",      // Required: Sender's name
    "email": "string",     // Required: Sender's email
    "subject": "string",   // Required: Subject of the message
    "message": "string",   // Required: The message content
    "phone": "string" (optional),
    "company": "string" (optional),
    "isUrgent": boolean (optional) // Set to true for urgent queries
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "message": "Contact form submitted successfully",
    "id": "string",
    "estimatedResponse": "string" // e.g., "24-48 hours" or "2-3 working days"
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

#### `GET /api/contact`
- **Description**: Retrieves all contact form submissions (for admin use).
- **Input**: None
- **Output (JSON Response - Success)**:
  ```json
  {
    "contacts": [
      {
        "_id": "string",
        "name": "string",
        "email": "string",
        "subject": "string",
        "message": "string",
        "phone": "string" (optional),
        "company": "string" (optional),
        "isUrgent": boolean,
        "createdAt": "string",
        "updatedAt": "string"
      }
    ]
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 28. `/api/save-upload`

- **Description**: Saves uploaded image URLs and session IDs to the database for sharing and retrieves them.
- **Methods**: `POST`, `GET`

#### `POST /api/save-upload`
- **Description**: Saves an uploaded image URL and its associated session ID.
- **Input (JSON Body)**:
  ```json
  {
    "imageUrl": "string",  // Required: URL of the uploaded image
    "sessionId": "string" // Required: Session ID associated with the upload
  }
  ```
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "id": "string",       // ID of the saved upload record
    "shareUrl": "string"  // Generated shareable URL for the upload
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Optional (associates `userId` if authenticated)

#### `GET /api/save-upload`
- **Description**: Retrieves saved upload data by its ID.
- **Input (Query Parameter)**:
  - `id`: `string` (Required) - The ID of the shared upload record.
- **Output (JSON Response - Success)**:
  ```json
  {
    "imageUrl": "string",   // URL of the uploaded image
    "sessionId": "string",  // Session ID associated with the upload
    "createdAt": "string"   // ISO date string
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 29. `/api/analytics`

- **Description**: Provides various analytics data for admin users, including user, chatbot session, and step breakdown statistics.
- **Method**: `GET`
- **Authorization**: Admin role required.
- **Input**: None
- **Output (JSON Response - Success)**:
  ```json
  {
    "userAnalytics": {
      "totalUsers": number,
      "usersToday": number,
      "usersYesterday": number,
      "usersThisWeek": number,
      "usersThisMonth": number,
      "creditStats": {
        "avgCredits": number,
        "totalCredits": number,
        "maxCredits": number,
        "minCredits": number
      },
      "dailyUsers": [
        { "_id": "YYYY-MM-DD", "count": number }
      ],
      "creditDistribution": [
        { "_id": "string" | number, "count": number, "avgCredits": number }
      ]
    },
    "chatbotSessionAnalytics": {
      "totalSessions": number,
      "sessionsToday": number,
      "sessionsYesterday": number,
      "sessionsThisWeek": number,
      "sessionsThisMonth": number,
      "dailySessions": [
        { "_id": "YYYY-MM-DD", "count": number }
      ],
      "weeklySessions": [
        { "_id": { "year": number, "week": number }, "count": number, "startDate": "string" }
      ]
    },
    "stepBreakdownAnalytics": {
      "totalStepBreakdowns": number,
      "stepBreakdownsToday": number,
      "stepBreakdownsYesterday": number,
      "stepBreakdownsThisWeek": number,
      "stepBreakdownsThisMonth": number,
      "dailyStepBreakdowns": [
        { "_id": "YYYY-MM-DD", "count": number }
      ],
      "topStepBreakdownUsers": [
        { "_id": "user_email", "totalUsage": number, "lastUsed": "string", "firstUsed": "string" }
      ]
    }
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 30. `/api/auth/[...nextauth]`

- **Description**: Handles user authentication with NextAuth.js, including Google OAuth, session management, user creation/updates, and role/credits integration.
- **Methods**: `GET`, `POST`
- **Input**: Varies based on NextAuth.js internal flow (e.g., OAuth callbacks).
- **Output**: Redirects or sets cookies for session management.
- **Callbacks**: Custom JWT and Session callbacks are used to: 
  - Find or create users in the database on sign-in.
  - Initialize new users with default credits and roles.
  - Enrich the JWT and session objects with `userId`, `credits`, and `role` for client-side access.

---

### 31. `/api/upload-json`

- **Description**: Uploads structured JSON data, typically for chatbot sessions, and returns a link to the session.
- **Method**: `POST`
- **Input (JSON Body)**:
  ```json
  {
    "questions": ["string"],
    "options": [["string", "string", "string", "string"]], // Each inner array must have 4 options
    "correct_answers": [number], // 0-indexed correct option (0 to 3)
    "hint1": ["string"],
    "hint2": ["string"],
    "explanations": ["string"],
    "conceptual_explanation": ["string"],
    "concept_tags": ["string"]
  }
  ```
  - **Note**: All top-level arrays must have the same length.
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "sessionId": "string",   // Unique ID generated for the session
    "chatbotLink": "string", // URL to access the chatbot session (e.g., /learnbot?id=...)
    "message": "string"      // Confirmation message
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```

---

### 32. `/api/upload`

- **Description**: Handles image uploads to an AWS S3 bucket, including image optimization, and returns the S3 URL.
- **Method**: `POST`
- **Input (Multipart Form Data)**:
  - `image`: `File` (Required) - The image file to upload.
- **Output (JSON Response - Success)**:
  ```json
  {
    "success": true,
    "imageUrl": "string",     // Public URL of the uploaded image on S3
    "imageId": "string",      // Filename/key of the image on S3 (for backward compatibility)
    "fileName": "string",     // Filename/key of the image on S3
    "fileSize": number,       // Size of the uploaded file in bytes
    "contentType": "string"   // MIME type of the uploaded file
  }
  ```
- **Output (JSON Response - Error)**:
  ```json
  {
    "error": "string"
  }
  ```
- **Authentication**: Required 