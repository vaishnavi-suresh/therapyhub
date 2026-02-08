import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { setSession, getSession } from '../services/meetingSession';

/**
 * Generate a VideoSDK token for joining meetings
 * POST /videosdk/token
 */
export const generateTokenController = async (req: Request, res: Response) => {
  try {
    const API_KEY = process.env.VIDEOSDK_API_KEY;
    const SECRET_KEY = process.env.VIDEOSDK_SECRET;

    if (!API_KEY || !SECRET_KEY) {
      return res.status(500).json({ 
        error: 'VideoSDK credentials not configured' 
      });
    }

    const { permissions = ['allow_join'], roomId, participantId } = req.body;

    const options: SignOptions = { 
      expiresIn: '24h', 
      algorithm: 'HS256' 
    };

    const payload: any = {
      apikey: API_KEY,
      permissions: Array.isArray(permissions) ? permissions : [permissions],
    };

    // Optional fields
    if (roomId) {
      payload.roomId = roomId;
    }
    if (participantId) {
      payload.participantId = participantId;
    }

    const token = jwt.sign(payload, SECRET_KEY as string, options);
    
    res.json({ token });
  } catch (error) {
    console.error('Error generating VideoSDK token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};

/**
 * Create a new VideoSDK meeting room
 * POST /videosdk/meeting
 */
export const createMeetingController = async (req: Request, res: Response) => {
  try {
    const API_KEY = process.env.VIDEOSDK_API_KEY;
    const SECRET_KEY = process.env.VIDEOSDK_SECRET;

    if (!API_KEY || !SECRET_KEY) {
      return res.status(500).json({ 
        error: 'VideoSDK credentials not configured' 
      });
    }

    const therapistId = (req as any).user?.userId;
    const { client_id } = req.body as { client_id?: string };

    if (!therapistId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a token for creating the meeting
    const tokenOptions: SignOptions = { 
      expiresIn: '24h', 
      algorithm: 'HS256' 
    };

    const tokenPayload = {
      apikey: API_KEY,
      permissions: ['allow_join'],
    };

    const authToken = jwt.sign(tokenPayload, SECRET_KEY as string, tokenOptions);

    // Create meeting via VideoSDK API (no webhook - using localhost manual save)
    const response = await fetch('https://api.videosdk.live/v2/rooms', {
      method: 'POST',
      headers: {
        authorization: authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VideoSDK API error:', errorText);
      return res.status(response.status).json({ 
        error: 'Failed to create meeting',
        details: errorText 
      });
    }

    const data = await response.json();
    const meetingId = data.roomId;

    // Store session info for manual recording save (use client_id if provided, otherwise therapist creates for themselves)
    if (client_id) {
      console.log('💾 Storing session for recording save:', { meetingId, user_id: client_id, therapist_id: therapistId });
      setSession(meetingId, client_id, therapistId);
    } else {
      // If no client_id, store with therapist as both (for testing)
      console.log('💾 Storing session for recording save (therapist only):', { meetingId, user_id: therapistId, therapist_id: therapistId });
      setSession(meetingId, therapistId, therapistId);
    }

    console.log('✅ Meeting created successfully:', { meetingId, therapistId, client_id });
    res.json({ 
      meetingId,
      token: authToken // Return token for immediate use
    });
  } catch (error) {
    console.error('Error creating VideoSDK meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
};

/**
 * Validate a meeting ID
 * GET /videosdk/meeting/:meetingId/validate
 */
export const validateMeetingController = async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const API_KEY = process.env.VIDEOSDK_API_KEY;
    const SECRET_KEY = process.env.VIDEOSDK_SECRET;

    if (!API_KEY || !SECRET_KEY) {
      return res.status(500).json({ 
        error: 'VideoSDK credentials not configured' 
      });
    }

    // Generate a token for validating the meeting
    const tokenOptions: SignOptions = { 
      expiresIn: '1h', 
      algorithm: 'HS256' 
    };

    const tokenPayload = {
      apikey: API_KEY,
      permissions: ['allow_join'],
      roomId: meetingId,
    };

    const authToken = jwt.sign(tokenPayload, SECRET_KEY as string, tokenOptions);

    // Validate meeting via VideoSDK API
    const response = await fetch(`https://api.videosdk.live/v2/rooms/validate/${meetingId}`, {
      method: 'GET',
      headers: {
        authorization: authToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        valid: false,
        error: 'Meeting not found or invalid' 
      });
    }

    const data = await response.json();
    
    // If session doesn't exist and user is a client, try to create session
    const existingSession = getSession(meetingId);
    console.log('🔍 Validating meeting:', { meetingId, existingSession: !!existingSession });
    
    if (!existingSession) {
      const userId = (req as any).user?.userId;
      const therapistId = (req as any).user?.therapist_id;
      const userRole = (req as any).user?.role;
      
      console.log('📝 No existing session, checking if we can create one:', { userId, therapistId, userRole });
      
      // If client is joining and we have their therapist_id, store session
      if (userId && therapistId && userRole === 'user') {
        console.log('💾 Creating session for client joining:', { meetingId, user_id: userId, therapist_id: therapistId });
        setSession(meetingId, userId, therapistId);
      } else {
        console.log('⚠️ Cannot create session - missing required data:', { hasUserId: !!userId, hasTherapistId: !!therapistId, userRole });
      }
    }

    res.json({ 
      valid: true,
      meetingId: data.roomId || meetingId 
    });
  } catch (error) {
    console.error('Error validating VideoSDK meeting:', error);
    res.status(500).json({ error: 'Failed to validate meeting' });
  }
};
