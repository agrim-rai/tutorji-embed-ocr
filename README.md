# Codebase Cleanup Guide

## Core Functionalities to Keep

The following files implement the OCR, embedding, storage, and search functionalities you want to preserve.

### OCR (Optical Character Recognition) Files
- **`src/app/api/ocr/route.js`** - Main OCR API endpoint that extracts text from images using OpenAI Vision
- **`src/app/api/link-ocr-ai/route.js`** - Links OCR records with AI responses
- **`src/models/OCRRecord.js`** - MongoDB model for storing OCR records

### Embedding/Vector Functionality Files
- **`src/app/api/vectors/route.js`** - Vector storage and similarity search API using OpenAI embeddings
- **`src/app/api/vectors/store.js`** - Vector storage functions (addVector, getAllVectors)
- **`src/models/vector.js`** - MongoDB model for storing text embeddings

### Storage/Fetcher Functionality Files
- **`src/app/api/ada-store/route.ts`** - Stores and retrieves Ada-Image mappings
- **`src/app/api/ada-store/multiple/route.ts`** - Fetches multiple Ada-Image mappings
- **`src/app/api/store-breakdown/route.ts`** - Stores breakdown data
- **`src/app/api/store-summary/route.ts`** - Stores summary data
- **`src/models/adaAndImage.js`** - MongoDB model for Ada-Image mappings
- **`src/models/breakdown.js`** - MongoDB model for breakdown data
- **`src/models/summary.js`** - MongoDB model for summary data

### Core Dependencies (Keep these supporting files)
- **`src/lib/mongoose.js`** - Database connection
- **`src/lib/auth.js`** - Authentication setup
- **`src/models/User.js`** - User model (needed for authentication)
- **`src/app/layout.tsx`** - Main layout
- **`src/app/globals.css`** - Global styles
- **`src/app/page.tsx`** - Home page
- **`package.json`** - Dependencies
- **`tsconfig.json`** - TypeScript configuration

## Files That Can Be Removed

### SAT/Test Related (All can be removed)
- `src/app/sat/page.tsx`
- `src/app/satadmin/page.tsx`
- `src/app/satanalysis/page.tsx`
- `src/app/satask/page.tsx`
- `src/app/satbot/page.tsx`
- `src/app/satbreakdown/page.tsx`
- `src/app/satlearnbot/page.tsx`
- All files in `src/app/api/sat/` directory

### Admin Functionality (All can be removed)
- All files in `src/app/admin/` directory
- `src/app/api/admin/` directory
- `src/app/api/analytics/route.js`

### Authentication Pages (Keep core auth.js but remove these pages)
- `src/app/auth/` directory (keep `src/lib/auth.js`)

### Payment Processing (All can be removed)
- `src/app/payment/` directory
- `src/app/api/payment/route.js`
- `src/app/api/create-order/route.js`
- `src/app/api/verify-payment/route.js`
- `src/app/api/user/credits/route.js`
- `src/app/api/user/payments/route.js`

### Chat/Bot Functionality (All can be removed)
- `src/app/bot/page.tsx`
- `src/app/learnbot/page.tsx`
- `src/app/stepsbot/page.tsx`
- `src/app/api/chat/route.js`
- `src/app/api/get-response/route.js`
- `src/app/api/history/route.js`
- `src/app/api/session/route.js`

### Plugin Functionality (All can be removed)
- `src/app/plugin-demo/page.tsx`
- `src/app/plugin-demo-stream/page.tsx`
- All files in `src/app/api/plugin/` directory

### Discord Integration (All can be removed)
- `src/app/discord/` directory
- `src/app/api/discord/` directory

### Comparison/Image Processing (Keep OCR, remove these)
- `src/app/api/compare-images/` directory
- `src/app/api/compare-texts/route.js`
- `src/app/api/process-image/route.js` (different from OCR - this creates questions from images)

### Other Features (All can be removed)
- `src/app/ask/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/linkerpage/page.tsx`
- `src/app/pro/page.tsx`
- `src/app/share/` directory
- `src/app/shareask/page.tsx`
- `src/app/suggest/page.tsx`
- `src/app/steps/page.tsx`
- `src/app/test-combiner/page.jsx`
- `src/app/test-math/page.tsx`
- `src/app/testing-ada/page.jsx`
- `src/app/upload-image/page.tsx`
- `src/app/unauthorized/page.tsx`

### API Routes (Keep core OCR/vector/storage, remove these)
- `src/app/api/ask/route.js`
- `src/app/api/auth/route.js`
- `src/app/api/breakdown/route.js`
- `src/app/api/combiner/route.js`
- `src/app/api/contact/` directory
- `src/app/api/diagram-check/route.ts`
- `src/app/api/query-ada/route.js`
- `src/app/api/rating/route.js`
- `src/app/api/save-upload/route.js`
- `src/app/api/secure-api-nextjs-session-token/route.js`
- `src/app/api/share/` directory
- `src/app/api/suggestions/` directory
- `src/app/api/test-stream/route.js`
- `src/app/api/upload/route.js`
- `src/app/api/upload-json/route.js`

### UI Components (Keep core, remove specialized)
Keep basic UI components in `src/components/ui/`, remove specialized components like:
- `src/components/admin/` directory
- `src/components/AuthProvider.jsx`
- `src/components/ComingSoon.tsx`
- `src/components/pricing2.tsx`
- `src/components/ratingComponent.tsx`
- `src/components/response-text.tsx`
- `src/components/robotui.tsx`
- `src/components/shadcnblocks-com-feature108.tsx`
- `src/components/thinking.tsx`

### Models (Keep core OCR/vector/storage models, remove these)
- `src/models/AIResponse.js`
- `src/models/ChatbotSession.js`
- `src/models/Contact.js`
- `src/models/Payment.js`
- `src/models/PluginAnswer.js`
- `src/models/Rating.js`
- `src/models/SatQuestion.js`
- `src/models/share.js`
- `src/models/SharedUpload.js`
- `src/models/Suggestion.js`
- `src/models/Transaction.js`

## Summary

**Total files to KEEP: ~20-25 files**
**Total files to REMOVE: ~150+ files**

The core OCR, embedding, storage, and search functionality represents about 15-20% of the current codebase. Removing the unnecessary features will significantly simplify the application and make it easier to maintain.

## Next Steps

1. Backup the current codebase
2. Remove all files listed in the "Files That Can Be Removed" section
3. Test that the remaining OCR, embedding, storage, and search functionalities still work
4. Update any import statements that reference removed files
5. Clean up the UI to only show the core functionality