import { Router } from 'express';
import {
  startSessionController,
  getActiveSessionController,
  manualSaveRecordingController,
  createMeetingRecordingController,
  getAllMeetingDataController,
  getMeetingDataController,
  updateMeetingDataController,
  deleteMeetingDataController,
} from '../controllers/meetingRecordings';
import { checkJwt, enrichUserFromDb, requiredRoles, requiredRoleIn, requiredUserId, requiredTherapistId } from '../../middleware/auth';

const meetingRecordingsRouter = Router();

// Session management routes (must come before parameterized routes)
meetingRecordingsRouter.post('/session/start', checkJwt, enrichUserFromDb, requiredRoles('therapist'), startSessionController);
meetingRecordingsRouter.get('/session/active', checkJwt, enrichUserFromDb, requiredRoleIn('user', 'therapist'), getActiveSessionController);
meetingRecordingsRouter.post('/manual-save', checkJwt, enrichUserFromDb, manualSaveRecordingController); // Manual save for localhost

// CRUD routes
meetingRecordingsRouter.post('/:user_id/:therapist_id', checkJwt, enrichUserFromDb, requiredRoles('user'), requiredUserId, createMeetingRecordingController);
meetingRecordingsRouter.get('/:user_id/:therapist_id', checkJwt, enrichUserFromDb, requiredRoles('therapist'), requiredTherapistId, getAllMeetingDataController);
meetingRecordingsRouter.get('/:user_id/:therapist_id/:meeting_recording_id', checkJwt, enrichUserFromDb, requiredRoles('therapist'), requiredTherapistId, getMeetingDataController);
meetingRecordingsRouter.delete('/:user_id/:therapist_id/:meeting_recording_id', checkJwt, enrichUserFromDb, requiredRoles('therapist'), requiredTherapistId, deleteMeetingDataController);

export { meetingRecordingsRouter };