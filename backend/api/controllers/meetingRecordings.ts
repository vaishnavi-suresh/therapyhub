import { Request, Response } from 'express';
import { createMeetingRecording, getMeetingRecordings, getMeetingRecording, updateMeetingRecording, deleteMeetingRecording } from '../services/meeting_recordings';
import { MeetingRecording } from '../models/MeetingRecording';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Type definition for multer file (if multer is used)
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : undefined,
});

const BUCKET = process.env.S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';

const getFileExtension = (mimetype: string): string => {
    const map: Record<string, string> = {
        'video/webm': 'webm',
        'video/mp4': 'mp4',
        'video/ogg': 'ogv',
        'video/quicktime': 'mov',
    };
    return map[mimetype] || 'webm';
};

/**
 * Generate a signed URL for a recording stored in S3
 * @param recordingUrl The full S3 URL stored in the database
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns A signed URL that can be used to access the video
 */
const getSignedRecordingUrl = async (recordingUrl: string, expiresIn: number = 3600): Promise<string> => {
    if (!BUCKET) {
        throw new Error('S3_BUCKET_NAME not configured');
    }
    
    // Extract the S3 key from the full URL
    // Format: https://BUCKET.s3.REGION.amazonaws.com/key
    const url = new URL(recordingUrl);
    const key = url.pathname.substring(1); // Remove leading slash
    
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Upload meeting recording: accepts video buffer via multer, uploads to S3, creates Mongo document.
 * Expects: req.file (video buffer from multer), req.body.user_id, req.body.therapist_id
 */
const uploadMeetingRecordingController = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = (req as any).file as MulterFile | undefined;
        const { user_id, therapist_id } = req.params;

        if (!file?.buffer || !user_id || !therapist_id) {
            res.status(400).json({
                message: 'Missing required fields: video file (multipart), user_id, therapist_id',
            });
            return;
        }

        if (!BUCKET) {
            res.status(500).json({ message: 'S3_BUCKET_NAME not configured' });
            return;
        }

        const meeting_id = uuidv4();
        const ext = getFileExtension(file.mimetype || 'video/webm');
        const key = `meetings/${user_id}/${therapist_id}/${meeting_id}.${ext}`;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype || 'video/webm',
            })
        );

        const recording_url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
        const recording_created_at = new Date();

        const payload = {
            meeting_id,
            user_id: String(user_id),
            therapist_id: String(therapist_id),
            recording_url,
            recording_created_at,
            transcript: null,
            analysis: '',
        };

        const meetingRecording = await createMeetingRecording(payload as any);
        res.status(201).json(meetingRecording);
    } catch (err) {
        console.error('Upload meeting recording error:', err);
        res.status(500).json({ message: 'Failed to upload meeting recording' });
    }
};

const createMeetingRecordingController = async (req: Request, res: Response) => {
    const { user_id, therapist_id, recording_url, transcript, analysis } = req.body;
    const payload = {
        meeting_id: uuidv4(),
        user_id,
        therapist_id,
        recording_url: recording_url || '',
        recording_created_at: new Date(),
        transcript: transcript ?? null,
        analysis: analysis || '',
    };
    const meetingRecording = await createMeetingRecording(payload as any);
    res.status(201).json(meetingRecording);
};

const getAllMeetingDataController = async (req: Request, res: Response) => {
    const { user_id, therapist_id } = req.params;
    if (!user_id || !therapist_id) {
        res.status(400).json({ message: 'user_id and therapist_id params required' });
        return;
    }
    const meetingRecordings = await getMeetingRecordings(String(user_id), String(therapist_id));
    
    // Generate signed URLs for each recording
    const recordingsWithSignedUrls = await Promise.all(
        meetingRecordings.map(async (recording) => {
            if (recording.recording_url) {
                try {
                    const signedUrl = await getSignedRecordingUrl(recording.recording_url);
                    return { ...recording, recording_url: signedUrl };
                } catch (error) {
                    console.error('Error generating signed URL:', error);
                    return recording; // Return original if signing fails
                }
            }
            return recording;
        })
    );
    
    res.json(recordingsWithSignedUrls);
};

const getMeetingDataController = async (req: Request, res: Response) => {
    const { meeting_recording_id } = req.params;
    const meetingRecording = await getMeetingRecording(meeting_recording_id);
    
    if (!meetingRecording) {
        res.status(404).json({ message: 'Recording not found' });
        return;
    }
    
    // Generate signed URL for the recording
    if (meetingRecording.recording_url) {
        try {
            const signedUrl = await getSignedRecordingUrl(meetingRecording.recording_url);
            res.json({ ...meetingRecording, recording_url: signedUrl });
        } catch (error) {
            console.error('Error generating signed URL:', error);
            res.status(500).json({ message: 'Failed to generate access URL' });
        }
    } else {
        res.json(meetingRecording);
    }
};

const updateMeetingDataController = async (req: Request, res: Response) => {
    const { meeting_recording_id } = req.params;
    const { transcript, analysis } = req.body;
    const result = await updateMeetingRecording(meeting_recording_id, { transcript, analysis } as any);
    res.json(result);
};

const deleteMeetingDataController = async (req: Request, res: Response) => {
    const { meeting_recording_id } = req.params;
    const meetingRecording = await deleteMeetingRecording(meeting_recording_id);
    res.json(meetingRecording);
};

// Import session storage from shared service
import { setSession, getSession, getSessionByParticipants, deleteSession } from '../services/meetingSession';

// VideoSDK token generation
function generateToken(roomId?: string): string {
  const API_KEY = process.env.VIDEOSDK_API_KEY;
  const SECRET = process.env.VIDEOSDK_SECRET;
  if (!API_KEY || !SECRET) {
    throw new Error('VIDEOSDK_API_KEY and VIDEOSDK_SECRET required');
  }
  const payload: Record<string, unknown> = {
    apikey: API_KEY,
    permissions: ['allow_join'],
    version: 2,
  };
  if (roomId) payload.roomId = roomId;
  return jwt.sign(payload, SECRET, { expiresIn: '120m', algorithm: 'HS256' });
}

// Create VideoSDK room (localhost mode - no webhook)
async function createRoom(): Promise<string> {
  const token = generateToken();
  
  const res = await fetch('https://api.videosdk.live/v2/rooms', {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`VideoSDK create room failed: ${err}`);
  }
  const data = (await res.json()) as { roomId: string };
  return data.roomId;
}

// Process recording: download from VideoSDK URL, upload to S3, save to MongoDB
async function processRecording(meetingId: string, fileUrl: string): Promise<void> {
  console.log('🎬 processRecording called:', { meetingId, fileUrl });
  
  const session = getSession(meetingId);
  if (!session) {
    console.error('❌ Session not found for meetingId:', meetingId);
    throw new Error(`Session not found for meetingId: ${meetingId}`);
  }
  
  const { user_id, therapist_id } = session;
  console.log('✅ Session found:', { meetingId, user_id, therapist_id });
  console.log('📥 Downloading recording from VideoSDK:', fileUrl);
  
  // Download the recording file from VideoSDK
  const videoResponse = await fetch(fileUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download recording: ${videoResponse.statusText}`);
  }
  
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
  const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
  console.log('✅ Downloaded recording:', { size: videoBuffer.length, contentType });
  
  if (!BUCKET) {
    throw new Error('S3_BUCKET_NAME not configured');
  }
  
  // Upload to S3
  const meeting_id = uuidv4();
  const ext = getFileExtension(contentType);
  const key = `meetings/${user_id}/${therapist_id}/${meeting_id}.${ext}`;
  
  console.log('📤 Uploading to S3:', { bucket: BUCKET, key });
  let recording_url: string;
  
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: videoBuffer,
        ContentType: contentType,
      })
    );
    
    recording_url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    console.log('✅ Uploaded to S3:', recording_url);
  } catch (s3Error: any) {
    console.error('❌ S3 Upload Error:', s3Error);
    if (s3Error.Code === 'AccessDenied' || s3Error.name === 'AccessDenied') {
      const errorMsg = `AWS S3 Permission Error: The IAM user 'devfest2026' does not have permission to upload to S3 bucket '${BUCKET}'. 
      
Required AWS IAM Policy:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    }
  ]
}

Please add this policy to the IAM user 'devfest2026' in AWS Console.
Original error: ${s3Error.message}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    throw s3Error;
  }
  
  // Store metadata in MongoDB using the service function
  const payload = {
    meeting_id,
    user_id,
    therapist_id,
    recording_url,
    recording_created_at: new Date(),
    transcript: null,
    analysis: '',
  };
  
  try {
    console.log('💾 Saving to MongoDB via meeting_recordings service (same as route handler):', payload);
    
    // Use the same createMeetingRecording service function that the route controller uses
    // This ensures the recording is saved the same way as POST /meeting_recordings/:user_id/:therapist_id
    const savedRecording = await createMeetingRecording(payload as any);
    
    console.log('✅ Saved to MongoDB successfully (via meeting_recordings route service):', { 
      meeting_id: savedRecording?.meeting_id || payload.meeting_id,
      user_id: savedRecording?.user_id || user_id,
      therapist_id: savedRecording?.therapist_id || therapist_id,
      recording_url: savedRecording?.recording_url || payload.recording_url
    });
    
    // The recording has been saved using the same service function that the route uses
    // This ensures consistency with POST /meeting_recordings/:user_id/:therapist_id endpoint
    // The route controller (createMeetingRecordingController) calls the same createMeetingRecording service
  } catch (mongoError) {
    console.error('❌ Failed to save to MongoDB:', mongoError);
    // Don't throw - we still want to delete the session even if MongoDB save fails
    // The recording is already in S3, so we can retry MongoDB save later if needed
  }
  
  deleteSession(meetingId);
}

// Start session controller (for therapist) - localhost mode
const startSessionController = async (req: Request, res: Response) => {
  try {
    const therapistId = (req as any).user?.userId;
    const { user_id } = req.body as { user_id?: string };
    if (!therapistId || !user_id) {
      res.status(400).json({ message: 'therapist_id and user_id required' });
      return;
    }
    
    console.log('🎬 Starting session (localhost mode):', { 
      therapistId, 
      userId: user_id
    });
    
    // Create room without webhook (localhost mode - manual save)
    const roomId = await createRoom();
    setSession(roomId, user_id, therapistId);
    const token = generateToken(roomId);
    console.log('✅ Session started:', { 
      roomId, 
      therapistId, 
      userId: user_id
    });
    res.json({ roomId, token });
  } catch (err) {
    console.error('❌ Start session error:', err);
    res.status(500).json({ message: 'Failed to start session' });
  }
};

// Get active session controller
const getActiveSessionController = async (req: Request, res: Response) => {
  const { user_id, therapist_id } = req.query;
  const authUserId = (req as any).user?.userId;
  if (!user_id || !therapist_id || !authUserId) {
    res.status(400).json({ message: 'user_id and therapist_id required' });
    return;
  }
  const role = (req as any).user?.role;
  if (role === 'user' && String(user_id) !== authUserId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (role === 'therapist' && String(therapist_id) !== authUserId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const roomId = getSessionByParticipants(String(user_id), String(therapist_id));
  if (!roomId) {
    res.json({ roomId: null, token: null });
    return;
  }
  const token = generateToken(roomId);
  res.json({ roomId, token });
};

// Manual save endpoint - call this from frontend when recording stops (localhost-friendly)
const manualSaveRecordingController = async (req: Request, res: Response) => {
  try {
    console.log('🔧 Manual save endpoint called');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const { meetingId, fileUrl } = req.body;
    if (!meetingId || !fileUrl) {
      console.error('❌ Missing required fields:', { hasMeetingId: !!meetingId, hasFileUrl: !!fileUrl });
      return res.status(400).json({ message: 'meetingId and fileUrl required' });
    }
    
    console.log('🔧 Manual recording save (localhost):', { meetingId, fileUrl });
    await processRecording(meetingId, fileUrl);
    console.log('✅ Manual save completed successfully');
    res.json({ message: 'Recording saved successfully' });
  } catch (err) {
    console.error('❌ Manual save error:', err);
    if (err instanceof Error) {
      console.error('❌ Error details:', err.message, err.stack);
    }
    res.status(500).json({ message: err instanceof Error ? err.message : 'Failed to save recording' });
  }
};

// Webhook controller (for production with HTTPS)
const webhookController = async (req: Request, res: Response) => {
  try {
    console.log('🔔 Webhook endpoint called');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📦 Request headers:', req.headers);
    
    const { webhookType, data } = req.body || {};
    console.log('📹 Webhook received:', { webhookType, meetingId: data?.meetingId, fileUrl: data?.fileUrl });
    
    if (webhookType !== 'recording-stopped' || !data?.meetingId || !data?.fileUrl) {
      console.log('⚠️ Webhook ignored - invalid type or missing data:', { webhookType, hasMeetingId: !!data?.meetingId, hasFileUrl: !!data?.fileUrl });
      return res.status(200).send('OK');
    }
    
    console.log('✅ Processing recording from webhook...');
    await processRecording(data.meetingId, data.fileUrl);
    console.log('✅ Webhook processing completed successfully');
    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Webhook error:', err);
    if (err instanceof Error) {
      console.error('❌ Error details:', err.message, err.stack);
    }
    res.status(200).send('OK');
  }
};

export {
    uploadMeetingRecordingController,
    createMeetingRecordingController,
    getAllMeetingDataController,
    getMeetingDataController,
    updateMeetingDataController,
    deleteMeetingDataController,
    startSessionController,
    getActiveSessionController,
    manualSaveRecordingController,
    webhookController,
};

