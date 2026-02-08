# Harbor - Therapeutic Chat Assistant Platform

Harbor is a comprehensive therapeutic platform that connects therapists with clients, featuring AI-powered chat assistance, video conferencing, homework assignments, care plans, and session recordings with transcription.

## Features

- **AI-Powered Chat Assistant**: Therapeutic chat bot powered by Google's Generative AI
- **Video Conferencing**: Real-time video sessions with recording capabilities
- **Session Recordings**: Automatic recording and transcription of video sessions using ElevenLabs
- **Homework Management**: Create and track therapeutic homework assignments
- **Care Plans**: Generate and manage personalized care plans based on client interactions
- **Conversation History**: Archive and review past conversations
- **Role-Based Access**: Separate interfaces for therapists and clients

## Tech Stack

### Backend
- **Runtime**: Node.js 25.2.1
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Auth0 with JWT
- **AI**: Google Generative AI (Vertex AI)
- **Transcription**: ElevenLabs Speech-to-Text API
- **Video SDK**: VideoSDK.live
- **Storage**: AWS S3 for video recordings
- **Language**: TypeScript

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Authentication**: Auth0 React SDK
- **Video**: VideoSDK.live React SDK
- **Styling**: CSS with CSS Variables

## Prerequisites

- Node.js 18+ (recommended: 25.2.1)
- MongoDB instance (local or cloud)
- Auth0 account and application
- AWS account with S3 bucket (for video storage)
- ElevenLabs API key (for transcription)
- Google Cloud Project with Vertex AI enabled
- VideoSDK.live account and API credentials

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd devfest
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017
DB_NAME=harbor_db

# Auth0
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-api-audience

# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1

# AWS S3 (for video storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket-name

# ElevenLabs (for transcription)
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# VideoSDK
VIDEOSDK_API_KEY=your-videosdk-api-key
VIDEOSDK_SECRET=your-videosdk-secret
```

Start the backend:

```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend/devfest
npm install
```

Create a `.env` file in the `frontend/devfest` directory:

```env
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-audience
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Access the Application

1. Open `http://localhost:5173` in your browser
2. Sign in with Auth0
3. Complete onboarding to set your role (therapist or client)
4. Start using Harbor!

## Project Structure

```
devfest/
├── backend/                 # Backend API server
│   ├── api/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.ts       # Express server setup
│   ├── middleware/         # Auth middleware
│   ├── utils/              # Utility functions (AI, prompts)
│   └── __tests__/          # Test files
│
├── frontend/
│   └── devfest/            # React frontend
│       ├── src/
│       │   ├── components/ # Reusable components
│       │   ├── screens/    # Page components
│       │   ├── api/        # API client
│       │   └── main.tsx    # Entry point
│       └── package.json
│
└── README.md               # This file
```

## API Endpoints

### Authentication
- All endpoints require JWT authentication via Auth0
- Therapist-only endpoints require `therapist` role

### Main Endpoints

**Users**
- `GET /me` - Get current user profile
- `POST /users` - Create user (onboarding)
- `GET /users/:user_id` - Get user details

**Conversations**
- `GET /therabot_conversations/client/:user_id` - Get client conversations
- `POST /therabot_conversations` - Create conversation
- `GET /:user_id/:conversation_id/therabot_messages` - Get messages

**Video Sessions**
- `POST /videosdk/meeting` - Create video meeting (therapist only)
- `POST /videosdk/token` - Get VideoSDK token
- `GET /videosdk/meeting/:roomId/validate` - Validate meeting

**Recordings**
- `GET /meeting_recordings/:user_id/:therapist_id` - Get recordings
- `POST /meeting_recordings/manual-save` - Save recording manually
- `DELETE /meeting_recordings/:user_id/:therapist_id/:meeting_recording_id` - Delete recording

**Homework**
- `GET /homeworks/:user_id/:therapist_id` - Get homework assignments
- `POST /homeworks/:user_id/:therapist_id` - Create homework
- `PUT /homeworks/:user_id/:therapist_id/:homework_id` - Update homework
- `DELETE /homeworks/:user_id/:therapist_id/:homework_id` - Delete homework

**Care Plans**
- `GET /care_plans/client/:user_id` - Get care plans
- `POST /care_plans/generate` - Generate care plan (therapist only)

## Development

### Running Tests

```bash
cd backend
npm test
```

### Building for Production

**Backend:**
```bash
cd backend
npm run start
```

**Frontend:**
```bash
cd frontend/devfest
npm run build
```

The production build will be in `frontend/devfest/dist`

### Docker (Optional)

See `backend/README.Docker.md` for Docker setup instructions.

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:5173) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `DB_NAME` | MongoDB database name | Yes |
| `AUTH0_DOMAIN` | Auth0 domain | Yes |
| `AUTH0_AUDIENCE` | Auth0 API audience | Yes |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | Yes |
| `VERTEX_AI_LOCATION` | Vertex AI region | No (default: us-central1) |
| `AWS_REGION` | AWS region | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |
| `S3_BUCKET_NAME` | S3 bucket name | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | Yes |
| `VIDEOSDK_API_KEY` | VideoSDK API key | Yes |
| `VIDEOSDK_SECRET` | VideoSDK secret | Yes |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_AUTH0_DOMAIN` | Auth0 domain | Yes |
| `VITE_AUTH0_CLIENT_ID` | Auth0 client ID | Yes |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience | Yes |

## Key Features Explained

### Video Recording & Transcription

1. Therapist starts a video session
2. Recording begins automatically when both participants join
3. Recording stops when participants leave
4. Video is uploaded to S3
5. ElevenLabs transcribes the audio
6. AI generates a session summary
7. Recording appears in therapist's dashboard

### AI Chat Assistant

- Powered by Google's Generative AI (Vertex AI)
- Therapeutic prompts and context-aware responses
- Conversation history tracking
- Integration with care plan generation

### Homework Management

- Therapists create assignments
- Clients submit responses
- Status tracking (pending, completed, archived)
- Archive completed assignments

## Troubleshooting

### Backend won't start
- Check MongoDB is running and accessible
- Verify all environment variables are set
- Check port 3000 is available

### Frontend won't connect
- Verify `VITE_AUTH0_*` variables are set correctly
- Check backend is running on port 3000
- Verify CORS settings in backend

### Video recording not working
- Check VideoSDK credentials
- Verify S3 bucket permissions
- Check network connectivity

### Transcription not working
- Verify ElevenLabs API key
- Check audio file is accessible
- Review backend logs for errors

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue on the repository.
