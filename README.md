# Tutorji - Interactive Learning Assistant

A Next.js application that provides step-by-step analysis and interactive learning for educational content using AI.

## Features

- **Image Upload & Analysis**: Upload question images with Cloudinary integration
- **Step-by-Step Breakdown**: AI-powered analysis with detailed steps and sub-steps  
- **Interactive Learning**: AI chatbot for personalized guidance
- **Database Storage**: Complete analysis tracking and user analytics
- **Authentication**: Google OAuth integration
- **Responsive Design**: Mobile and desktop optimized

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication (NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Optional: Admin email for enhanced permissions
ADMIN_EMAIL=your_admin_email@example.com
```

## Getting Started

1. **Clone the repository**
```bash
   git clone <repository-url>
cd tutorji
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
   - Copy the environment variables above into `.env.local`
   - Configure your MongoDB, Google OAuth, OpenAI, and Cloudinary credentials

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses MongoDB with the following main collections:

### Analysis Collection
- **Image Data**: Cloudinary URLs, metadata, dimensions
- **Question Summary**: AI-generated question analysis
- **Step Breakdown**: Hierarchical steps with sub-steps and theory
- **Interactive Learning**: Chatbot session data
- **Analytics**: View counts, user interactions, completion tracking
- **User Management**: Authentication, credits, permissions

### Key Features of the Schema
- **Auto-tagging**: Automatically extracts subject tags from content
- **Analytics Tracking**: Monitors user engagement and learning progress
- **Access Control**: Public/private sharing with expiration dates
- **Credit System**: Tracks API usage for different features

## API Endpoints

### Image Upload
- `POST /api/upload-image` - Upload images to Cloudinary

### Analysis Management
- `POST /api/analysis` - Create new analysis
- `GET /api/analysis` - List analyses (user's or public)
- `GET /api/analysis/[id]` - Get specific analysis
- `PATCH /api/analysis/[id]` - Update analysis
- `DELETE /api/analysis/[id]` - Delete analysis

### Content Generation
- `POST /api/breakdown` - Generate step-by-step analysis
- `POST /api/process-image` - Process images for interactive learning

### User Management
- `GET /api/user/credits` - Get user credits
- `PATCH /api/user/credits` - Update user credits

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with Google OAuth
- **AI/ML**: OpenAI GPT-4, GPT-4o-mini
- **Image Storage**: Cloudinary
- **UI Components**: Custom components with Framer Motion
- **Math Rendering**: Custom LaTeX renderer

## Key Features

### Intelligent Image Analysis
- Cloudinary integration for optimized image storage
- AI-powered question analysis and categorization
- Automatic concept extraction and tagging

### Structured Learning
- Hierarchical breakdown (Steps → Sub-steps → Theory)
- On-demand theory explanations
- Interactive expansion tracking

### User Analytics
- Learning progress tracking
- Interaction analytics
- Completion percentages
- Reading time estimation

### Sharing & Collaboration
- Public/private analysis sharing
- Shareable links with access controls
- Comment support (configurable)
- Expiration dates for shared content

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license information here]