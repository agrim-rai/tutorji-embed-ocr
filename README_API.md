# API Documentation

## Base url 
```
https://tutorji.in/

```


## 🔑 API Endpoints

### Authentication Endpoints

#### `GET/POST /api/auth/[...nextauth]`
**Description**: NextAuth.js dynamic authentication routes for Google OAuth
- **Access**: Public
- **Features**:
  - Google OAuth authentication
  - Automatic user creation on first login
  - Session management with user data enrichment
  - Credits system integration (25 credits for new users)
  - JWT token handling with custom user data

**Response Format**:
```json
{
  "user": {
    "id": "userId",
    "name": "User Name",
    "email": "user@example.com",
    "image": "profile_image_url",
    "credits": 25
  }
}
```

### Core Learning Features

#### `POST /api/process-image`
**Description**: Analyzes uploaded academic images and breaks them into scaffolded learning questions
- **Access**: Public
- **Input**: FormData with image file
- **AI Model**: OpenAI o4-mini for advanced question decomposition
- **Features**:
  - Image-to-base64 conversion
  - Advanced pedagogical question breakdown
  - Multiple-choice question generation with distractors
  - Hint systems (light and strong hints)
  - Concept tagging and explanations

**Request**:
```javascript
const formData = new FormData();
formData.append('image', imageFile);
```

**Response Format**:
```json
{
  "questions": ["Sub-question 1", "Sub-question 2", "..."],
  "options": [
    ["Option a", "Option b", "Option c", "Option d"],
    ["Option a", "Option b", "Option c", "Option d"]
  ],
  "correct_answers": [1, 0, 2],
  "hint1": ["Light hint for Q1", "Light hint for Q2"],
  "hint2": ["Strong hint for Q1", "Strong hint for Q2"],
  "explanations": ["Explanation for Q1", "Explanation for Q2"],
  "conceptual_explanation": ["Core concept for Q1", "Core concept for Q2"],
  "concept_tags": [["Physics", "Newton's Laws"], ["Mathematics", "Calculus"]]
}
```

#### `POST /api/upload-json`
**Description**: Creates a new chatbot learning session from processed question data
- **Access**: Public
- **Input**: JSON object with question structure
- **Features**:
  - Comprehensive data validation
  - Unique session ID generation (UUID v4)
  - Database storage with auto-expiration (30 days)
  - Learning bot link generation

**Request**:
```json
{
  "questions": ["Question 1", "Question 2"],
  "options": [["a", "b", "c", "d"], ["a", "b", "c", "d"]],
  "correct_answers": [0, 2],
  "hint1": ["Hint 1", "Hint 2"],
  "hint2": ["Hint 1", "Hint 2"],
  "explanations": ["Explanation 1", "Explanation 2"],
  "conceptual_explanation": ["Concept 1", "Concept 2"],
  "concept_tags": [["Tag1"], ["Tag2"]]
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "uuid-session-id",
  "chatbotLink": "/learnbot?id=uuid-session-id",
  "message": "JSON data uploaded successfully"
}
```

#### `GET /api/session`
**Description**: Retrieves chatbot session data for interactive learning
- **Access**: Public
- **Query Parameters**: `id` (session ID)
- **Features**:
  - Session validation
  - Complete learning data retrieval
  - Creation timestamp tracking

**Request**:
```
GET /api/session?id=session-uuid
```

**Response**:
```json
{
  "success": true,
  "sessionId": "session-uuid",
  "jsonData": {
    "questions": ["..."],
    "options": [["..."]],
    "correct_answers": [0, 1],
    "explanations": ["..."]
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```


### Utility Endpoints

#### `POST /api/upload`
**Description**: Uploads images to Cloudinary CDN
- **Access**: Public
- **Input**: FormData with image file
- **Features**:
  - Cloudinary integration
  - Automatic folder organization
  - Secure URL generation
  - Error handling

**Request**:
```javascript
const formData = new FormData();
formData.append('image', imageFile);
```

**Response**:
```json
{
  "imageId": "cloudinary-public-id",
  "imageUrl": "https://res.cloudinary.com/..."
}
```

#### `POST /api/newsletter`
**Description**: Newsletter subscription management
- **Access**: Public
- **Features**:
  - Email validation
  - Duplicate prevention
  - Local JSON file storage
  - TypeScript implementation

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription successful"
}
```




## JSON Schema

### Required Fields

| Field                       | Type         | Description                                               |
| -----------------           | ------------ | --------------------------------------------------------- |
| `questions`                 | `string[]`   | Array of question strings                                 |
| `options`                   | `string[][]` | Array of arrays, each containing 4 option strings         |
| `correct_answers`           | `number[]`   | Array of correct answer indices (0-3)                     |
| `hint1`                     | `string[]`   | Array of weak hints for each question                     |
| `hint2`                     | `string[]`   | Array of string hints for each question                   |
| `explanations`              | `string[]`   | Array of explanation strings for each question            |
| `conceptual_explanation`    | `string[]`   | Array of conceptual explanation for each question         |
| `concept_tags`              | `string[][]` | Array of arrays containing concept tags for each question |

## Sample Question Bank

Here's a complete example of a valid question bank:

```json
{
  "questions": [
    {
      "question": "What is the probability of drawing a white ball from Bag 1, which contains 4 white and 5 black balls?"
    },
    {
      "question": "If a white ball is transferred from Bag 1 to Bag 2 (which initially has n white and 3 black balls), what is the probability of drawing a white ball from Bag 2?"
    },
    {
      "question": "If a black ball is transferred from Bag 1 to Bag 2 (initially with n white and 3 black balls), what is the probability of drawing a white ball from Bag 2?"
    },
    {
      "question": "Using the law of total probability, which expression correctly gives the overall probability of drawing a white ball from Bag 2 after the transfer?"
    },
    {
      "question": "Which equation should be solved to find n, given that the overall probability equals 29/45?"
    },
    {
      "question": "What is the value of n that satisfies the equation?"
    }
  ],
  "options": [
    ["5/9", "4/9", "1/2", "4/5"],
    ["n/(n+3)", "(n+1)/(n+4)", "(n+1)/(n+3)", "n/(n+4)"],
    ["n/(n+4)", "n/(n+3)", "(n-1)/(n+3)", "(n+1)/(n+4)"],
    [
      "(4/9)*(n/(n+4)) + (5/9)*((n+1)/(n+4))",
      "(5/9)*(n/(n+4)) + (4/9)*((n+1)/(n+4))",
      "(4/9)*((n+1)/(n+4)) + (5/9)*(n/(n+4))",
      "(4/9)*(n/(n+3)) + (5/9)*(n/(n+4))"
    ],
    [
      "(4/9)*(n+1)/(n+4) + (5/9)*n/(n+4) = 29/36",
      "(4/9)*((n+1)/(n+4)) + (5/9)*(n/(n+4)) = 29/45",
      "(5/9)*((n+1)/(n+4)) + (4/9)*(n/(n+4)) = 29/45",
      "(4/9)*((n+1)/(n+4)) - (5/9)*(n/(n+4)) = 29/45"
    ],
    ["3", "6", "5", "4"]
  ],
  "correct_answers": [1, 1, 0, 2, 1, 1],
  "hint1": [
    "Recall probability = favorable outcomes / total outcomes.",
    "After transferring, white count increases by 1.",
    "A black transfer adds to black count.",
    "Use P(A and B) = P(A)*P(B|A) then sum cases.",
    "Set the expression equal to 29/45.",
    "Clear denominators before solving."
  ],
  "hint2": [
    "There are 4 white and total 9 balls.",
    "New total in Bag2 becomes n+3+1 = n+4.",
    "White count remains n, total becomes n+4.",
    "Use P(white transfer)=4/9, P(black transfer)=5/9.",
    "Use the result from Q4 and equate to 29/45.",
    "Multiply both sides by 9(n+4) to simplify."
  ],
  "explanations": [
    "4 white out of 9 total gives P=4/9; other choices miscount numerator or denominator.",
    "Transferred white yields white count n+1, total n+3+1, so P=(n+1)/(n+4).",
    "Transferred black increases black count to 4, white remains n, so P=n/(n+4).",
    "Law of total probability gives P=4/9*(n+1)/(n+4) + 5/9*(n/(n+4)); other options swap terms or use wrong denominators.",
    "Correct equation is (4/9)*((n+1)/(n+4)) + (5/9)*(n/(n+4)) = 29/45; others have wrong values or operations.",
    "Solving 4/9*(n+1)/(n+4) + 5/9*n/(n+4) = 29/45 yields n=6; other values do not satisfy."
  ],
  "conceptual_explanation": [
    "Basic definition of probability for equally likely outcomes.",
    "Conditional probability and updating sample space when an event adds to outcomes.",
    "Conditional probability with updated sample space after adding an unfavorable outcome.",
    "Law of total probability: sum over partition of events.",
    "Forming equations by equating theoretical probability to a given value.",
    "Algebraic manipulation: clearing fractions and solving for unknown."
  ],
  "concept_tags": [
    ["Probability", "Basic Probability"],
    ["Conditional Probability", "Sample Space"],
    ["Conditional Probability", "Sample Space"],
    ["Total Probability Theorem", "Conditional Probability"],
    ["Equation Setup", "Algebra"],
    ["Algebra", "Probability"]
  ]
}
```
