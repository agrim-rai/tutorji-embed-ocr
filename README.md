# tutorji - AI-Powered Learning Platform

**URL:** https://tutorji.in/

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: MongoDB with Mongoose
- **AI Integration**: OpenAI GPT-4 (o4-mini / o3 if required)
- **Image file upload and CDN**: Cloudinary

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18.0 or higher)
- npm or yarn package manager
- Git
- MongoDB database (local or cloud)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://bitbucket.org/bigvisionllc/tutorji.git
cd tutorji
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Create a `.env.local` file in the root directory and add the following environment variables:

```env
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/tutorji
# or for cloud MongoDB:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tutorji

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## Running the Development Server

### Start the development server:

```bash
npm run dev
```

The application will be available at: http://localhost:3000

### Build for Production:

```bash
npm run build
npm start
```

## Usage Guide

### 1. Upload Question Image
- Navigate to `/upload-image`
- Drag & drop an image or click to browse
- Paste from clipboard (Ctrl+V / Cmd+V)
- Supported formats: JPG, PNG, GIF, WebP

### 2. AI Processing
- Click "Breakdown Problem" to start AI analysis
- Mock/hard coded thinking process
- AI will generate scaffolded sub-questions

### 3. Interactive Learning
- Click "Start Learning with AI Bot" to begin
- Navigate through step-by-step guidance
- View original question with zoom controls


## Testing

### Run Tests:

```bash
npm test
```

### API Testing:

Refer README_API.md file

## Database Models

### User Model (`src/models/User.js`)
**Purpose**: Stores user account information and credit system data

**Schema**:
```javascript
{
  name: {
    type: String,
    required: true,
    description: "User's display name from OAuth"
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validation: "Valid email format required"
  },
  image: {
    type: String,
    description: "Profile image URL from OAuth provider"
  },
  credits: {
    type: Number,
    default: 25,
    description: "Available credits for AI question asking"
  },
  createdAt: {
    type: Date,
    default: Date.now,
    description: "Account creation timestamp"
  }
}
```

**Usage**:
- Created automatically on first Google OAuth login
- Referenced in AIResponse model for question history

### AIResponse Model (`src/models/AIResponse.js`)
**Purpose**: Stores user's question-answer history for the main AI chat feature

**Schema**:
```javascript
{
  userId: {
    type: ObjectId,
    ref: 'User',
    description: "Reference to the user who asked the question"
  },
  question: {
    type: String,
    required: true,
    description: "User's original question text"
  },
  answer: {
    type: String,
    required: true,
    description: "AI-generated response with analysis and solution"
  },
  imageId: {
    type: String,
    default: null,
    description: "Cloudinary public ID if question included an image"
  },
  imageUrl: {
    type: String,
    default: null,
    description: "Full Cloudinary URL for image reference"
  },
  createdAt: {
    type: Date,
    default: Date.now,
    description: "Timestamp when question was asked"
  }
}
```


**JSON Data Structure**:
```javascript
{
  questions: ["Array of sub-questions"],
  options: [["4 options per question"]],
  correct_answers: [0, 1, 2], // Indices of correct options
  hint1: ["Light hints for each question"],
  hint2: ["Stronger hints for each question"],
  explanations: ["Detailed explanations for correct answers"],
  conceptual_explanation: ["Core concepts and formulas"],
  concept_tags: [["Subject tags", "Topic tags"]]
}
```

**Usage**:
- Created via `/api/upload-json` after image processing
- Retrieved via `/api/session` for learnbot interface
- Automatically expires after 30 days to manage storage



## 🔑 API Endpoints

Refer README_API.md file