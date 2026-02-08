import { Router } from 'express';
import {
  generateTokenController,
  createMeetingController,
  validateMeetingController,
} from '../controllers/videoSDKController';
import { checkJwt, enrichUserFromDb, requiredRoles } from '../../middleware/auth';

const videoSDKRouter = Router();

// Generate token for joining meetings (requires authentication)
videoSDKRouter.post('/token', checkJwt, enrichUserFromDb, generateTokenController);

// Create a new meeting (requires authentication and therapist role)
videoSDKRouter.post('/meeting', checkJwt, enrichUserFromDb, requiredRoles('therapist'), createMeetingController);

// Validate a meeting ID (requires authentication)
videoSDKRouter.get('/meeting/:meetingId/validate', checkJwt, enrichUserFromDb, validateMeetingController);

export default videoSDKRouter;
